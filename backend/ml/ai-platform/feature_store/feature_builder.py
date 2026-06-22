"""
Builds feature vectors from raw event data passed by NestJS.

The contract is intentionally simple: NestJS sends aggregated daily metrics
and this module converts them into the normalized feature vectors expected
by each model. No direct database access — all inputs arrive via the API.
"""

import json
import os
from datetime import datetime
from typing import Any
import numpy as np
from config import settings
from feature_store.feature_definitions import (
    PRODUCTIVITY_FEATURE_NAMES,
    HABIT_FEATURE_NAMES,
    BURNOUT_FEATURE_NAMES,
    RECOMMENDATION_FEATURE_NAMES,
)


def _slope(values: list[float]) -> float:
    """Linear regression slope — positive = improving, negative = declining."""
    n = len(values)
    if n < 2:
        return 0.0
    x = np.arange(n, dtype=float)
    y = np.array(values, dtype=float)
    x_mean, y_mean = x.mean(), y.mean()
    denom = float(np.sum((x - x_mean) ** 2))
    if denom == 0:
        return 0.0
    return float(np.sum((x - x_mean) * (y - y_mean)) / denom)


def build_productivity_features(payload: dict[str, Any]) -> dict[str, float]:
    metrics: list[dict] = payload.get("daily_metrics", [])
    focus_7d   = [m.get("focus_minutes", 0) for m in metrics[-7:]]
    focus_30d  = [m.get("focus_minutes", 0) for m in metrics[-30:]]
    habit_7d   = [m.get("habit_completion_rate", 0.0) for m in metrics[-7:]]
    habit_30d  = [m.get("habit_completion_rate", 0.0) for m in metrics[-30:]]
    task_7d    = [m.get("task_completion_rate", 0.0) for m in metrics[-7:]]
    social_7d  = [m.get("social_usage_minutes", 0) for m in metrics[-7:]]
    scores_7d  = [m.get("productivity_score", 50.0) for m in metrics[-7:]]
    xp_7d      = sum(m.get("xp_earned", 0) for m in metrics[-7:])

    return {
        "avg_focus_minutes_7d":      float(np.mean(focus_7d))  if focus_7d  else 0.0,
        "avg_focus_minutes_30d":     float(np.mean(focus_30d)) if focus_30d else 0.0,
        "focus_session_count_7d":    int(payload.get("focus_session_count_7d", 0)),
        "habit_completion_rate_7d":  float(np.mean(habit_7d))  if habit_7d  else 0.0,
        "habit_completion_rate_30d": float(np.mean(habit_30d)) if habit_30d else 0.0,
        "task_completion_rate_7d":   float(np.mean(task_7d))   if task_7d   else 0.0,
        "avg_social_minutes_7d":     float(np.mean(social_7d)) if social_7d else 0.0,
        "streak_length":             int(payload.get("current_streak", 0)),
        "active_habits_count":       int(payload.get("active_habits_count", 0)),
        "xp_earned_7d":              float(xp_7d),
        "goal_count":                int(payload.get("goal_count", 0)),
        "productivity_trend_7d":     _slope(scores_7d),
        "overdue_task_rate":         float(payload.get("overdue_task_rate", 0.0)),
    }


def build_habit_features(payload: dict[str, Any]) -> dict[str, float]:
    history: list[dict] = payload.get("history", [])
    rates_7d  = [int(h.get("completed", False)) for h in history[-7:]]
    rates_30d = [int(h.get("completed", False)) for h in history[-30:]]

    target_time: str = payload.get("target_time", "09:00")
    try:
        hour = int(target_time.split(":")[0])
    except (ValueError, IndexError):
        hour = 9

    last_entry = history[-1] if history else {}
    missed_yesterday = int(not last_entry.get("completed", True))

    return {
        "habit_difficulty":             float(payload.get("difficulty", 3)),
        "habit_age_days":               float(payload.get("habit_age_days", 0)),
        "current_streak":               float(payload.get("current_streak", 0)),
        "completion_rate_7d":           float(np.mean(rates_7d))  if rates_7d  else 0.5,
        "completion_rate_30d":          float(np.mean(rates_30d)) if rates_30d else 0.5,
        "hour_of_target":               float(hour),
        "day_of_week":                  float(datetime.utcnow().weekday()),
        "avg_focus_minutes_7d":         float(payload.get("avg_focus_minutes_7d", 0.0)),
        "productivity_score_yesterday": float(payload.get("productivity_score_yesterday", 50.0)),
        "missed_yesterday":             float(missed_yesterday),
    }


