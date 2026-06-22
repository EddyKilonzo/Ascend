from datetime import datetime
from schemas.requests import (
    ProductivityScoreRequest,
    HabitRecord,
    FocusSessionRecord,
    TaskRecord,
    SocialUsageRecord,
    SessionType,
    Priority,
)
from schemas.responses import ProductivityScoreResponse, ProductivityBreakdown

_PRIORITY_WEIGHTS: dict[str, int] = {
    Priority.LOW: 1,
    Priority.MEDIUM: 2,
    Priority.HIGH: 3,
    Priority.URGENT: 4,
}

_FOCUS_MULTIPLIERS: dict[str, float] = {
    SessionType.POMODORO: 1.0,
    SessionType.DEEP_WORK: 1.5,
    SessionType.ULTRA_FOCUS: 2.0,
}

_SOCIAL_IMPACT: dict[str, float] = {
    "TikTok": 2.0,
    "tiktok": 2.0,
    "Instagram": 1.5,
    "instagram": 1.5,
    "Facebook": 1.2,
    "facebook": 1.2,
    "Twitter": 1.0,
    "twitter": 1.0,
    "X": 1.0,
    "Reddit": 1.3,
    "reddit": 1.3,
    "YouTube": 1.4,
    "youtube": 1.4,
    "Snapchat": 1.5,
    "snapchat": 1.5,
}

_TARGET_DAILY_FOCUS_MINUTES = 120
_SCORE_GRADES = [
    (90, "S"),
    (80, "A"),
    (70, "B"),
    (60, "C"),
    (50, "D"),
    (0, "F"),
]


def _compute_habit_score(habits: list[HabitRecord]) -> float:
    if not habits:
        return 50.0

    weighted_completed = sum(h.difficulty * int(h.completed) for h in habits)
    max_possible = sum(h.difficulty for h in habits)

    if max_possible == 0:
        return 0.0

    return min(100.0, (weighted_completed / max_possible) * 100)


def _compute_focus_score(sessions: list[FocusSessionRecord]) -> float:
    if not sessions:
        return 0.0

    quality_minutes = 0.0
    for s in sessions:
        if not s.completed:
            continue
        multiplier = _FOCUS_MULTIPLIERS.get(s.session_type, 1.0)
        interruption_penalty = max(0.0, 1.0 - (s.interruptions * 0.1))
        quality_minutes += s.duration_minutes * multiplier * interruption_penalty

    return min(100.0, (quality_minutes / _TARGET_DAILY_FOCUS_MINUTES) * 100)


def _compute_task_score(tasks: list[TaskRecord]) -> float:
    if not tasks:
        return 50.0

    weighted_completed = sum(
        _PRIORITY_WEIGHTS.get(t.priority, 2) * int(t.completed) for t in tasks
    )
    max_possible = sum(_PRIORITY_WEIGHTS.get(t.priority, 2) for t in tasks)

    if max_possible == 0:
        return 0.0

    return (weighted_completed / max_possible) * 100


def _compute_social_penalty(usage: list[SocialUsageRecord]) -> float:
    if not usage:
        return 0.0

    total_penalty_minutes = sum(
        u.duration_minutes * _SOCIAL_IMPACT.get(u.platform, 1.0) for u in usage
    )
    return min(20.0, total_penalty_minutes / 30.0)


def _compute_consistency_score(historical_scores: list[float]) -> float:
    if len(historical_scores) < 3:
        return 50.0

    import statistics
    recent = historical_scores[-7:]
    mean = statistics.mean(recent)
    stdev = statistics.stdev(recent) if len(recent) > 1 else 0.0

    variance_penalty = min(30.0, stdev * 0.5)
    return max(0.0, min(100.0, mean - variance_penalty))


def _grade(score: float) -> str:
    for threshold, grade in _SCORE_GRADES:
        if score >= threshold:
            return grade
    return "F"


def _generate_insights(
    breakdown: ProductivityBreakdown,
    habits: list[HabitRecord],
    tasks: list[TaskRecord],
) -> list[str]:
    insights: list[str] = []

    if breakdown.habit_score < 50:
        incomplete = sum(1 for h in habits if not h.completed)
        insights.append(f"{incomplete} habit(s) missed — habit completion is your biggest growth lever today.")
    elif breakdown.habit_score >= 90:
        insights.append("Excellent habit completion. Consistency compounds over time.")

    if breakdown.focus_score < 30:
        insights.append("No focus sessions logged. Even one 25-minute session significantly boosts your score.")
    elif breakdown.focus_score >= 80:
        insights.append("Strong focus session output today.")

    if breakdown.social_penalty > 10:
        insights.append("Social media usage is causing significant productivity loss. Consider scheduling app usage to off-hours.")
    elif breakdown.social_penalty > 5:
        insights.append("Moderate social media usage detected. Try batching usage to one block per day.")

    overdue = sum(1 for t in tasks if t.overdue and not t.completed)
    if overdue > 0:
        insights.append(f"{overdue} overdue task(s) detected. Clearing overdue items first removes cognitive load.")

    if breakdown.task_score >= 90:
        insights.append("All high-priority tasks completed. Excellent execution.")

    return insights or ["Good effort today. Keep building momentum."]


def compute_productivity_score(req: ProductivityScoreRequest) -> ProductivityScoreResponse:
    habit_score = _compute_habit_score(req.habits)
    focus_score = _compute_focus_score(req.focus_sessions)
    task_score = _compute_task_score(req.tasks)
    social_penalty = _compute_social_penalty(req.social_usage)
    consistency_score = _compute_consistency_score(req.historical_scores)

    raw = (
        habit_score * 0.35
        + focus_score * 0.25
        + task_score * 0.20
        + consistency_score * 0.10
        + (100 - social_penalty) * 0.10
    )
    final_score = round(max(0.0, min(100.0, raw)), 2)

    breakdown = ProductivityBreakdown(
        habit_score=round(habit_score, 2),
        focus_score=round(focus_score, 2),
        task_score=round(task_score, 2),
        social_penalty=round(social_penalty, 2),
        consistency_score=round(consistency_score, 2),
    )

    return ProductivityScoreResponse(
        user_id=req.user_id,
        score=final_score,
        grade=_grade(final_score),
        breakdown=breakdown,
        insights=_generate_insights(breakdown, req.habits, req.tasks),
        period_days=req.period_days,
        computed_at=datetime.utcnow().isoformat(),
    )
