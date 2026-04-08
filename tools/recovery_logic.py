"""
DisruptionShield - Recovery Logic
Handles the intelligent shifting of tasks and disruption logging.
"""

from datetime import datetime, timedelta
from typing import List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.task_model import Task
from models.disruption_log import DisruptionLog

async def intelligent_shift(
    session: AsyncSession, 
    delay_minutes: int, 
    reason: str, 
    shield_active: bool = True
) -> Tuple[List[Task], str]:
    """
    Shifts all upcoming tasks forward by delay_minutes.
    If shield_active is False, only logs the disruption without shifting.
    """
    now = datetime.utcnow()
    
    # 1. Log the disruption (Persistent History)
    log = DisruptionLog(
        disruption_type=reason,
        description=f"Detected {reason} with {delay_minutes}min delay.",
        severity="High" if delay_minutes > 60 else "Moderate",
        time_lost_minutes=delay_minutes,
        day_of_week=now.weekday(),
        hour_of_day=now.hour
    )
    session.add(log)
    
    if not shield_active:
        await session.commit()
        return [], f"Disruption logged: {reason}. Shield is OFF, no tasks shifted."

    # 2. Identify tasks to shift (Pending ones starting after now)
    stmt = select(Task).where(
        Task.status == "Pending",
        Task.start_time >= now
    )
    result = await session.execute(stmt)
    tasks_to_shift = result.scalars().all()
    
    affected_tasks = []
    
    # 3. Apply the shift
    for task in tasks_to_shift:
        # Save original times if this is the first shift
        if not task.original_start_time:
            task.original_start_time = task.start_time
            task.original_end_time = task.end_time
            
        # Shift forward
        task.start_time += timedelta(minutes=delay_minutes)
        task.end_time += timedelta(minutes=delay_minutes)
        affected_tasks.append(task)
        
    await session.commit()
    
    msg = f"Recovery complete. {len(affected_tasks)} tasks shifted by {delay_minutes} minutes."
    return affected_tasks, msg
