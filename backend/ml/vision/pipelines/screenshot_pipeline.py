from ocr.preprocess import preprocess, image_to_bytes
from ocr.selector import select_and_extract
from ocr.confidence import score_result
from extraction.structurer import structure
from extraction.intent_parser import classify_intent
import re


_PLATFORM_SIGNATURES = {
    "TikTok": ["tiktok", "for you", "following", "fyp"],
    "Instagram": ["instagram", "reels", "stories", "explore", "liked by"],
    "Twitter": ["twitter", "tweet", "retweet", "x.com"],
    "Facebook": ["facebook", "marketplace", "groups", "what's on your mind"],
    "YouTube": ["youtube", "subscribe", "views", "shorts"],
    "Reddit": ["reddit", "upvote", "subreddit", "r/"],
    "Snapchat": ["snapchat", "snap", "streak", "bitmoji"],
}


def _detect_platform(text: str) -> str | None:
    text_lower = text.lower()
    for platform, signatures in _PLATFORM_SIGNATURES.items():
        if any(sig in text_lower for sig in signatures):
            return platform
    return None


def _extract_social_metrics(text: str) -> dict:
    metrics: dict = {}

    time_match = re.search(r"(\d+[hm]|\d+\s*hour|\d+\s*min)", text, re.IGNORECASE)
    if time_match:
        metrics["usage_indicator"] = time_match.group(0)

    number_patterns = re.findall(r"\b(\d+(?:\.\d+)?[KkMm]?)\s*(followers|following|views|likes|subscribers)\b", text, re.IGNORECASE)
    for value, label in number_patterns:
        metrics[label.lower()] = value

    return metrics


def run(image_bytes: bytes, screenshot_type: str = "social") -> dict:
    try:
        processed = preprocess(image_bytes, for_handwriting=False)
        processed_bytes = image_to_bytes(processed)
        if not processed_bytes:
            processed_bytes = image_bytes

        ocr_result = select_and_extract(processed_bytes, hint="general")
        scored = score_result(ocr_result)
        raw_text = scored.get("text", "")

        platform = _detect_platform(raw_text)
        social_metrics = _extract_social_metrics(raw_text)
        classification = classify_intent(raw_text)

        if screenshot_type == "social" or platform:
            structured = structure(raw_text, context_hint="screenshot")
        elif screenshot_type == "calendar":
            structured = structure(raw_text, context_hint="calendar")
        elif screenshot_type == "notes":
            structured = structure(raw_text, context_hint="notes")
        else:
            structured = structure(raw_text, context_hint="general")

        return {
            "success": True,
            "raw_text": raw_text,
            "platform_detected": platform,
            "social_metrics": social_metrics,
            "structured": structured,
            "intent": classification["intent"],
            "ocr_metadata": {
                "engine": scored.get("engine"),
                "confidence": scored.get("adjusted_confidence", scored.get("confidence")),
                "quality": scored.get("quality"),
            },
            "pipeline": "screenshot",
            "screenshot_type": screenshot_type,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "platform_detected": None,
            "structured": None,
        }
