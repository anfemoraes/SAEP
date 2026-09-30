# app/services/setores.py
from app.services.cascata import carregar_dados_consolidados

# Mapeamento dos 4 Macro-Setores e Subsetores do CETRAN-PA
MACRO_SETORES_CONFIG = [
    {
        "nome": "Secretaria Executiva",
        "tipo": "MACRO",
        "aliases": ["Secretaria-Executiva", "Secretaria Executiva", "SEC", "ICETRAN", "CTSIST"],
        "subsetores": ["ICETRAN", "CTSIST", "Secretaria-Executiva"]
    },
    {
        "nome": "CTC - Câmara Temática de Coordenação",
        "tipo": "COMISSAO",
        "aliases": ["CTC", "Coordenação"],
        "subsetores": []
    },
    {
        "nome": "CTEDUC - Câmara Temática de Educação",
        "tipo": "COMISSAO",
        "aliases": ["CTEDUC", "Educação"],
        "subsetores": []
    },
    {
        "nome": "CTES - Câmara Temática de Esforço Legal e Fiscalização",
        "tipo": "COMISSAO",
        "aliases": ["CTES", "Fiscalização", "Esforço Legal"],
        "subsetores": []
    },
    {
        "nome": "Presidência do Cetran",
        "tipo": "DIRECAO",
        "aliases": ["Presidência do Cetran", "Presidência"],
        "subsetores": []
    }
]

async def obter_distribuicao_setores(setor_selecionado: str = None):
    """
    VISÃO 5: Desempenho por Setores ('Lente de Setor').
    Permite visualizar e comparar o desempenho dos 4 macro-setores e subsetores,
    ou aplicar uma lente em um setor específico para reuniões executivas.
    """
    acoes = await carregar_dados_consolidados()

    # Mapeia cada ação para todos os seus setores declarados
    setores_map = {}
    for a in acoes:
        for s in a["setores"]:
            s_clean = s.strip()
            if not s_clean:
                continue
            if s_clean not in setores_map:
                setores_map[s_clean] = {
                    "setor": s_clean,
                    "acoes": []
                }
            setores_map[s_clean]["acoes"].append(a)

    resultado_setores = []
    for s_nome, s_info in setores_map.items():
        acoes_setor = s_info["acoes"]
        total = len(acoes_setor)
        progresso = round(sum(a["progresso"] for a in acoes_setor) / total) if total > 0 else 0
        concluidas = sum(1 for a in acoes_setor if a["progresso"] == 100)
        em_andamento = sum(1 for a in acoes_setor if 0 < a["progresso"] < 100)
        nao_iniciadas = sum(1 for a in acoes_setor if a["progresso"] == 0)

        resultado_setores.append({
            "setor": s_nome,
            "progresso": progresso,
            "totalAcoes": total,
            "acoesConcluidas": concluidas,
            "acoesEmAndamento": em_andamento,
            "acoesNaoIniciadas": nao_iniciadas
        })

    # Ordena setores por total de ações decrescente
    resultado_setores.sort(key=lambda x: (x["totalAcoes"], x["progresso"]), reverse=True)

    # Detalhamento do setor selecionado para a "Lente de Setor"
    detalhes_lente = None
    if setor_selecionado:
        setor_upper = setor_selecionado.upper()
        acoes_lente = [a for a in acoes if any(setor_upper in s.upper() for s in a["setores"])]
        
        if acoes_lente:
            total_lente = len(acoes_lente)
            progresso_lente = round(sum(a["progresso"] for a in acoes_lente) / total_lente)
            
            # Distribuição das ações desse setor por Eixo
            dist_eixos = {1: 0, 2: 0, 3: 0, 4: 0}
            for a in acoes_lente:
                dist_eixos[a["eixoNumero"]] = dist_eixos.get(a["eixoNumero"], 0) + 1

            detalhes_lente = {
                "setor": setor_selecionado,
                "totalAcoes": total_lente,
                "progresso": progresso_lente,
                "distribuicaoPorEixo": dist_eixos,
                "acoes": [
                    {
                        "id": a["id"],
                        "diretriz": a["diretriz"],
                        "meta": a["meta"],
                        "prazo": a["prazo"],
                        "projeto": f"{a['projetoCodigo']}: {a['projetoNome']}",
                        "progresso": a["progresso"],
                        "status": a["statusExecucao"]
                    }
                    for a in acoes_lente
                ]
            }

    return {
        "macroSetoresConfig": MACRO_SETORES_CONFIG,
        "setores": resultado_setores,
        "lenteSetor": detalhes_lente
    }