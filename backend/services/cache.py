import json
import asyncpg

from config import get_settings

settings = get_settings()
from services.db import get_db

# async def get_db():
#     return await asyncpg.connect(
#         settings.database_url,
#         ssl="require",
#     )
async def get_cached_run(
    user_id: str,
    route: str,
    goal: str,
):
    pool = await get_db()

    async with pool.acquire() as conn:

        row = await conn.fetchrow(
            """
            SELECT result
            FROM cached_runs
            WHERE
                user_id = $1
                AND route = $2
                AND lower(goal) = lower($3)
            ORDER BY created_at DESC
            LIMIT 1
            """,
            user_id,
            route,
            goal.strip(),
        )

        return dict(row) if row else None

async def save_cached_run(
    user_id: str,
    route: str,
    goal: str,
    result,
):
    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            INSERT INTO cached_runs (
                user_id,
                route,
                goal,
                result
            )
            VALUES ($1,$2,$3,$4)
            """,
            user_id,
            route,
            goal.strip(),
            json.dumps(result),
        )

 