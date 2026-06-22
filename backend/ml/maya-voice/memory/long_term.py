from __future__ import annotations

"""
Long-term memory: stores user preferences, behavioral patterns, and
custom wake words. Backed by Redis with 30-day TTL.
"""

import json
import time
from typing import Optional, Any

from config import settings

try:
    import redis.asyncio as aioredis
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False


class LongTermMemory:
    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None
        self._fallback: dict[str, dict] = {}

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

    def _key(self, user_id: str) -> str:
        return f"maya:ltm:{user_id}"

    async def get(self, user_id: str) -> dict[str, Any]:
        key = self._key(user_id)
        if self._client:
            raw = await self._client.get(key)
            return json.loads(raw) if raw else {}
        return self._fallback.get(key, {})

    async def set_field(self, user_id: str, field: str, value: Any) -> None:
        current = await self.get(user_id)
        current[field] = value
        current["_updated_at"] = time.time()
        await self._save(user_id, current)

    async def get_field(self, user_id: str, field: str, default: Any = None) -> Any:
        memory = await self.get(user_id)
        return memory.get(field, default)

    async def _save(self, user_id: str, data: dict) -> None:
        key = self._key(user_id)
        serialized = json.dumps(data)
        if self._client:
            await self._client.set(key, serialized, ex=settings.LONG_TERM_TTL_SECONDS)
        else:
            self._fallback[key] = data

    async def update_interaction_count(self, user_id: str) -> None:
        current = await self.get(user_id)
        count = current.get("interaction_count", 0) + 1
        await self.set_field(user_id, "interaction_count", count)

    async def remember_preference(self, user_id: str, key: str, value: Any) -> None:
        prefs = (await self.get(user_id)).get("preferences", {})
        prefs[key] = value
        await self.set_field(user_id, "preferences", prefs)


long_term_memory = LongTermMemory()
