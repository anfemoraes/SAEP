# app/services/cascata.py
import json
from app.database.connection import get_db_connection

# Mapeamento oficial dos 4 Eixos do PETRANS
EIXOS_INFO = {
    1: {
        "id": 1,
        "codigo": "EIXO 1",
        "nome": "Governança, Integração e Gestão Estratégica",
        "sigla": "GIG",
        "cor": "#2563eb"
    },
    2: {
        "id": 2,
        "codigo": "EIXO 2",
        "nome": "Educação, Capacitação e Cidadania no Trânsito",
        "sigla": "ECC",
        "cor": "#16a34a"
    },
    3: {
        "id": 3,
        "codigo": "EIXO 3",
        "nome": "Fiscalização, Segurança Viária e Operações Integradas",
        "sigla": "FSO",
        "cor": "#d97706"
    },
    4: {
        "id": 4,
        "codigo": "EIXO 4",
        "nome": "Sustentabilidade, Tecnologia, Inteligência e Infraestrutura",
        "sigla": "STI",
        "cor": "#7c3aed"
    }
}

# Os 8 Projetos Estratégicos Estruturantes padrão do PETRANS (ponto de partida)
PROJETOS_ESTRATEGICOS_PADRAO = {
    "PROJETO 01",  # PETRANS
    "PROJETO 04",  # Observatório Estadual de Segurança Viária
    "PROJETO 05",  # GTIP Trânsito
    "PROJETO 07",  # Reestruturação do Conselho
    "PROJETO 12",  # Autonomia financeira Cetran/PA
    "PROJETO 16",  # Escola Pública de Trânsito
    "PROJETO 17",  # Compliance e Combate ao Crime e à Corrupção
    "PROJETO 21",  # Centro Integrado de Operações de Trânsito
}

async def obter_projetos_estrategicos_set(conn) -> set:
    """
    Recupera do banco de dados quais projetos estão com a estrela / status de Estratégico.
    Se a tabela ainda não existir ou estiver vazia, cria e inicializa com os 8 padrões.
    """
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS "ProjetoEstrategico" (
                "codigo" VARCHAR(50) PRIMARY KEY,
                "isEstrategico" BOOLEAN NOT NULL DEFAULT TRUE,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedBy" VARCHAR(150)
            );
        """)

        linhas = await conn.fetch('SELECT "codigo", "isEstrategico" FROM "ProjetoEstrategico";')
        if not linhas:
            # Inicializa com os 8 padrões
            for cod in PROJETOS_ESTRATEGICOS_PADRAO:
                await conn.execute(
                    'INSERT INTO "ProjetoEstrategico" ("codigo", "isEstrategico", "updatedBy") VALUES ($1, TRUE, $2) ON CONFLICT DO NOTHING;',
                    cod, "sistema_inicializacao"
                )
            return set(PROJETOS_ESTRATEGICOS_PADRAO)

        return {row["codigo"] for row in linhas if row["isEstrategico"]}
    except Exception as e:
        print(f"Aviso ao consultar ProjetoEstrategico: {e}")
        return set(PROJETOS_ESTRATEGICOS_PADRAO)

async def alternar_projeto_estrategico(codigo: str, is_estrategico: bool, usuario_email: str = None) -> dict:
    """
    Permite que Administradores (ADMIN e ADMIN_SETOR) marquem ou desmarquem a estrela / destaque de um projeto.
    """
    conn = await get_db_connection()
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS "ProjetoEstrategico" (
                "codigo" VARCHAR(50) PRIMARY KEY,
                "isEstrategico" BOOLEAN NOT NULL DEFAULT TRUE,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedBy" VARCHAR(150)
            );
        """)

        await conn.execute("""
            INSERT INTO "ProjetoEstrategico" ("codigo", "isEstrategico", "updatedAt", "updatedBy")
            VALUES ($1, $2, NOW(), $3)
            ON CONFLICT ("codigo")
            DO UPDATE SET "isEstrategico" = $2, "updatedAt" = NOW(), "updatedBy" = $3;
        """, codigo, is_estrategico, usuario_email or "admin")

        return {
            "codigo": codigo,
            "isEstrategico": is_estrategico,
            "sucesso": True
        }
    finally:
        await conn.close()


def extrair_numero_eixo(og: str, lae: str) -> int:
    """Identifica a qual dos 4 Eixos a ação pertence com base no OG ou LAE."""
    for texto in [og, lae]:
        if not texto:
            continue
        texto_limpo = texto.upper().replace(" ", "")
        if "OG1" in texto_limpo or "LAE1" in texto_limpo:
            return 1
        if "OG2" in texto_limpo or "LAE2" in texto_limpo:
            return 2
        if "OG3" in texto_limpo or "LAE3" in texto_limpo:
            return 3
        if "OG4" in texto_limpo or "LAE4" in texto_limpo:
            return 4
    return 1

