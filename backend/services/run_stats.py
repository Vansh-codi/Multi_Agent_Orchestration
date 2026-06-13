
import asyncpg
from config import get_settings
from services.db import get_db
settings = get_settings()

# async def get_db():
#     return await asyncpg.connect(
#         settings.database_url,
#         ssl="require"
#     )


async def create_run(
    run_id: str,
    user_id: str,
    goal: str,
):
    pool = await get_db()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO agent_runs (
                id,
                user_id,
                goal
            )
            VALUES ($1, $2, $3)
            """,
            run_id,
            user_id,
            goal,
        )

