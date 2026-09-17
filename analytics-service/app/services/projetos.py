from app.database.connection import get_db_connection

async def obter_distribuicao_projetos():
    conn = await get_db_connection()
    try:
        total_acoes = await conn.fetchval('SELECT COUNT(*) FROM "Acao";')
        
        if not total_acoes:
            return []

        query = """
            SELECT 
                COALESCE(og, 'SEM PROJETO') AS projeto,
                COUNT(*) AS total_acoes
            FROM "Acao"
            GROUP BY og
            ORDER BY total_acoes DESC;
        """
        rows = await conn.fetch(query)

        resultado = []
        for row in rows:
            qtd = row['total_acoes']
            percentual = round((qtd / total_acoes) * 100, 2)
            resultado.append({
                "projeto": row['projeto'],
                "totalAcoes": qtd,
                "percentual": percentual
            })

        return resultado
    finally:
        await conn.close()