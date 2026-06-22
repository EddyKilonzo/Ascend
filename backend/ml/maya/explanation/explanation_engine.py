from __future__ import annotations

import uuid
from typing import Optional

from schemas.requests import ExplainPredictionRequest
from schemas.responses import ExplanationFactor, ExplanationResponse
from llm.claude_client import claude
from llm.prompt_builder import EXPLANATION_SYSTEM_PROMPT, build_explanation_message
from llm.response_parser import parse_explanation_response

_FEATURE_LABELS: dict[str, str] = {
    # Productivity model
    "avg_focus_minutes_7d": "average daily focus minutes (7d)",
    "avg_focus_minutes_30d": "average daily focus minutes (30d)",
    "focus_session_count_7d": "focus sessions this week",
    "habit_completion_rate_7d": "habit completion rate (7d)",
    "habit_completion_rate_30d": "habit completion rate (30d)",
    "task_completion_rate_7d": "task completion rate (7d)",
    "avg_social_minutes_7d": "average daily social media (7d)",
    "streak_length": "current habit streak length",
    "active_habits_count": "active habits count",
    "xp_earned_7d": "XP earned this week",
    "goal_count": "active goals",
    "productivity_trend_7d": "productivity trend (7d)",
    "overdue_task_rate": "overdue task rate",
    # Habit model
    "habit_difficulty": "habit difficulty level",
    "habit_age_days": "habit age in days",
    "current_streak": "current habit streak",
    "completion_rate_7d": "completion rate (7d)",
    "completion_rate_30d": "completion rate (30d)",
    "hour_of_target": "target hour of day",
    "day_of_week": "day of week",
    "productivity_score_yesterday": "productivity score yesterday",
    "missed_yesterday": "missed yesterday",
    # Burnout model
    "productivity_trend_14d": "productivity trend (14d)",
    "focus_trend_14d": "focus trend (14d)",
    "habit_decline_rate_14d": "habit decline rate (14d)",
    "social_increase_rate_14d": "social media increase rate (14d)",
    "avg_productivity_score_7d": "average productivity score (7d)",
    "avg_productivity_score_14d": "average productivity score (14d)",
    "activity_variance_7d": "activity variance (7d)",
    "days_with_zero_focus_7d": "days with no focus sessions (7d)",
    "consecutive_decline_days": "consecutive days of decline",
}


def _label(feature: str) -> str:
    return _FEATURE_LABELS.get(feature, feature.replace("_", " "))


def _impact_direction(shap_val: float) -> str:
    if shap_val > 0.02:
        return "positive"
    if shap_val < -0.02:
        return "negative"
    return "neutral"


def _top_shap_factors(
    shap_values: dict[str, float],
    feature_values: dict[str, float],
    top_k: int,
) -> list[ExplanationFactor]:
    sorted_features = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:top_k]
    factors = []
    for feat, shap_val in sorted_features:
        feat_val = feature_values.get(feat)
        val_str = f"{feat_val:.2f}" if isinstance(feat_val, float) else str(feat_val)
        factors.append(
            ExplanationFactor(
                name=_label(feat),
                impact=f"{shap_val:+.3f}",
                direction=_impact_direction(shap_val),
                description=f"Value: {val_str} — SHAP impact: {shap_val:+.3f}",
            )
        )
    return factors


def _top_importance_factors(
    feature_values: dict[str, float],
    top_k: int,
) -> list[ExplanationFactor]:
    sorted_feats = sorted(feature_values.items(), key=lambda x: abs(x[1]), reverse=True)[:top_k]
    return [
        ExplanationFactor(
            name=_label(feat),
            impact=f"{val:+.3f}",
            direction=_impact_direction(val),
            description=f"Feature value: {val:.3f}",
        )
        for feat, val in sorted_feats
    ]


class ExplanationEngine:
    async def explain(self, request: ExplainPredictionRequest) -> ExplanationResponse:
        request_id = str(uuid.uuid4())

        if request.shap_values:
            factors = _top_shap_factors(
                request.shap_values,
                request.feature_values,
                request.top_k_factors,
            )
        else:
            factors = _top_importance_factors(request.feature_values, request.top_k_factors)

        user_msg = build_explanation_message(
            model_name=request.model_name,
            prediction=request.prediction_value,
            confidence=request.confidence,
            feature_values=request.feature_values,
            shap_values=request.shap_values,
        )
        raw = await claude.generate(EXPLANATION_SYSTEM_PROMPT, user_msg)
        parsed = parse_explanation_response(raw)

        explanation = parsed["explanation"]
        if parsed["action_summary"]:
            recommendations = [parsed["action_summary"]]
        else:
            recommendations = []

        return ExplanationResponse(
            request_id=request_id,
            model_name=request.model_name,
            prediction=request.prediction_value,
            confidence=request.confidence,
            factors=factors,
            explanation=explanation,
            recommendations=recommendations,
        )


explanation_engine = ExplanationEngine()
