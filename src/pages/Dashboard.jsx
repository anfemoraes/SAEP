// src/pages/Dashboard.jsx
import React, { useState, useMemo } from 'react';
import { carregarBanco } from '../services/storage';
import { acoesEstrategicas } from '../services/acoes_data';
import { 
    obterMatrizesFiltradasDashboard, 
    obterSetoresUnicos, 
    obterPrazosUnicos, 
    obterPrazoDaMatriz,
    obterSetoresDaMatriz
} from '../services/filters';
import { 
    GraficoStatus, 
    GraficoSetor, 
    GraficoPrazo 
} from '../components/DashboardCharts';

export function Dashboard() {
    const [db] = useState(carregarBanco());
    const [filtros] = useState({ 
        og: "Todos", lae: "Todos", setor: "Todos", prazo: "Todos", statusAprovacao: "Todos" 
    });

    const matrizesFiltradas = useMemo(() => 
        obterMatrizesFiltradasDashboard(db.registros || [], acoesEstrategicas, filtros),
    [db, filtros]);

    // Lógica para contagem dos gráficos
    const contagensStatus = {
        "Rascunho": matrizesFiltradas.filter(m => m.status === "Rascunho").length,
        "Enviado": matrizesFiltradas.filter(m => m.status === "Enviado").length,
        "Pendente": matrizesFiltradas.filter(m => m.status === "Pendente").length,
        "Aprovado": matrizesFiltradas.filter(m => m.status === "Aprovado").length,
    };

    // Preparar dados para o gráfico de Setores
    const setoresLabels = obterSetoresUnicos(matrizesFiltradas, acoesEstrategicas);
    const setoresDados = setoresLabels.map(s => 
        matrizesFiltradas.filter(m => obterSetoresDaMatriz(m, acoesEstrategicas).includes(s)).length
    );

    // Preparar dados para o gráfico de Prazos
    const prazosLabels = obterPrazosUnicos(matrizesFiltradas);
    const prazosDados = prazosLabels.map(p => 
        matrizesFiltradas.filter(m => obterPrazoDaMatriz(m) === p).length
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '1.5rem' }}>Dashboard Estratégico</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                
                <div style={estiloCardGrafico}>
                    <h3>Status das Matrizes</h3>
                    <div style={{ height: '250px' }}><GraficoStatus contagens={contagensStatus} /></div>
                </div>

                <div style={estiloCardGrafico}>
                    <h3>Distribuição por Setor</h3>
                    <div style={{ height: '250px' }}>
                        <GraficoSetor labels={setoresLabels} dados={setoresDados} />
                    </div>
                </div>

                <div style={estiloCardGrafico}>
                    <h3>Metas por Prazo</h3>
                    <div style={{ height: '250px' }}>
                        <GraficoPrazo labels={prazosLabels} dados={prazosDados} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const estiloCardGrafico = {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};