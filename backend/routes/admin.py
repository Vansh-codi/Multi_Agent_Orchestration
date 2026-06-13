from fastapi import APIRouter
from fastapi import Depends
from fastapi import APIRouter,HTTPException
from services.db import get_db
from routes.dependencies import get_current_user
from pydantic import BaseModel

class MaintenanceRequest(BaseModel):
    maintenance_mode: bool
    message: str = ""
router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)
class PlatformUpdateRequest(BaseModel):
    title: str
    message: str
    details: str = ""
    type: str
    priority: str = "medium"

    version: str = ""

    active: bool = True
    show_banner: bool = False
class UpdateEditRequest(BaseModel):
    title: str
    message: str
    details: str = ""
    type: str
    priority: str = "medium"

    version: str = ""

    active: bool = True
    show_banner: bool = False
def require_admin(user):

    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )


@router.get("/me")
async def admin_me(
    user=Depends(get_current_user)
):

    require_admin(user)

    return {
        "is_admin": True,
        "email": user["email"],
        "role": user["role"]
    }

def percent_change(today, yesterday):
    if yesterday == 0:
        return 100 if today > 0 else 0

    return round(
        ((today - yesterday) / yesterday) * 100,
        1,
    )
@router.get("/stats")
async def admin_stats(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        total_users = await conn.fetchval(
            "SELECT COUNT(*) FROM users"
        )

        total_runs = await conn.fetchval(
            "SELECT COUNT(*) FROM agent_runs"
        )

        completed_runs = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status = 'completed'
            """
        )

        failures = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status != 'completed'
            """
        )

        total_tokens = await conn.fetchval(
            """
            SELECT COALESCE(
                SUM(tokens_used),
                0
            )
            FROM agent_runs
            """
        )
        new_users_week = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM users
            WHERE created_at >= NOW() - INTERVAL '7 days'
            """
        )
        runs_today = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE
            """
        )
        runs_yesterday = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND created_at < CURRENT_DATE
            """
        )
        tokens_today = await conn.fetchval(
            """
            SELECT COALESCE(SUM(tokens_used), 0)
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE
            """
        )
        tokens_yesterday = await conn.fetchval(
            """
            SELECT COALESCE(SUM(tokens_used), 0)
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND created_at < CURRENT_DATE
            """
        )
        failures_today = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status != 'completed'
            AND created_at >= CURRENT_DATE
            """
        )
        failures_yesterday = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status != 'completed'
            AND created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND created_at < CURRENT_DATE
            """
        )
        today_completed = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status = 'completed'
            AND created_at >= CURRENT_DATE
            """
        )

        today_total = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE
            """
        )

        yesterday_completed = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status = 'completed'
            AND created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND created_at < CURRENT_DATE
            """
        )

        yesterday_total = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND created_at < CURRENT_DATE
            """
        )
        today_success_rate = (
            round(
                (today_completed / today_total) * 100,
                2
            )
            if today_total > 0
            else 0
        )

        yesterday_success_rate = (
            round(
                (yesterday_completed / yesterday_total) * 100,
                2
            )
            if yesterday_total > 0
            else 0
        )

        success_rate_change = round(
            today_success_rate - yesterday_success_rate,
            2
        )

        success_rate = (
            round(
                (completed_runs / total_runs) * 100,
                2
            )
            if total_runs > 0
            else 0
        )
#         active_users = await conn.fetchval(
#     """
#     SELECT COUNT(DISTINCT user_id)
#     FROM sessions
#     WHERE revoked = FALSE
#     AND expires_at > NOW()
#     """
# )
        active_users = await conn.fetchval(
    """
    SELECT COUNT(DISTINCT user_id)
    FROM agent_runs
    WHERE created_at > NOW() - INTERVAL '24 minutes'
    """
        )
        return {
        "total_users": total_users,
        "new_users_week": new_users_week,

        "active_users": active_users,

        "total_runs": runs_today,
        "runs_change": percent_change(
            runs_today,
            runs_yesterday,
        ),

        "success_rate": success_rate,
        "success_rate_change": success_rate_change,

        "tokens_today": tokens_today,
        "tokens_change": percent_change(
            tokens_today,
            tokens_yesterday,
        ),

        "failures": failures_today,
        "failures_change": percent_change(
            failures_today,
            failures_yesterday,
        ),
    }
@router.get("/users")
async def admin_users(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT
                id,
                name,
                email,
                role,
                created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 100
            """
        )

        return [
            dict(row)
            for row in rows
        ]
@router.get("/runs")
async def admin_runs(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT
                id,
                goal,
                status,
                tokens_used,
                created_at
            FROM agent_runs
            ORDER BY created_at DESC
            LIMIT 100
            """
        )

        return [dict(r) for r in rows]
