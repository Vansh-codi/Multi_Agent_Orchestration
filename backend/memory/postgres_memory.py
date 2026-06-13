# backend/memory/postgres_memory.py
import json
from typing import Optional
import asyncpg
from config import get_settings

settings = get_settings()
_pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(dsn=settings.database_url, min_size=2, max_size=10)
    return _pool

async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def init_db() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_runs (
                id         UUID PRIMARY KEY,
                goal       TEXT        NOT NULL,
                status     TEXT        NOT NULL DEFAULT 'running',
                events     JSONB       NOT NULL DEFAULT '[]',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs (status);
        """)

async def create_run(run_id: str, goal: str) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO agent_runs (id, goal) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            run_id, goal
        )

async def append_event(run_id: str, event: dict) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE agent_runs SET events = events || $1::jsonb, updated_at = NOW() WHERE id = $2",
            json.dumps([event]), run_id
        )

async def mark_run_done(run_id: str, status: str = "done") -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE agent_runs SET status = $1, updated_at = NOW() WHERE id = $2",
            status, run_id
        )

async def get_run(run_id: str) -> Optional[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM agent_runs WHERE id = $1", run_id)
    if not row:
        return None
    return {
        "id": str(row["id"]), "goal": row["goal"], "status": row["status"],
        "events": json.loads(row["events"]),
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }

async def list_recent_runs(limit: int = 20) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, goal, status, created_at, jsonb_array_length(events) AS event_count FROM agent_runs ORDER BY created_at DESC LIMIT $1",
            limit
        )
    return [{"id": str(r["id"]), "goal": r["goal"][:120], "status": r["status"],
             "event_count": r["event_count"], "created_at": r["created_at"].isoformat()} for r in rows]