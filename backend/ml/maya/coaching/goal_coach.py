from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach


class GoalCoach(BaseCoach):
    module_name = "goal"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        goals = context.goals
        if not goals:
            return {
                "prediction": 0.0,
                "confidence": 0.5,
                "urgency": "low",
                "behind_schedule": [],
                "on_track_count": 0,
                "avg_progress": 0.0,
                "factors": [],
            }

        behind = [g for g in goals if not g.is_on_track]
        on_track = [g for g in goals if g.is_on_track]
        at_deadline_risk = [
            g for g in goals
            if g.deadline_days is not None and g.deadline_days <= 7 and g.progress_pct < 80
        ]

        avg_progress = sum(g.progress_pct for g in goals) / len(goals)

        urgency = (
            "critical" if at_deadline_risk
            else "high" if len(behind) >= 2
            else "moderate" if behind
            else "low"
        )

        factors = [
            {
                "name": "goals behind schedule",
                "impact": str(len(behind)),
                "direction": "negative" if behind else "positive",
                "description": f"{len(behind)} of {len(goals)} goals are behind their weekly target",
            },
            {
                "name": "average goal progress",
                "impact": f"{avg_progress:.1f}%",
                "direction": "positive" if avg_progress >= 50 else "negative",
                "description": f"Overall average progress across all {len(goals)} goals",
            },
        ]

        if at_deadline_risk:
            factors.append({
                "name": "deadline-at-risk goals",
                "impact": str(len(at_deadline_risk)),
                "direction": "negative",
                "description": f"{len(at_deadline_risk)} goal(s) due within 7 days with <80% progress",
            })

        return {
            "prediction": avg_progress / 100,
            "confidence": 0.85,
            "urgency": urgency,
            "behind_schedule": [
                {
                    "title": g.title,
                    "progress": f"{g.progress_pct:.0f}%",
                    "deadline_days": g.deadline_days,
                    "weekly_gap": f"{g.weekly_target_pct - g.weekly_actual_pct:.1f}%",
                }
                for g in behind[:3]
            ],
            "at_deadline_risk": [
                {"title": g.title, "progress": f"{g.progress_pct:.0f}%", "days_left": g.deadline_days}
                for g in at_deadline_risk[:2]
            ],
            "on_track_count": len(on_track),
            "behind_count": len(behind),
            "total_goals": len(goals),
            "avg_progress": round(avg_progress, 1),
            "factors": factors,
        }
