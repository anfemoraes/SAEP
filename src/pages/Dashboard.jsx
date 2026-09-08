// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { listarMatrizes } from '../services/matrizes';
import { acoesEstrategicas } from '../services/acoes_data';
import { ApiError } from '../services/api';
import Swal from 'sweetalert2';

export function Dashboard() {
    const [matrizes, setMatrizes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const carregarDados = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await listarMatrizes();
            setMatrizes(Array.isArray(dados) ? dados : []);
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Não foi possível carregar os dados.';
            Swal.fire({ icon: 'error', title: 'Erro ao carregar', text: msg, confirmButtonColor: '#2563eb' });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const contagensStatus = useMemo(() => ({
        'RASCUNHO': matrizes.filter(m => m.status === 'RASCUNHO').length,
        'ENVIADO': matrizes.filter(m => m.status === 'ENVIADO').length,
        'PENDENTE': matrizes.filter(m => m.status === 'PENDENTE').length,
        'APROVADO': matrizes.filter(m => m.status === 'APROVADO').length,
    }), [matrizes]);

    if (carregando) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Dashboard Estratégico</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>
                Visão geral das matrizes 5W2H do PETRANS.
            </p>

            {/* Cards de status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
                <div style={estiloCard('#ca8a04')}>
                    <span style={estiloLabel}>Rascunhos</span>
                    <h3 style={estiloValor}>{contagensStatus.RASCUNHO}</h3>
                </div>
                <div style={estiloCard('#0284c7')}>
                    <span style={estiloLabel}>Aguardando Análise</span>
                    <h3 style={estiloValor}>{contagensStatus.ENVIADO}</h3>
                </div>
                <div style={estiloCard('#dc2626')}>
                    <span style={estiloLabel}>Pendentes</span>
                    <h3 style={estiloValor}>{contagensStatus.PENDENTE}</h3>
                </div>
                <div style={estiloCard('#16a34a')}>
                    <span style={estiloLabel}>Aprovadas</span>
                    <h3 style={estiloValor}>{contagensStatus.APROVADO}</h3>
                </div>
                <div style={estiloCard('#2563eb')}>
                    <span style={estiloLabel}>Total de Matrizes</span>
                    <h3 style={estiloValor}>{matrizes.length}</h3>
                </div>
                <div style={estiloCard('#7c3aed')}>
                    <span style={estiloLabel}>Ações Estratégicas Base</span>
                    <h3 style={estiloValor}>{acoesEstrategicas.length}</h3>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    📊 O Dashboard analítico completo (gráficos de custo, previsão de atraso e comparação entre setores) será implementado em breve via serviço Python dedicado.
                </p>
            </div>
        </div>
    );
}

const estiloCard = (borderColor) => ({
    background: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    borderLeft: `5px solid ${borderColor}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
});

const estiloLabel = {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '8px'
};

const estiloValor = {
    fontSize: '1.8rem',
    color: '#1e293b',
    margin: 0
};