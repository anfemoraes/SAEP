from fastapi import APIRouter
from app.services.resumo import obter_resumo_geral
from app.services.projetos import obter_distribuicao_projetos
from app.services.setores import obter_distribuicao_setores
from app.services.prazos import obter_distribuicao_prazos
from app.services.execucao import obter_analise_execucao

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/resumo")
async def get_resumo():
    return await obter_resumo_geral()

@router.get("/projetos")
async def get_projetos():
    return await obter_distribuicao_projetos()

@router.get("/setores")
async def get_setores():
    return await obter_distribuicao_setores()

@router.get("/prazos")
async def get_prazos():
    try:
        return await obter_distribuicao_prazos()
    except Exception as e:
        return {
            "status": "erro",
            "mensagem": str(e),
            "tipo": type(e).__name__
        }

@router.get("/execucao")
async def get_execucao():
    try:
        return await obter_analise_execucao()
    except Exception as e:
        return {
            "status": "erro",
            "mensagem": str(e),
            "tipo": type(e).__name__
        }