// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { obterKpis, obterGraficos } from '../services/dashboard';
import { ApiError } from '../services/api';
import { Chart } from 'chart.js/auto';

export function Dashboard() {
    const [kpis, setKpis] = useState({ total: 0, aprovados: 0, pendentes: 0, enviados: 0, rascunhos: 0, percentualMedio: 0 });
    const [graficos, setGraficos] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                const [kpisResp, graficosResp] = await Promise.all([obterKpis(), obterGraficos()]);
                if (!cancelado) {
                    setKpis(kpisResp);
                    setGraficos(graficosResp);
                }
            } catch (err) {
                if (!cancelado) setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar o dashboard.');
            } finally {
                if (!cancelado) setCarregando(false);
            }
        })();
        return () => { cancelado = true; };
    }, []);

    useEffect(() => {
        if (!graficos || !chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const contagemPorStatus = {};
        (graficos.status || []).forEach(item => {
            contagemPorStatus[item.status] = item._count?.status || 0;
        });

        chartInstance.current = new Chart(chartRef.current, {
            type: 'doughnut',
            data: {
                labels: ['Aprovadas', 'Pendentes', 'Rascunhos', 'Enviadas'],
                datasets: [{
                    data: [
                        contagemPorStatus['APROVADO'] || 0,
                        contagemPorStatus['PENDENTE'] || 0,
                        contagemPorStatus['RASCUNHO'] || 0,
                        contagemPorStatus['ENVIADO'] || 0,
                    ],
                    backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [graficos]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '1.5rem' }}>Dashboard do PETRANS</h2>

            {erro && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    ⚠️ {erro}
                </div>
            )}

            {carregando ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Carregando dashboard...</div>
            ) : (
                <>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <CardKpi titulo="Total de Matrizes" valor={kpis.total} cor="#1e293b" />
                        <CardKpi titulo="Aprovadas" valor={kpis.aprovados} cor="#22c55e" />
                        <CardKpi titulo="Enviadas" valor={kpis.enviados} cor="#0284c7" />
                        <CardKpi titulo="Pendentes" valor={kpis.pendentes} cor="#ef4444" />
                        <CardKpi titulo="Rascunhos" valor={kpis.rascunhos} cor="#f59e0b" />
                    </div>

                    {/* Gráficos */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Status das Matrizes</h4>
                            <canvas ref={chartRef} style={{ maxHeight: '300px', width: '100%' }}></canvas>
                        </div>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Progresso Médio</h4>
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2563eb' }}>
                                    {kpis.percentualMedio || 0}%
                                </p>
                                <p style={{ color: '#64748b' }}>Média de progresso das matrizes</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function CardKpi({ titulo, valor, cor }) {
    return (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{titulo}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: cor, margin: '0.5rem 0' }}>{valor}</p>
        </div>
    );
}
