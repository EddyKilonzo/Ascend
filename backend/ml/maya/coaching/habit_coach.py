from __future__ import annotations

from typing import Any

from schemas.requests import UserContext, HabitSummary
from coaching.base_coach import BaseCoach


class HabitCoach(BaseCoach):
    module_name = "habit"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        habits = context.habits
        if not habits:
            return {
                "prediction": 0.0,
                "confidence": 0.5,
                "urgency": "low",
                "at_risk_habits": [],
                "best_habit": None,
                "avg_completion_7d": 0.0,
                "streak_health": "no habits tracked",
                "factors": [],
            }

        at_risk = [h for h in habits if h.completion_rate_7d < 0.60]
        at_risk.sort(key=lambda h: h.completion_rate_7d)
        best = max(habits, key=lambda h: h.completion_rate_7d)
        avg_completion = sum(h.completion_rate_7d for h in habits) / len(habits)
        total_streak = sum(h.current_streak for h in habits)
        missed_yesterday = [h for h in habits if h.missed_yesterday]

        urgency = "high" if len(at_risk) >= 3 else "moderate" if at_risk else "low"

        factors = [
            {
                "name": "at-risk habits",
                "impact": str(len(at_risk)),
                "direction": "negative" if at_risk else "positive",
                "description": f"{len(at_risk)} habit(s) below 60% completion this week",
            },
            {
                "name": "average completion rate (7d)",
                "impact": f"{avg_completion * 100:.1f}%",
                "direction": "positive" if avg_completion >= 0.75 else "negative",
                "description": f"Average habit completion across all {len(habits)} habits",
            },
            {
                "name": "total active streak days",
                "impact": str(total_streak),
                "direction": "positive" if total_streak >= 7 else "neutral",
                "description": f"Sum of all current streaks: {total_streak} days",
            },
        ]

        return {
            "prediction": avg_completion,
            "confidence": 0.88,
            "urgency": urgency,
            "at_risk_habits": [
                {"name": h.name, "completion_7d": f"{h.completion_rate_7d * 100:.0f}%", "streak": h.current_streak}
                for h in at_risk[:3]
            ],
            "best_habit": {"name": best.name, "completion_7d": f"{best.completion_rate_7d * 100:.0f}%"},
            "avg_completion_7d": round(avg_completion, 3),
            "missed_yesterday_count": len(missed_yesterday),
            "total_habits": len(habits),
            "streak_health": f"{total_streak} total streak days across {len(habits)} habits",
            "factors": factors,
        }