@router.get("/runs/stats")
async def admin_run_stats(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        total_runs = await conn.fetchval(
            "SELECT COUNT(*) FROM agent_runs"
        )

        completed_runs = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status = 'completed'
            """
        )

        failed_runs = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM agent_runs
            WHERE status != 'completed'
            """
        )

        total_tokens = await conn.fetchval(
            """
            SELECT COALESCE(
                SUM(tokens_used),
                0
            )
            FROM agent_runs
            """
        )
       

        return {
            "total_runs": total_runs,
            "completed_runs": completed_runs,
            "failed_runs": failed_runs,
            "total_tokens": total_tokens,
        }
@router.get("/system")
async def admin_system(
    user=Depends(get_current_user)
):
    require_admin(user)

    return {
        "backend": "online",
        "database": "online",
        "storage": "online",
        "cache": "offline",
    }
from datetime import datetime, timedelta

@router.get("/runs/chart")
async def admin_runs_chart(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT
                TO_CHAR(created_at,'Dy') as day,
                COUNT(*) as runs
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY day
            """
        )

        db_data = {
            row["day"].strip(): int(row["runs"])
            for row in rows
        }

        result = []

        for i in range(6, -1, -1):
            day_name = (
                datetime.now() - timedelta(days=i)
            ).strftime("%a")

            result.append({
                "day": day_name,
                "runs": db_data.get(day_name, 0),
            })

        return result
@router.get("/activity")
async def admin_activity(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT
                type,
                title,
                description,
                created_at
            FROM activity_logs
            ORDER BY created_at DESC
            LIMIT 20
            """
        )

    return [dict(r) for r in rows]
@router.get("/top-users")
async def admin_top_users(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT
                u.name,
                u.email,
                COUNT(r.id) as runs
            FROM users u
            LEFT JOIN agent_runs r
                ON r.user_id = u.id
            GROUP BY u.id
            ORDER BY runs DESC
            LIMIT 10
            """
        )

    return [dict(r) for r in rows]
@router.get("/updates")
async def get_updates(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
    """
    SELECT *
    FROM platform_updates
    ORDER BY created_at DESC
    """
)

    return [dict(r) for r in rows]

@router.get("/maintenance")
async def get_maintenance(
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        row = await conn.fetchrow(
            """
            SELECT
                maintenance_mode,
                message
            FROM platform_status
            WHERE id = 1
            """
        )

    return dict(row)
@router.post("/updates")
async def create_update(
    payload: PlatformUpdateRequest,
    user=Depends(get_current_user)
):
    require_admin(user)
    print("PAYLOAD:")
    print(payload.model_dump())

    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            INSERT INTO platform_updates
            (
                title,
                message,
                type,
                priority,
                version,
                active,
                show_banner,
                details
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8
            )
            """,
            payload.title,
            payload.message,
            payload.type,
            payload.priority,
            payload.version,
            payload.active,
            payload.show_banner,
            payload.details,
        )

    return {
        "success": True
    }

@router.patch("/maintenance")
async def update_maintenance(
    payload: MaintenanceRequest,
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            UPDATE platform_status
            SET
                maintenance_mode = $1,
                message = $2,
                updated_at = NOW()
            WHERE id = 1
            """,
            payload.maintenance_mode,
            payload.message,
        )

    return {
        "success": True
    }
@router.delete("/updates/{update_id}")
async def delete_update(
    update_id: str,
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            DELETE FROM platform_updates
            WHERE id = $1
            """,
            update_id
        )

    return {
        "success": True
    }
@router.patch("/updates/{update_id}/toggle")
async def toggle_update(
    update_id: str,
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            UPDATE platform_updates
            SET active = NOT active
            WHERE id = $1
            """,
            update_id
        )

    return {
        "success": True
    }
@router.patch("/updates/{update_id}")
async def edit_update(
    update_id: str,
    payload: UpdateEditRequest,
    user=Depends(get_current_user)
):
    require_admin(user)

    pool = await get_db()

    async with pool.acquire() as conn:

        await conn.execute(
            """
            UPDATE platform_updates
            SET
                title = $1,
                message = $2,
                type = $3,
                priority = $4,
                version = $5,
                active = $6,
                show_banner = $7,
                details=$8
            WHERE id = $9
            """,
            payload.title,
            payload.message,
            payload.type,
            payload.priority,
            payload.version,
            payload.active,
            payload.show_banner,
            payload.details,
            update_id,
        )

    return {
        "success": True
    }