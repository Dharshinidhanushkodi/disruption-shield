from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationship to nested task shifts
    tasks: Mapped[List["EventTask"]] = relationship("EventTask", back_populates="event", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "tasks": [t.to_dict() for t in self.tasks]
        }

class EventTask(Base):
    __tablename__ = "event_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    old_start: Mapped[str] = mapped_column(String(50), nullable=False)
    new_start: Mapped[str] = mapped_column(String(50), nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="tasks")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "old_start": self.old_start,
            "new_start": self.new_start
        }
