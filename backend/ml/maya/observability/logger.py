from __future__ import annotations

import json
import logging
import sys
import time
from contextvars import ContextVar
from typing import Any

request_id_var: ContextVar[str] = ContextVar("request_id", default="")

_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(logging.Formatter("%(message)s"))
_logger = logging.getLogger("maya")
_logger.addHandler(_handler)
_logger.setLevel(logging.INFO)
_logger.propagate = False


def _emit(level: str, event: str, **fields: Any) -> None:
    record = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "service": "maya",
        "level": level,
        "event": event,
        "request_id": request_id_var.get(),
        **fields,
    }
    getattr(_logger, level)(json.dumps(record, default=str))


def log_info(event: str, **fields: Any) -> None:
    _emit("info", event, **fields)


def log_warning(event: str, **fields: Any) -> None:
    _emit("warning", event, **fields)


def log_error(event: str, **fields: Any) -> None:
    _emit("error", event, **fields)


def log_request(user_id: str, module: str, latency_ms: float, cached: bool) -> None:
    log_info(
        "request_complete",
        user_id=user_id,
        coaching_module=module,
        latency_ms=round(latency_ms, 2),
        cached=cached,
    )


def log_llm_call(model: str, input_chars: int, latency_ms: float, success: bool) -> None:
    log_info(
        "llm_call",
        model=model,
        input_chars=input_chars,
        latency_ms=round(latency_ms, 2),
        success=success,
    )


def log_security_event(event_type: str, user_id: str, detail: str) -> None:
    log_warning("security_event", event_type=event_type, user_id=user_id, detail=detail)
