"""
DisruptionShield - Primary Coordinator Agent
Orchestrates the full multi-agent disruption recovery chain:
  Step 1: Detect disruption type + severity  
  Step 2: InfoAgent → log + retrieve patterns
  Step 3: TaskAgent → reprioritize all tasks
  Step 4: ScheduleAgent → reschedule the day  
  Step 5: Generate LLM-powered recovery summary
  Step 6: Save RecoveryPlan to DB
"""

import json
from datetime import datetime
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from agents.info_agent import InfoAgent
from agents.task_agent import TaskAgent
from agents.schedule_agent import ScheduleAgent
from agents.llm_client import call_llm
from tools.db_tools import tool_save_recovery_plan, tool_resolve_disruption


class CoordinatorAgent:
    """
    Primary Coordinator: Detects disruption and orchestrates the 
    full multi-agent recovery workflow. Yields UI progress steps.
    """

    SYSTEM_PROMPT = """You are DisruptionShield Coordinator, an expert AI productivity manager.
Your job is to analyze disruptions and generate clear, actionable recovery summaries.
Be concise, professional, and empathetic. Use markdown formatting.
Always end with specific action items the user should take right now."""

    def __init__(self):
        self.name = "Coordinator"
        self.info_agent = InfoAgent()
        self.task_agent = TaskAgent()
        self.schedule_agent = ScheduleAgent()

    async def handle_disruption(
        self,
        session: AsyncSession,
        user_message: str,
        severity_override: Optional[str] = None,
        delay_override: Optional[int] = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Full disruption recovery chain. Yields step-by-step progress dicts
        that the Chainlit UI renders in real-time.

        Yields dict with keys: step, agent, message, data, status
        """

        # ─── STEP 0: Coordinator Analysis ────────────────────────────
        yield {
            "step": 0,
            "agent": "Coordinator",
            "message": (
                "🎯 **DisruptionShield Coordinator** activated!\n\n"
                f"Analyzing your disruption: *\"{user_message}\"*\n\n"
                "Initiating multi-agent recovery protocol..."
            ),
            "status": "running",
        }

        # Analyze details (calling InfoAgent detection)
        # Note: In the new workflow, logging happens at the end.
        from agents.info_agent import _detect_disruption_type, _parse_time_lost, _estimate_severity
        disruption_type = _detect_disruption_type(user_message)
        time_lost = delay_override if delay_override is not None else _parse_time_lost(user_message)
        severity = _estimate_severity(user_message, time_lost)

        yield {
            "step": 0,
            "agent": "Coordinator",
            "message": (
                f"✅ **Coordinator Analysis** complete!\n\n"
                f"- **Type**: {disruption_type.replace('_', ' ').title()}\n"
                f"- **Time Lost**: ~{time_lost} minutes\n"
            ),
            "data": {
                "type": disruption_type,
                "time_lost": time_lost,
                "severity": severity
            },
            "status": "done",
        }

        # ─── STEP 1: TaskAgent — Re-prioritize Tasks ──────────────────
        yield {
            "step": 1,
            "agent": "TaskAgent",
            "message": await self.task_agent.get_step_description(),
            "status": "running",
        }

        task_result = await self.task_agent.reprioritize_all(session)

        task_changes_str = (
            "\n".join(task_result.get("changes", [])[:8])
            if task_result.get("changes")
            else "No task priority changes needed."
        )

        yield {
            "step": 1,
            "agent": "TaskAgent",
            "message": (
                f"✅ **TaskAgent** → Task re-prioritization complete!\n\n"
                f"- **Tasks Re-prioritized**: {task_result['reprioritized_count']}\n"
                f"- **Tasks Deferred**: {task_result['deferred_count']}\n"
                f"**Changes Made:**\n{task_changes_str}"
            ),
            "data": task_result,
            "status": "done",
        }

        # ─── STEP 2: ScheduleAgent — Reschedule the Day ───────────────
        yield {
            "step": 2,
            "agent": "ScheduleAgent",
            "message": await self.schedule_agent.get_step_description(),
            "status": "running",
        }

        schedule_result = await self.schedule_agent.reschedule_day(
            session=session,
            time_lost_minutes=time_lost,
        )

        schedule_changes_str = (
            "\n".join(schedule_result.get("changes", [])[:8])
            if schedule_result.get("changes")
            else "No events to reschedule today."
        )

        yield {
            "step": 2,
            "agent": "ScheduleAgent",
            "message": (
                f"✅ **ScheduleAgent** → Schedule rescheduled!\n\n"
                f"- **Events Rescheduled**: {schedule_result['events_rescheduled']}\n"
                f"- **Time Shift Applied**: +{time_lost} minutes\n\n"
                f"**Schedule Changes:**\n{schedule_changes_str}"
            ),
            "data": schedule_result,
            "status": "done",
        }

        # ─── STEP 3: InfoAgent — Log Everything ───────────────
        yield {
            "step": 3,
            "agent": "InfoAgent",
            "message": "🔍 **InfoAgent** → Logging disruption and actions taken to database...",
            "status": "running",
        }

        log_result = await self.info_agent.log_disruption(
            session=session,
            description=user_message,
            severity_override=severity,
            time_lost_override=time_lost,
        )
        disruption_id = log_result["disruption_log"]["id"]

        yield {
            "step": 3,
            "agent": "InfoAgent",
            "message": f"✅ **InfoAgent** → Logged as entry #{disruption_id}.",
            "status": "done",
        }

        # ─── STEP 4: Generate LLM Recovery Summary ────────────────────
        yield {
            "step": 4,
            "agent": "Coordinator",
            "message": "🧠 **Coordinator** → Generating intelligent recovery summary...",
            "status": "running",
        }

        summary_prompt = f"""
A disruption occurred: "{user_message}"

Disruption Analysis:
- Type: {disruption_type}
- Severity: {severity}
- Time Lost: {time_lost} minutes

Task Changes:
- {task_result['reprioritized_count']} tasks re-prioritized
- {task_result['deferred_count']} tasks deferred

Schedule Changes:
- {schedule_result['events_rescheduled']} events rescheduled

Generate a professional, concise recovery summary. Recovery complete. Your schedule has been adjusted.
"""
        try:
            summary_text = await call_llm(
                prompt=summary_prompt,
                system_prompt=self.SYSTEM_PROMPT,
                max_tokens=400,
            )
        except Exception:
            summary_text = "Recovery complete. Your schedule has been adjusted."

        # Save Recovery Plan
        all_changes = task_result.get("changes", []) + schedule_result.get("changes", [])
        await tool_save_recovery_plan(
            session=session,
            disruption_id=disruption_id,
            changes_made=all_changes,
            summary_text=summary_text,
            tasks_reprioritized=task_result["reprioritized_count"],
            events_rescheduled=schedule_result["events_rescheduled"],
            time_recovered_minutes=max(0, time_lost - 10),
        )
        await tool_resolve_disruption(session, disruption_id)

        yield {
            "step": 4,
            "agent": "Coordinator",
            "message": summary_text,
            "data": {
                "type": disruption_type,
                "time_lost": time_lost,
                "tasks": task_result.get("tasks", []),
                "updated_timeline": schedule_result.get("updated_timeline", []),
            },
            "status": "complete",
        }

    async def handle_pattern_check(self, session: AsyncSession) -> dict:
        """Run pattern analysis and return proactive warnings."""
        return await self.info_agent.analyze_patterns(session)

    async def handle_task_summary(self, session: AsyncSession) -> dict:
        """Return current task landscape."""
        return await self.task_agent.get_task_summary(session)

    async def handle_timeline(self, session: AsyncSession) -> dict:
        """Return today's schedule."""
        return await self.schedule_agent.get_timeline(session)
