import re
from typing import Optional


_HABIT_KEYWORDS = [
    "every day", "daily", "each morning", "each evening", "every night",
    "wake up", "workout", "exercise", "meditate", "meditation", "journal",
    "read", "study", "practice", "run", "gym", "sleep", "drink water",
    "no phone", "no social media", "gratitude", "review",
]

_TASK_KEYWORDS = [
    "todo", "to do", "to-do", "task", "complete", "finish", "submit",
    "send", "call", "email", "meeting", "deadline", "due", "by",
    "must", "need to", "have to", "should",
]

_GOAL_KEYWORDS = [
    "goal", "target", "achieve", "aim", "reach", "want to", "will be",
    "by end of", "this year", "this month", "save", "earn", "lose",
    "score", "grade", "gpa", "weight", "fitness",
]

_CALENDAR_KEYWORDS = [
    "appointment", "meeting", "event", "conference", "session",
    "at", "pm", "am", "tomorrow", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday", "sunday", "next week",
]

_SOCIAL_KEYWORDS = [
    "instagram", "tiktok", "twitter", "facebook", "snapchat", "youtube",
    "reddit", "linkedin", "followers", "likes", "views", "post", "story",
    "reel", "scroll",
]

_TIME_PATTERN = re.compile(
    r"\b(\d{1,2})[:.h](\d{2})?\s*(am|pm|AM|PM)?\b|"
    r"\b(morning|afternoon|evening|night|midnight|noon)\b",
    re.IGNORECASE,
)

_DATE_PATTERN = re.compile(
    r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b|"
    r"\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|"
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\b",
    re.IGNORECASE,
)


def classify_intent(text: str) -> dict:
    text_lower = text.lower()

    scores = {
        "habit": _score_keywords(text_lower, _HABIT_KEYWORDS),
        "task": _score_keywords(text_lower, _TASK_KEYWORDS),
        "goal": _score_keywords(text_lower, _GOAL_KEYWORDS),
        "calendar_event": _score_keywords(text_lower, _CALENDAR_KEYWORDS),
        "social_media": _score_keywords(text_lower, _SOCIAL_KEYWORDS),
    }

    time_matches = _TIME_PATTERN.findall(text)
    date_matches = _DATE_PATTERN.findall(text)

    if time_matches:
        scores["calendar_event"] += 0.3
        scores["habit"] += 0.1

    if date_matches:
        scores["calendar_event"] += 0.3
        scores["task"] += 0.2

    if all(s == 0 for s in scores.values()):
        intent = "general_text"
        confidence = 0.5
    else:
        intent = max(scores, key=scores.get)
        max_score = scores[intent]
        confidence = min(0.95, max_score / max(sum(scores.values()), 0.01))

    return {
        "intent": intent,
        "confidence": round(confidence, 3),
        "scores": {k: round(v, 3) for k, v in scores.items()},
        "has_time": len(time_matches) > 0,
        "has_date": len(date_matches) > 0,
        "extracted_times": [m for group in time_matches for m in group if m],
        "extracted_dates": [m for group in date_matches for m in group if m],
    }


def _score_keywords(text: str, keywords: list[str]) -> float:
    matches = sum(1 for kw in keywords if kw in text)
    return min(1.0, matches * 0.25)


def extract_list_items(text: str) -> list[str]:
    lines = text.split("\n")
    items: list[str] = []

    for line in lines:
        line = line.strip()
        cleaned = re.sub(r"^[-*•·\d]+[.):\s]+", "", line).strip()
        if cleaned and len(cleaned) > 2:
            items.append(cleaned)

    return items
