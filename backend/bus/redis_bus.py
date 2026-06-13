# backend/bus/redis_bus.py
import json
from typing import AsyncGenerator
import redis.asyncio as aioredis
from config import get_settings

settings = get_settings()

def _client() -> aioredis.Redis:
    return aioredis.from_url(
        settings.redis_url,     # reads from .env via Settings
        decode_responses=True,
    )

async def publish_event(run_id: str, event: dict) -> None:
    async with _client() as r:
        await r.publish(f"run:{run_id}", json.dumps(event))

async def subscribe_events(run_id: str) -> AsyncGenerator[dict, None]:
    async with _client() as r:
        pubsub = r.pubsub()
        await pubsub.subscribe(f"run:{run_id}")
        async for message in pubsub.listen():
            if message["type"] == "message":
                yield json.loads(message["data"])
