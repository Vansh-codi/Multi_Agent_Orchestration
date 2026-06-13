import asyncpg
from config import get_settings

settings = get_settings()

db_pool = None

async def init_db():
    global db_pool

    db_pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=5,
        max_size=20,
        ssl="require",
    )

async def get_db():
    return db_pool