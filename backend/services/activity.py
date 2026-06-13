# services/activity.py

from services.db import get_db

async def log_activity(
    activity_type: str,
    title: str,
    description: str = ""
):
    pool = await get_db()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO activity_logs
            (
                type,
                title,
                description
            )
            VALUES ($1,$2,$3)
            """,
            activity_type,
            title,
            description,
        )