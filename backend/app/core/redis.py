import json
from typing import Optional
from redis.asyncio import Redis, from_url

from app.core.config import get_settings

settings = get_settings()

_redis_client: Optional[Redis] = None


async def get_redis() -> Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = from_url(
            settings.redis_url, encoding="utf-8", decode_responses=True
        )
    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


async def cache_get(key: str) -> Optional[dict | list]:
    redis = await get_redis()
    value = await redis.get(key)
    return json.loads(value) if value else None


async def cache_set(key: str, value: dict | list, ttl_seconds: int):
    redis = await get_redis()
    await redis.setex(key, ttl_seconds, json.dumps(value))