def normalizar_prazo(prazo: str) -> str:
    """Padroniza a faixa de prazo da ação."""
    if not prazo:
        return "CURTO"
    p = prazo.upper()
    if "CURTO" in p:
        return "CURTO"
    if "MEDIO" in p or "MÉDIO" in p:
        return "MEDIO"
    if "LONGO" in p:
        return "LONGO"
    return "CURTO"

def calcular_percentual_etapas(etapas_raw) -> int:
    """Calcula o percentual de conclusão das etapas de uma ação."""
    if not etapas_raw:
        return 0
    
    etapas = etapas_raw
    if isinstance(etapas_raw, str):
        try:
            etapas = json.loads(etapas_raw)
        except Exception:
            return 0
            
    if not isinstance(etapas, list) or len(etapas) == 0:
        return 0
        
    concluidas = sum(1 for e in etapas if isinstance(e, dict) and e.get("concluida") is True)
    return round((concluidas / len(etapas)) * 100)

def normalizar_etapas(etapas_raw):
    """Retorna os passos da matriz em um formato seguro para a API."""
    etapas = etapas_raw
    if isinstance(etapas_raw, str):
        try:
            etapas = json.loads(etapas_raw)
        except Exception:
            return []

    if not isinstance(etapas, list):
        return []

    return [
        {
            "id": etapa.get("id") or f"etapa-{indice}",
            "titulo": etapa.get("titulo") or f"Etapa {indice + 1}",
            "concluida": etapa.get("concluida") is True
        }
        for indice, etapa in enumerate(etapas)
        if isinstance(etapa, dict)
    ]

async def carregar_dados_consolidados():
    """
    Carrega todas as ações do banco e cruza com as matrizes APROVADAS
    para gerar o mapa de progresso individual de cada ação.
    """
    conn = await get_db_connection()
    try:
        # 1. Busca todas as ações estratégicas cadastradas
        query_acoes = """
            SELECT 
                id, diretriz, prazo, meta, indicador, setor,
                og, lae, "projetoCodigo", "projetoNome", "projetoTema"
            FROM "Acao"
            ORDER BY id ASC;
        """
        acoes_db = await conn.fetch(query_acoes)

        # 2. Busca os checklists de etapas das matrizes APROVADAS
        query_matrizes = """
            SELECT 
                am."acaoId",
                am.etapas,
                m."dataCriacao"
            FROM "AcoesMatriz" am
            INNER JOIN "Matriz" m ON m.id = am."matrizId"
            WHERE m.status = 'APROVADO'
            ORDER BY m."dataCriacao" ASC;
        """
        etapas_matrizes = await conn.fetch(query_matrizes)

        # Mapeia o percentual calculado por ação (a mais recente sobrescreve se houver duplicação)
        percentual_por_acao = {}
        etapas_por_acao = {}
        for row in etapas_matrizes:
            acao_id = row["acaoId"]
            etapas = row["etapas"]
            percentual_por_acao[acao_id] = calcular_percentual_etapas(etapas)
            etapas_por_acao[acao_id] = normalizar_etapas(etapas)

        # 3. Busca a configuração de projetos estratégicos (definida pelos Administradores)
        estrategicos_set = await obter_projetos_estrategicos_set(conn)

        # Monta a lista enriquecida de todas as ações
        acoes_consolidadas = []
        for a in acoes_db:
            acao_id = a["id"]
            progresso = percentual_por_acao.get(acao_id, 0)
            eixo_num = extrair_numero_eixo(a["og"], a["lae"])
            prazo_norm = normalizar_prazo(a["prazo"])
            proj_cod = a["projetoCodigo"] or "SEM_PROJETO"
            proj_nome = a["projetoNome"] or proj_cod
            
            # Divide múltiplos setores se houver vírgula
            setores_lista = [s.strip() for s in (a["setor"] or "").split(",") if s.strip()]
            if not setores_lista:
                setores_lista = ["Não Classificado"]

            acoes_consolidadas.append({
                "id": acao_id,
                "diretriz": a["diretriz"],
                "prazo": a["prazo"],
                "prazoNormalizado": prazo_norm,
                "meta": a["meta"],
                "indicador": a["indicador"],
                "setores": setores_lista,
                "setorPrincipal": setores_lista[0],
                "og": a["og"] or "Geral",
                "lae": a["lae"] or "Geral",
                "eixoNumero": eixo_num,
                "projetoCodigo": proj_cod,
                "projetoNome": proj_nome,
                "projetoTema": a["projetoTema"] or "",
                "isEstrategico": proj_cod in estrategicos_set,
                "progresso": progresso,
                "etapas": etapas_por_acao.get(acao_id, []),
                "statusExecucao": "CONCLUIDA" if progresso == 100 else ("EM_ANDAMENTO" if progresso > 0 else "NAO_INICIADA")
            })

        return acoes_consolidadas
    finally:
        await conn.close()
