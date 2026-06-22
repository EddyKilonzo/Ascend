from dataclasses import dataclass, field
from typing import Optional


@dataclass
class FeatureSpec:
    name: str
    dtype: str          # 'float' | 'int' | 'bool' | 'categorical'
    default: float = 0.0
    min_val: Optional[float] = None
    max_val: Optional[float] = None


# ── Productivity score regression ────────────────────────────────────────────

PRODUCTIVITY_FEATURES: list[FeatureSpec] = [
    FeatureSpec("avg_focus_minutes_7d",      "float", 0.0,   0.0, 1440.0),
    FeatureSpec("avg_focus_minutes_30d",     "float", 0.0,   0.0, 1440.0),
    FeatureSpec("focus_session_count_7d",    "int",   0,     0,   200),
    FeatureSpec("habit_completion_rate_7d",  "float", 0.0,   0.0, 1.0),
    FeatureSpec("habit_completion_rate_30d", "float", 0.0,   0.0, 1.0),
    FeatureSpec("task_completion_rate_7d",   "float", 0.0,   0.0, 1.0),
    FeatureSpec("avg_social_minutes_7d",     "float", 0.0,   0.0, 1440.0),
    FeatureSpec("streak_length",             "int",   0,     0,   365),
    FeatureSpec("active_habits_count",       "int",   0,     0,   50),
    FeatureSpec("xp_earned_7d",              "float", 0.0,   0.0, 50000.0),
    FeatureSpec("goal_count",                "int",   0,     0,   20),
    FeatureSpec("productivity_trend_7d",     "float", 0.0, -100.0, 100.0),
    FeatureSpec("overdue_task_rate",         "float", 0.0,   0.0, 1.0),
]
PRODUCTIVITY_FEATURE_NAMES = [f.name for f in PRODUCTIVITY_FEATURES]

# ── Habit completion classification (binary) ──────────────────────────────────

HABIT_FEATURES: list[FeatureSpec] = [
    FeatureSpec("habit_difficulty",             "int",   3,    1,    5),
    FeatureSpec("habit_age_days",               "int",   0,    0,    365),
    FeatureSpec("current_streak",               "int",   0,    0,    365),
    FeatureSpec("completion_rate_7d",           "float", 0.5,  0.0,  1.0),
    FeatureSpec("completion_rate_30d",          "float", 0.5,  0.0,  1.0),
    FeatureSpec("hour_of_target",               "int",   9,    0,    23),
    FeatureSpec("day_of_week",                  "int",   0,    0,    6),
    FeatureSpec("avg_focus_minutes_7d",         "float", 0.0,  0.0,  1440.0),
    FeatureSpec("productivity_score_yesterday", "float", 50.0, 0.0,  100.0),
    FeatureSpec("missed_yesterday",             "bool",  0,    0,    1),
]
HABIT_FEATURE_NAMES = [f.name for f in HABIT_FEATURES]

# ── Burnout detection (multiclass: LOW / MEDIUM / HIGH) ──────────────────────

BURNOUT_FEATURES: list[FeatureSpec] = [
    FeatureSpec("productivity_trend_14d",     "float", 0.0,  -100.0, 100.0),
    FeatureSpec("focus_trend_14d",            "float", 0.0, -1440.0, 1440.0),
    FeatureSpec("habit_decline_rate_14d",     "float", 0.0,   -1.0,  1.0),
    FeatureSpec("social_increase_rate_14d",   "float", 0.0, -1440.0, 1440.0),
    FeatureSpec("streak_length",              "int",   0,     0,    365),
    FeatureSpec("overdue_task_rate",          "float", 0.0,   0.0,   1.0),
    FeatureSpec("avg_productivity_score_7d",  "float", 50.0,  0.0,  100.0),
    FeatureSpec("avg_productivity_score_14d", "float", 50.0,  0.0,  100.0),
    FeatureSpec("activity_variance_7d",       "float", 0.0,   0.0,  10000.0),
    FeatureSpec("days_with_zero_focus_7d",    "int",   0,     0,    7),
    FeatureSpec("consecutive_decline_days",   "int",   0,     0,    30),
]
BURNOUT_FEATURE_NAMES = [f.name for f in BURNOUT_FEATURES]

BURNOUT_LABELS        = ["LOW", "MEDIUM", "HIGH"]
BURNOUT_LABEL_MAP     = {label: idx for idx, label in enumerate(BURNOUT_LABELS)}
BURNOUT_IDX_MAP       = {idx: label for label, idx in BURNOUT_LABEL_MAP.items()}

# ── Recommendation ranking ────────────────────────────────────────────────────

RECOMMENDATION_FEATURES: list[FeatureSpec] = [
    FeatureSpec("productivity_score",       "float", 50.0, 0.0,  100.0),
    FeatureSpec("habit_completion_rate_7d", "float", 0.5,  0.0,  1.0),
    FeatureSpec("focus_score_7d",           "float", 0.0,  0.0,  100.0),
    FeatureSpec("social_penalty_7d",        "float", 0.0,  0.0,  20.0),
    FeatureSpec("streak_length",            "int",   0,    0,    365),
    FeatureSpec("overdue_task_rate",        "float", 0.0,  0.0,  1.0),
    FeatureSpec("has_focus_deficit",        "bool",  0,    0,    1),
    FeatureSpec("has_habit_deficit",        "bool",  0,    0,    1),
    FeatureSpec("has_social_overuse",       "bool",  0,    0,    1),
]
RECOMMENDATION_FEATURE_NAMES = [f.name for f in RECOMMENDATION_FEATURES]
RECOMMENDATION_LABELS = ["FOCUS", "HABIT", "TASK", "SOCIAL", "SCHEDULE", "RECOVERY"]
