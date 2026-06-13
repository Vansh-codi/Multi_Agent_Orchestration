import asyncpg
from config import get_settings

settings = get_settings()


async def get_github_token(user_id: str):

    conn = await asyncpg.connect(
        settings.database_url,
        ssl="require"
    )

    try:

        row = await conn.fetchrow(
            """
            SELECT github_token
            FROM user_api_keys
            WHERE user_id = $1
            """,
            user_id,
        )

        if row:
            return row["github_token"]

        return None

    finally:
        await conn.close()