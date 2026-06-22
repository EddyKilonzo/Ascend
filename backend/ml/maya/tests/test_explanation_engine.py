import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from explanation.explanation_engine import _top_shap_factors, _top_importance_factors, _label


def test_label_known_feature():
    assert _label("avg_focus_minutes_7d") == "average daily focus minutes (7d)"


def test_label_unknown_feature_humanized():
    result = _label("my_custom_feature")
    assert result == "my custom feature"


def test_top_shap_factors_sorted_by_abs():
    shap = {
        "habit_completion_rate_7d": -0.15,
        "avg_focus_minutes_7d": 0.08,
        "streak_length": 0.03,
    }
    feat_vals = {
        "habit_completion_rate_7d": 0.45,
        "avg_focus_minutes_7d": 50.0,
        "streak_length": 5.0,
    }
    factors = _top_shap_factors(shap, feat_vals, top_k=2)
    assert len(factors) == 2
    assert factors[0].direction == "negative"  # -0.15 is the biggest abs impact
    assert factors[1].direction == "positive"  # 0.08


def test_top_shap_factors_direction():
    shap = {"avg_focus_minutes_7d": 0.25, "overdue_task_rate": -0.18}
    feat_vals = {"avg_focus_minutes_7d": 90.0, "overdue_task_rate": 0.3}
    factors = _top_shap_factors(shap, feat_vals, top_k=2)
    directions = {f.name: f.direction for f in factors}
    assert directions["average daily focus minutes (7d)"] == "positive"
    assert directions["overdue task rate"] == "negative"


def test_top_importance_factors_capped_by_k():
    feat_vals = {f"feat_{i}": float(i) for i in range(10)}
    factors = _top_importance_factors(feat_vals, top_k=3)
    assert len(factors) == 3


def test_top_importance_factors_neutral_near_zero():
    feat_vals = {"habit_completion_rate_7d": 0.005}
    factors = _top_importance_factors(feat_vals, top_k=1)
    assert factors[0].direction == "neutral"
