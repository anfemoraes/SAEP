from fastapi import APIRouter
from app.services.resumo import obter_resumo_geral
from app.services.projetos import obter_distribuicao_projetos
from app.services.setores import obter_distribuicao_setores
from app.services.prazos import obter_distribuicao_prazos

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
    return await obter_distribuicao_prazos()