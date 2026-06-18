# backend/routes/orion.py

from fastapi import APIRouter, Depends
from routes.dependencies import get_current_user
from services.db import get_db

router = APIRouter(
    prefix="/orion",
    tags=["orion"]
)

@router.post("/register")
async def register_device(
    body: dict,
    user=Depends(get_current_user)
):
    db = await get_db()

    async with db.acquire() as conn:

        await conn.execute("""
            INSERT INTO orion_devices (
                id,
                user_id,
                device_name,
                os,
                version,
                verified,
                last_seen
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                $4,
                TRUE,
                NOW()
            )

            ON CONFLICT (user_id, device_name)

            DO UPDATE SET
                os = EXCLUDED.os,
                version = EXCLUDED.version,
                verified = TRUE,
                last_seen = NOW()
        """,
        user["id"],
        body["device_name"],
        body["os"],
        body["version"]
        )

    return {"success": True}
@router.post("/heartbeat")
async def heartbeat(
    body: dict,
    user=Depends(get_current_user)
):
    db = await get_db()

    async with db.acquire() as conn:

        await conn.execute("""
            UPDATE orion_devices
            SET
                last_seen = NOW(),
                version = $2
            WHERE user_id = $1
        """,
        user["id"],
        body.get("version")
        )

    return {"success": True}