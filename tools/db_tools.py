"""
DisruptionShield - DB Tools (MCP-style Function Tools)
All database operations exposed as clean callable tools for agents.
Each tool is async and takes a DB session.
"""

import json
from datetime import datetime, timedelta
from typing import Optional
from collections import Counter

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.task_model import Task
from models.event_model import Event
from models.disruption_log import DisruptionLog
from models.recovery_plan import RecoveryPlan

# ═══════════════════════════════════════════════════════════════
# ── TASK TOOLS ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

async def tool_add_task(
    session: AsyncSession,
    title: str,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    priority: int = 3,
    energy_level: str = "Medium",
    impact_score: int = 5,
    notes: Optional[str] = None,
) -> dict:
    """Add a new task to the database."""
    
    if not start_time or not start_time.strip():
        return {"status": "error", "message": "Start time is required (HH:MM format)"}
    
    # Calculate end_time = start_time + 1 hour if not provided
    if not end_time:
        try:
            dt = datetime.strptime(start_time, "%H:%M")
            end_dt = dt + timedelta(hours=1)
            end_time = end_dt.strftime("%H:%M")
        except ValueError:
            return {"status": "error", "message": "Invalid time format. Use HH:MM"}

    task = Task(
        title=title,
        priority=priority,
        energy_level=energy_level,
        start_time=start_time,
        end_time=end_time,
        impact_score=impact_score,
        notes=notes,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return {"status": "success", "task": task.to_dict()}


async def tool_get_all_tasks(
    session: AsyncSession,
    status_filter: Optional[str] = None,
) -> dict:
    """Retrieve all tasks, sorted by time."""
    stmt = select(Task)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    stmt = stmt.order_by(Task.start_time.asc())
    result = await session.execute(stmt)
    tasks = result.scalars().all()
    return {"status": "success", "tasks": [t.to_dict() for t in tasks]}


async def tool_update_task_priority(
    session: AsyncSession,
    task_id: int,
    new_priority: int,
    new_status: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict:
    """Update a task's priority and optionally status."""
    stmt = select(Task).where(Task.id == task_id)
    result = await session.execute(stmt)
    task = result.scalar_one_or_none()
    if not task:
        return {"status": "error", "message": f"Task {task_id} not found"}

    task.priority = new_priority
    if new_status:
        task.status = new_status
    if notes:
        task.notes = notes
    await session.commit()
    await session.refresh(task)
    return {"status": "success", "task": task.to_dict()}


async def tool_defer_low_priority_tasks(
    session: AsyncSession,
    threshold_priority: int = 2,
) -> dict:
    """Defer all tasks with priority <= threshold (used after disruption)."""
    stmt = (
        update(Task)
        .where(Task.priority <= threshold_priority, Task.status == "Pending")
        .values(status="Deferred")
        .returning(Task.id, Task.title)
    )
    result = await session.execute(stmt)
    await session.commit()
    deferred = result.fetchall()
    return {
        "status": "success",
        "deferred_count": len(deferred),
        "deferred_tasks": [{"id": r[0], "title": r[1]} for r in deferred],
    }


async def tool_reprioritize_tasks(
    session: AsyncSession,
) -> dict:
    """
    Smart re-prioritization: boosts tasks with near deadlines + high impact.
    Returns updated task list sorted by new priority.
    """
    now_dt = datetime.now()
    now_str = now_dt.strftime("%H:%M")
    now_compare = datetime.strptime(now_str, "%H:%M")

    stmt = select(Task).where(Task.status.in_(["Pending", "In-Progress"]))
    result = await session.execute(stmt)
    tasks = result.scalars().all()

    changes = []
    for task in tasks:
        old_priority = task.priority
        score = task.impact_score  # base

        # End time urgency boost
        if task.end_time:
            try:
                end_dt = datetime.strptime(task.end_time, "%H:%M")
                hours_left = (end_dt - now_compare).total_seconds() / 3600
                if hours_left < 0: # Already past
                    score += 10
                elif hours_left < 2:
                    score += 5
                elif hours_left < 6:
                    score += 3
            except ValueError:
                pass

        # Clamp priority to 1-5
        new_priority = min(5, max(1, (score // 2)))
        if new_priority != old_priority:
            task.priority = new_priority
            changes.append({
                "task_id": task.id,
                "title": task.title,
                "old_priority": old_priority,
                "new_priority": new_priority,
            })

    await session.commit()
    return {"status": "success", "changes": changes, "total_changed": len(changes)}


# ═══════════════════════════════════════════════════════════════
# ── EVENT TOOLS ─────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

async def tool_add_event(
    session: AsyncSession,
    title: str,
    start_time: str,
    end_time: str,
    location: Optional[str] = None,
    linked_task_id: Optional[int] = None,
    notes: Optional[str] = None,
) -> dict:
    """Add a new calendar event."""
    event = Event(
        title=title,
        start_time=start_time,
        end_time=end_time,
        location=location,
        linked_task_id=linked_task_id,
        notes=notes,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return {"status": "success", "event": event.to_dict()}


async def tool_get_todays_events(session: AsyncSession) -> dict:
    """Retrieve all events for the current neural plan (single-day)."""
    stmt = (
        select(Event)
        .order_by(Event.start_time)
    )
    result = await session.execute(stmt)
    events = result.scalars().all()
    return {"status": "success", "events": [e.to_dict() for e in events]}


async def tool_reschedule_event(
    session: AsyncSession,
    event_id: int,
    new_start_time: str,
    new_end_time: str,
    reason: Optional[str] = None,
) -> dict:
    """Reschedule an event to new times, preserving original times."""
    stmt = select(Event).where(Event.id == event_id)
    result = await session.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        return {"status": "error", "message": f"Event {event_id} not found"}

    # Save original times if first reschedule
    if not event.original_start_time:
        event.original_start_time = event.start_time
        event.original_end_time = event.end_time

    event.start_time = new_start_time
    event.end_time = new_end_time
    event.status = "Rescheduled"
    if reason:
        event.notes = reason

    await session.commit()
    await session.refresh(event)
    return {"status": "success", "event": event.to_dict()}


async def tool_find_free_slots(
    session: AsyncSession,
    duration_minutes: int,
    after_time: Optional[str] = None,
) -> dict:
    """Find free time slots today for a given duration (in minutes)."""
    now_hhmm = datetime.now().strftime("%H:%M")
    search_from_str = after_time if after_time else now_hhmm
    search_from = datetime.strptime(search_from_str, "%H:%M")
    day_end = datetime.strptime("21:00", "%H:%M") # End day at 9 PM

    # Get all events today
    events_result = await tool_get_todays_events(session)
    events = events_result.get("events", [])

    # Build busy intervals
    busy = []
    for e in events:
        if e["status"] != "Cancelled":
            busy.append((
                datetime.strptime(e["start_time"], "%H:%M"),
                datetime.strptime(e["end_time"], "%H:%M"),
            ))
    busy.sort(key=lambda x: x[0])

    # Find free slots
    free_slots = []
    cursor = search_from
    buffer = timedelta(minutes=15)  # 15-min buffer between events

    for start, end in busy:
        if cursor + timedelta(minutes=duration_minutes) <= start - buffer:
            free_slots.append({
                "start": cursor.strftime("%H:%M"),
                "end": (cursor + timedelta(minutes=duration_minutes)).strftime("%H:%M"),
            })
        cursor = max(cursor, end + buffer)
        if len(free_slots) >= 5:
            break

    # Check after all events
    if cursor + timedelta(minutes=duration_minutes) <= day_end:
        free_slots.append({
            "start": cursor.strftime("%H:%M"),
            "end": (cursor + timedelta(minutes=duration_minutes)).strftime("%H:%M"),
        })

    return {"status": "success", "free_slots": free_slots[:5]}


async def tool_cancel_event(
    session: AsyncSession, event_id: int, reason: Optional[str] = None
) -> dict:
    """Cancel an event."""
    stmt = select(Event).where(Event.id == event_id)
    result = await session.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        return {"status": "error", "message": f"Event {event_id} not found"}
    event.status = "Cancelled"
    if reason:
        event.notes = reason
    await session.commit()
    return {"status": "success", "message": f"Event '{event.title}' cancelled."}


# ═══════════════════════════════════════════════════════════════
# ── DISRUPTION LOG TOOLS ────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

async def tool_log_disruption(
    session: AsyncSession,
    disruption_type: str,
    description: str,
    severity: str = "Moderate",
    time_lost_minutes: int = 60,
) -> dict:
    """Log a new disruption event."""
    now = datetime.utcnow()
    log = DisruptionLog(
        disruption_type=disruption_type,
        description=description,
        severity=severity,
        time_lost_minutes=time_lost_minutes,
        day_of_week=now.weekday(),  # 0=Monday
        hour_of_day=now.hour,
    )
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return {"status": "success", "disruption_log": log.to_dict()}


async def tool_get_disruption_history(
    session: AsyncSession,
    limit: int = 20,
) -> dict:
    """Retrieve recent disruption logs."""
    stmt = select(DisruptionLog).order_by(DisruptionLog.timestamp.desc()).limit(limit)
    result = await session.execute(stmt)
    logs = result.scalars().all()
    return {"status": "success", "disruption_logs": [l.to_dict() for l in logs]}


async def tool_analyze_disruption_patterns(session: AsyncSession) -> dict:
    """
    Analyze past disruption logs to detect recurring patterns.
    Returns day-of-week + hour-of-day frequency analysis.
    """
    stmt = select(DisruptionLog)
    result = await session.execute(stmt)
    logs = result.scalars().all()

    if not logs:
        return {"status": "success", "patterns": [], "insights": "No disruption history yet."}

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_counts = Counter(l.day_of_week for l in logs)
    hour_counts = Counter(l.hour_of_day for l in logs)
    type_counts = Counter(l.disruption_type for l in logs)

    # Identify high-risk slots (>= 2 occurrences)
    risky_days = [
        {"day": day_names[d], "count": c}
        for d, c in day_counts.most_common(3) if c >= 2
    ]
    risky_hours = [
        {"hour": f"{h:02d}:00", "count": c}
        for h, c in hour_counts.most_common(3) if c >= 2
    ]

    insights = []
    if risky_days:
        top_day = risky_days[0]
        insights.append(
            f"⚠️ {top_day['day']} is your highest disruption day ({top_day['count']} incidents)."
        )
    if risky_hours:
        top_hour = risky_hours[0]
        insights.append(
            f"⚠️ Disruptions most frequent around {top_hour['hour']} ({top_hour['count']} times)."
        )
    if type_counts:
        top_type = type_counts.most_common(1)[0]
        insights.append(
            f"📊 Most common disruption: '{top_type[0]}' ({top_type[1]} occurrences)."
        )

    return {
        "status": "success",
        "total_disruptions": len(logs),
        "risky_days": risky_days,
        "risky_hours": risky_hours,
        "type_breakdown": dict(type_counts),
        "insights": insights,
    }


async def tool_resolve_disruption(
    session: AsyncSession, disruption_id: int
) -> dict:
    """Mark a disruption as resolved."""
    stmt = select(DisruptionLog).where(DisruptionLog.id == disruption_id)
    result = await session.execute(stmt)
    log = result.scalar_one_or_none()
    if not log:
        return {"status": "error", "message": f"Disruption {disruption_id} not found"}
    log.resolved_at = datetime.utcnow()
    log.recovery_generated = True
    await session.commit()
    return {"status": "success", "message": "Disruption marked as resolved."}


# ═══════════════════════════════════════════════════════════════
# ── RECOVERY PLAN TOOLS ─────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

async def tool_save_recovery_plan(
    session: AsyncSession,
    disruption_id: int,
    changes_made: list,
    summary_text: str,
    tasks_reprioritized: int = 0,
    events_rescheduled: int = 0,
    time_recovered_minutes: int = 0,
) -> dict:
    """Persist a recovery plan linked to a disruption."""
    plan = RecoveryPlan(
        disruption_id=disruption_id,
        changes_made=json.dumps(changes_made),
        summary_text=summary_text,
        tasks_reprioritized=tasks_reprioritized,
        events_rescheduled=events_rescheduled,
        time_recovered_minutes=time_recovered_minutes,
    )
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return {"status": "success", "recovery_plan": plan.to_dict()}


async def tool_get_recovery_plans(
    session: AsyncSession, disruption_id: Optional[int] = None
) -> dict:
    """Retrieve recovery plans, optionally for a specific disruption."""
    stmt = select(RecoveryPlan).order_by(RecoveryPlan.created_at.desc())
    if disruption_id:
        stmt = stmt.where(RecoveryPlan.disruption_id == disruption_id)
    result = await session.execute(stmt)
    plans = result.scalars().all()
    return {"status": "success", "recovery_plans": [p.to_dict() for p in plans]}
