from fastapi import APIRouter, Depends
from routes.dependencies import get_current_user
from langchain_groq import ChatGroq
from config import get_settings
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from routes.dependencies import get_current_user
from services.db import get_db
from services.activity import log_activity
# import asyncpg
router = APIRouter(
    prefix="/apikeys",
    tags=["apikeys"],
)

settings = get_settings()


# async def get_db():
#     return await asyncpg.connect(
#         settings.database_url,
#         ssl="require",
#     )
class APIKeysRequest(BaseModel):
    groq_key: str = ""
    serpapi_key: str = ""
    github_token: str = ""
@router.get("")
async def get_keys(
    user=Depends(get_current_user)
):

    pool = await get_db()

    async with pool.acquire() as conn:

        row = await conn.fetchrow(
            """
            SELECT
                groq_key,
                serpapi_key,
                github_token
            FROM user_api_keys
            WHERE user_id = $1
            """,
            user["user_id"],
        )

        if not row:
            return {
                "groq_key": "",
                "serpapi_key": "",
                "github_token": "",
            }

        return dict(row)

  
@router.patch("")
async def save_keys(
    payload: APIKeysRequest,
    user=Depends(get_current_user)
):

    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            INSERT INTO user_api_keys (
                user_id,
                groq_key,
                serpapi_key,
                github_token
            )
            VALUES ($1,$2,$3,$4)

            ON CONFLICT (user_id)
            DO UPDATE SET
                groq_key = EXCLUDED.groq_key,
                serpapi_key = EXCLUDED.serpapi_key,
                github_token = EXCLUDED.github_token,
                updated_at = NOW()
            """,
            user["user_id"],
            payload.groq_key,
            payload.serpapi_key,
            payload.github_token,
        )
        if payload.github_token:
          await log_activity(
        "github",
        "GitHub connected",
        user["name"],
    )

        return {"success": True}

@router.post("/test/groq")
async def test_groq(
    user=Depends(get_current_user)
):
    pool = await get_db()

    async with pool.acquire() as conn:

        row = await conn.fetchrow(
            """
            SELECT groq_key
            FROM user_api_keys
            WHERE user_id = $1
            """,
            user["user_id"],
        )

        if not row or not row["groq_key"]:
            return {
                "success": False,
                "error": "No Groq key saved",
            }

        try:

            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=row["groq_key"],
            )

            await llm.ainvoke("hello")

            return {
                "success": True,
            }

        except Exception as e:

            return {
                "success": False,
                "error": str(e),
            }
