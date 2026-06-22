"""
Receives raw events from NestJS (via BullMQ worker or direct HTTP call)
and converts them into feature vectors stored in the feature store.

This is the entry point for all real user data flowing into the ML platform.
"""

from dataclasses import dataclass
from typing import Any
from feature_store.feature_builder import (
    build_productivity_features,
    build_habit_features,
    build_burnout_features,
    build_recommendation_features,
    persist_feature_vector,
)
from anti_poison.poison_detector import is_excluded


@dataclass
class IngestionResult:
    user_id: str
    model_type: str
    features_stored: bool
    skipped_reason: str


_BUILDERS = {
    "productivity":    build_productivity_features,
    "habits":          build_habit_features,
    "burnout":         build_burnout_features,
    "recommendations": build_recommendation_features,
}


def ingest_event(user_id: str, model_type: str, payload: dict[str, Any]) -> IngestionResult:
    if is_excluded(user_id):
        return IngestionResult(
            user_id=user_id,
            model_type=model_type,
            features_stored=False,
            skipped_reason="user_excluded_anti_poison",
        )

    builder = _BUILDERS.get(model_type)
    if builder is None:
        return IngestionResult(
            user_id=user_id,
            model_type=model_type,
            features_stored=False,
            skipped_reason=f"unknown_model_type:{model_type}",
        )

    features = builder(payload)
    persist_feature_vector(user_id, model_type, features)

    return IngestionResult(
        user_id=user_id,
        model_type=model_type,
        features_stored=True,
        skipped_reason="",
    )
