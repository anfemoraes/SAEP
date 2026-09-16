from app.database.connection import get_db_connection

async def obter_resumo_geral():
    conn = await get_db_connection()
    try:
        # Contagem de Ações e Matrizes
        total_acoes = await conn.fetchval('SELECT COUNT(*) FROM "Acao";')
        total_matrizes = await conn.fetchval('SELECT COUNT(*) FROM "Matriz";')
        
        # Contagem de Setores únicos cadastrados nas Ações
        total_setores = await conn.fetchval(
            'SELECT COUNT(DISTINCT setor) FROM "Acao" WHERE setor IS NOT NULL;'
        )
        
        # Projetos derivados dos Grupos/OGs cadastrados em Acao
        total_projetos = await conn.fetchval(
            'SELECT COUNT(DISTINCT og) FROM "Acao" WHERE og IS NOT NULL;'
        )

        return {
            "totalAcoes": total_acoes or 0,
            "totalProjetos": total_projetos or 0,
            "totalMatrizes": total_matrizes or 0,
            "totalSetores": total_setores or 0
        }
    finally:
        await conn.close()