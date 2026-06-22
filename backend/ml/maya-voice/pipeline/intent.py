from __future__ import annotations

"""
Hybrid intent classifier: fast rule-based matching first, ML fallback second.
No external model needed at boot — ML model trains from labeled examples.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Intent(str, Enum):
    PRODUCTIVITY = "productivity"
    HABIT = "habit"
    GOAL = "goal"
    FOCUS = "focus"
    BURNOUT = "burnout"
    SCHEDULE = "schedule"
    WEEKLY_REVIEW = "weekly_review"
    MONTHLY_REVIEW = "monthly_review"
    ACHIEVEMENT = "achievement"
    ACCOUNTABILITY = "accountability"
    CALENDAR_VIEW = "calendar_view"
    CALENDAR_ADD = "calendar_add"
    CALENDAR_MOVE = "calendar_move"
    OCR = "ocr"
    LEADERBOARD = "leaderboard"
    UNKNOWN = "unknown"


@dataclass
class IntentResult:
    intent: Intent
    confidence: float
    entities: dict
    method: str  # "rules" | "ml"


# ── Rule patterns ────────────────────────────────────────────────────────────

_RULES: list[tuple[Intent, list[re.Pattern]]] = [
    (Intent.PRODUCTIVITY, [
        re.compile(r"productivity (score|drop|trend|today)", re.I),
        re.compile(r"(why|what) (did|happened to) my (score|productivity)", re.I),
        re.compile(r"how am i doing (today|this week)?", re.I),
    ]),
    (Intent.HABIT, [
        re.compile(r"(habit|streak)(s)?", re.I),
        re.compile(r"which habit", re.I),
        re.compile(r"habit (completion|consistency|miss)", re.I),
    ]),
    (Intent.GOAL, [
        re.compile(r"(goal|objective|target)(s)?", re.I),
        re.compile(r"on track", re.I),
        re.compile(r"what goal should i", re.I),
    ]),
    (Intent.FOCUS, [
        re.compile(r"focus (session|time|trend|minutes|today)", re.I),
        re.compile(r"deep work", re.I),
        re.compile(r"how (much|many) (did i|have i) focus", re.I),
    ]),
    (Intent.BURNOUT, [
        re.compile(r"burn.?out", re.I),
        re.compile(r"(tired|exhausted|overwhelmed)", re.I),
        re.compile(r"need (a break|rest|recovery)", re.I),
    ]),
    (Intent.SCHEDULE, [
        re.compile(r"(schedule|plan|organize) my (day|week|time)", re.I),
        re.compile(r"when should i", re.I),
        re.compile(r"best time (to|for)", re.I),
    ]),
    (Intent.WEEKLY_REVIEW, [
        re.compile(r"(this week|weekly) (review|summary|recap|how did)", re.I),
        re.compile(r"week in review", re.I),
    ]),
    (Intent.MONTHLY_REVIEW, [
        re.compile(r"(this month|monthly) (review|summary|recap)", re.I),
        re.compile(r"month in review", re.I),
    ]),
    (Intent.ACHIEVEMENT, [
        re.compile(r"(achievement|badge|xp|level|rank|leaderboard)", re.I),
        re.compile(r"how much xp", re.I),
        re.compile(r"what level am i", re.I),
    ]),
    (Intent.ACCOUNTABILITY, [
        re.compile(r"(overdue|behind|missed|didn.t complete)", re.I),
        re.compile(r"hold me accountable", re.I),
        re.compile(r"social media (usage|time|today|this week)", re.I),
    ]),
    (Intent.CALENDAR_VIEW, [
        re.compile(r"(what.s|what is|show) (on |my )?(calendar|schedule|agenda)", re.I),
        re.compile(r"when am i free", re.I),
        re.compile(r"do i have (any|a) (meeting|event|appointment)", re.I),
    ]),
    (Intent.CALENDAR_ADD, [
        re.compile(r"(add|create|schedule|set up) (a |an )?(meeting|event|appointment|session)", re.I),
        re.compile(r"remind me (to|about)", re.I),
        re.compile(r"block (off |out )?(time|an hour|30 min)", re.I),
    ]),
    (Intent.CALENDAR_MOVE, [
        re.compile(r"(move|reschedule|change) (my |the )?(.+ )?(to|for)", re.I),
        re.compile(r"(postpone|delay|push back)", re.I),
    ]),
    (Intent.OCR, [
        re.compile(r"(scan|read|extract|process) (this |the )?(image|photo|screenshot|document|note)", re.I),
        re.compile(r"(turn|convert) (this|it) into tasks", re.I),
        re.compile(r"i (uploaded|sent|shared) (an? )?(image|photo|screenshot)", re.I),
    ]),
]


def classify(text: str) -> IntentResult:
    """Classify user intent. Pure rule-based — fast, no model loading required."""
    text_stripped = text.strip()

    for intent, patterns in _RULES:
        for pattern in patterns:
            if pattern.search(text_stripped):
                entities = _extract_entities(text_stripped)
                return IntentResult(
                    intent=intent,
                    confidence=0.90,
                    entities=entities,
                    method="rules",
                )

    return IntentResult(
        intent=Intent.UNKNOWN,
        confidence=0.0,
        entities={},
        method="rules",
    )


def _extract_entities(text: str) -> dict:
    entities: dict = {}

    # Time references
    if re.search(r"\btoday\b", text, re.I):
        entities["time_ref"] = "today"
    elif re.search(r"\bthis week\b", text, re.I):
        entities["time_ref"] = "this_week"
    elif re.search(r"\bthis month\b", text, re.I):
        entities["time_ref"] = "this_month"
    elif re.search(r"\byesterday\b", text, re.I):
        entities["time_ref"] = "yesterday"

    # Duration mentions (e.g. "30 minutes", "1 hour")
    duration_match = re.search(r"(\d+)\s*(minutes?|hours?|mins?|hrs?)", text, re.I)
    if duration_match:
        val = int(duration_match.group(1))
        unit = duration_match.group(2).lower()
        if "hour" in unit or "hr" in unit:
            val *= 60
        entities["duration_minutes"] = val

    # Habit name extraction (quoted text)
    quoted = re.findall(r'"([^"]+)"', text)
    if quoted:
        entities["named_items"] = quoted

    return entities


# Map intent → coaching module name (matches ml/maya CoachingModule enum)
INTENT_TO_COACHING_MODULE: dict[Intent, str] = {
    Intent.PRODUCTIVITY: "productivity",
    Intent.HABIT: "habit",
    Intent.GOAL: "goal",
    Intent.FOCUS: "focus",
    Intent.BURNOUT: "burnout",
    Intent.SCHEDULE: "schedule",
    Intent.WEEKLY_REVIEW: "weekly_review",
    Intent.MONTHLY_REVIEW: "monthly_review",
    Intent.ACHIEVEMENT: "achievement",
    Intent.ACCOUNTABILITY: "accountability",
}
