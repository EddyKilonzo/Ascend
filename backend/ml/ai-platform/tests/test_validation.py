import sys
import os
import numpy as np
import pytest
import joblib
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datasets.data_quality import validate_dataset
import pandas as pd


def _make_df(n: int = 300) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    return pd.DataFrame({
        "habit_completion_rate_7d": rng.uniform(0, 1, n),
        "avg_focus_minutes_7d":     rng.uniform(0, 200, n),
        "streak_length":            rng.integers(0, 30, n),
        "overdue_task_rate":        rng.uniform(0, 0.5, n),
        "target":                   rng.uniform(30, 90, n),
    })


def test_clean_dataset_passes():
    df = _make_df(500)
    clean, report = validate_dataset(df, "test")
    assert report.passed is True
    assert report.total_records == 500


def test_too_few_records_fails():
    df = _make_df(50)
    _, report = validate_dataset(df, "test")
    assert report.passed is False


def test_range_violation_rejected():
    df = _make_df(300)
    df.loc[0, "habit_completion_rate_7d"] = 5.0  # >1.0 — invalid
    df.loc[1, "avg_focus_minutes_7d"]     = 9999  # >1440 — invalid
    _, report = validate_dataset(df, "test")
    total_rejected = sum(report.rejection_reasons.values())
    assert total_rejected >= 2


def test_duplicates_removed():
    df = _make_df(200)
    df_dup = pd.concat([df, df.head(50)]).reset_index(drop=True)
    clean, report = validate_dataset(df_dup, "test")
    assert report.duplicate_count == 50
    assert len(clean) == 200


def test_outliers_rejected():
    df = _make_df(300)
    df.loc[0, "streak_length"] = 999999   # extreme z-score
    _, report = validate_dataset(df, "test")
    assert report.outlier_count >= 1
