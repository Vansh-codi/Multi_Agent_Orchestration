from fastapi import APIRouter, Depends
from pydantic import BaseModel
from routes.dependencies import get_current_user
# import asyncpg
from config import get_settings
from services.db import get_db
router = APIRouter(
    prefix="/preferences",
    tags=["preferences"],
)

settings = get_settings()

# async def get_db():
#     return await asyncpg.connect(
#         settings.database_url,
#         ssl="require",
#     )

class PreferencesRequest(BaseModel):
    model: str = "llama-3.3-70b-versatile"
    web_search: bool = True
    smart_cache: bool = False
    smart_suggestion: bool = True
    rag_threshold: float = 1.5


@router.get("")
async def get_preferences(
    user=Depends(get_current_user)
):
    pool = await get_db()

    async with pool.acquire() as conn:
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
            user["id"],
        )

        if not row:
            return {
                "success": True,
                "preferences": PreferencesRequest().model_dump(),
            }

        return {
            "success": True,
            "preferences": {
                "model": row["model"],
                "web_search": row["web_search"],
                "smart_cache": row["smart_cache"],
                "smart_suggestion": row["smart_suggestion"],
                "rag_threshold": row["rag_threshold"],
            },
        }

@router.patch("")
async def save_preferences(
    payload: PreferencesRequest,
    user=Depends(get_current_user)
):
    pool = await get_db()

    async with pool.acquire() as conn:
        print("==== SAVE PREFS ====")
        print("USER:", user)
        print("USER ID:", user.get("id"))
        print("PAYLOAD:", payload.model_dump())
        result =await conn.execute(
            """
            INSERT INTO user_preferences (
                user_id,
                model,
                web_search,
                smart_cache,
                smart_suggestion,
                rag_threshold,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, NOW()
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                model = EXCLUDED.model,
                web_search = EXCLUDED.web_search,
                smart_cache = EXCLUDED.smart_cache,
                smart_suggestion = EXCLUDED.smart_suggestion,
                rag_threshold = EXCLUDED.rag_threshold,
                updated_at = NOW()
            """,
            user["id"],
            payload.model,
            payload.web_search,
            payload.smart_cache,
            payload.smart_suggestion,
            payload.rag_threshold,
        )
        print("SQL RESULT:", result)

        row = await conn.fetchrow(
            """
            SELECT *
            FROM user_preferences
            WHERE user_id = $1
            """,
            user["id"],
        )

        print(
            "ROW AFTER SAVE:",
            dict(row) if row else None
        )


        return {
            "success": True,
            "message": "Preferences saved",
        }
