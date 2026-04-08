"""
DisruptionShield - DisruptionLog Model
Stores every disruption event with type, severity, and resolution time.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class DisruptionLog(Base):
    __tablename__ = "disruption_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Required fields for History
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    old_start: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    new_start: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Metadata
    disruption_type: Mapped[str] = mapped_column(String(50), default="other", nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="Moderate", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "old_start": self.old_start,
            "new_start": self.new_start,
            "reason": self.reason,
            "disruption_type": self.disruption_type,
            "severity": self.severity,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

