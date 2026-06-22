import numpy as np
import joblib
from dataclasses import dataclass
from typing import Optional
from model_registry.registry import registry


@dataclass
class ExplainabilityOutput:
    model_name: str
    prediction: float
    top_factors: list[str]
    feature_contributions: dict[str, float]
    confidence: float
    explanation_text: str


def _shap_values(model, X: np.ndarray) -> Optional[np.ndarray]:
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        vals = explainer.shap_values(X)
        if isinstance(vals, list):
            vals = vals[1] if len(vals) > 1 else vals[0]
        return np.array(vals)
    except Exception:
        return None


def _importance_fallback(model, n_features: int) -> np.ndarray:
    try:
        return model.feature_importances_[:n_features]
    except AttributeError:
        return np.zeros(n_features)


def explain_prediction(
    model_name: str,
    feature_vector: dict[str, float],
    feature_names: list[str],
    top_k: int = 5,
) -> Optional[ExplainabilityOutput]:
    record = registry.get_champion(model_name)
    if record is None:
        return None

    model = joblib.load(record.artifact_path)
    X     = np.array([[feature_vector.get(f, 0.0) for f in feature_names]])
    pred  = float(model.predict(X)[0])

    shap_vals = _shap_values(model, X)
    if shap_vals is not None:
        contributions = shap_vals[0] if shap_vals.ndim > 1 else shap_vals
    else:
        contributions = _importance_fallback(model, len(feature_names))

    feat_contrib = {
        name: round(float(v), 4)
        for name, v in zip(feature_names, contributions)
    }

    sorted_feats = sorted(feat_contrib.items(), key=lambda x: abs(x[1]), reverse=True)
    top_factors  = [name.replace("_", " ") for name, _ in sorted_feats[:top_k]]

    try:
        probas     = model.predict_proba(X)[0]
        confidence = float(np.max(probas))
    except AttributeError:
        confidence = min(1.0, max(0.0, abs(pred) / 100.0))

    explanation = _build_text(top_factors, feat_contrib)

    return ExplainabilityOutput(
        model_name=model_name,
        prediction=round(pred, 4),
        top_factors=top_factors,
        feature_contributions=feat_contrib,
        confidence=round(confidence, 4),
        explanation_text=explanation,
    )


def _build_text(top_factors: list[str], contrib: dict[str, float]) -> str:
    positive = [f for f in top_factors if contrib.get(f.replace(" ", "_"), 0) > 0]
    negative = [f for f in top_factors if contrib.get(f.replace(" ", "_"), 0) < 0]
    parts: list[str] = []
    if positive:
        parts.append(f"Key drivers: {', '.join(positive[:3])}.")
    if negative:
        parts.append(f"Limiting factors: {', '.join(negative[:2])}.")
    return " ".join(parts) or "Prediction derived from current behavioral patterns."
