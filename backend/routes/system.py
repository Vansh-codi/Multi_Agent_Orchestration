# backend/routes/system.py
from fastapi import APIRouter
from storage.supabase_storage import (
    supabase,
    BUCKET,
)
from services.db import get_db
import time
import redis.asyncio as redis

router = APIRouter(
    prefix="/system",
    tags=["system"],
)

@router.get("/health")
async def system_health():

    result = {
        "api": {
            "status": "online",
            "latency": 0,
        },
        "postgres": {
            "status": "offline",
            "latency": None,
        },
        "redis": {
            "status": "offline",
            "latency": None,
        },
    }

    # PostgreSQL
    try:
        pool = await get_db()

        async with pool.acquire() as conn:

            start = time.perf_counter()

            await conn.fetchval("SELECT 1")

            query_latency = round(
                (time.perf_counter() - start) * 1000
            )

        result["postgres"] = {
            "status": "online",
            "latency": query_latency,
        }

    except Exception:
         result["postgres"] = {
        "status": "offline",
        "latency": None,
    }
    # try:
    #     start = time.perf_counter()

    #     pool = await get_db()

    #     async with pool.acquire() as conn:
    #         await conn.fetchval("SELECT 1")

    #     result["postgres"] = {
    #         "status": "online",
    #         "latency": round(
    #             (time.perf_counter() - start) * 1000
    #         ),
    #     }

    # except Exception:
    #     pass

    # Redis
    try:
        start = time.perf_counter()

        r = redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        try:
         await r.ping()
        finally:
         await r.close()

        result["redis"] = {
            "status": "online",
            "latency": round(
                (time.perf_counter() - start) * 1000
            ),
        }

    except Exception:
      result["redis"] = {
        "status": "offline",
        "latency": None,
    }

   # Storage (Supabase)
    try:
        start = time.perf_counter()

        from storage.supabase_storage import (
            supabase,
            BUCKET,
        )

        supabase.storage \
            .from_(BUCKET) \
            .list()

        storage_latency = round(
            (time.perf_counter() - start) * 1000
        )

        result["storage"] = {
            "status": "online",
            "latency": storage_latency,
        }

    except Exception:
        result["storage"] = {
            "status": "offline",
            "latency": None,
        }
    return result