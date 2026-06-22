import json
import hashlib
from typing import Any, Optional
from config import settings

try:
    import redis.asyncio as aioredis
    _redis_client: Optional[aioredis.Redis] = None

    async def get_redis() -> aioredis.Redis:
        global _redis_client
        if _redis_client is None:
            _redis_client = aioredis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
            )
        return _redis_client

    async def cache_get(key: str) -> Optional[Any]:
        try:
            client = await get_redis()
            value = await client.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None

    async def cache_set(key: str, value: Any, ttl: int = settings.CACHE_TTL) -> None:
        try:
            client = await get_redis()
            await client.setex(key, ttl, json.dumps(value))
        except Exception:
            pass

    async def cache_delete(key: str) -> None:
        try:
            client = await get_redis()
            await client.delete(key)
        except Exception:
            pass

    REDIS_AVAILABLE = True

except ImportError:
    REDIS_AVAILABLE = False
    _in_memory_cache: dict[str, Any] = {}

    async def cache_get(key: str) -> Optional[Any]:
        return _in_memory_cache.get(key)

    async def cache_set(key: str, value: Any, ttl: int = settings.CACHE_TTL) -> None:
        _in_memory_cache[key] = value

    async def cache_delete(key: str) -> None:
        _in_memory_cache.pop(key, None)


def make_cache_key(prefix: str, payload: dict) -> str:
    payload_str = json.dumps(payload, sort_keys=True)
    hash_suffix = hashlib.sha256(payload_str.encode()).hexdigest()[:16]
    return f"ascend:ai:{prefix}:{hash_suffix}"
