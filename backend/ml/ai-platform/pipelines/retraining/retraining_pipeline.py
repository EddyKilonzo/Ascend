"""
Orchestrates the full retraining workflow for all models.

Trigger conditions (any one is sufficient):
  A. Model accuracy < threshold (performance degradation)
  B. New feature records >= RETRAINING_MIN_NEW_RECORDS (sufficient new data)
  C. Significant drift detected in key features (distributional shift)

Workflow per model:
  1. Check if any trigger is met
  2. Load / generate training dataset
  3. Run data quality validation
  4. Train new model
  5. Validate (accuracy + latency + SHAP + bias)
  6. If valid → promote to challenger for shadow testing
  7. Log training run to registry
"""

import os
import json
import glob
from dataclasses import dataclass
from typing import Optional
import numpy as np
import pandas as pd
from datetime import datetime
from config import settings
from model_registry.registry import registry
from datasets.data_quality import validate_dataset
from pipelines.validation.model_validator import validate_model
from monitoring.model_metrics.metrics_tracker import performance_is_degraded
from anti_poison.poison_detector import get_excluded_users


@dataclass
class RetrainingTrigger:
    model_name: str
    triggered: bool
    reason: str
    new_records: int
    accuracy_degraded: bool
    drift_detected: bool


@dataclass
class RetrainingOutcome:
    model_name: str
    triggered: bool
    trigger_reason: str
    training_samples: int
    validation_passed: bool
    new_model_version: Optional[int]
    new_model_status: str     # 'challenger' | 'rejected' | 'no_trigger'
    metrics: dict
    error: Optional[str]
    completed_at: str


def _count_feature_records(model_type: str) -> int:
    path = os.path.join(settings.FEATURE_STORE_DIR, model_type, "*.jsonl")
    total = 0
    for f in glob.glob(path):
        with open(f) as fh:
            total += sum(1 for _ in fh)
    return total


def _load_feature_records(model_type: str, excluded_users: set[str]) -> list[dict]:
    path = os.path.join(settings.FEATURE_STORE_DIR, model_type, "*.jsonl")
    records: list[dict] = []
    for filepath in glob.glob(path):
        user_id = os.path.splitext(os.path.basename(filepath))[0]
        if user_id in excluded_users:
            continue
        with open(filepath) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    return records


def check_triggers(model_name: str, feature_type: str) -> RetrainingTrigger:
    champion = registry.get_champion(model_name)

    new_records = _count_feature_records(feature_type)

    acc_degraded = False
    if champion:
        acc_degraded = performance_is_degraded(model_name, champion.accuracy)

    drift_records = registry.get_drift_history(model_name, days=settings.DRIFT_CHECK_WINDOW_DAYS)
    drift_detected = any(r.get("drift_detected") for r in drift_records)

    sufficient_data = new_records >= settings.RETRAINING_MIN_NEW_RECORDS

    triggered = acc_degraded or sufficient_data or drift_detected or champion is None
    reasons = []
    if champion is None:       reasons.append("no_champion_exists")
    if acc_degraded:           reasons.append("accuracy_degraded")
    if sufficient_data:        reasons.append(f"new_data_{new_records}_records")
    if drift_detected:         reasons.append("feature_drift_detected")

    return RetrainingTrigger(
        model_name=model_name,
        triggered=triggered,
        reason=", ".join(reasons) if reasons else "no_trigger",
        new_records=new_records,
        accuracy_degraded=acc_degraded,
        drift_detected=drift_detected,
    )


def _get_trainer(model_name: str):
    from training.productivity.trainer import ProductivityTrainer
    from training.habits.trainer import HabitTrainer
    from training.burnout.trainer import BurnoutTrainer
    from training.recommendations.trainer import RecommendationTrainer

    mapping = {
        "productivity_score":   ProductivityTrainer,
        "habit_completion":     HabitTrainer,
        "burnout_detection":    BurnoutTrainer,
        "recommendation_engine": RecommendationTrainer,
    }
    cls = mapping.get(model_name)
    if cls is None:
        raise ValueError(f"Unknown model name: {model_name}")
    return cls()


def _feature_type(model_name: str) -> str:
    return {
        "productivity_score":    "productivity",
        "habit_completion":      "habits",
        "burnout_detection":     "burnout",
        "recommendation_engine": "recommendations",
    }.get(model_name, model_name)


def _task_type(model_name: str) -> str:
    return {
        "productivity_score":    "regression",
        "habit_completion":      "binary",
        "burnout_detection":     "multiclass",
        "recommendation_engine": "multiclass",
    }.get(model_name, "regression")


def run_retraining(model_name: str, force: bool = False) -> RetrainingOutcome:
    now = datetime.utcnow().isoformat()
    feature_type = _feature_type(model_name)
    trigger      = check_triggers(model_name, feature_type)

    if not trigger.triggered and not force:
        return RetrainingOutcome(
            model_name=model_name,
            triggered=False,
            trigger_reason="no_trigger",
            training_samples=0,
            validation_passed=False,
            new_model_version=None,
            new_model_status="no_trigger",
            metrics={},
            error=None,
            completed_at=now,
        )

    run_id = registry.log_training_run(model_name, trigger.reason)
    trainer = _get_trainer(model_name)
    error: Optional[str] = None
    new_model_id: Optional[int] = None
    df_clean: Optional[pd.DataFrame] = None

    try:
        excluded = set(get_excluded_users())
        records  = _load_feature_records(feature_type, excluded)

        if len(records) >= settings.MIN_TRAINING_SAMPLES:
            df = pd.DataFrame(records)
            if "target" not in df.columns:
                raise ValueError("Feature records missing 'target' column")
        else:
            # Bootstrap with synthetic data — replaced by real data once it accumulates
            df = trainer.generate_synthetic_data()

        df_clean, quality = validate_dataset(df, model_name)
        if not quality.passed:
            raise ValueError(f"Data quality check failed: {quality.rejection_reasons}")

        result = trainer.train(df_clean)
        new_model_id = result.model_record.id

        val_result = validate_model(
            result.model_record,
            df_clean[trainer.feature_names].values,
            df_clean["target"].values,
            task_type=_task_type(model_name),
        )

        if val_result.passed:
            registry.promote_to_challenger(result.model_record.id)
            status = "challenger"
        else:
            status = "rejected"

        metrics = {
            "accuracy":  result.accuracy,
            "f1":        result.f1,
            "latency_ms": result.avg_latency_ms,
            "validation_passed": val_result.passed,
            "gates": [
                {"name": g.name, "passed": g.passed, "value": g.value}
                for g in val_result.gates
            ],
        }

    except Exception as exc:
        error   = str(exc)
        status  = "failed"
        metrics = {}

    registry.complete_training_run(run_id, new_model_id, metrics, error)

    return RetrainingOutcome(
        model_name=model_name,
        triggered=trigger.triggered,
        trigger_reason=trigger.reason,
        training_samples=len(df_clean) if (error is None and df_clean is not None) else 0,
        validation_passed=status == "challenger",
        new_model_version=registry.get_model_by_id(new_model_id).version if new_model_id else None,
        new_model_status=status,
        metrics=metrics,
        error=error,
        completed_at=datetime.utcnow().isoformat(),
    )


ALL_MODELS = [
    "productivity_score",
    "habit_completion",
    "burnout_detection",
    "recommendation_engine",
]


def run_all_retraining(force: bool = False) -> list[RetrainingOutcome]:
    return [run_retraining(name, force=force) for name in ALL_MODELS]
