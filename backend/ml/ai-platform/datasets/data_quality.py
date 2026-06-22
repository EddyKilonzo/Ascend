import numpy as np
import pandas as pd
from dataclasses import dataclass

_HARD_LIMITS: dict[str, tuple[float, float]] = {
    "avg_focus_minutes_7d":      (0, 1440),
    "avg_focus_minutes_30d":     (0, 1440),
    "habit_completion_rate_7d":  (0.0, 1.0),
    "habit_completion_rate_30d": (0.0, 1.0),
    "task_completion_rate_7d":   (0.0, 1.0),
    "avg_social_minutes_7d":     (0, 1440),
    "streak_length":             (0, 3650),
    "productivity_score":        (0, 100),
    "productivity_trend_7d":     (-100, 100),
    "overdue_task_rate":         (0.0, 1.0),
    "habit_difficulty":          (1, 5),
    "habit_age_days":            (0, 3650),
    "current_streak":            (0, 3650),
    "completion_rate_7d":        (0.0, 1.0),
    "completion_rate_30d":       (0.0, 1.0),
    "hour_of_target":            (0, 23),
    "day_of_week":               (0, 6),
    "focus_session_count_7d":    (0, 200),
    "xp_earned_7d":              (0, 500_000),
    "active_habits_count":       (0, 100),
    "goal_count":                (0, 50),
}

_MAX_MISSING_RATE    = 0.05
_Z_SCORE_THRESHOLD   = 5.0
_MIN_RECORDS         = 100
_MAX_REJECT_FRACTION = 0.30


@dataclass
class QualityReport:
    passed: bool
    total_records: int
    rejected_records: int
    rejection_reasons: dict[str, int]
    missing_rate: dict[str, float]
    outlier_count: int
    duplicate_count: int
    warnings: list[str]


def validate_dataset(df: pd.DataFrame, model_name: str) -> tuple[pd.DataFrame, QualityReport]:
    rejection_reasons: dict[str, int] = {}
    warnings: list[str] = []
    bad: set[int] = set()

    if len(df) < _MIN_RECORDS:
        return df.iloc[0:0], QualityReport(
            passed=False,
            total_records=len(df),
            rejected_records=len(df),
            rejection_reasons={"insufficient_data": len(df)},
            missing_rate={},
            outlier_count=0,
            duplicate_count=0,
            warnings=[f"Only {len(df)} records — minimum is {_MIN_RECORDS}"],
        )

    # Missing value audit
    missing_rate: dict[str, float] = {}
    for col in df.columns:
        rate = float(df[col].isna().sum() / len(df))
        missing_rate[col] = round(rate, 4)
        if rate > _MAX_MISSING_RATE:
            warnings.append(f"'{col}' has {rate:.1%} missing values")

    # Hard-limit range violations
    for col, (lo, hi) in _HARD_LIMITS.items():
        if col not in df.columns:
            continue
        mask = (df[col] < lo) | (df[col] > hi)
        violated = df.index[mask].tolist()
        if violated:
            bad.update(violated)
            rejection_reasons[f"range_{col}"] = len(violated)

    # Z-score outliers per numeric column
    outlier_count = 0
    for col in df.select_dtypes(include=[np.number]).columns:
        series = df[col].dropna()
        if len(series) < 3:
            continue
        mean, std = float(series.mean()), float(series.std())
        if std == 0:
            continue
        z = np.abs((df[col] - mean) / std)
        hits = df.index[z > _Z_SCORE_THRESHOLD].tolist()
        if hits:
            outlier_count += len(hits)
            bad.update(hits)
            rejection_reasons[f"outlier_{col}"] = len(hits)

    # Exact-duplicate rows (excluding label / id columns)
    id_cols  = {c for c in df.columns if c in ("label", "target", "user_id")}
    feat_cols = [c for c in df.columns if c not in id_cols]
    dup_mask  = df.duplicated(subset=feat_cols, keep="first")
    dups      = df.index[dup_mask].tolist()
    if dups:
        bad.update(dups)
        rejection_reasons["duplicate"] = len(dups)

    clean_df = df.drop(index=list(bad)).reset_index(drop=True)
    rejected = len(df) - len(clean_df)
    passed = (
        len(clean_df) >= _MIN_RECORDS
        and (rejected / max(len(df), 1)) < _MAX_REJECT_FRACTION
    )

    return clean_df, QualityReport(
        passed=passed,
        total_records=len(df),
        rejected_records=rejected,
        rejection_reasons=rejection_reasons,
        missing_rate=missing_rate,
        outlier_count=outlier_count,
        duplicate_count=len(dups),
        warnings=warnings,
    )
