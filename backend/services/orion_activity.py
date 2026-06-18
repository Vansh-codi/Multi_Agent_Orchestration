# backend/services/orion_activity.py

from services.db import get_db

async def log_orion_activity(
    user_id: str,
    event_type: str,
):
    db = await get_db()

    async with db.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO orion_activity (
                user_id,
                event_type
            )
            VALUES ($1,$2)
            """,
            user_id,
            event_type,
        )