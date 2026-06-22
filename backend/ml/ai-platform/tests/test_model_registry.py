import pytest
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import joblib
from model_registry.registry import ModelRegistry


@pytest.fixture
def reg(tmp_path):
    db = str(tmp_path / "test_registry.db")
    return ModelRegistry(db_path=db)


@pytest.fixture
def dummy_artifact(tmp_path):
    from sklearn.linear_model import LinearRegression
    model = LinearRegression()
    model.fit([[1], [2], [3]], [1, 2, 3])
    path = str(tmp_path / "test_model.joblib")
    joblib.dump(model, path)
    return path


def test_register_and_retrieve(reg, dummy_artifact):
    record = reg.register_model(
        model_name="test_model",
        accuracy=0.90,
        precision=0.88,
        recall=0.87,
        f1_score=0.875,
        avg_latency_ms=12.5,
        training_samples=1000,
        feature_importance={"f1": 0.6, "f2": 0.4},
        artifact_path=dummy_artifact,
    )
    assert record.id is not None
    assert record.version == 1
    assert record.status == "candidate"
    assert record.accuracy == 0.90


def test_version_increment(reg, dummy_artifact):
    reg.register_model("m", 0.8, 0.8, 0.8, 0.8, 10.0, 500, {}, dummy_artifact)
    r2 = reg.register_model("m", 0.85, 0.85, 0.85, 0.85, 9.0, 600, {}, dummy_artifact)
    assert r2.version == 2


def test_set_and_get_champion(reg, dummy_artifact):
    record = reg.register_model("m", 0.9, 0.9, 0.9, 0.9, 10.0, 1000, {}, dummy_artifact)
    reg.set_as_champion(record.id)
    champion = reg.get_champion("m")
    assert champion is not None
    assert champion.status == "champion"
    assert champion.version == record.version


def test_champion_replaced_on_promote(reg, dummy_artifact):
    r1 = reg.register_model("m", 0.80, 0.8, 0.8, 0.8, 10.0, 1000, {}, dummy_artifact)
    reg.set_as_champion(r1.id)

    r2 = reg.register_model("m", 0.90, 0.9, 0.9, 0.9, 9.0, 1200, {}, dummy_artifact)
    reg.promote_to_challenger(r2.id)
    reg.promote_challenger_to_champion("m")

    champion = reg.get_champion("m")
    assert champion.id == r2.id
    assert champion.status == "champion"

    retired = reg.get_model_by_id(r1.id)
    assert retired.status == "retired"


def test_drift_logging(reg):
    reg.log_drift("m", "focus_minutes", 0.25, 0.08, 0.05, True, "2025-01-01", "2025-01-07")
    history = reg.get_drift_history("m", days=30)
    assert len(history) >= 1
    assert history[0]["drift_detected"] == 1


def test_feedback_logging(reg):
    reg.log_feedback("rec_001", "user_abc", "FOCUS", accepted=True, helpful=True)
    # No error = test passes
