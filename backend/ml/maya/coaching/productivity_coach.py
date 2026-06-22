from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach

_COMPONENT_WEIGHTS = {
    "habit_completion": 0.35,
    "focus_sessions": 0.25,
    "task_completion": 0.20,
    "consistency": 0.10,
    "social_control": 0.10,
}


class ProductivityCoach(BaseCoach):
    module_name = "productivity"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        p = context.productivity
        f = context.focus
        s = context.social

        habit_rate = (
            sum(h.completion_rate_7d for h in context.habits) / len(context.habits)
            if context.habits
            else 0.0
        )

        bottleneck = self._find_bottleneck(p, f, s, habit_rate)
        trend_label = "improving" if p.trend_7d > 2 else "declining" if p.trend_7d < -2 else "stable"

        factors = [
            {
                "name": "habit completion rate (7d)",
                "impact": f"{habit_rate * 100:.1f}%",
                "direction": "positive" if habit_rate >= 0.75 else "negative",
                "description": f"{habit_rate * 100:.0f}% of habits completed this week",
            },
            {
                "name": "daily focus minutes",
                "impact": f"{f.total_minutes_7d // 7}min/day",
                "direction": "positive" if f.total_minutes_7d // 7 >= 60 else "negative",
                "description": f"Averaging {f.total_minutes_7d // 7}min focus/day over 7 days",
            },
            {
                "name": "task completion rate (7d)",
                "impact": f"{p.task_completion_rate_7d * 100:.1f}%",
                "direction": "positive" if p.task_completion_rate_7d >= 0.70 else "negative",
                "description": f"{p.task_completion_rate_7d * 100:.0f}% of tasks completed",
            },
            {
                "name": "social media usage",
                "impact": f"{s.avg_minutes_7d}min/day",
                "direction": "negative" if s.avg_minutes_7d > 60 else "positive",
                "description": f"Averaging {s.avg_minutes_7d}min/day social usage",
            },
        ]

        return {
            "prediction": p.score_today,
            "confidence": 0.90,
            "urgency": "high" if p.trend_7d < -10 else "moderate" if p.trend_7d < -3 else "low",
            "current_score": p.score_today,
            "score_7d_avg": p.score_7d_avg,
            "trend_7d_pct": round(p.trend_7d, 1),
            "trend_label": trend_label,
            "bottleneck": bottleneck,
            "overdue_tasks": p.overdue_task_count,
            "percentile_rank": p.percentile_rank,
            "factors": factors,
        }

    @staticmethod
    def _find_bottleneck(p: Any, f: Any, s: Any, habit_rate: float) -> str:
        scores = {
            "habit completion": habit_rate,
            "focus sessions": min(f.total_minutes_7d / 7 / 120, 1.0),
            "task completion": p.task_completion_rate_7d,
            "social control": max(0.0, 1.0 - s.avg_minutes_7d / 120),
        }
        return min(scores, key=lambda k: scores[k])
