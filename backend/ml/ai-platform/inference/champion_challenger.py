"""
Routes inference requests to the champion model and — when a challenger is
in shadow mode — silently runs the challenger in parallel to collect comparison data.

Users always receive champion predictions. Challenger predictions are logged
to the registry for later evaluation.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np
import joblib

from model_registry.registry import registry, ModelRecord
from config import settings


@dataclass
class InferenceResult:
    model_name: str
    champion_version: int
    prediction: float
    confidence: Optional[float]
    latency_ms: float
    shadow_active: bool


# ── In-process model cache ────────────────────────────────────────────────────
# Key: (artifact_path, mtime) — invalidates automatically when file changes.
# Avoids joblib.load() on every inference call (was ~500ms disk I/O per call).

_model_cache: dict[str, tuple[object, float]] = {}
_CACHE_TTL = 300.0  # seconds


def _load_model(record: ModelRecord) -> object:
    path = record.artifact_path
    now = time.monotonic()

    cached_model, cached_at = _model_cache.get(path, (None, 0.0))
    if cached_model is not None and (now - cached_at) < _CACHE_TTL:
        return cached_model

    # Check file mtime to detect in-place model updates
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        mtime = 0.0

    key = f"{path}:{mtime}"
    cached_model, cached_at = _model_cache.get(key, (None, 0.0))
    if cached_model is not None and (now - cached_at) < _CACHE_TTL:
        return cached_model

    model = joblib.load(path)
    _model_cache[key] = (model, now)
    # Evict stale entries for the same path
    stale = [k for k in _model_cache if k.startswith(path + ":") and k != key]
    for k in stale:
        del _model_cache[k]
    return model


def _predict_single(model: object, features: list[float]) -> tuple[float, float, float]:
    """Returns (prediction, confidence, latency_ms)."""
    X = np.array([features])
    t0 = time.perf_counter()
    pred = float(model.predict(X)[0])
    latency = (time.perf_counter() - t0) * 1000

    try:
        probas = model.predict_proba(X)[0]
        conf = float(np.max(probas))
    except AttributeError:
        conf = min(1.0, max(0.0, abs(pred) / 100.0))

    return pred, conf, latency


def infer(
    model_name: str,
    feature_names: list[str],
    feature_vector: dict[str, float],
    user_id: str,
) -> Optional[InferenceResult]:
    champion = registry.get_champion(model_name)
    if champion is None:
        return None

    champion_model = _load_model(champion)
    features = [feature_vector.get(f, 0.0) for f in feature_names]

    pred, conf, latency = _predict_single(champion_model, features)

    # Shadow mode: run challenger silently if one exists
    shadow_active = False
    challenger = registry.get_challenger(model_name)
    if challenger is not None:
        try:
            challenger_model = _load_model(challenger)
            ch_pred, _, ch_latency = _predict_single(challenger_model, features)

            registry.log_shadow_prediction(
                champion_model_id=champion.id,
                challenger_model_id=challenger.id,
                user_id=user_id,
                champion_prediction=pred,
                challenger_prediction=ch_pred,
                champion_latency_ms=latency,
                challenger_latency_ms=ch_latency,
            )
            shadow_active = True
            _maybe_promote_challenger(model_name, challenger)
        except Exception:
            pass

    return InferenceResult(
        model_name=model_name,
        champion_version=champion.version,
        prediction=round(pred, 4),
        confidence=round(conf, 4),
        latency_ms=round(latency, 2),
        shadow_active=shadow_active,
    )


def _maybe_promote_challenger(model_name: str, challenger: ModelRecord) -> None:
    """
    Auto-promotes the challenger to champion when it has accumulated enough shadow
    predictions AND outperforms the champion on the comparison metrics.
    """
    count = registry.get_shadow_count(challenger.id)
    if count < settings.MIN_SHADOW_PREDICTIONS:
        return

    champion = registry.get_champion(model_name)
    comparison = registry.get_shadow_comparison(challenger.id)

    if not comparison or champion is None:
        return

    challenger_is_faster = (
        comparison.get("challenger_avg_latency_ms", 9999)
        < comparison.get("champion_avg_latency_ms", 9999) * 0.95
    )
    challenger_is_better_acc = challenger.accuracy > champion.accuracy * 1.01
    high_agreement = comparison.get("prediction_correlation", 0) > 0.95

    if (challenger_is_better_acc or challenger_is_faster) and high_agreement:
        registry.promote_challenger_to_champion(model_name)
        # Evict cached models so next inference reloads the new champion
        _model_cache.clear()
