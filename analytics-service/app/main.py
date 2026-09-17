from fastapi import FastAPI
from app.api.routes import dashboard

app = FastAPI(
    title="SAEP Analytics API",
    description="Camada de Análise Estatística do SAEP",
    version="1.0.0"
)

app.include_router(dashboard.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}