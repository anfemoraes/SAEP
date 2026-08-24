// src/pages/PainelAndamento.jsx
import React from 'react';
import { carregarBanco } from '../services/storage';
import { acoesEstrategicas } from '../services/acoes_data';
import { exportarMatrizesAprovadasCSV, exportarMatrizesAprovadasExcel } from '../services/exportService';
import Swal from 'sweetalert2';

export function PainelAndamento() {
    const db = carregarBanco();
    const registros = db.registros || [];

    // Estatísticas gerais
    const totalAcoesBase = acoesEstrategicas.length;
    const totalRegistros = registros.length;
    const rascunhos = registros.filter(r => r.status === 'Rascunho').length;
    const enviados = registros.filter(r => r.status === 'Enviado').length;
    const aprovados = registros.filter(r => r.status === 'Aprovado').length;
    const pendentes = registros.filter(r => r.status === 'Pendente').length;

    // Cálculo da média de progresso das matrizes cadastradas
    const somaProgresso = registros.reduce((acc, curr) => acc + (parseFloat(curr.percentual) || 0), 0);
    const progressoMedio = totalRegistros > 0 ? (somaProgresso / totalRegistros).toFixed(1) : 0;

    const handleExportarCSV = () => {
        const resultado = exportarMatrizesAprovadasCSV();
        if (resultado.sucesso) {
            Swal.fire({
                icon: 'success',
                title: 'CSV gerado com sucesso!',
                text: `${resultado.quantidade} matriz(es) aprovada(s) exportada(s) para CSV.`,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Nada para exportar',
                text: resultado.mensagem,
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleExportarExcel = () => {
        const resultado = exportarMatrizesAprovadasExcel();
        if (resultado.sucesso) {
            Swal.fire({
                icon: 'success',
                title: 'Excel gerado com sucesso!',
                text: `${resultado.quantidade} matriz(es) aprovada(s) exportada(s) para .xlsx.`,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Nada para exportar',
                text: resultado.mensagem,
                confirmButtonColor: '#2563eb'
            });
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: '#1e293b', margin: 0 }}>Painel de Andamento e Indicadores</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Visão consolidada do progresso e monitoramento das matrizes 5W2H do PETRANS.</p>
                </div>

                {/* Container dos dois botões de exportação */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={handleExportarCSV}
                        style={{ 
                            background: '#0284c7', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '0.6rem 1.2rem', 
                            borderRadius: '6px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                         Exportar CSV
                    </button>

                    <button 
                        onClick={handleExportarExcel}
                        style={{ 
                            background: '#16a34a', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '0.6rem 1.2rem', 
                            borderRadius: '6px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                         Exportar Excel
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
                <div style={estiloCardMetric('#f8fafc', '#2563eb')}>
                    <span style={estiloTituloCard}>Ações Estratégicas Base</span>
                    <h3 style={estiloValorCard}>{totalAcoesBase}</h3>
                </div>
                <div style={estiloCardMetric('#f8fafc', '#0284c7')}>
                    <span style={estiloTituloCard}>Matrizes Criadas</span>
                    <h3 style={estiloValorCard}>{totalRegistros}</h3>
                </div>
                <div style={estiloCardMetric('#f8fafc', '#16a34a')}>
                    <span style={estiloTituloCard}>Aprovadas pelo Comitê</span>
                    <h3 style={estiloValorCard}>{aprovados}</h3>
                </div>
                <div style={estiloCardMetric('#f8fafc', '#ca8a04')}>
                    <span style={estiloTituloCard}>Progresso Médio Geral</span>
                    <h3 style={estiloValorCard}>{progressoMedio}%</h3>
                </div>
            </div>

            {/* Seção de Status Detalhado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Status das Matrizes</h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li style={estiloItemStatus}>
                            <span>Rascunhos salvos:</span>
                            <strong style={{ color: '#ca8a04' }}>{rascunhos}</strong>
                        </li>
                        <li style={estiloItemStatus}>
                            <span>Aguardando Análise (Enviados):</span>
                            <strong style={{ color: '#0284c7' }}>{enviados}</strong>
                        </li>
                        <li style={estiloItemStatus}>
                            <span>Aprovados pelo Comitê:</span>
                            <strong style={{ color: '#16a34a' }}>{aprovados}</strong>
                        </li>
                        <li style={estiloItemStatus}>
                            <span>Pendentes / Ajustes solicitados:</span>
                            <strong style={{ color: '#dc2626' }}>{pendentes}</strong>
                        </li>
                    </ul>
                </div>

                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Transparência de Dados</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Os dados exibidos neste painel são calculados em tempo real com base nos registros locais salvos no navegador. As diretrizes seguem estritamente o planejamento estratégico do PETRANS / CETRAN-PA.
                    </p>
                </div>
            </div>
        </div>
    );
}

const estiloCardMetric = (bg, borderColor) => ({
    background: bg,
    padding: '1.5rem',
    borderRadius: '8px',
    border: `1px solid #e2e8f0`,
    borderLeft: `5px solid ${borderColor}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
});

const estiloTituloCard = {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '8px'
};

const estiloValorCard = {
    fontSize: '1.8rem',
    color: '#1e293b',
    margin: 0
};

const estiloItemStatus = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.95rem',
    color: '#475569'
};