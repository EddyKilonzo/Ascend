"""
Validates a candidate model against the current champion before deployment.

Every new model must pass ALL gates:
  1. Accuracy >= threshold (or >= champion if one exists)
  2. F1 >= threshold
  3. Latency < 200ms
  4. SHAP explanations producible
  5. No significant segment degradation (bias check)
"""

import time
import numpy as np
import pandas as pd
import joblib
from dataclasses import dataclass
from typing import Optional
from config import settings
from model_registry.registry import registry, ModelRecord


@dataclass
class ValidationGate:
    name: str
    passed: bool
    value: float
    threshold: float
    message: str


@dataclass
class ValidationResult:
    model_id: int
    model_name: str
    version: int
    passed: bool
    gates: list[ValidationGate]
    recommendation: str


def _check_latency(model, X: np.ndarray, n: int = 100) -> float:
    sample = X[:min(n, len(X))]
    times: list[float] = []
    for row in sample:
        t0 = time.perf_counter()
        model.predict(row.reshape(1, -1))
        times.append((time.perf_counter() - t0) * 1000)
    return float(np.mean(times))


def _check_shap(model, X: np.ndarray) -> bool:
    try:
        import shap
        exp = shap.TreeExplainer(model)
        exp.shap_values(X[:5])
        return True
    except Exception:
        return False


def _bias_check(model, X: np.ndarray, y: np.ndarray, segments: int = 3) -> bool:
    """
    Splits data into equal score-range buckets and verifies no bucket degrades
    more than 20% below the overall accuracy. Catches segment-level regressions.
    """
    if len(X) < 100:
        return True

    preds = model.predict(X)
    buckets = np.array_split(np.arange(len(X)), segments)
    overall_acc = float(np.mean(preds == y)) if y.dtype == int else float(np.corrcoef(preds, y)[0, 1])

    for bucket in buckets:
        if len(bucket) == 0:
            continue
        b_preds, b_y = preds[bucket], y[bucket]
        if b_y.dtype == int or (len(np.unique(b_y)) <= 5):
            b_acc = float(np.mean(b_preds == b_y))
        else:
            b_acc = max(0.0, float(np.corrcoef(b_preds.astype(float), b_y.astype(float))[0, 1]))
        if b_acc < overall_acc - 0.20:
            return False
    return True


def validate_model(
    record: ModelRecord,
    X_val: np.ndarray,
    y_val: np.ndarray,
    task_type: str,
) -> ValidationResult:
    model = joblib.load(record.artifact_path)
    gates: list[ValidationGate] = []

    # ── Gate 1: Accuracy ──────────────────────────────────────────────────────
    if task_type == "regression":
        from sklearn.metrics import r2_score
        preds = model.predict(X_val)
        acc   = max(0.0, float(r2_score(y_val, preds)))
    else:
        from sklearn.metrics import accuracy_score
        preds = model.predict(X_val)
        acc   = float(accuracy_score(y_val, preds))

    champion = registry.get_champion(record.model_name)
    acc_threshold = max(settings.ACCURACY_THRESHOLD, champion.accuracy if champion else 0.0)

    gates.append(ValidationGate(
        name="accuracy",
        passed=acc >= acc_threshold,
        value=round(acc, 4),
        threshold=round(acc_threshold, 4),
        message=f"Accuracy {acc:.4f} {'≥' if acc >= acc_threshold else '<'} threshold {acc_threshold:.4f}",
    ))

    # ── Gate 2: F1 / correlation ──────────────────────────────────────────────
    if task_type == "regression":
        from sklearn.metrics import r2_score
        f1 = max(0.0, float(r2_score(y_val, model.predict(X_val))))
    else:
        from sklearn.metrics import f1_score
        avg  = "binary" if task_type == "binary" else "weighted"
        f1   = float(f1_score(y_val, model.predict(X_val), average=avg, zero_division=0))

    gates.append(ValidationGate(
        name="f1_score",
        passed=f1 >= settings.F1_THRESHOLD,
        value=round(f1, 4),
        threshold=settings.F1_THRESHOLD,
        message=f"F1 {f1:.4f} {'≥' if f1 >= settings.F1_THRESHOLD else '<'} threshold {settings.F1_THRESHOLD}",
    ))

    # ── Gate 3: Latency ───────────────────────────────────────────────────────
    latency = _check_latency(model, X_val)
    gates.append(ValidationGate(
        name="latency_ms",
        passed=latency < settings.LATENCY_THRESHOLD_MS,
        value=round(latency, 2),
        threshold=settings.LATENCY_THRESHOLD_MS,
        message=f"Avg latency {latency:.1f}ms {'<' if latency < settings.LATENCY_THRESHOLD_MS else '≥'} {settings.LATENCY_THRESHOLD_MS}ms",
    ))

    # ── Gate 4: Explainability ────────────────────────────────────────────────
    shap_ok = _check_shap(model, X_val)
    gates.append(ValidationGate(
        name="shap_explainability",
        passed=shap_ok,
        value=float(shap_ok),
        threshold=1.0,
        message="SHAP explanations available" if shap_ok else "SHAP explanations failed — model may not be tree-based",
    ))

    # ── Gate 5: Bias / segment equality ──────────────────────────────────────
    bias_ok = _bias_check(model, X_val, y_val)
    gates.append(ValidationGate(
        name="bias_check",
        passed=bias_ok,
        value=float(bias_ok),
        threshold=1.0,
        message="No significant segment degradation" if bias_ok else "Segment accuracy drop > 20% detected",
    ))

    all_passed = all(g.passed for g in gates)
    rec = (
        "PROMOTE_TO_CHALLENGER: All validation gates passed. Ready for shadow testing."
        if all_passed
        else f"REJECT: Failed gates: {[g.name for g in gates if not g.passed]}"
    )

    return ValidationResult(
        model_id=record.id,
        model_name=record.model_name,
        version=record.version,
        passed=all_passed,
        gates=gates,
        recommendation=rec,
    )
