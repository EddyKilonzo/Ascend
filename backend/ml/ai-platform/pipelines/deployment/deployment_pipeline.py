"""
Handles model promotion decisions after shadow testing is complete.

Called either manually (via API) or automatically by the champion/challenger
module after MIN_SHADOW_PREDICTIONS accumulate.
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from model_registry.registry import registry
from inference.shadow_mode import get_shadow_report
from config import settings


@dataclass
class DeploymentDecision:
    model_name: str
    action: str          # 'promoted' | 'kept_champion' | 'no_challenger' | 'insufficient_data'
    previous_champion_version: Optional[int]
    new_champion_version: Optional[int]
    reason: str
    decided_at: str


def evaluate_and_deploy(model_name: str) -> DeploymentDecision:
    now = datetime.utcnow().isoformat()

    champion   = registry.get_champion(model_name)
    challenger = registry.get_challenger(model_name)

    if challenger is None:
        return DeploymentDecision(
            model_name=model_name,
            action="no_challenger",
            previous_champion_version=champion.version if champion else None,
            new_champion_version=None,
            reason="No challenger model in registry.",
            decided_at=now,
        )

    report = get_shadow_report(model_name, settings.MIN_SHADOW_PREDICTIONS)
    if report is None or not report.ready_for_evaluation:
        needed = settings.MIN_SHADOW_PREDICTIONS - (report.n_predictions if report else 0)
        return DeploymentDecision(
            model_name=model_name,
            action="insufficient_data",
            previous_champion_version=champion.version if champion else None,
            new_champion_version=None,
            reason=f"Need {needed} more shadow predictions before deployment decision.",
            decided_at=now,
        )

    challenger_wins = (
        challenger.accuracy > (champion.accuracy if champion else 0.0) * 1.01
        and challenger.avg_latency_ms < settings.LATENCY_THRESHOLD_MS
        and report.prediction_correlation > 0.90
    )

    if champion is None or challenger_wins:
        promoted = registry.promote_challenger_to_champion(model_name)
        return DeploymentDecision(
            model_name=model_name,
            action="promoted",
            previous_champion_version=champion.version if champion else None,
            new_champion_version=promoted.version if promoted else None,
            reason=(
                f"Challenger v{challenger.version} promoted: "
                f"accuracy {challenger.accuracy:.4f} vs champion {champion.accuracy if champion else 0.0:.4f}, "
                f"latency {challenger.avg_latency_ms:.1f}ms"
            ),
            decided_at=now,
        )
    else:
        return DeploymentDecision(
            model_name=model_name,
            action="kept_champion",
            previous_champion_version=champion.version if champion else None,
            new_champion_version=champion.version if champion else None,
            reason=(
                f"Champion v{champion.version} retained: challenger did not exceed accuracy threshold "
                f"({challenger.accuracy:.4f} vs {champion.accuracy:.4f} required)"
            ),
            decided_at=now,
        )
