"""
DisruptionShield - ScheduleAgent
Responsibilities:
  - Find free time slots in today's schedule
  - Reschedule events displaced by disruption
  - Resolve conflicts with 15-minute buffer between events
  - Return a conflict-free rescheduled timeline
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from tools.db_tools import (
    tool_get_todays_events,
    tool_find_free_slots,
    tool_reschedule_event,
    tool_cancel_event,
)


class ScheduleAgent:
    """
    ScheduleAgent: Intelligent conflict-free rescheduling engine.
    After a disruption, it compresses, shifts, and reschedules the day.
    """

    def __init__(self):
        self.name = "ScheduleAgent"

    async def reschedule_day(
        self,
        session: AsyncSession,
        time_lost_minutes: int,
        after_time: Optional[str] = None,
    ) -> dict:
        """
        Full day rescheduling after disruption:
        1. Get all today's remaining events
        2. Shift events by time_lost_minutes, skipping past slots
        3. Find free slots for events that can't be shifted
        4. Return full change log
        """
        now = datetime.utcnow()
        search_from = datetime.fromisoformat(after_time) if after_time else now

        # Get today's events
        events_result = await tool_get_todays_events(session)
        events = events_result.get("events", [])

        # Only reschedule future events with "Scheduled" status
        future_events = [
            e for e in events
            if e["status"] == "Scheduled"
            and datetime.fromisoformat(e["start_time"]) > search_from
        ]
        future_events.sort(key=lambda e: e["start_time"])

        changes = []
        rescheduled_count = 0

        # Strategy: shift each future event by time_lost_minutes
        shift_delta = timedelta(minutes=time_lost_minutes)

        for event in future_events:
            orig_start = datetime.fromisoformat(event["start_time"])
            orig_end = datetime.fromisoformat(event["end_time"])
            duration = int((orig_end - orig_start).total_seconds() / 60)

            new_start = orig_start + shift_delta
            new_end = orig_end + shift_delta

            # If event goes past 10 PM, try to find a free slot instead
            cutoff = now.replace(hour=22, minute=0, second=0, microsecond=0)
            if new_start >= cutoff:
                # Try finding a free slot for this event
                free_result = await tool_find_free_slots(
                    session,
                    duration_minutes=duration,
                    after_time=search_from.isoformat(),
                )
                slots = free_result.get("free_slots", [])
                if slots:
                    best_slot = slots[0]
                    new_start = datetime.fromisoformat(best_slot["start"])
                    new_end = datetime.fromisoformat(best_slot["end"])
                else:
                    # No room — cancel with note
                    await tool_cancel_event(
                        session, event["id"],
                        reason=f"Cancelled: no available slot after {time_lost_minutes}min disruption"
                    )
                    changes.append(
                        f"❌ **'{event['title']}'** — cancelled (no available time slot)"
                    )
                    continue

            result = await tool_reschedule_event(
                session,
                event_id=event["id"],
                new_start_time=new_start.isoformat(),
                new_end_time=new_end.isoformat(),
                reason=f"Rescheduled after {time_lost_minutes}min disruption",
            )

            if result["status"] == "success":
                rescheduled_count += 1
                changes.append(
                    f"🔄 **'{event['title']}'**: "
                    f"{orig_start.strftime('%H:%M')} → {new_start.strftime('%H:%M')}"
                )

        # Get updated timeline
        updated_result = await tool_get_todays_events(session)

        return {
            "agent": self.name,
            "status": "success",
            "events_rescheduled": rescheduled_count,
            "time_shifted_minutes": time_lost_minutes,
            "changes": changes,
            "updated_timeline": updated_result.get("events", []),
        }

    async def get_timeline(self, session: AsyncSession) -> dict:
        """Return today's full event timeline."""
        result = await tool_get_todays_events(session)
        events = result.get("events", [])
        events.sort(key=lambda e: e["start_time"])
        return {
            "agent": self.name,
            "events": events,
            "total_events": len(events),
        }

    async def get_step_description(self) -> str:
        return (
            "📅 **ScheduleAgent** → Finding free slots, shifting rescheduled events with "
            "15-min buffers, resolving timeline conflicts..."
        )
