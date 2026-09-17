import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL não configurada no arquivo .env")
    
    url = url.strip('"\'')
    
    # Se a URL contiver a porta 6543 (pooler) ou 5432, garante conexão resiliente sem prepared statements
    return await asyncpg.connect(url, statement_cache_size=0, timeout=10)