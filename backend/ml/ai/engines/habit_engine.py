from datetime import datetime
from pathlib import Path
import os
import numpy as np
from schemas.requests import HabitPredictionRequest, HabitHistoryEntry
from schemas.responses import HabitPredictionResponse

try:
    import joblib
    _JOBLIB_AVAILABLE = True
except ImportError:
    _JOBLIB_AVAILABLE = False

_MODEL_PATH = Path(os.getenv("MODELS_DIR", "models/trained")) / "habit_predictor.pkl"
_model = None

# Feature ordering must exactly match HABIT_FEATURE_NAMES in
# ml/ai-platform/feature_store/feature_definitions.py
_FEATURE_NAMES = [
    "habit_difficulty",
    "habit_age_days",
    "current_streak",
    "completion_rate_7d",
    "completion_rate_30d",
    "hour_of_target",
    "day_of_week",
    "avg_focus_minutes_7d",
    "productivity_score_yesterday",
    "missed_yesterday",
]


def _load_model():
    global _model
    if _JOBLIB_AVAILABLE and _MODEL_PATH.exists():
        try:
            _model = joblib.load(_MODEL_PATH)
        except Exception:
            _model = None


def _extract_features(req: HabitPredictionRequest) -> dict:
    """
    Build a feature vector aligned with HABIT_FEATURE_NAMES.
    Any change here must be mirrored in feature_builder.build_habit_features()
    and feature_definitions.HABIT_FEATURES.
    """
    history = req.history
    last_7 = history[-7:] if len(history) >= 7 else history
    last_30 = history[-30:] if len(history) >= 30 else history

    rate_7d = sum(1 for h in last_7 if h.completed) / max(len(last_7), 1)
    rate_30d = sum(1 for h in last_30 if h.completed) / max(len(last_30), 1)
    missed_yesterday = int(not history[-1].completed) if history else 0

    hour = 9
    if req.target_time:
        try:
            hour = int(req.target_time.split(":")[0])
        except (ValueError, IndexError):
            hour = 9

    now = datetime.utcnow()

    return {
        "habit_difficulty":             float(req.difficulty),
        "habit_age_days":               float(req.habit_age_days),
        "current_streak":               float(req.current_streak),
        "completion_rate_7d":           rate_7d,
        "completion_rate_30d":          rate_30d,
        "hour_of_target":               float(hour),
        "day_of_week":                  float(now.weekday()),
        "avg_focus_minutes_7d":         float(req.avg_focus_minutes_7d),
        "productivity_score_yesterday": float(req.productivity_score_yesterday),
        "missed_yesterday":             float(missed_yesterday),
    }


def _heuristic_predict(features: dict) -> tuple[float, float, str]:
    rate_7d = features["completion_rate_7d"]
    rate_30d = features["completion_rate_30d"]
    streak = features["current_streak"]
    missed = features["missed_yesterday"]
    difficulty = features["habit_difficulty"]
    age = features["habit_age_days"]
    productivity_yesterday = features["productivity_score_yesterday"]

    streak_bonus = min(0.15, streak * 0.02)
    recency_penalty = 0.10 if missed else 0.0
    difficulty_penalty = (difficulty - 1) * 0.03
    maturity_bonus = min(0.10, age / 100.0)
    context_bonus = min(0.05, (productivity_yesterday - 50) / 1000.0)

    score = (
        rate_7d * 0.45
        + rate_30d * 0.25
        + streak_bonus
        - recency_penalty
        - difficulty_penalty
        + maturity_bonus
        + context_bonus
    )
    probability = max(0.05, min(0.95, score))

    n_history = int(age)
    if n_history < 7:
        confidence = 0.50
    elif n_history < 30:
        confidence = 0.65
    else:
        confidence = 0.82

    return round(probability, 3), round(confidence, 3), "heuristic"


def _ml_predict(features: dict) -> tuple[float, float, str]:
    if _model is None:
        return _heuristic_predict(features)

    try:
        feature_vector = np.array([[features[name] for name in _FEATURE_NAMES]])
        prob = float(_model.predict_proba(feature_vector)[0][1])
        return round(prob, 3), 0.88, "xgboost"
    except Exception:
        return _heuristic_predict(features)


def _suggest_best_time(req: HabitPredictionRequest) -> str | None:
    if req.target_time:
        return req.target_time

    completion_hours: list[int] = []
    for entry in req.history:
        if entry.completed and entry.completion_time:
            try:
                hour = datetime.fromisoformat(entry.completion_time).hour
                completion_hours.append(hour)
            except Exception:
                pass

    if not completion_hours:
        return None

    avg_hour = int(sum(completion_hours) / len(completion_hours))
    return f"{avg_hour:02d}:00"


def _identify_risk_factors(features: dict, probability: float) -> list[str]:
    risks: list[str] = []

    if features["missed_yesterday"]:
        risks.append("Missed yesterday — re-engagement today is critical to maintain streak.")
    if features["completion_rate_7d"] < 0.3:
        risks.append("7-day completion rate below 30% — habit at risk of abandonment.")
    if features["habit_difficulty"] >= 4:
        risks.append("High difficulty habit — consider breaking into smaller steps.")
    if features["current_streak"] == 0:
        risks.append("No active streak — starting fresh with a lower-effort version can rebuild momentum.")

    return risks


_load_model()


def predict_habit_completion(req: HabitPredictionRequest) -> HabitPredictionResponse:
    features = _extract_features(req)
    probability, confidence, model_used = _ml_predict(features)
    best_time = _suggest_best_time(req)
    risks = _identify_risk_factors(features, probability)

    return HabitPredictionResponse(
        user_id=req.user_id,
        habit_id=req.habit_id,
        completion_probability=probability,
        confidence=confidence,
        best_time_window=best_time,
        risk_factors=risks,
        model_used=model_used,
    )
