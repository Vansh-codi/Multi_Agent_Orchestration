# # backend/ws/stream.py
# import json
# import asyncio
# from typing import AsyncGenerator
# import redis.asyncio as aioredis
# from config import get_settings

# settings = get_settings()

# def _get_redis() -> aioredis.Redis:
#     return aioredis.from_url(settings.redis_url, decode_responses=True)

# async def publish_event(run_id: str, event: dict) -> None:
#     async with _get_redis() as r:
#         await r.publish(f"run:{run_id}", json.dumps(event))

# async def subscribe_events(run_id: str) -> AsyncGenerator[dict, None]:
#     redis = _get_redis()
#     pubsub = redis.pubsub()
#     try:
#         await pubsub.subscribe(f"run:{run_id}")
#         async for raw in pubsub.listen():
#             if raw["type"] != "message":
#                 continue
#             try:
#                 event = json.loads(raw["data"])
#             except (json.JSONDecodeError, TypeError):
#                 continue
#             yield event
#             if event.get("approved") is True or event.get("error"):
#                 break
#     except asyncio.CancelledError:
#         pass
#     finally:
#         await pubsub.unsubscribe(f"run:{run_id}")
#         await pubsub.close()
#         await redis.aclose()

# backend/ws/stream.py
import json
import asyncio
from typing import AsyncGenerator
import redis.asyncio as aioredis
from config import get_settings

settings = get_settings()

def _get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, decode_responses=True)

async def publish_event(run_id: str, event: dict) -> None:
    async with _get_redis() as r:
        await r.publish(f"run:{run_id}", json.dumps(event))

async def subscribe_events(run_id: str) -> AsyncGenerator[dict, None]:
    redis = _get_redis()
    pubsub = redis.pubsub()
    try:
        await pubsub.subscribe(f"run:{run_id}")
        async for raw in pubsub.listen():
            if raw["type"] != "message":
                continue
            try:
                event = json.loads(raw["data"])
            except (json.JSONDecodeError, TypeError):
                continue
            yield event
            if event.get("type") == "done":
                break

            if event.get("error"):
                break
                        # if event.get("approved") is True or event.get("error"):
            #     break
    except (asyncio.CancelledError, GeneratorExit):
        pass
    finally:
        try:
            await pubsub.unsubscribe(f"run:{run_id}")
            await pubsub.close()
            await redis.aclose()
        except Exception:
            pass