from __future__ import annotations

import time
from typing import Optional

from fastapi import HTTPException, status

try:
    import redis.asyncio as aioredis
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False

from config import settings
from observability.logger import log_security_event


class RateLimiter:
    """Redis sliding-window rate limiter with in-process fallback."""

    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None
        self._fallback: dict[str, list[float]] = {}

    async def connect(self) -> None:
        if not _REDIS_AVAILABLE:
            return
        try:
            self._client = aioredis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
            )
            await self._client.ping()
        except Exception:
            self._client = None

    async def check(self, user_id: str) -> None:
        if self._client:
            await self._check_redis(user_id)
        else:
            self._check_fallback(user_id)

    async def _check_redis(self, user_id: str) -> None:
        now = time.time()
        window = 60
        key = f"maya:rl:{user_id}"
        pipe = self._client.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zcard(key)
        pipe.zadd(key, {str(now): now})
        pipe.expire(key, window)
        results = await pipe.execute()
        count = results[1]
        if count >= settings.RATE_LIMIT_PER_USER_PER_MINUTE:
            log_security_event("rate_limit_exceeded", user_id, f"count={count}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait before sending another request.",
            )

    def _check_fallback(self, user_id: str) -> None:
        now = time.time()
        window = 60
        ts = self._fallback.setdefault(user_id, [])
        self._fallback[user_id] = [t for t in ts if now - t < window]
        if len(self._fallback[user_id]) >= settings.RATE_LIMIT_PER_USER_PER_MINUTE:
            log_security_event("rate_limit_exceeded", user_id, "fallback")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded.",
            )
        self._fallback[user_id].append(now)


rate_limiter = RateLimiter()
