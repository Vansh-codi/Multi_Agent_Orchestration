import asyncpg
from config import get_settings

settings = get_settings()

DEFAULT_PREFERENCES = {
    "model": "llama-3.3-70b-versatile",
    "web_search": True,
    "smart_cache": False,
    "smart_suggestion": True,
    "rag_threshold": 1.5,
}


async def get_user_preferences(user_id: str):
    conn = await asyncpg.connect(
        settings.database_url,
        ssl="require",
    )

    try:
        row = await conn.fetchrow(
            """
            SELECT
                model,
                web_search,
                smart_cache,
                smart_suggestion,
                rag_threshold
            FROM user_preferences
            WHERE user_id = $1
            """,
            user_id,
        )

        if not row:
            return DEFAULT_PREFERENCES

        return {
            "model": row["model"],
            "web_search": row["web_search"],
            "smart_cache": row["smart_cache"],
            "smart_suggestion": row["smart_suggestion"],
            "rag_threshold": row["rag_threshold"],
        }

    finally:
        await conn.close()