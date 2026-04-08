"""
DisruptionShield - InfoAgent
Responsibilities:
  - Log disruptions with type detection, severity, and time lost
  - Retrieve past disruption patterns from the DB
  - Generate proactive warnings based on recurring patterns
"""

import re
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from config import DISRUPTION_KEYWORDS, get_llm_config
from tools.db_tools import (
    tool_log_disruption,
    tool_get_disruption_history,
    tool_analyze_disruption_patterns,
)


def _detect_disruption_type(description: str) -> str:
    """Detect disruption type from natural language description."""
    text = description.lower()
    if "power" in text:
        return "power_cut"
    if "call" in text:
        return "unexpected_call"
    
    for dtype, keywords in DISRUPTION_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return dtype
    return "general"


def _estimate_severity(description: str, time_lost_minutes: int) -> str:
    """Estimate severity based on time lost and keywords."""
    text = description.lower()
    if time_lost_minutes >= 180 or any(
        kw in text for kw in ["major", "critical", "emergency", "accident", "hospital"]
    ):
        return "Major"
    elif time_lost_minutes >= 60 or any(
        kw in text for kw in ["moderate", "significant", "hours"]
    ):
        return "Moderate"
    return "Minor"


def _parse_time_lost(description: str) -> int:
    """Extract time lost in minutes from description text."""
    text = description.lower()
    
    # Rule-based defaults
    if "power" in text:
        return 120 # 2 hours as requested
    if "call" in text:
        return 60  # 1 hour as requested

    # Look for patterns like "2 hours", "30 minutes", "1.5 hours"
    hour_match = re.search(r"(\d+(?:\.\d+)?)\s*hour", text)
    min_match = re.search(r"(\d+)\s*min", text)

    total = 0
    if hour_match:
        total += int(float(hour_match.group(1)) * 60)
    if min_match:
        total += int(min_match.group(1))

    return total if total > 0 else 60  # default 60 min


class InfoAgent:
    """
    InfoAgent: Handles all disruption logging and pattern intelligence.
    """

    def __init__(self):
        self.name = "InfoAgent"

    async def log_disruption(
        self,
        session: AsyncSession,
        description: str,
        severity_override: Optional[str] = None,
        time_lost_override: Optional[int] = None,
    ) -> dict:
        """
        Detect type, severity, and time lost from description, then log the disruption.
        Returns the created disruption log entry.
        """
        disruption_type = _detect_disruption_type(description)
        time_lost = time_lost_override if time_lost_override else _parse_time_lost(description)
        severity = severity_override if severity_override else _estimate_severity(
            description, time_lost
        )

        result = await tool_log_disruption(
            session=session,
            disruption_type=disruption_type,
            description=description,
            severity=severity,
            time_lost_minutes=time_lost,
        )

        result["detected_type"] = disruption_type
        result["detected_severity"] = severity
        result["time_lost_minutes"] = time_lost
        result["agent"] = self.name
        return result

    async def get_history(self, session: AsyncSession, limit: int = 20) -> dict:
        """Retrieve recent disruption history."""
        result = await tool_get_disruption_history(session, limit=limit)
        result["agent"] = self.name
        return result

    async def analyze_patterns(self, session: AsyncSession) -> dict:
        """
        Run pattern analysis on disruption history.
        Returns risk insights and proactive warnings.
        """
        result = await tool_analyze_disruption_patterns(session)
        result["agent"] = self.name

        # Add proactive warning flag
        now = datetime.utcnow()
        current_day = now.weekday()   # 0=Mon
        current_hour = now.hour

        warnings = []
        for risky_day in result.get("risky_days", []):
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday",
                         "Friday", "Saturday", "Sunday"]
            if risky_day["day"] == day_names[current_day] and risky_day["count"] >= 2:
                warnings.append(
                    f"🚨 **Proactive Warning**: You've had {risky_day['count']} disruptions "
                    f"on {risky_day['day']}s. Consider scheduling critical work earlier today!"
                )

        for risky_hour in result.get("risky_hours", []):
            h = int(risky_hour["hour"].split(":")[0])
            if abs(h - current_hour) <= 1 and risky_hour["count"] >= 2:
                warnings.append(
                    f"⏰ **Proactive Warning**: {risky_hour['count']} past disruptions "
                    f"occurred around {risky_hour['hour']}. Stay prepared!"
                )

        result["proactive_warnings"] = warnings
        return result

    async def get_step_description(self) -> str:
        """Returns a UI-visible description of what this agent is doing."""
        return (
            "🔍 **InfoAgent** → Logging disruption to database, "
            "retrieving past patterns, generating proactive insights..."
        )
