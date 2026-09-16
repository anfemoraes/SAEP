from app.database.connection import get_db_connection

async def obter_distribuicao_prazos():
    conn = await get_db_connection()
    try:
        total_acoes = await conn.fetchval('SELECT COUNT(*) FROM "Acao";')
        
        if not total_acoes:
            return []

        query = """
            SELECT 
                COALESCE(prazo::text, 'NAO_DEFINIDO') AS prazo,
                COUNT(*) AS total_acoes
            FROM "Acao"
            GROUP BY prazo
            ORDER BY total_acoes DESC;
        """
        rows = await conn.fetch(query)

        resultado = []
        for row in rows:
            qtd = row['total_acoes']
            percentual = round((qtd / total_acoes) * 100, 2)
            resultado.append({
                "prazo": row['prazo'],
                "totalAcoes": qtd,
                "percentual": percentual
            })

        return resultado
    finally:
        await conn.close()