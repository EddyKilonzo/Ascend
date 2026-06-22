from __future__ import annotations

from typing import Any

from schemas.requests import UserContext
from coaching.base_coach import BaseCoach

_RISK_LABELS = {"low": 0, "moderate": 1, "high": 2, "critical": 3}
_RISK_THRESHOLDS = {0.0: "low", 0.3: "moderate", 0.6: "high", 0.85: "critical"}


def _risk_label(score: float) -> str:
    label = "low"
    for threshold, name in sorted(_RISK_THRESHOLDS.items()):
        if score >= threshold:
            label = name
    return label


class BurnoutCoach(BaseCoach):
    module_name = "burnout"

    def analyze(self, context: UserContext) -> dict[str, Any]:
        b = context.burnout
        p = context.productivity
        f = context.focus

        risk_score = b.risk_score
        risk_label = b.risk_level
        primary_signal = b.primary_signal or self._derive_signal(b, p, f)

        recovery_days = max(0, int(risk_score * 14))

        urgency = (
            "critical" if risk_label == "critical"
            else "high" if risk_label == "high"
            else "moderate" if risk_label == "moderate"
            else "low"
        )

        factors = [
            {
                "name": "burnout risk level",
                "impact": risk_label,
                "direction": "negative" if _RISK_LABELS.get(risk_label, 0) >= 2 else "neutral",
                "description": f"Risk assessed at {risk_label} ({risk_score:.0%} confidence)",
            },
            {
                "name": "consecutive decline days",
                "impact": str(b.consecutive_decline_days),
                "direction": "negative" if b.consecutive_decline_days >= 3 else "neutral",
                "description": f"Productivity declining for {b.consecutive_decline_days} consecutive days",
            },
            {
                "name": "zero-focus days (7d)",
                "impact": str(b.days_with_zero_focus_7d),
                "direction": "negative" if b.days_with_zero_focus_7d >= 2 else "neutral",
                "description": f"{b.days_with_zero_focus_7d} day(s) this week with zero focus sessions",
            },
        ]

        interventions = self._get_interventions(risk_label)

        return {
            "prediction": risk_score,
            "confidence": 0.84,
            "urgency": urgency,
            "risk_level": risk_label,
            "risk_score": risk_score,
            "primary_signal": primary_signal,
            "consecutive_decline_days": b.consecutive_decline_days,
            "zero_focus_days": b.days_with_zero_focus_7d,
            "estimated_recovery_days": recovery_days,
            "interventions": interventions,
            "factors": factors,
        }

    @staticmethod
    def _derive_signal(b: Any, p: Any, f: Any) -> str:
        if b.consecutive_decline_days >= 5:
            return "prolonged productivity decline"
        if b.days_with_zero_focus_7d >= 3:
            return "loss of focus engagement"
        if p.trend_7d < -15:
            return "sharp productivity drop"
        return "early fatigue indicators"

    @staticmethod
    def _get_interventions(risk_level: str) -> list[str]:
        base = [
            "Schedule a 20-minute recovery break between focus sessions",
            "Aim for 7-8 hours of sleep tonight",
        ]
        if risk_level in ("high", "critical"):
            base.extend([
                "Consider reducing daily task targets by 30% for the next 3 days",
                "Activate 'recovery mode': one deep work session maximum per day",
            ])
        if risk_level == "critical":
            base.append("Take at least one full rest day this week with no productivity tracking")
        return base
