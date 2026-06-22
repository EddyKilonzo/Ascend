from __future__ import annotations

"""Routes classified intents to the appropriate backend skill."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from pipeline.intent import Intent, IntentResult, INTENT_TO_COACHING_MODULE


class SkillType(str, Enum):
    COACHING = "coaching"      # → ml/maya/ POST /coach
    CALENDAR_VIEW = "calendar_view"
    CALENDAR_MUTATE = "calendar_mutate"
    OCR = "ocr"                # → ml/vision/
    LEADERBOARD = "leaderboard"
    FALLBACK = "fallback"      # Unknown — return canned response


@dataclass
class RoutingDecision:
    skill: SkillType
    coaching_module: Optional[str]   # only for COACHING
    intent: Intent
    confidence: float
    needs_user_context: bool


def route(intent_result: IntentResult) -> RoutingDecision:
    intent = intent_result.intent
    confidence = intent_result.confidence

    if intent in INTENT_TO_COACHING_MODULE:
        return RoutingDecision(
            skill=SkillType.COACHING,
            coaching_module=INTENT_TO_COACHING_MODULE[intent],
            intent=intent,
            confidence=confidence,
            needs_user_context=True,
        )

    if intent == Intent.CALENDAR_VIEW:
        return RoutingDecision(
            skill=SkillType.CALENDAR_VIEW,
            coaching_module=None,
            intent=intent,
            confidence=confidence,
            needs_user_context=False,
        )

    if intent in (Intent.CALENDAR_ADD, Intent.CALENDAR_MOVE):
        return RoutingDecision(
            skill=SkillType.CALENDAR_MUTATE,
            coaching_module=None,
            intent=intent,
            confidence=confidence,
            needs_user_context=False,
        )

    if intent == Intent.OCR:
        return RoutingDecision(
            skill=SkillType.OCR,
            coaching_module=None,
            intent=intent,
            confidence=confidence,
            needs_user_context=False,
        )

    # LEADERBOARD, ACHIEVEMENT handled as coaching
    if intent == Intent.LEADERBOARD:
        return RoutingDecision(
            skill=SkillType.COACHING,
            coaching_module="achievement",
            intent=intent,
            confidence=confidence,
            needs_user_context=True,
        )

    return RoutingDecision(
        skill=SkillType.FALLBACK,
        coaching_module=None,
        intent=intent,
        confidence=0.0,
        needs_user_context=False,
    )
