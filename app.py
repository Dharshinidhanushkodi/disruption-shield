"""
DisruptionShield Coordinator - Main Chainlit App
Full conversational UI with:
- Multi-agent disruption chain visualization (step-by-step)
- DISRUPTION MODE (red alert) and RECOVERED (green) banners
- Sidebar with task list, today's schedule, disruption history, pattern insights
- Seed data creation and helpful command routing
"""

import json
import traceback
from datetime import datetime, timedelta

try:
    import chainlit as cl
except ImportError:
    # Fallback for Vercel where chainlit is not installed
    class cl:
        def on_chat_start(func): return func
        def on_message(func): return func
        class Message:
            def __init__(self, **kwargs): pass
            async def send(self): pass
        class user_session:
            @staticmethod
            def set(k, v): pass
            @staticmethod
            def get(k): return None
from sqlalchemy.ext.asyncio import AsyncSession

from database import init_db, AsyncSessionLocal
from agents.coordinator import CoordinatorAgent
from tools.db_tools import (
    tool_add_task, tool_get_all_tasks,
    tool_add_event, tool_get_todays_events,
    tool_get_disruption_history,
    tool_analyze_disruption_patterns,
    tool_get_recovery_plans,
)
from config import APP_NAME, APP_VERSION, DISRUPTION_KEYWORDS

# ─── Disruption detection keywords ─────────────────────────────────────────
DISRUPTION_TRIGGERS = [
    "power cut", "power outage", "blackout", "no power",
    "client call", "urgent call", "unexpected meeting",
    "traffic", "stuck in traffic", "road block",
    "emergency", "accident", "hospital", "family emergency",
    "sick", "unwell", "not feeling well",
    "laptop crashed", "system down", "internet down",
    "disruption", "lost time", "lost", "interrupted", "delay",
]

HELP_COMMANDS = {
    "/tasks": "Show all current tasks with priority",
    "/schedule": "Show today's event timeline",
    "/history": "Show disruption history",
    "/patterns": "Show disruption pattern insights",
    "/recovery": "Show last recovery plans",
    "/seed": "Add sample tasks and events (demo setup)",
    "/help": "Show this help message",
}


def is_disruption_message(text: str) -> bool:
    """Detect if user message describes a disruption."""
    text_lower = text.lower()
    return any(trigger in text_lower for trigger in DISRUPTION_TRIGGERS)


def format_task_list(tasks: list) -> str:
    """Format task list as a markdown table."""
    if not tasks:
        return "No tasks found."
    
    priority_emoji = {5: "🔴", 4: "🟠", 3: "🟡", 2: "🔵", 1: "⚪"}
    energy_emoji = {"High": "⚡", "Medium": "🔋", "Low": "🌿"}
    status_emoji = {
        "Pending": "⏳", "In-Progress": "▶️",
        "Deferred": "⏸️", "Completed": "✅", "Dropped": "🗑️"
    }

    lines = ["| # | Task | Priority | Energy | Deadline | Status |",
             "|---|------|----------|--------|----------|--------|"]
    for t in tasks[:15]:
        dl = t["deadline"][:10] if t["deadline"] else "—"
        lines.append(
            f"| {t['id']} | {t['title'][:35]} | "
            f"{priority_emoji.get(t['priority'], '⚪')} P{t['priority']} | "
            f"{energy_emoji.get(t['energy_level'], '')} {t['energy_level']} | "
            f"{dl} | {status_emoji.get(t['status'], '')} {t['status']} |"
        )
    return "\n".join(lines)


def format_timeline(events: list) -> str:
    """Format events as a readable timeline."""
    if not events:
        return "No events scheduled for today."
    
    status_emoji = {
        "Scheduled": "📅", "Rescheduled": "🔄",
        "Cancelled": "❌", "Completed": "✅"
    }
    lines = []
    for e in events:
        start = datetime.fromisoformat(e["start_time"]).strftime("%H:%M")
        end = datetime.fromisoformat(e["end_time"]).strftime("%H:%M")
        was_rescheduled = e.get("original_start_time")
        rescheduled_tag = " *(rescheduled)*" if was_rescheduled else ""
        emoji = status_emoji.get(e["status"], "📅")
        lines.append(f"{emoji} **{start}–{end}** — {e['title']}{rescheduled_tag}")
    return "\n".join(lines)


