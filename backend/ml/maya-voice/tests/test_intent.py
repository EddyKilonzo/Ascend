import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.intent import classify, Intent


@pytest.mark.parametrize("text,expected_intent", [
    ("Why did my productivity score drop?", Intent.PRODUCTIVITY),
    ("How am I doing today?", Intent.PRODUCTIVITY),
    ("Which habit am I most likely to miss?", Intent.HABIT),
    ("What habits are hurting my consistency?", Intent.HABIT),
    ("Am I on track to complete my goals?", Intent.GOAL),
    ("What goal should I prioritize today?", Intent.GOAL),
    ("How much did I focus today?", Intent.FOCUS),
    ("Schedule a deep work session for me", Intent.SCHEDULE),
    ("I feel exhausted and overwhelmed", Intent.BURNOUT),
    ("I need a break", Intent.BURNOUT),
    ("Show my weekly review", Intent.WEEKLY_REVIEW),
    ("Weekly recap please", Intent.WEEKLY_REVIEW),
    ("Monthly summary", Intent.MONTHLY_REVIEW),
    ("How much XP did I earn this week?", Intent.ACHIEVEMENT),
    ("What level am I?", Intent.ACHIEVEMENT),
    ("You said I'd have 4 focus sessions but I only did 2", Intent.ACCOUNTABILITY),
    ("How much time did I spend on social media today?", Intent.ACCOUNTABILITY),
    ("What's on my calendar today?", Intent.CALENDAR_VIEW),
    ("When am I free?", Intent.CALENDAR_VIEW),
    ("Schedule a meeting tomorrow at 9am", Intent.CALENDAR_ADD),
    ("Move my workout to Thursday", Intent.CALENDAR_MOVE),
    ("I uploaded a screenshot, turn it into tasks", Intent.OCR),
    ("Scan this document for goals", Intent.OCR),
])
def test_intent_classification(text: str, expected_intent: Intent) -> None:
    result = classify(text)
    assert result.intent == expected_intent, (
        f"Expected {expected_intent} for '{text}', got {result.intent}"
    )


def test_unknown_intent_returns_low_confidence():
    result = classify("What's the weather like?")
    assert result.intent == Intent.UNKNOWN
    assert result.confidence == 0.0


def test_entity_extraction_time_ref():
    result = classify("Show me my focus sessions today")
    assert result.entities.get("time_ref") == "today"


def test_entity_extraction_duration():
    result = classify("Block off 45 minutes for deep work")
    assert result.entities.get("duration_minutes") == 45


def test_result_has_method_field():
    result = classify("How are my habits?")
    assert result.method == "rules"
