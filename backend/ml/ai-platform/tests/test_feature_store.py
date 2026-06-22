import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from feature_store.feature_builder import (
    build_productivity_features,
    build_habit_features,
    build_burnout_features,
    build_recommendation_features,
)
from feature_store.feature_definitions import (
    PRODUCTIVITY_FEATURE_NAMES,
    HABIT_FEATURE_NAMES,
    BURNOUT_FEATURE_NAMES,
    RECOMMENDATION_FEATURE_NAMES,
)


def _productivity_payload(n_days: int = 14) -> dict:
    return {
        "daily_metrics": [
            {
                "focus_minutes": 90,
                "habit_completion_rate": 0.75,
                "task_completion_rate": 0.6,
                "social_usage_minutes": 30,
                "productivity_score": 72.0,
                "xp_earned": 400,
            }
        ] * n_days,
        "focus_session_count_7d": 5,
        "current_streak": 14,
        "active_habits_count": 4,
        "goal_count": 2,
        "overdue_task_rate": 0.1,
    }


def test_productivity_features_keys():
    feats = build_productivity_features(_productivity_payload())
    assert set(feats.keys()) == set(PRODUCTIVITY_FEATURE_NAMES)


def test_productivity_features_values_in_range():
    feats = build_productivity_features(_productivity_payload())
    assert 0.0 <= feats["habit_completion_rate_7d"] <= 1.0
    assert 0.0 <= feats["avg_focus_minutes_7d"] <= 1440.0
    assert feats["streak_length"] >= 0


def test_habit_features_keys():
    payload = {
        "difficulty": 3,
        "habit_age_days": 30,
        "current_streak": 5,
        "history": [{"completed": True}, {"completed": False}, {"completed": True}],
        "target_time": "08:00",
        "avg_focus_minutes_7d": 60.0,
        "productivity_score_yesterday": 68.0,
    }
    feats = build_habit_features(payload)
    assert set(feats.keys()) == set(HABIT_FEATURE_NAMES)


def test_burnout_features_slope():
    payload = {
        "daily_metrics": [
            {"focus_minutes": 100, "habit_completion_rate": 0.9, "social_usage_minutes": 10, "productivity_score": 85}
        ] * 7
        + [
            {"focus_minutes": 20, "habit_completion_rate": 0.2, "social_usage_minutes": 120, "productivity_score": 30}
        ] * 7,
        "current_streak": 2,
        "overdue_task_rate": 0.4,
    }
    feats = build_burnout_features(payload)
    assert feats["productivity_trend_14d"] < 0
    assert feats["days_with_zero_focus_7d"] == 0


def test_recommendation_features_deficit_flags():
    payload = {
        "productivity_score": 35.0,
        "habit_completion_rate_7d": 0.2,
        "focus_score_7d": 15.0,
        "social_penalty_7d": 15.0,
        "current_streak": 0,
        "overdue_task_rate": 0.5,
    }
    feats = build_recommendation_features(payload)
    assert feats["has_focus_deficit"] == 1.0
    assert feats["has_habit_deficit"] == 1.0
    assert feats["has_social_overuse"] == 1.0