def format_disruption_history(logs: list) -> str:
    """Format disruption history compactly."""
    if not logs:
        return "No disruptions recorded yet."
    
    severity_emoji = {"Minor": "🟡", "Moderate": "🟠", "Major": "🔴"}
    lines = []
    for log in logs[:10]:
        ts = datetime.fromisoformat(log["timestamp"]).strftime("%b %d %H:%M")
        emoji = severity_emoji.get(log["severity"], "⚪")
        resolved = "✅" if log.get("resolved_at") else "🔧"
        lines.append(
            f"{emoji} **{ts}** — {log['disruption_type'].replace('_',' ').title()} "
            f"({log['severity']}, {log['time_lost_minutes']}min) {resolved}"
        )
    return "\n".join(lines)


# ─── Chainlit Lifecycle ─────────────────────────────────────────────────────

@cl.on_chat_start
async def on_chat_start():
    """Initialize DB, create coordinator, show welcome screen."""
    await init_db()

    # Store coordinator in user session
    cl.user_session.set("coordinator", CoordinatorAgent())
    cl.user_session.set("in_disruption_mode", False)

    welcome = f"""# 🛡️ {APP_NAME} v{APP_VERSION}

**Your AI-Powered Multi-Agent Disruption Recovery System**

I automatically detect disruptions and re-plan your entire day using a coordinated team of AI agents:

| Agent | Role |
|-------|------|
| 🎯 **Coordinator** | Detects disruption, orchestrates recovery |
| 🔍 **InfoAgent** | Logs event, retrieves patterns, warns proactively |
| 📋 **TaskAgent** | Re-prioritizes tasks by urgency + impact |
| 📅 **ScheduleAgent** | Reschedules events, resolves conflicts |

---

### 🚀 Quick Start
Just tell me what happened naturally:
> *"Power cut just hit, I lost 2 hours"*  
> *"Stuck in traffic, running 45 minutes late"*  
> *"Emergency family call came up, need to reschedule"*

### ⚡ Commands
{chr(10).join(f'`{cmd}` — {desc}' for cmd, desc in HELP_COMMANDS.items())}

---
*Type `/seed` to add demo tasks & events, then try a disruption!*
"""
    await cl.Message(content=welcome).send()

    # Check for proactive warnings on startup
    async with AsyncSessionLocal() as session:
        pattern_result = await tool_analyze_disruption_patterns(session)
        warnings = []
        now = datetime.utcnow()
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        current_day = day_names[now.weekday()]

        for risky in pattern_result.get("risky_days", []):
            if risky["day"] == current_day and risky["count"] >= 2:
                warnings.append(
                    f"⚠️ **Proactive Alert**: You've had {risky['count']} disruptions "
                    f"on {current_day}s historically. Consider scheduling critical tasks earlier!"
                )

        if warnings:
            await cl.Message(
                content="---\n### 🚨 Proactive Warning\n" + "\n".join(warnings),
                author="DisruptionShield",
            ).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Route incoming messages: commands or disruption detection."""
    text = message.content.strip()
    coordinator: CoordinatorAgent = cl.user_session.get("coordinator")

    # ── Command Routing ────────────────────────────────────────────
    if text.startswith("/"):
        await handle_command(text.lower(), coordinator)
        return

    # ── Disruption Detection ───────────────────────────────────────
    if is_disruption_message(text):
        await handle_disruption_flow(text, coordinator)
    else:
        # General conversation — route to LLM
        await handle_general_query(text, coordinator)


async def handle_command(cmd: str, coordinator: CoordinatorAgent):
    """Handle slash commands."""
    async with AsyncSessionLocal() as session:

        if cmd == "/help":
            help_text = "### 📖 Available Commands\n\n" + "\n".join(
                f"**`{c}`** — {d}" for c, d in HELP_COMMANDS.items()
            )
            await cl.Message(content=help_text).send()

        elif cmd == "/tasks":
            result = await tool_get_all_tasks(session)
            tasks = result.get("tasks", [])
            content = f"### 📋 All Tasks ({len(tasks)} total)\n\n{format_task_list(tasks)}"
            await cl.Message(content=content).send()

        elif cmd == "/schedule":
            result = await tool_get_todays_events(session)
            events = result.get("events", [])
            events.sort(key=lambda e: e["start_time"])
            content = f"### 📅 Today's Schedule\n\n{format_timeline(events)}"
            await cl.Message(content=content).send()

        elif cmd == "/history":
            result = await tool_get_disruption_history(session)
            logs = result.get("disruption_logs", [])
            content = f"### 📊 Disruption History\n\n{format_disruption_history(logs)}"
            await cl.Message(content=content).send()

        elif cmd == "/patterns":
            result = await tool_analyze_disruption_patterns(session)
            insights = result.get("insights", [])
            warnings = result.get("proactive_warnings", [])
            risky_days = result.get("risky_days", [])
            risky_hours = result.get("risky_hours", [])

            lines = [f"### 🧠 Disruption Pattern Analysis\n",
                     f"**Total disruptions logged**: {result.get('total_disruptions', 0)}\n"]

            if risky_days:
                lines.append("**High-risk days:**")
                for d in risky_days:
                    lines.append(f"  - {d['day']}: {d['count']} incidents")

            if risky_hours:
                lines.append("\n**High-risk hours:**")
                for h in risky_hours:
                    lines.append(f"  - {h['hour']}: {h['count']} incidents")

            if insights:
                lines.append("\n**Insights:**")
                lines.extend(f"  {i}" for i in insights)

            if warnings:
                lines.append("\n**⚠️ Active Warnings:**")
                lines.extend(f"  {w}" for w in warnings)

            if not result.get("total_disruptions"):
                lines.append("\n*No disruption history yet. Log some disruptions first!*")

            await cl.Message(content="\n".join(lines)).send()

        elif cmd == "/recovery":
            result = await tool_get_recovery_plans(session)
            plans = result.get("recovery_plans", [])
            if not plans:
                await cl.Message(content="No recovery plans found yet.").send()
                return

            lines = ["### 🔄 Recovery Plans\n"]
            for p in plans[:5]:
                ts = p.get("created_at", "")[:16]
                lines.append(
                    f"**Plan #{p['id']}** (Disruption #{p['disruption_id']}) — {ts}\n"
                    f"- Tasks re-prioritized: {p['tasks_reprioritized']}\n"
                    f"- Events rescheduled: {p['events_rescheduled']}\n"
                    f"- Time recovered: {p['time_recovered_minutes']} min\n"
                )
                if p.get("summary_text"):
                    lines.append(f"*{p['summary_text'][:200]}...*\n")
            await cl.Message(content="\n".join(lines)).send()

        elif cmd == "/seed":
            await seed_demo_data(session)
            await cl.Message(
                content=(
                    "✅ **Demo data loaded!**\n\n"
                    "Added 6 tasks and 5 events for today.\n\n"
                    "Now try: *\"Power cut just happened, I lost 2 hours\"*"
                )
            ).send()

        else:
            await cl.Message(
                content=f"Unknown command: `{cmd}`. Type `/help` for options."
            ).send()


async def handle_disruption_flow(message: str, coordinator: CoordinatorAgent):
    """Run the full multi-agent disruption recovery chain with step-by-step UI."""

    # Show DISRUPTION MODE banner
    cl.user_session.set("in_disruption_mode", True)
    await cl.Message(
        content=(
            "```\n"
            "🚨🚨🚨  D I S R U P T I O N   M O D E   A C T I V A T E D  🚨🚨🚨\n"
            "```\n"
            "Initiating full multi-agent recovery protocol..."
        ),
        author="DisruptionShield ALERT",
    ).send()

    # Stream agent steps
    async with AsyncSessionLocal() as session:
        recovery_data = {}

        try:
            async for step in coordinator.handle_disruption(session, message):
                step_num = step.get("step", 0)
                agent = step.get("agent", "System")
                msg_text = step.get("message", "")
                status = step.get("status", "running")

                # Determine author/prefix for each agent
                author_map = {
                    "Coordinator": "🎯 Coordinator",
                    "InfoAgent": "🔍 InfoAgent",
                    "TaskAgent": "📋 TaskAgent",
                    "ScheduleAgent": "📅 ScheduleAgent",
                }
                author = author_map.get(agent, "🤖 Agent")

                await cl.Message(content=msg_text, author=author).send()

                if status == "complete":
                    recovery_data = step.get("data", {})

        except Exception as e:
            tb = traceback.format_exc()
            await cl.Message(
                content=(
                    f"⚠️ **Recovery Error**: {str(e)}\n\n"
                    f"```\n{tb[:500]}\n```"
                ),
                author="DisruptionShield ERROR",
            ).send()
            return

    # Show RECOVERED banner
    cl.user_session.set("in_disruption_mode", False)

    severity = recovery_data.get("severity", "Moderate")
    time_lost = recovery_data.get("time_lost", 0)
    time_recovered = recovery_data.get("time_recovered", 0)
    tasks_reprioritized = recovery_data.get("tasks_reprioritized", 0)
    events_rescheduled = recovery_data.get("events_rescheduled", 0)

    recovered_banner = (
        "```\n"
        "✅✅✅   R E C O V E R Y   C O M P L E T E   ✅✅✅\n"
        "```\n"
        f"**Severity**: {severity}  |  "
        f"**Lost**: {time_lost} min  |  "
        f"**Recovered**: {time_recovered} min\n\n"
        f"📋 **{tasks_reprioritized}** tasks re-prioritized  •  "
        f"📅 **{events_rescheduled}** events rescheduled\n\n"
    )

    # Show updated timeline if available
    updated_timeline = recovery_data.get("updated_timeline", [])
    if updated_timeline:
        updated_timeline.sort(key=lambda e: e["start_time"])
        recovered_banner += "### 📅 Updated Schedule\n\n"
        recovered_banner += format_timeline(updated_timeline)

    recovered_banner += "\n\n*Type `/tasks` or `/schedule` to see the full updated plan.*"

    await cl.Message(
        content=recovered_banner,
        author="✅ DisruptionShield RECOVERED",
    ).send()


async def handle_general_query(text: str, coordinator: CoordinatorAgent):
    """Handle non-disruption conversation using LLM context."""
    from agents.llm_client import call_llm

    async with AsyncSessionLocal() as session:
        # Gather context
        tasks_result = await tool_get_all_tasks(session, status_filter="Pending")
        events_result = await tool_get_todays_events(session)
        history_result = await tool_get_disruption_history(session, limit=5)

        tasks = tasks_result.get("tasks", [])[:5]
        events = events_result.get("events", [])
        history = history_result.get("disruption_logs", [])[:3]

        context = f"""Current pending tasks: {json.dumps([t['title'] for t in tasks])}
