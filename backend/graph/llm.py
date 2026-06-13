

# from langchain_groq import ChatGroq
# import asyncpg

# from config import get_settings

# settings = get_settings()


# async def get_llm(user_id: str) -> ChatGroq:

#     conn = await asyncpg.connect(
#         settings.database_url,
#         ssl="require",
#     )

#     try:

#         row = await conn.fetchrow(
#             """
#             SELECT
#                 k.groq_key,
#                 COALESCE(
#                     p.model,
#                     'llama-3.3-70b-versatile'
#                 ) AS model
#             FROM users u
#             LEFT JOIN user_api_keys k
#                 ON k.user_id = u.id
#             LEFT JOIN user_preferences p
#                 ON p.user_id = u.id
#             WHERE u.id = $1
#             """,
#             user_id,
#         )

#         user_key = None
#         model = "llama-3.3-70b-versatile"

#         if row:
#             user_key = row["groq_key"]
#             model = row["model"]

#         api_key = (
#             user_key
#             if user_key
#             else settings.groq_api_key
#         )

#         print("MODEL =", model)
#         print("USING USER KEY =", bool(user_key))

#         return ChatGroq(
#             model=model,
#             temperature=0,
#             api_key=api_key,
#         )

#     finally:
#         await conn.close()


from langchain_groq import ChatGroq

from config import get_settings
from services.db import get_db

settings = get_settings()


async def get_llm(user_id: str) -> ChatGroq:

    
    pool = await get_db()

    if pool is None:
        raise RuntimeError(
            "Database pool not initialized"
        )

    async with pool.acquire() as conn:

        row = await conn.fetchrow(
            """
            SELECT
                k.groq_key,
                COALESCE(
                    p.model,
                    'llama-3.3-70b-versatile'
                ) AS model
            FROM users u
            LEFT JOIN user_api_keys k
                ON k.user_id = u.id
            LEFT JOIN user_preferences p
                ON p.user_id = u.id
            WHERE u.id = $1
            """,
            user_id,
        )

        user_key = None
        model = "llama-3.3-70b-versatile"

        if row:
            user_key = row["groq_key"]
            model = row["model"]

        api_key = (
            user_key
            if user_key
            else settings.groq_api_key
        )

        print("MODEL =", model)
        print("USING USER KEY =", bool(user_key))

        return ChatGroq(
            model=model,
            temperature=0,
            api_key=api_key,
        )