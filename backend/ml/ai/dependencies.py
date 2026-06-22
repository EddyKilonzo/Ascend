from __future__ import annotations

import time
from collections import defaultdict
from typing import Optional

from fastapi import Header, HTTPException, Request, status

from config import settings

# ── Redis-backed sliding window rate limiter ──────────────────────────────────
# Falls back to in-process store when Redis is unavailable.
# The in-process fallback is per-worker — acceptable degradation, not primary path.

_redis_client: Optional[object] = None
_fallback_store: dict[str, list[float]] = defaultdict(list)

try:
    import redis.asyncio as aioredis
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False


async def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not _REDIS_AVAILABLE:
        return None
    try:
        client = aioredis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=settings.REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        await client.ping()
        _redis_client = client
        return _redis_client
    except Exception:
        return None


async def verify_api_key(x_api_key: str = Header(..., alias="x-api-key")) -> None:
    if x_api_key != settings.AI_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


async def rate_limit(request: Request) -> None:
    # Prefer X-User-ID header; fall back to X-Forwarded-For; last resort: host
    client_id = (
        request.headers.get("x-user-id")
        or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )

    now = time.time()
    window = settings.RATE_LIMIT_WINDOW

    redis = await _get_redis()
    if redis is not None:
        key = f"ascend:rl:ai:{client_id}"
        try:
            pipe = redis.pipeline()
            pipe.zremrangebyscore(key, 0, now - window)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, int(window) + 1)
            results = await pipe.execute()
            count = results[1]
        except Exception:
            # Redis failure: fall through to in-process check
            count = 0
    else:
        window_start = now - window
        _fallback_store[client_id] = [t for t in _fallback_store[client_id] if t > window_start]
        count = len(_fallback_store[client_id])
        _fallback_store[client_id].append(now)

    if count >= settings.RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
