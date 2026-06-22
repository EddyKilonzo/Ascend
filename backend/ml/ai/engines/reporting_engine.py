from datetime import datetime
import statistics
from schemas.requests import ReportRequest, DailyMetrics
from schemas.responses import ReportResponse, WeeklyHighlight


def _compute_period_score(metrics: list[DailyMetrics]) -> float:
    if not metrics:
        return 0.0

    scores: list[float] = []
    for m in metrics:
        habit_component = m.habit_completion_rate * 35
        focus_component = min(25, (m.focus_minutes / 120) * 25)
        task_component = m.task_completion_rate * 20
        social_penalty = min(10, (m.social_usage_minutes / 60) * 5)
        daily = habit_component + focus_component + task_component - social_penalty
        scores.append(max(0.0, min(100.0, daily)))

    return round(sum(scores) / len(scores), 2)


def _compute_highlights(metrics: list[DailyMetrics], period: str) -> list[WeeklyHighlight]:
    highlights: list[WeeklyHighlight] = []
    if not metrics:
        return highlights

    avg_habits = sum(m.habit_completion_rate for m in metrics) / len(metrics)
    total_focus = sum(m.focus_minutes for m in metrics)
    avg_tasks = sum(m.task_completion_rate for m in metrics) / len(metrics)
    total_social = sum(m.social_usage_minutes for m in metrics)
    total_xp = sum(m.xp_earned for m in metrics)

    midpoint = len(metrics) // 2
    if midpoint > 0:
        first_half_habits = sum(m.habit_completion_rate for m in metrics[:midpoint]) / midpoint
        second_half_habits = sum(m.habit_completion_rate for m in metrics[midpoint:]) / max(len(metrics) - midpoint, 1)
        habit_trend = ((second_half_habits - first_half_habits) / max(first_half_habits, 0.01)) * 100
    else:
        habit_trend = 0.0

    highlights.append(WeeklyHighlight(
        metric="Habit Completion Rate",
        value=f"{avg_habits:.0%}",
        change_pct=round(habit_trend, 1),
        trend="up" if habit_trend > 2 else "down" if habit_trend < -2 else "stable",
    ))

    target_focus = 840 if period == "weekly" else 3360
    focus_pct = (total_focus / target_focus) * 100
    highlights.append(WeeklyHighlight(
        metric="Focus Time",
        value=f"{total_focus} min",
        change_pct=round(focus_pct - 100, 1),
        trend="up" if focus_pct >= 100 else "down",
    ))

    highlights.append(WeeklyHighlight(
        metric="Task Completion Rate",
        value=f"{avg_tasks:.0%}",
        change_pct=0.0,
        trend="stable",
    ))

    highlights.append(WeeklyHighlight(
        metric="XP Earned",
        value=str(total_xp),
        change_pct=0.0,
        trend="up" if total_xp > 0 else "stable",
    ))

    avg_social_daily = total_social / max(len(metrics), 1)
    social_trend = "down" if avg_social_daily < 30 else "up" if avg_social_daily > 90 else "stable"
    highlights.append(WeeklyHighlight(
        metric="Daily Social Media",
        value=f"{avg_social_daily:.0f} min/day",
        change_pct=0.0,
        trend=social_trend,
    ))

    return highlights


def _find_improvement_areas(metrics: list[DailyMetrics], req: ReportRequest) -> list[str]:
    areas: list[str] = []
    if not metrics:
        return areas

    avg_habits = sum(m.habit_completion_rate for m in metrics) / len(metrics)
    total_focus = sum(m.focus_minutes for m in metrics)
    avg_tasks = sum(m.task_completion_rate for m in metrics) / len(metrics)
    avg_social = sum(m.social_usage_minutes for m in metrics) / len(metrics)

    period_days = len(metrics)
    target_focus = period_days * 120

    if avg_habits < 0.5:
        areas.append("Habit completion is below 50% — the core driver of long-term progress.")
    if total_focus < target_focus * 0.5:
        areas.append(f"Focus time is at {total_focus}/{target_focus} target minutes — deep work sessions are under-utilized.")
    if avg_tasks < 0.6:
        areas.append("Task completion rate below 60% — high-priority tasks may be stalling.")
    if avg_social > 90:
        areas.append(f"Social media averaging {avg_social:.0f} min/day — above recommended 30 min/day ceiling.")

    if not areas:
        areas.append("All primary metrics are healthy. Focus on consistency to sustain current performance.")

    return areas


