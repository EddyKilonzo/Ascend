from __future__ import annotations

"""
Session memory: stores the last N conversation turns per user per session.
Backed by Redis. Falls back to in-process dict for development.
"""

import json
import time
import uuid
from typing import Optional

from config import settings

try:
    import redis.asyncio as aioredis
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False


class ConversationTurn:
    def __init__(self, role: str, text: str, intent: str | None = None) -> None:
        self.role = role        # "user" | "maya"
        self.text = text
        self.intent = intent
        self.ts = time.time()

    def to_dict(self) -> dict:
        return {"role": self.role, "text": self.text, "intent": self.intent, "ts": self.ts}

    @classmethod
    def from_dict(cls, d: dict) -> "ConversationTurn":
        t = cls(d["role"], d["text"], d.get("intent"))
        t.ts = d.get("ts", time.time())
        return t


class SessionMemory:
    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None
        self._fallback: dict[str, list[dict]] = {}

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

    def _session_key(self, user_id: str) -> str:
        return f"maya:session:{user_id}"

    async def add_turn(self, user_id: str, turn: ConversationTurn) -> None:
        key = self._session_key(user_id)
        if self._client:
            await self._client.rpush(key, json.dumps(turn.to_dict()))
            await self._client.ltrim(key, -settings.SHORT_TERM_MEMORY_TURNS, -1)
            await self._client.expire(key, settings.SESSION_TTL_SECONDS)
        else:
            turns = self._fallback.setdefault(key, [])
            turns.append(turn.to_dict())
            self._fallback[key] = turns[-settings.SHORT_TERM_MEMORY_TURNS:]

    async def get_history(self, user_id: str) -> list[ConversationTurn]:
        key = self._session_key(user_id)
        if self._client:
            raw_list = await self._client.lrange(key, 0, -1)
            return [ConversationTurn.from_dict(json.loads(r)) for r in raw_list]
        raw_list = self._fallback.get(key, [])
        return [ConversationTurn.from_dict(r) for r in raw_list]

    async def clear(self, user_id: str) -> None:
        key = self._session_key(user_id)
        if self._client:
            await self._client.delete(key)
        else:
            self._fallback.pop(key, None)


session_memory = SessionMemory()
