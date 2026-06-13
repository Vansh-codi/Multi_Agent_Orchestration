# from fastapi import APIRouter
# from services.db import get_db

# router = APIRouter()

# @router.get("/updates")
# async def public_updates():

#     pool = await get_db()

#     async with pool.acquire() as conn:

#         rows = await conn.fetch(
#             """
#             SELECT *
#             FROM platform_updates
#             WHERE active = TRUE
#             ORDER BY created_at DESC
#             """
#         )

#     return [dict(r) for r in rows]

from fastapi import APIRouter
from services.db import get_db

router = APIRouter()

@router.get("/updates")
async def public_updates():

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT *
            FROM platform_updates
            WHERE active = TRUE
            ORDER BY created_at DESC
            """
        )

    return [dict(r) for r in rows]