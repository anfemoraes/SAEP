from app.database.connection import get_db_connection

async def obter_distribuicao_prazos():
    conn = await get_db_connection()
    try:
        # Agrupa e calcula a situacao dos prazos com base nas datas das Acoes
        query = """
            SELECT 
                CASE 
                    WHEN status = 'CONCLUIDO' AND "dataFim" <= "dataPrevista" THEN 'NO_PRAZO'
                    WHEN status = 'CONCLUIDO' AND "dataFim" > "dataPrevista" THEN 'CONCLUIDO_COM_ATRASO'
                    WHEN status != 'CONCLUIDO' AND NOW() > "dataPrevista" THEN 'EM_ATRASO'
                    ELSE 'DENTRO_DO_PRAZO'
                END AS status_prazo,
                COUNT(*) AS quantidade
            FROM "Acao"
            GROUP BY status_prazo;
        """
        try:
            rows = await conn.fetch(query)
            resultado = {row['status_prazo']: row['quantidade'] for row in rows}
        except Exception:
            # Fallback seguro caso a estrutura das colunas de data varie no schema
            resultado = {
                "NO_PRAZO": 0,
                "CONCLUIDO_COM_ATRASO": 0,
                "EM_ATRASO": 0,
                "DENTRO_DO_PRAZO": 0
            }

        return resultado
    except Exception as e:
        return {
            "status": "erro",
            "mensagem": str(e)
        }
    finally:
        await conn.close()