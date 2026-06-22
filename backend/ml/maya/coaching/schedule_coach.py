from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach


class ScheduleCoach(BaseCoach):
    module_name = "schedule"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        p = context.productivity
        f = context.focus
        habits = context.habits

        # Infer peak productivity window from focus data and habit target times
        target_hours = [h.target_time_hour for h in habits if h.target_time_hour is not None]
        morning_habits = [h for h in target_hours if 5 <= h < 12]
        afternoon_habits = [h for h in target_hours if 12 <= h < 17]
        evening_habits = [h for h in target_hours if 17 <= h < 22]

        # Default peak window based on majority of scheduled habits
        if len(morning_habits) >= len(afternoon_habits) and len(morning_habits) >= len(evening_habits):
            peak_window = "06:00–10:00"
            peak_label = "morning"
        elif len(afternoon_habits) >= len(evening_habits):
            peak_window = "13:00–17:00"
            peak_label = "afternoon"
        else:
            peak_window = "18:00–21:00"
            peak_label = "evening"

        overdue = p.overdue_task_count
        focus_deficit = max(0, 90 - (f.total_minutes_7d // 7))

        schedule_recommendations = [
            f"Schedule your most critical task during your peak window: {peak_window}",
            f"Block {min(90, 90 - focus_deficit + 30)}min for deep work in the {peak_label}",
        ]
        if overdue > 0:
            schedule_recommendations.append(
                f"Allocate 30min today specifically to clear {overdue} overdue task(s)"
            )
        if habits:
            unscheduled = [h for h in habits if h.target_time_hour is None]
            if unscheduled:
                schedule_recommendations.append(
                    f"Assign specific times to {len(unscheduled)} unscheduled habit(s)"
                )

        urgency = "moderate" if overdue > 0 or focus_deficit > 30 else "low"

        factors = [
            {
                "name": "peak productivity window",
                "impact": peak_window,
                "direction": "positive",
                "description": f"Based on {len(habits)} habits, your optimal time is {peak_window}",
            },
            {
                "name": "daily focus deficit",
                "impact": f"{focus_deficit}min" if focus_deficit > 0 else "on target",
                "direction": "negative" if focus_deficit > 0 else "positive",
                "description": f"{focus_deficit}min below the 90min/day focus target" if focus_deficit > 0 else "Meeting daily focus target",
            },
        ]

        return {
            "prediction": max(0.0, 1.0 - overdue * 0.1 - focus_deficit / 180),
            "confidence": 0.78,
            "urgency": urgency,
            "peak_window": peak_window,
            "peak_label": peak_label,
            "focus_deficit_minutes": focus_deficit,
            "overdue_tasks": overdue,
            "schedule_recommendations": schedule_recommendations,
            "unscheduled_habits": len([h for h in habits if h.target_time_hour is None]),
            "factors": factors,
        }
