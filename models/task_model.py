"""
DisruptionShield - Task Model
Represents a work task with priority, energy level, and timing.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Priority: 1 (lowest) → 5 (highest)
    priority: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Energy required: Low / Medium / High
    energy_level: Mapped[str] = mapped_column(
        SAEnum("Low", "Medium", "High", name="energy_enum"),
        default="Medium",
        nullable=False,
    )

    # Timing: start and end (Stored as "HH:MM")
    start_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

    # History: original times before any shifts
    original_start_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    original_end_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)


    # Impact score 1-10 (used by TaskAgent for re-prioritization)
    impact_score: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    # Notes / description
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "energy_level": self.energy_level,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "original_start_time": self.original_start_time,
            "original_end_time": self.original_end_time,
            "status": self.status,
            "impact_score": self.impact_score,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