Today's events: {json.dumps([e['title'] for e in events])}
Recent disruptions: {json.dumps([d['disruption_type'] for d in history])}
Current time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"""

        prompt = f"""{context}

User message: {text}

Respond helpfully as DisruptionShield Coordinator. If the user wants to add tasks or events, 
guide them on how to use the system. Keep your response concise and actionable.
Available commands: /tasks, /schedule, /history, /patterns, /recovery, /seed"""

        try:
            response = await call_llm(
                prompt=prompt,
                system_prompt=(
                    "You are DisruptionShield Coordinator, an expert AI productivity assistant. "
                    "Help users manage their disrupted schedules. Be concise and helpful."
                ),
                max_tokens=400,
            )
        except Exception as e:
            response = (
                "I can help you manage disruptions and reschedule your day! "
                f"Try telling me about a disruption, or use `/help` for commands.\n\n"
                f"*(LLM unavailable: {str(e)[:60]})*"
            )

    await cl.Message(content=response, author="🎯 Coordinator").send()


async def seed_demo_data(session: AsyncSession):
    """Populate the DB with demo tasks and events for showcasing."""
    now = datetime.utcnow()
    # Snap to the hour
    base = now.replace(minute=0, second=0, microsecond=0)
    
    # demo events (stay as events for now, or we can use Tasks for everything)
    # The user request focused on 'Task model with id, title, start_time, end_time...'
    # So I will seed TASKS primarily.
    
    demo_tasks = [
        {"title": "Morning standup",              "start_time": (base + timedelta(hours=1)).isoformat(),  "end_time": (base + timedelta(hours=1, minutes=30)).isoformat(), "priority": 3},
        {"title": "Submit Q1 financial report",    "start_time": (base + timedelta(hours=2)).isoformat(),  "end_time": (base + timedelta(hours=3, minutes=30)).isoformat(), "priority": 5},
        {"title": "Client strategy presentation", "start_time": (base + timedelta(hours=4)).isoformat(),  "end_time": (base + timedelta(hours=5)).isoformat(), "priority": 4},
        {"title": "Q1 report review meeting",     "start_time": (base + timedelta(hours=5, minutes=30)).isoformat(), "end_time": (base + timedelta(hours=6, minutes=30)).isoformat(), "priority": 4},
        {"title": "Lunch with team",              "start_time": (base + timedelta(hours=7)).isoformat(),  "end_time": (base + timedelta(hours=8)).isoformat(), "priority": 2},
        {"title": "Contract review call",         "start_time": (base + timedelta(hours=8, minutes=30)).isoformat(), "end_time": (base + timedelta(hours=9)).isoformat(), "priority": 4},
    ]
    
    # Clear existing if any? No, just add.
    from models.task_model import Task
    for t_data in demo_tasks:
        task = Task(
            title=t_data["title"],
            priority=t_data["priority"],
            start_time=datetime.fromisoformat(t_data["start_time"]),
            end_time=datetime.fromisoformat(t_data["end_time"]),
            original_start_time=datetime.fromisoformat(t_data["start_time"]),
            original_end_time=datetime.fromisoformat(t_data["end_time"]),
            status="Pending"
        )
        session.add(task)
    
    await session.commit()