def _generate_behavioral_insights(metrics: list[DailyMetrics], req: ReportRequest) -> list[str]:
    insights: list[str] = []
    if not metrics:
        return insights

    xp_values = [m.xp_earned for m in metrics]
    if len(xp_values) >= 3:
        stdev_xp = statistics.stdev(xp_values) if len(xp_values) > 1 else 0
        mean_xp = statistics.mean(xp_values)
        cv = stdev_xp / mean_xp if mean_xp > 0 else 0

        if cv < 0.20:
            insights.append("High consistency in daily XP output — your routine is stable and sustainable.")
        elif cv > 0.60:
            insights.append("High volatility in daily XP — performance spikes and crashes suggest inconsistent scheduling.")

    habit_rates = [m.habit_completion_rate for m in metrics]
    best_day_idx = habit_rates.index(max(habit_rates)) if habit_rates else 0
    worst_day_idx = habit_rates.index(min(habit_rates)) if habit_rates else 0

    try:
        best_dt = datetime.fromisoformat(metrics[best_day_idx].date)
        worst_dt = datetime.fromisoformat(metrics[worst_day_idx].date)
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        insights.append(f"Best day: {days[best_dt.weekday()]} — worst day: {days[worst_dt.weekday()]}. Adjust scheduling to reinforce your strong days.")
    except Exception:
        pass

    if req.goals_completed > 0:
        insights.append(f"{req.goals_completed} goal(s) completed this period. Goal velocity is building.")
    if req.achievements_earned > 0:
        insights.append(f"{req.achievements_earned} achievement(s) unlocked. Achievement rate reflects activity diversity.")
    if req.level_ups > 0:
        insights.append(f"Leveled up {req.level_ups} time(s) this period — strong XP accumulation.")

    return insights or ["Insufficient data for behavioral pattern analysis. Continue logging activity to unlock insights."]


def _identify_top_habit(req: ReportRequest) -> str | None:
    if not req.habits:
        return None
    completed = [h for h in req.habits if h.completed]
    if not completed:
        return None
    best = max(completed, key=lambda h: h.difficulty)
    return f"Difficulty-{best.difficulty} habit (id: {best.habit_id})"


def _next_period_goals(metrics: list[DailyMetrics], improvement_areas: list[str]) -> list[str]:
    goals: list[str] = []

    if not metrics:
        return ["Log at least 5 days of activity to generate next-period targets."]

    avg_habits = sum(m.habit_completion_rate for m in metrics) / len(metrics)
    total_focus = sum(m.focus_minutes for m in metrics)
    period_days = len(metrics)

    target_habit = min(1.0, avg_habits + 0.10)
    goals.append(f"Increase habit completion rate from {avg_habits:.0%} to {target_habit:.0%}.")

    current_daily_focus = total_focus / max(period_days, 1)
    target_focus = min(180, current_daily_focus + 20)
    goals.append(f"Increase average daily focus time from {current_daily_focus:.0f} to {target_focus:.0f} minutes.")

    if "social media" in " ".join(improvement_areas).lower():
        goals.append("Reduce daily social media to under 30 minutes.")

    goals.append("Maintain zero-missed-days on your top 3 habits.")

    return goals[:4]


def generate_report(req: ReportRequest) -> ReportResponse:
    metrics = req.daily_metrics
    period_score = _compute_period_score(metrics)

    score_change: float | None = None
    if req.previous_period_score is not None:
        score_change = round(period_score - req.previous_period_score, 2)

    highlights = _compute_highlights(metrics, req.period)
    improvement_areas = _find_improvement_areas(metrics, req)
    behavioral_insights = _generate_behavioral_insights(metrics, req)
    top_habit = _identify_top_habit(req)
    next_goals = _next_period_goals(metrics, improvement_areas)

    period_label = _build_period_label(req.period)

    achievements_summary = (
        f"{req.achievements_earned} achievements · {req.level_ups} level-ups · {req.total_xp} XP earned"
    )

    return ReportResponse(
        user_id=req.user_id,
        period=req.period,
        period_label=period_label,
        overall_score=period_score,
        score_change=score_change,
        highlights=highlights,
        top_habit=top_habit,
        improvement_areas=improvement_areas,
        behavioral_insights=behavioral_insights,
        achievements_summary=achievements_summary,
        next_period_goals=next_goals,
        generated_at=datetime.utcnow().isoformat(),
    )


def _build_period_label(period: str) -> str:
    now = datetime.utcnow()
    if period == "weekly":
        from_date = now.strftime("%b %d")
        return f"Week of {from_date}"
    return now.strftime("%B %Y")
