from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, time
from pydantic import BaseModel
from typing import List, Optional

from database import init_db, get_session
from models.task_model import Task
from models.disruption_log import DisruptionLog as History

app = FastAPI()

# FIX CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def on_startup():
    await init_db()

# Pydantic models for validation
class TaskCreate(BaseModel):
    title: str
    start_time: str
    end_time: str

class RecoverRequest(BaseModel):
    message: str

# APIs
@app.get("/api/tasks")
async def get_tasks(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Task).order_by(Task.start_time))
    tasks = result.scalars().all()
    return [t.to_dict() for t in tasks]

@app.post("/api/tasks")
async def add_task(req: TaskCreate, session: AsyncSession = Depends(get_session)):
    try:
        # User is sending "HH:MM". We store it directly as String.
        # We also calculate end_time as start_time + 1 hour.
        start_dt = datetime.strptime(req.start_time, "%H:%M")
        end_dt = start_dt + timedelta(hours=1)
        
        task = Task(
            title=req.title,
            start_time=req.start_time,
            end_time=end_dt.strftime("%H:%M"),
            status="Pending"
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/history")
async def get_history(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(History).order_by(History.timestamp.desc()))
    logs = result.scalars().all()
    return [log.to_dict() for log in logs]

@app.post("/api/recover")
async def recover(data: dict, session: AsyncSession = Depends(get_session)):
    print("Incoming:", data)

    reason = data.get("message", "").lower()

    # 🔹 shift minutes
    shift_map = {
        "traffic": 30,
        "power": 60,
        "meeting": 45,
        "emergency": 90
    }

    shift = 0
    for key in shift_map:
        if key in reason:
            shift = shift_map[key]

    print("Reason:", reason)
    print("Shift:", shift)

    if shift == 0:
        return {"message": "No disruption detected"}

    # 🔹 current time
    now_time = datetime.strptime(datetime.now().strftime("%H:%M"), "%H:%M")
    print(f"DEBUG: Processing disruption shift (+{shift} mins)")

    result = await session.execute(select(Task).order_by(Task.start_time))
    tasks = result.scalars().all()
    print(f"DEBUG: Found {len(tasks)} tasks to evaluate.")

    prev_end_dt = None

    for i, task in enumerate(tasks):
        task_start_dt = datetime.strptime(task.start_time, "%H:%M")
        task_end_dt = datetime.strptime(task.end_time, "%H:%M")
        
        old_start = task.start_time
        old_end = task.end_time

        # 🔥 APPLY SHIFT TO ALL ELIGIBLE TASKS
        # We process ALL tasks found for maximum visibility during testing
        task_start_dt += timedelta(minutes=shift)
        task_end_dt += timedelta(minutes=shift)

        # 🔥 CASCADE PROTECTION
        # If the task now overlaps with the previous one, push it further
        if prev_end_dt and task_start_dt < prev_end_dt:
            print(f"DEBUG: Cascading push for '{task.title}' to avoid overlap with previous task.")
            duration = task_end_dt - task_start_dt
            task_start_dt = prev_end_dt
            task_end_dt = task_start_dt + duration

        print(f"DEBUG: Rescheduling '{task.title}': {old_start} -> {task_start_dt.strftime('%H:%M')}")

        # save original only once
        if not task.original_start_time:
            task.original_start_time = old_start
            task.original_end_time = old_end

        # update
        task.start_time = task_start_dt.strftime("%H:%M")
        task.end_time = task_end_dt.strftime("%H:%M")
        task.status = "rescheduled"

        prev_end_dt = task_end_dt

        # history
        history = History(
            title=task.title,
            old_start=old_start,
            new_start=task.start_time,
            reason=reason
        )
        session.add(history)

    await session.commit()
    print("DEBUG: All tasks rescheduled and committed.")

    return {"message": "Rescheduled successfully"}


@app.post("/api/undo")
async def undo(session: AsyncSession = Depends(get_session)):
    stmt = select(Task).where(Task.status == "rescheduled")
    result = await session.execute(stmt)
    rescheduled_tasks = result.scalars().all()
    
    for task in rescheduled_tasks:
        if task.original_start_time:
            task.start_time = task.original_start_time
        task.status = "Pending"
    
    await session.commit()
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
