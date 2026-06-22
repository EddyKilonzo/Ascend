from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach

_DAILY_FOCUS_TARGET = 90  # minutes


class FocusCoach(BaseCoach):
    module_name = "focus"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        f = context.focus
        daily_avg = f.total_minutes_7d // 7 if f.total_minutes_7d > 0 else 0
        vs_target = daily_avg - _DAILY_FOCUS_TARGET
        trend_label = "improving" if f.trend_7d > 5 else "declining" if f.trend_7d < -5 else "stable"

        quality_score = min(
            1.0,
            (daily_avg / _DAILY_FOCUS_TARGET) * 0.6 + f.deep_work_pct * 0.4,
        )

        urgency = (
            "high" if daily_avg < 30
            else "moderate" if daily_avg < 60
            else "low"
        )

        factors = [
            {
                "name": "daily focus average (7d)",
                "impact": f"{daily_avg}min",
                "direction": "positive" if daily_avg >= _DAILY_FOCUS_TARGET else "negative",
                "description": f"Averaging {daily_avg}min/day vs {_DAILY_FOCUS_TARGET}min target",
            },
            {
                "name": "deep work percentage",
                "impact": f"{f.deep_work_pct * 100:.0f}%",
                "direction": "positive" if f.deep_work_pct >= 0.40 else "negative",
                "description": f"{f.deep_work_pct * 100:.0f}% of sessions are deep work",
            },
            {
                "name": "focus trend (7d)",
                "impact": f"{f.trend_7d:+.1f}%",
                "direction": "positive" if f.trend_7d > 0 else "negative",
                "description": f"Focus time has {trend_label} by {abs(f.trend_7d):.1f}% this week",
            },
        ]

        return {
            "prediction": quality_score,
            "confidence": 0.87,
            "urgency": urgency,
            "daily_avg_minutes": daily_avg,
            "vs_target_minutes": vs_target,
            "sessions_7d": f.session_count_7d,
            "avg_session_length": round(f.avg_session_minutes_7d, 1),
            "deep_work_pct": f.deep_work_pct,
            "trend_label": trend_label,
            "trend_7d_pct": f.trend_7d,
            "today_minutes": f.total_minutes_today,
            "factors": factors,
        }
