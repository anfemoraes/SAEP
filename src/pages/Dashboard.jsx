// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { carregarBanco } from '../services/storage';
import { Chart } from 'chart.js/auto';

export function Dashboard({ usuarioLogado }) {
    const [registros, setRegistros] = useState([]);
    const [kpis, setKpis] = useState({
        total: 0,
        aprovados: 0,
        pendentes: 0,
        rascunhos: 0
    });

    useEffect(() => {
        const db = carregarBanco();
        setRegistros(db.registros || []);
        calcularKPIs(db.registros || []);
    }, []);

    useEffect(() => {
        if (registros.length > 0) {
            renderizarGraficos();
        }
    }, [registros]);

    const calcularKPIs = (dados) => {
        const total = dados.length;
        const aprovados = dados.filter(r => r.status === 'Aprovado').length;
        const pendentes = dados.filter(r => r.status === 'Pendente').length;
        const rascunhos = dados.filter(r => r.status === 'Rascunho').length;

        setKpis({ total, aprovados, pendentes, rascunhos });
    };

    const renderizarGraficos = () => {
        // Gráfico de Status
        const ctxStatus = document.getElementById('chartStatus');
        if (ctxStatus) {
            new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Aprovados', 'Pendentes', 'Rascunhos', 'Enviados'],
                    datasets: [{
                        data: [
                            registros.filter(r => r.status === 'Aprovado').length,
                            registros.filter(r => r.status === 'Pendente').length,
                            registros.filter(r => r.status === 'Rascunho').length,
                            registros.filter(r => r.status === 'Enviado').length
                        ],
                        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '1.5rem' }}>Dashboard do PETRANS</h2>
            
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Total de Matrizes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: '0.5rem 0' }}>{kpis.total}</p>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Aprovadas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e', margin: '0.5rem 0' }}>{kpis.aprovados}</p>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Pendentes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', margin: '0.5rem 0' }}>{kpis.pendentes}</p>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Rascunhos</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: '0.5rem 0' }}>{kpis.rascunhos}</p>
                </div>
            </div>

            {/* Gráficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Status das Matrizes</h4>
                    <canvas id="chartStatus" style={{ maxHeight: '300px', width: '100%' }}></canvas>
                </div>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Progresso Médio</h4>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2563eb' }}>
                            {registros.length > 0 
                                ? Math.round(registros.reduce((acc, r) => acc + (r.percentual || 0), 0) / registros.length) 
                                : 0}%
                        </p>
                        <p style={{ color: '#64748b' }}>Média de progresso das ações</p>
                    </div>
                </div>
            </div>

            {/* Últimas Matrizes */}
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>Últimas Matrizes Criadas</h4>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '12px' }}>Nome</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Progresso</th>
                            <th style={{ padding: '12px' }}>Criado Por</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.slice(0, 5).map(reg => (
                            <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', color: '#1e293b' }}>{reg.nome}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        backgroundColor: reg.status === 'Aprovado' ? '#dcfce7' : 
                                                       reg.status === 'Enviado' ? '#e0f2fe' : 
                                                       reg.status === 'Pendente' ? '#fee2e2' : '#fef9c3',
                                        color: reg.status === 'Aprovado' ? '#16a34a' : 
                                               reg.status === 'Enviado' ? '#0284c7' : 
                                               reg.status === 'Pendente' ? '#dc2626' : '#ca8a04'
                                    }}>
                                        {reg.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>{reg.percentual || 0}%</td>
                                <td style={{ padding: '12px', color: '#64748b' }}>{reg.criadoPor}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}