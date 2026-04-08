"""
DisruptionShield - TaskAgent
Responsibilities:
  - Re-prioritize all pending tasks using urgency + impact scoring
  - Defer low-priority tasks that cannot be completed after disruption
  - Return a clear change summary for the Coordinator
"""

from sqlalchemy.ext.asyncio import AsyncSession
from tools.db_tools import (
    tool_get_all_tasks,
    tool_reprioritize_tasks,
    tool_defer_low_priority_tasks,
)


class TaskAgent:
    """
    TaskAgent: Intelligent task re-prioritization engine.
    Uses deadline proximity, impact score, and energy level to rank tasks.
    """

    def __init__(self):
        self.name = "TaskAgent"

    async def reprioritize_all(
        self,
        session: AsyncSession,
        defer_threshold: int = 2,
    ) -> dict:
        """
        Full re-prioritization workflow:
        1. Smart re-score tasks based on deadlines + impact
        2. Defer tasks with priority still <= threshold
        Returns a unified change report.
        """
        # Step 1: Smart reprioritization
        reprio_result = await tool_reprioritize_tasks(session)

        # Step 2: Defer low-priority tasks
        defer_result = await tool_defer_low_priority_tasks(
            session, threshold_priority=defer_threshold
        )

        # Step 3: Get current pending task list (post-changes)
        pending = await tool_get_all_tasks(session, status_filter="Pending")
        in_progress = await tool_get_all_tasks(session, status_filter="In-Progress")
        deferred = await tool_get_all_tasks(session, status_filter="Deferred")

        # Build change summary
        changes = []
        for change in reprio_result.get("changes", []):
            changes.append(
                f"📌 Task **'{change['title']}'**: priority {change['old_priority']} → "
                f"{change['new_priority']}"
            )
        for deferred_task in defer_result.get("deferred_tasks", []):
            changes.append(
                f"⏸️ Task **'{deferred_task['title']}'** deferred (low priority after disruption)"
            )

        return {
            "agent": self.name,
            "status": "success",
            "reprioritized_count": reprio_result.get("total_changed", 0),
            "deferred_count": defer_result.get("deferred_count", 0),
            "active_tasks_count": len(pending.get("tasks", [])) + len(in_progress.get("tasks", [])),
            "deferred_tasks_count": len(deferred.get("tasks", [])),
            "changes": changes,
            "high_priority_tasks": [
                t for t in pending.get("tasks", []) if t["priority"] >= 4
            ][:5],  # Top 5 high-priority tasks
        }

    async def get_task_summary(self, session: AsyncSession) -> dict:
        """Get a snapshot of the current task landscape."""
        all_tasks = await tool_get_all_tasks(session)
        tasks = all_tasks.get("tasks", [])

        summary = {
            "total": len(tasks),
            "pending": sum(1 for t in tasks if t["status"] == "Pending"),
            "in_progress": sum(1 for t in tasks if t["status"] == "In-Progress"),
            "deferred": sum(1 for t in tasks if t["status"] == "Deferred"),
            "completed": sum(1 for t in tasks if t["status"] == "Completed"),
            "critical": [t for t in tasks if t["priority"] == 5],
            "agent": self.name,
        }
        return summary

    async def get_step_description(self) -> str:
        return (
            "📋 **TaskAgent** → Analyzing all tasks by deadline urgency + impact score, "
            "boosting critical tasks, deferring low-priority work..."
        )
