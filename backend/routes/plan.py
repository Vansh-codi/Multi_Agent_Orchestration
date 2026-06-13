
from fastapi import APIRouter, Depends
from routes.dependencies import get_current_user
from storage.supabase_storage import list_user_files
from services.db import get_db
# import asyncpg

from config import get_settings

router = APIRouter(prefix="/plan", tags=["plan"])

settings = get_settings()


# async def get_db():
#     return await asyncpg.connect(
#         settings.database_url,
#         ssl="require"
#     )

@router.get("/stats")
async def stats(
    user=Depends(get_current_user)
):

    pool = await get_db()

    async with pool.acquire() as conn:

        # Count today's agent runs

        runs_today = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE user_id = $1
            AND created_at >= CURRENT_DATE
            """,
            user["user_id"],
        )
        tokens_used = await conn.fetchval(
            """
            SELECT COALESCE(SUM(tokens_used), 0)
            FROM agent_runs
            WHERE user_id = $1
            AND created_at >= CURRENT_DATE
            """,
            user["user_id"],
        )

        # Count uploaded documents
        files_uploaded = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM uploaded_files
            WHERE user_id = $1
            """,
            user["user_id"],
        )

        return {
           "runs_today": runs_today,
            "runs_limit": 10,

             "tokens_used": tokens_used,
            "tokens_limit": 100000,

            "files_uploaded": files_uploaded,
            "files_limit": 10,
        }

