import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def get_db_connection():
    url = DATABASE_URL.replace("postgresql://", "postgres://")
    # statement_cache_size=0 resolve o erro do PgBouncer no Supabase
    return await asyncpg.connect(url, statement_cache_size=0)