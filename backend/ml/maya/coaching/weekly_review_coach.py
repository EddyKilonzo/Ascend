from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach


class WeeklyReviewCoach(BaseCoach):
    module_name = "weekly_review"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        p = context.productivity
        f = context.focus
        s = context.social
        xp = context.xp

        # Week-over-week trend
        trend_pct = p.trend_7d
        trend_label = "up" if trend_pct > 2 else "down" if trend_pct < -2 else "flat"

        # Habit performance this week
        strong_habits = [h for h in context.habits if h.completion_rate_7d >= 0.85]
        weak_habits = [h for h in context.habits if h.completion_rate_7d < 0.60]

        # Goal progress check
        on_track_goals = [g for g in context.goals if g.is_on_track]
        behind_goals = [g for g in context.goals if not g.is_on_track]

        # XP this week
        xp_delta = (xp.xp_this_week - xp.xp_last_week) if xp else 0
        xp_trend = "up" if xp_delta > 0 else "down" if xp_delta < 0 else "flat"

        top_achievement = strong_habits[0].name if strong_habits else "Maintained consistency"
        key_improvement = weak_habits[0].name if weak_habits else "Social media reduction"

        urgency = "moderate" if len(weak_habits) >= 2 or len(behind_goals) >= 2 else "low"

        factors = [
            {
                "name": "productivity trend (7d)",
                "impact": f"{trend_pct:+.1f}%",
                "direction": "positive" if trend_pct > 0 else "negative",
                "description": f"Productivity was {trend_label} by {abs(trend_pct):.1f}% this week",
            },
            {
                "name": "strong habits this week",
                "impact": str(len(strong_habits)),
                "direction": "positive",
                "description": f"{len(strong_habits)} habit(s) maintained 85%+ completion",
            },
            {
                "name": "habits needing attention",
                "impact": str(len(weak_habits)),
                "direction": "negative" if weak_habits else "positive",
                "description": f"{len(weak_habits)} habit(s) below 60% completion this week",
            },
        ]

        return {
            "prediction": p.score_7d_avg,
            "confidence": 0.89,
            "urgency": urgency,
            "week_score_avg": p.score_7d_avg,
            "trend_pct": round(trend_pct, 1),
            "trend_label": trend_label,
            "focus_minutes_week": f.total_minutes_7d,
            "sessions_week": f.session_count_7d,
            "social_daily_avg": s.avg_minutes_7d,
            "strong_habits": [h.name for h in strong_habits[:3]],
            "weak_habits": [h.name for h in weak_habits[:3]],
            "on_track_goals": len(on_track_goals),
            "behind_goals": len(behind_goals),
            "xp_this_week": xp.xp_this_week if xp else 0,
            "xp_delta": xp_delta,
            "xp_trend": xp_trend,
            "top_achievement": top_achievement,
            "key_improvement_area": key_improvement,
            "factors": factors,
        }
