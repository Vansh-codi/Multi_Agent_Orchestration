from fastapi import APIRouter
from fastapi import Body

from routes.dependencies import get_current_user
from fastapi import APIRouter, Depends, Body
from services.db import get_db

router = APIRouter(
    prefix="/memory",
    tags=["memory"]
)

@router.get("")
async def get_memories(
    user=Depends(get_current_user)
):
    db = await get_db()

    async with db.acquire() as conn:
        rows = await conn.fetch("""
            SELECT *
            FROM assistant_memory
            WHERE user_id = $1
            ORDER BY pinned DESC, created_at DESC
        """,
        user["id"]
        )

    return [
        {
            "id": str(r["id"]),
            "category": r["category"] or "general",
            "title": r["topic"],
            "content": r["summary"],
            "source": r["source"],
            "pinned": r["pinned"],
            "createdAt": r["created_at"].isoformat()
        }
        for r in rows
    ] 
@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    user=Depends(get_current_user)
):
    db = await get_db()

    async with db.acquire() as conn:
        await conn.execute("""
            DELETE FROM assistant_memory
            WHERE id = $1
            AND user_id = $2
        """,
        memory_id,
        user["id"]
        )

    return {"success": True}

@router.patch("/{memory_id}")
async def toggle_pin(
    memory_id: str,
    body: dict = Body(...),
    user=Depends(get_current_user)
):
    db = await get_db()

    async with db.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE assistant_memory
            SET pinned = $1
            WHERE id = $2
            AND user_id = $3
            RETURNING *
        """,
        body["pinned"],
        memory_id,
        user["id"]
        )

    if not row:
        return {"error": "not found"}

    return {
        "id": str(row["id"]),
        "pinned": row["pinned"]
    }