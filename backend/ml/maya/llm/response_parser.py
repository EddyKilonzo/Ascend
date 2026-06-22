from __future__ import annotations

import json
import re
from typing import Any

from observability.logger import log_warning

_JSON_BLOCK = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```")


def _extract_json(text: str) -> str:
    match = _JSON_BLOCK.search(text)
    if match:
        return match.group(1)
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        return text[start:end]
    return text


def parse_coaching_response(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(_extract_json(raw))
        return {
            "explanation": str(data.get("explanation", "")).strip(),
            "factors": [str(f).strip() for f in data.get("factors", [])],
            "recommendations": [str(r).strip() for r in data.get("recommendations", [])],
        }
    except (json.JSONDecodeError, ValueError):
        log_warning("parse_coaching_response_failed", raw_length=len(raw))
        return {
            "explanation": raw.strip()[:500],
            "factors": [],
            "recommendations": [],
        }


def parse_explanation_response(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(_extract_json(raw))
        return {
            "explanation": str(data.get("explanation", "")).strip(),
            "factors_narrative": str(data.get("factors_narrative", "")).strip(),
            "action_summary": str(data.get("action_summary", "")).strip(),
        }
    except (json.JSONDecodeError, ValueError):
        log_warning("parse_explanation_response_failed", raw_length=len(raw))
        return {
            "explanation": raw.strip()[:500],
            "factors_narrative": "",
            "action_summary": "",
        }
