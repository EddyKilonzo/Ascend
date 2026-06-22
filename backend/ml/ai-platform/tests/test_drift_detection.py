import sys
import os
import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from monitoring.drift_detection.drift_detector import (
    _psi, _kl, _js, detect_drift
)


def test_psi_identical_distributions():
    x = np.random.default_rng(0).normal(50, 10, 500)
    assert _psi(x, x.copy()) < 0.01


def test_psi_very_different_distributions():
    ref = np.random.default_rng(0).normal(50, 5, 500)
    cur = np.random.default_rng(1).normal(80, 5, 500)
    assert _psi(ref, cur) > 0.2


def test_kl_identical():
    x = np.random.default_rng(0).uniform(0, 100, 300)
    assert _kl(x, x.copy()) < 0.05


def test_js_bounded():
    ref = np.random.default_rng(0).normal(0,  1, 300)
    cur = np.random.default_rng(1).normal(10, 1, 300)
    js  = _js(ref, cur)
    assert 0.0 <= js <= 1.0


def test_detect_drift_stable(tmp_path):
    rng = np.random.default_rng(42)
    data = rng.normal(50, 10, 500)
    ref = {"feature_a": data}
    cur = {"feature_a": data + rng.normal(0, 0.5, 500)}  # tiny noise

    report = detect_drift("test_model", ref, cur, log_to_registry=False)
    assert report.overall_severity in ("none", "minor")


def test_detect_drift_significant(tmp_path):
    rng = np.random.default_rng(42)
    ref = {"focus_minutes": rng.normal(90, 10, 500)}
    cur = {"focus_minutes": rng.normal(20, 10, 500)}  # dramatic shift

    report = detect_drift("test_model", ref, cur, log_to_registry=False)
    assert report.drift_detected is True
    assert report.overall_severity in ("significant", "critical")


def test_detect_drift_unknown_feature():
    ref = {"feature_x": np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0])}
    cur = {"feature_y": np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0])}
    report = detect_drift("test_model", ref, cur, log_to_registry=False)
    assert report.feature_drift == []
    assert report.drift_detected is False
