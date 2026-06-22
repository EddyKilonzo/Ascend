from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach


class MonthlyReviewCoach(BaseCoach):
    module_name = "monthly_review"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        p = context.productivity
        f = context.focus
        s = context.social
        xp = context.xp

        monthly_delta = p.score_today - p.score_30d_avg
        trend_label = "improved" if monthly_delta > 3 else "declined" if monthly_delta < -3 else "stable"

        # Habit mastery: 30d completion >= 85%
        mastered_habits = [h for h in context.habits if h.completion_rate_30d >= 0.85]
        developing_habits = [h for h in context.habits if 0.50 <= h.completion_rate_30d < 0.85]
        struggling_habits = [h for h in context.habits if h.completion_rate_30d < 0.50]

        # Goal pipeline
        completed_goals = [g for g in context.goals if g.progress_pct >= 100]
        active_goals = [g for g in context.goals if g.progress_pct < 100]

        # Focus volume
        monthly_focus_hours = round(f.total_minutes_30d / 60, 1)

        # Social trend
        social_trend_label = "improving" if s.trend_7d < 0 else "worsening" if s.trend_7d > 5 else "stable"

        urgency = (
            "moderate"
            if monthly_delta < -5 or len(struggling_habits) >= 2
            else "low"
        )

        factors = [
            {
                "name": "monthly productivity delta",
                "impact": f"{monthly_delta:+.1f} pts",
                "direction": "positive" if monthly_delta > 0 else "negative",
                "description": f"Score {trend_label} by {abs(monthly_delta):.1f} pts vs 30d average",
            },
            {
                "name": "habits mastered (30d)",
                "impact": str(len(mastered_habits)),
                "direction": "positive",
                "description": f"{len(mastered_habits)} habit(s) at 85%+ completion over 30 days",
            },
            {
                "name": "total focus hours this month",
                "impact": f"{monthly_focus_hours}h",
                "direction": "positive" if monthly_focus_hours >= 30 else "negative",
                "description": f"{monthly_focus_hours} hours of focus time logged in 30 days",
            },
        ]

        return {
            "prediction": p.score_30d_avg,
            "confidence": 0.88,
            "urgency": urgency,
            "score_30d_avg": p.score_30d_avg,
            "monthly_delta": round(monthly_delta, 1),
            "trend_label": trend_label,
            "focus_hours_30d": monthly_focus_hours,
            "social_trend": social_trend_label,
            "mastered_habits": [h.name for h in mastered_habits],
            "developing_habits": [h.name for h in developing_habits[:3]],
            "struggling_habits": [h.name for h in struggling_habits[:3]],
            "completed_goals": len(completed_goals),
            "active_goals": len(active_goals),
            "xp_this_week": xp.xp_this_week if xp else 0,
            "current_level": xp.level if xp else 1,
            "factors": factors,
        }
