from __future__ import annotations

import re
import unicodedata
from typing import Optional

from fastapi import HTTPException, status

from observability.logger import log_security_event

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")

_INJECTION_PATTERNS = re.compile(
    r"(ignore (previous|prior|above|all) instructions?|"
    r"system prompt|"
    r"you are now|"
    r"forget (everything|all)|"
    r"disregard (your|all)|"
    r"jailbreak|"
    r"act as (an? |a )?(different|other|new)|"
    r"from now on you (are|will)|"
    r"<\|.*?\|>|"
    r"\[INST\]|\[/INST\]|"
    r"###\s*instruction)",
    re.IGNORECASE,
)


def sanitize_user_message(text: str, user_id: str, max_length: int = 500) -> str:
    if not text:
        return ""

    # Normalize unicode to NFC form and strip control chars
    text = unicodedata.normalize("NFC", text)
    text = _CONTROL_CHARS.sub("", text)
    text = text.strip()

    if len(text) > max_length:
        log_security_event("message_truncated", user_id, f"length={len(text)}")
        text = text[:max_length]

    if _INJECTION_PATTERNS.search(text):
        log_security_event("injection_attempt", user_id, text[:100])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message contains disallowed content.",
        )

    return text


def validate_api_key(provided_key: str, expected_key: str, user_id: str = "unknown") -> None:
    if not provided_key or provided_key != expected_key:
        log_security_event("invalid_api_key", user_id, "auth_failure")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )
