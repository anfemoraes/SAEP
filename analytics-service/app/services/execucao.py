from app.database.connection import get_db_connection

async def obter_analise_execucao():
    conn = await get_db_connection()
    try:
        # Tenta a consulta por matrizId na Acao
        try:
            query = """
                SELECT 
                    COALESCE("matrizId", 'SEM_MATRIZ') AS matriz_id,
                    COUNT(*) AS total_acoes
                FROM "Acao"
                GROUP BY "matrizId"
                ORDER BY total_acoes DESC;
            """
            rows = await conn.fetch(query)
        except Exception:
            # Fallback para caso o campo seja diferente no schema
            query = 'SELECT id AS matriz_id, 0 AS total_acoes FROM "Matriz";'
            rows = await conn.fetch(query)

        resultado = []
        for row in rows:
            resultado.append({
                "matrizId": str(row['matriz_id']),
                "totalAcoesVinculadas": row['total_acoes']
            })

        return resultado
    except Exception as e:
        return [
            {
                "matrizId": "ERRO",
                "totalAcoesVinculadas": 0,
                "detalhe": str(e)
            }
        ]
    finally:
        await conn.close()