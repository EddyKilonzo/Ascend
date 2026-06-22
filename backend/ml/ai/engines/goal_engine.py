from datetime import datetime, timedelta
import statistics
from schemas.requests import GoalForecastRequest
from schemas.responses import GoalForecastResponse


def _compute_velocity(daily_progress: list[float]) -> float:
    if not daily_progress:
        return 0.0
    recent = daily_progress[-7:] if len(daily_progress) >= 7 else daily_progress
    return sum(recent) / len(recent)


def _estimate_eta(current_pct: float, velocity: float) -> int | None:
    if velocity <= 0:
        return None
    remaining = 100.0 - current_pct
    return max(1, int(remaining / velocity))


def _compute_completion_probability(
    current_pct: float,
    velocity: float,
    days_remaining: int | None,
    eta_days: int | None,
    difficulty: int,
) -> float:
    if current_pct >= 100:
        return 1.0

    if velocity <= 0:
        return max(0.02, 0.10 - (difficulty * 0.01))

    if days_remaining is None or eta_days is None:
        base = min(0.90, current_pct / 100.0 + velocity * 0.01)
        difficulty_penalty = (difficulty - 1) * 0.05
        return max(0.05, min(0.95, base - difficulty_penalty))

    time_ratio = eta_days / max(days_remaining, 1)

    if time_ratio <= 0.7:
        base = 0.92
    elif time_ratio <= 1.0:
        base = 0.78
    elif time_ratio <= 1.5:
        base = 0.55
    elif time_ratio <= 2.0:
        base = 0.30
    else:
        base = 0.10

    velocity_trend_bonus = 0.0
    if len(req.daily_progress_history) > 3:
        recent_half = req.daily_progress_history[-len(req.daily_progress_history) // 2:]
        early_half = req.daily_progress_history[:len(req.daily_progress_history) // 2]
        recent_vel = sum(recent_half) / len(recent_half) if recent_half else 0.0
        early_vel = sum(early_half) / len(early_half) if early_half else 0.0
        if early_vel > 0:
            velocity_trend_bonus = min(0.05, (recent_vel - early_vel) / early_vel * 0.1)

    difficulty_penalty = (difficulty - 1) * 0.04
    progress_bonus = min(0.10, current_pct / 1000.0)

    prob = base - difficulty_penalty + progress_bonus + velocity_trend_bonus
    return round(max(0.02, min(0.97, prob)), 3)


def _generate_insights(
    current_pct: float,
    velocity: float,
    on_track: bool,
    eta_days: int | None,
    days_remaining: int | None,
    completion_probability: float,
) -> list[str]:
    insights: list[str] = []

    if current_pct >= 100:
        insights.append("Goal completed.")
        return insights

    if velocity == 0:
        insights.append("No progress recorded recently. Linking habits to this goal will drive consistent progress.")
    elif velocity < 0.5:
        insights.append(f"Progress velocity is low ({velocity:.2f}%/day). Increasing daily habit completion will accelerate this goal.")
    else:
        insights.append(f"Progress velocity: {velocity:.2f}%/day.")

    if on_track:
        insights.append("On track to hit target date.")
    else:
        if eta_days and days_remaining:
            overshoot = eta_days - days_remaining
            insights.append(f"At current pace, completion is {overshoot} day(s) past the target date.")
        else:
            insights.append("Insufficient progress data to confirm target date alignment.")

    if completion_probability < 0.40:
        insights.append("Low completion probability. Consider revising the target date or increasing daily effort.")
    elif completion_probability >= 0.80:
        insights.append("High confidence in hitting this goal.")

    return insights


def forecast_goal(req: GoalForecastRequest) -> GoalForecastResponse:
    velocity = _compute_velocity(req.daily_progress_history)
    eta_days = _estimate_eta(req.current_progress_pct, velocity)

    days_remaining: int | None = None
    projected_completion_date: str | None = None

    if req.target_date:
        try:
            target = datetime.fromisoformat(req.target_date)
            days_remaining = max(0, (target - datetime.utcnow()).days)
        except Exception:
            pass

    if eta_days is not None:
        projected = datetime.utcnow() + timedelta(days=eta_days)
        projected_completion_date = projected.strftime("%Y-%m-%d")

    on_track = (
        eta_days is not None
        and days_remaining is not None
        and eta_days <= days_remaining
    ) or (days_remaining is None and eta_days is not None)

    completion_probability = _compute_completion_probability(
        req.current_progress_pct,
        velocity,
        days_remaining,
        eta_days,
        req.difficulty,
    )

    insights = _generate_insights(
        req.current_progress_pct,
        velocity,
        on_track,
        eta_days,
        days_remaining,
        completion_probability,
    )

    return GoalForecastResponse(
        user_id=req.user_id,
        goal_id=req.goal_id,
        completion_probability=completion_probability,
        eta_days=eta_days,
        on_track=on_track,
        projected_completion_date=projected_completion_date,
        velocity=round(velocity, 3),
        insights=insights,
    )