def build_burnout_features(payload: dict[str, Any]) -> dict[str, float]:
    metrics: list[dict] = payload.get("daily_metrics", [])
    prod_14d  = [m.get("productivity_score", 50.0) for m in metrics[-14:]]
    focus_14d = [m.get("focus_minutes", 0) for m in metrics[-14:]]
    habit_14d = [m.get("habit_completion_rate", 0.5) for m in metrics[-14:]]
    social_14d = [m.get("social_usage_minutes", 0) for m in metrics[-14:]]

    prod_7d  = prod_14d[-7:]
    prod_14d_avg = float(np.mean(prod_14d))  if prod_14d  else 50.0
    prod_7d_avg  = float(np.mean(prod_7d))   if prod_7d   else 50.0

    zero_focus_days = sum(1 for m in metrics[-7:] if m.get("focus_minutes", 0) == 0)
    consec_decline  = 0
    for i in range(len(prod_14d) - 1, 0, -1):
        if prod_14d[i] < prod_14d[i - 1]:
            consec_decline += 1
        else:
            break

    return {
        "productivity_trend_14d":     _slope(prod_14d),
        "focus_trend_14d":            _slope(focus_14d),
        "habit_decline_rate_14d":     _slope(habit_14d),
        "social_increase_rate_14d":   _slope(social_14d),
        "streak_length":              float(payload.get("current_streak", 0)),
        "overdue_task_rate":          float(payload.get("overdue_task_rate", 0.0)),
        "avg_productivity_score_7d":  prod_7d_avg,
        "avg_productivity_score_14d": prod_14d_avg,
        "activity_variance_7d":       float(np.var(prod_7d)) if prod_7d else 0.0,
        "days_with_zero_focus_7d":    float(zero_focus_days),
        "consecutive_decline_days":   float(consec_decline),
    }


def build_recommendation_features(payload: dict[str, Any]) -> dict[str, float]:
    score      = float(payload.get("productivity_score", 50.0))
    habit_rate = float(payload.get("habit_completion_rate_7d", 0.5))
    focus_sc   = float(payload.get("focus_score_7d", 0.0))
    social_pen = float(payload.get("social_penalty_7d", 0.0))
    streak     = int(payload.get("current_streak", 0))
    overdue    = float(payload.get("overdue_task_rate", 0.0))

    return {
        "productivity_score":       score,
        "habit_completion_rate_7d": habit_rate,
        "focus_score_7d":           focus_sc,
        "social_penalty_7d":        social_pen,
        "streak_length":            float(streak),
        "overdue_task_rate":        overdue,
        "has_focus_deficit":        float(focus_sc < 30),
        "has_habit_deficit":        float(habit_rate < 0.4),
        "has_social_overuse":       float(social_pen > 10),
    }


def _safe_user_id(user_id: str) -> str:
    """Sanitize user_id — prevents path traversal and filesystem issues."""
    import re
    sanitized = re.sub(r"[^a-zA-Z0-9_\-]", "_", user_id)
    return sanitized[:64] if sanitized else "unknown"


def persist_feature_vector(user_id: str, model_type: str, features: dict) -> None:
    base_path = os.path.abspath(os.path.join(settings.FEATURE_STORE_DIR, model_type))
    safe_id = _safe_user_id(user_id)
    filepath = os.path.join(base_path, f"{safe_id}.jsonl")

    # Verify final path stays within the expected directory (belt + suspenders)
    if not os.path.abspath(filepath).startswith(base_path + os.sep):
        raise ValueError(f"path_traversal_prevented: user_id={user_id!r}")

    os.makedirs(base_path, exist_ok=True)
    record = {"timestamp": datetime.utcnow().isoformat(), **features}
    with open(filepath, "a") as f:
        f.write(json.dumps(record) + "\n")
