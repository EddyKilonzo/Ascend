"""
Shadow mode statistics and manual evaluation tools.

Provides the management API with summary statistics about how the challenger
model compares to the current champion across all accumulated shadow predictions.
"""

from dataclasses import dataclass
from typing import Optional
from model_registry.registry import registry


@dataclass
class ShadowModeReport:
    model_name: str
    champion_version: int
    challenger_version: int
    n_predictions: int
    champion_avg_latency_ms: float
    challenger_avg_latency_ms: float
    prediction_mae: float
    prediction_correlation: float
    challenger_is_faster: bool
    challenger_agreement: float
    min_predictions_needed: int
    ready_for_evaluation: bool


def get_shadow_report(model_name: str, min_predictions: int = 1000) -> Optional[ShadowModeReport]:
    champion   = registry.get_champion(model_name)
    challenger = registry.get_challenger(model_name)

    if champion is None or challenger is None:
        return None

    comparison = registry.get_shadow_comparison(challenger.id)
    count      = registry.get_shadow_count(challenger.id)

    if not comparison:
        return ShadowModeReport(
            model_name=model_name,
            champion_version=champion.version,
            challenger_version=challenger.version,
            n_predictions=0,
            champion_avg_latency_ms=0.0,
            challenger_avg_latency_ms=0.0,
            prediction_mae=0.0,
            prediction_correlation=0.0,
            challenger_is_faster=False,
            challenger_agreement=0.0,
            min_predictions_needed=min_predictions,
            ready_for_evaluation=False,
        )

    ch_lat    = comparison.get("challenger_avg_latency_ms", 0.0)
    champ_lat = comparison.get("champion_avg_latency_ms", 0.0)
    corr      = comparison.get("prediction_correlation", 0.0)

    return ShadowModeReport(
        model_name=model_name,
        champion_version=champion.version,
        challenger_version=challenger.version,
        n_predictions=count,
        champion_avg_latency_ms=champ_lat,
        challenger_avg_latency_ms=ch_lat,
        prediction_mae=comparison.get("prediction_mae", 0.0),
        prediction_correlation=corr,
        challenger_is_faster=ch_lat < champ_lat,
        challenger_agreement=round(corr, 4),
        min_predictions_needed=min_predictions,
        ready_for_evaluation=count >= min_predictions,
    )
