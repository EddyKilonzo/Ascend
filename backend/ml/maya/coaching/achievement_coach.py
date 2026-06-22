from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach


class AchievementCoach(BaseCoach):
    module_name = "achievement"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        xp = context.xp
        if not xp:
            return {
                "prediction": 0.0,
                "confidence": 0.5,
                "urgency": "low",
                "achievements": [],
                "factors": [],
            }

        xp_momentum = (
            "accelerating" if xp.xp_this_week > xp.xp_last_week * 1.1
            else "decelerating" if xp.xp_this_week < xp.xp_last_week * 0.9
            else "steady"
        )
        xp_delta_pct = (
            ((xp.xp_this_week - xp.xp_last_week) / xp.xp_last_week * 100)
            if xp.xp_last_week > 0
            else 0.0
        )

        # Streak quality
        streak_label = (
            "excellent" if xp.active_streak_days >= 14
            else "good" if xp.active_streak_days >= 7
            else "building" if xp.active_streak_days >= 3
            else "starting"
        )

        urgency = (
            "moderate" if xp_momentum == "decelerating"
            else "low"
        )

        factors = [
            {
                "name": "XP momentum",
                "impact": f"{xp_delta_pct:+.0f}%",
                "direction": "positive" if xp_momentum == "accelerating" else "negative" if xp_momentum == "decelerating" else "neutral",
                "description": f"XP earnings are {xp_momentum}: {xp.xp_this_week} this week vs {xp.xp_last_week} last week",
            },
            {
                "name": "active streak",
                "impact": f"{xp.active_streak_days} days",
                "direction": "positive",
                "description": f"{streak_label.capitalize()} streak of {xp.active_streak_days} days",
            },
            {
                "name": "current level",
                "impact": f"Level {xp.level}",
                "direction": "positive",
                "description": f"Total XP: {xp.total_xp:,} at Level {xp.level}",
            },
        ]

        return {
            "prediction": min(1.0, xp.xp_this_week / max(1, xp.xp_last_week)),
            "confidence": 0.83,
            "urgency": urgency,
            "level": xp.level,
            "total_xp": xp.total_xp,
            "xp_this_week": xp.xp_this_week,
            "xp_last_week": xp.xp_last_week,
            "xp_delta_pct": round(xp_delta_pct, 1),
            "xp_momentum": xp_momentum,
            "streak_days": xp.active_streak_days,
            "streak_label": streak_label,
            "rank": xp.rank_position,
            "recent_achievements": xp.recent_achievements[:5],
            "factors": factors,
        }
