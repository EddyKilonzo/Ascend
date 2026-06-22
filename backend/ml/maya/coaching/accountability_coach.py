from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach


class AccountabilityCoach(BaseCoach):
    module_name = "accountability"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        p = context.productivity
        f = context.focus
        s = context.social

        # Commitment gap: overdue tasks + behind-schedule goals
        overdue = p.overdue_task_count
        behind_goals = sum(1 for g in context.goals if not g.is_on_track)
        missed_habits = sum(1 for h in context.habits if h.missed_yesterday)

        # Social media accountability
        social_over = max(0, s.avg_minutes_7d - 60)  # minutes over 1hr/day baseline
        focus_gap = max(0, 90 - (f.total_minutes_7d // 7))  # gap from 90min/day target

        accountability_score = max(
            0.0,
            1.0
            - (overdue * 0.05)
            - (behind_goals * 0.10)
            - (missed_habits * 0.08)
            - (social_over / 200)
            - (focus_gap / 180),
        )

        urgency = (
            "high" if overdue >= 3 or behind_goals >= 2
            else "moderate" if overdue >= 1 or missed_habits >= 2
            else "low"
        )

        factors = [
            {
                "name": "overdue tasks",
                "impact": str(overdue),
                "direction": "negative" if overdue > 0 else "positive",
                "description": f"{overdue} task(s) past their deadline",
            },
            {
                "name": "goals behind schedule",
                "impact": str(behind_goals),
                "direction": "negative" if behind_goals > 0 else "positive",
                "description": f"{behind_goals} goal(s) missed their weekly target",
            },
            {
                "name": "social media daily average",
                "impact": f"{s.avg_minutes_7d}min",
                "direction": "negative" if s.avg_minutes_7d > 60 else "positive",
                "description": f"Spending {s.avg_minutes_7d}min/day on social media"
                + (f" — {social_over}min over baseline" if social_over > 0 else ""),
            },
        ]

        accountability_items = []
        if overdue > 0:
            accountability_items.append(f"You have {overdue} overdue task(s)")
        if behind_goals > 0:
            accountability_items.append(f"{behind_goals} goal(s) are below their weekly pace")
        if missed_habits > 0:
            accountability_items.append(f"You missed {missed_habits} habit(s) yesterday")
        if social_over > 10:
            accountability_items.append(
                f"You spent {social_over}min more than baseline on social media today"
            )
        if focus_gap > 15:
            accountability_items.append(f"You are {focus_gap}min short of your daily focus target")

        return {
            "prediction": round(accountability_score, 3),
            "confidence": 0.86,
            "urgency": urgency,
            "accountability_items": accountability_items,
            "overdue_tasks": overdue,
            "behind_goals": behind_goals,
            "missed_habits_yesterday": missed_habits,
            "social_daily_avg": s.avg_minutes_7d,
            "focus_gap_minutes": focus_gap,
            "factors": factors,
        }
