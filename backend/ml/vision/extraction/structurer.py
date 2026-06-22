from extraction.text_cleaner import clean, normalize_dates, normalize_times
from extraction.intent_parser import classify_intent, extract_list_items
from typing import Any


def structure(raw_text: str, context_hint: str = "general") -> dict:
    if not raw_text or not raw_text.strip():
        return {"type": "empty", "content": [], "raw_text": "", "metadata": {}}

    cleaned = clean(raw_text)
    cleaned = normalize_dates(cleaned)
    cleaned = normalize_times(cleaned)

    classification = classify_intent(cleaned)
    intent = classification["intent"]

    if context_hint != "general":
        intent_override_map = {
            "screenshot": "social_media",
            "notes": "task",
            "calendar": "calendar_event",
            "whiteboard": "goal",
            "document": "task",
        }
        intent = intent_override_map.get(context_hint, intent)

    structured: dict[str, Any] = {
        "type": intent,
        "raw_text": raw_text,
        "cleaned_text": cleaned,
        "metadata": {
            "intent_confidence": classification["confidence"],
            "has_time": classification["has_time"],
            "has_date": classification["has_date"],
            "extracted_times": classification["extracted_times"],
            "extracted_dates": classification["extracted_dates"],
        },
    }

    if intent == "habit":
        structured["content"] = _structure_habits(cleaned)
    elif intent == "task":
        structured["content"] = _structure_tasks(cleaned)
    elif intent == "goal":
        structured["content"] = _structure_goals(cleaned)
    elif intent == "calendar_event":
        structured["content"] = _structure_events(cleaned, classification)
    elif intent == "social_media":
        structured["content"] = _structure_social(cleaned)
    else:
        items = extract_list_items(cleaned)
        structured["content"] = [{"text": item} for item in items] if items else [{"text": cleaned}]

    return structured


def _structure_habits(text: str) -> list[dict]:
    items = extract_list_items(text)
    if not items:
        items = [line.strip() for line in text.split("\n") if line.strip()]

    return [
        {
            "name": item,
            "frequency": _infer_frequency(item),
            "suggested_time": _infer_time_from_text(item),
            "category": _infer_habit_category(item),
        }
        for item in items[:20]
    ]


def _structure_tasks(text: str) -> list[dict]:
    items = extract_list_items(text)
    if not items:
        items = [line.strip() for line in text.split("\n") if line.strip()]

    return [
        {
            "title": item,
            "priority": _infer_priority(item),
            "due_hint": _extract_due_hint(item),
        }
        for item in items[:30]
    ]


def _structure_goals(text: str) -> list[dict]:
    items = extract_list_items(text)
    if not items:
        items = [text.strip()]

    return [
        {
            "description": item,
            "category": _infer_goal_category(item),
            "measurable": _has_number(item),
        }
        for item in items[:10]
    ]


def _structure_events(text: str, classification: dict) -> list[dict]:
    items = extract_list_items(text)
    if not items:
        items = [text.strip()]

    events = []
    for item in items[:15]:
        events.append({
            "title": item,
            "time_hint": classification["extracted_times"][:1] if classification["extracted_times"] else [],
            "date_hint": classification["extracted_dates"][:1] if classification["extracted_dates"] else [],
        })

    return events


def _structure_social(text: str) -> list[dict]:
    import re
    platforms = ["Instagram", "TikTok", "Twitter", "Facebook", "Snapchat", "YouTube", "Reddit"]
    found: list[dict] = []
    for platform in platforms:
        if platform.lower() in text.lower():
            time_match = re.search(r"(\d+)\s*(min|hour|hr|h)\w*", text, re.IGNORECASE)
            found.append({
                "platform": platform,
                "usage_minutes": _parse_duration(time_match) if time_match else None,
                "context": "screenshot_analysis",
            })
    return found or [{"text": text, "context": "social_content"}]


def _infer_frequency(text: str) -> str:
    text_lower = text.lower()
    if "every day" in text_lower or "daily" in text_lower:
        return "daily"
    if "weekly" in text_lower or "every week" in text_lower:
        return "weekly"
    return "daily"


def _infer_time_from_text(text: str) -> str | None:
    import re
    match = re.search(r"\b(\d{1,2})[:.h](\d{2})?\s*(am|pm)?\b", text, re.IGNORECASE)
    return match.group(0) if match else None


def _infer_habit_category(text: str) -> str:
    text_lower = text.lower()
    if any(kw in text_lower for kw in ["workout", "gym", "run", "exercise", "yoga", "walk"]):
        return "fitness"
    if any(kw in text_lower for kw in ["read", "study", "learn", "course", "book"]):
        return "learning"
    if any(kw in text_lower for kw in ["meditate", "journal", "gratitude", "breathe"]):
        return "mindfulness"
    if any(kw in text_lower for kw in ["sleep", "wake", "bed"]):
        return "sleep"
    if any(kw in text_lower for kw in ["water", "eat", "meal", "diet", "fast"]):
        return "health"
    return "productivity"


def _infer_priority(text: str) -> str:
    text_lower = text.lower()
    if any(kw in text_lower for kw in ["urgent", "asap", "critical", "immediately"]):
        return "URGENT"
    if any(kw in text_lower for kw in ["important", "must", "deadline", "due today"]):
        return "HIGH"
    if any(kw in text_lower for kw in ["when possible", "low priority", "maybe"]):
        return "LOW"
    return "MEDIUM"


def _extract_due_hint(text: str) -> str | None:
    import re
    match = re.search(
        r"\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|"
        r"\d{1,2}[/-]\d{1,2}|by \w+)\b",
        text, re.IGNORECASE
    )
    return match.group(0) if match else None


def _infer_goal_category(text: str) -> str:
    text_lower = text.lower()
    if any(kw in text_lower for kw in ["gpa", "grade", "score", "exam", "study"]):
        return "academic"
    if any(kw in text_lower for kw in ["save", "earn", "money", "income", "salary"]):
        return "financial"
    if any(kw in text_lower for kw in ["weight", "fitness", "run", "gym", "health"]):
        return "fitness"
    if any(kw in text_lower for kw in ["career", "job", "promotion", "skill"]):
        return "career"
    return "personal"


def _has_number(text: str) -> bool:
    import re
    return bool(re.search(r"\d+", text))


def _parse_duration(match) -> int:
    import re
    value = int(match.group(1))
    unit = match.group(2).lower()
    if unit in ("hour", "hr", "h"):
        return value * 60
    return value
