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
_logger = logging.getLogger("ascend.ai")
_logger.addHandler(_handler)
_logger.setLevel(logging.INFO)
_logger.propagate = False


def _emit(level: str, event: str, **fields: Any) -> None:
    record = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "service": "ai-engine",
        "level": level,
        "event": event,
        "request_id": request_id_var.get(),
        **fields,
    }
    getattr(_logger, level)(json.dumps(record, default=str))


def log_info(event: str, **kw: Any) -> None:
    _emit("info", event, **kw)


def log_warning(event: str, **kw: Any) -> None:
    _emit("warning", event, **kw)


def log_error(event: str, **kw: Any) -> None:
    _emit("error", event, **kw)


def log_request(endpoint: str, user_id: str, latency_ms: float, cached: bool) -> None:
    log_info("request_complete", endpoint=endpoint, user_id=user_id,
             latency_ms=round(latency_ms, 2), cached=cached)
