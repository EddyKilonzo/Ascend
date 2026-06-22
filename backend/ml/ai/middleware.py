from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from utils.logging import request_id_var, log_info


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attaches X-Request-ID to every request and response, logs latency."""

    async def dispatch(self, request: Request, call_next) -> Response:
        rid = request.headers.get("x-request-id") or str(uuid.uuid4())
        request_id_var.set(rid)

        t0 = time.perf_counter()
        response = await call_next(request)
        latency_ms = (time.perf_counter() - t0) * 1000

        response.headers["X-Request-ID"] = rid
        log_info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            latency_ms=round(latency_ms, 2),
        )
        return response
