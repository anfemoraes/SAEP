// src/components/ChecklistEtapas.jsx
import React, { useState } from 'react';
import { calcularPercentualEtapas } from '../services/progresso';

function corDoProgresso(percentual) {
    if (percentual >= 70) return '#16a34a';
    if (percentual >= 40) return '#d97706';
    return '#dc2626';
}

/**
 * Checklist de etapas de uma Ação.
 *
 * - editavelTitulos: permite adicionar/remover/renomear etapas (fase de planejamento,
 *   antes da Matriz ser aprovada pelo comitê).
 * - editavelConclusao: permite marcar/desmarcar etapas como concluídas (só depois
 *   que a Matriz foi aprovada — é esse marcar que faz o percentual subir).
 */
export function ChecklistEtapas({ acaoId, acaoLabel, etapas = [], onChange, editavelTitulos, editavelConclusao }) {
    const [novaEtapa, setNovaEtapa] = useState('');
    const percentual = calcularPercentualEtapas(etapas);

    const adicionarEtapa = () => {
        const titulo = novaEtapa.trim();
        if (!titulo) return;
        onChange([...etapas, { id: `ET-${Date.now()}-${etapas.length}`, titulo, concluida: false }]);
        setNovaEtapa('');
    };

    const removerEtapa = (id) => {
        onChange(etapas.filter(e => e.id !== id));
    };

    const alternarConclusao = (id) => {
        onChange(etapas.map(e => e.id === id ? { ...e, concluida: !e.concluida, concluidaEm: !e.concluida ? new Date().toISOString() : null } : e));
    };

    const renomearEtapa = (id, titulo) => {
        onChange(etapas.map(e => e.id === id ? { ...e, titulo } : e));
    };

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{acaoId}</p>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.5 }}>{acaoLabel}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: corDoProgresso(percentual) }}>{percentual}%</span>
                </div>
            </div>

            <div style={{ height: '8px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ height: '100%', width: `${percentual}%`, background: corDoProgresso(percentual), transition: 'width 0.3s ease' }} />
            </div>

            {etapas.length === 0 && (
                <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    {editavelTitulos ? 'Nenhuma etapa definida ainda. Adicione os passos necessários para concluir esta ação.' : 'Nenhuma etapa foi definida para esta ação.'}
                </p>
            )}

            <div style={{ display: 'grid', gap: '0.5rem' }}>
                {etapas.map(etapa => (
                    <div key={etapa.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.55rem 0.75rem' }}>
                        <input
                            type="checkbox"
                            checked={Boolean(etapa.concluida)}
                            disabled={!editavelConclusao}
                            onChange={() => alternarConclusao(etapa.id)}
                            style={{ width: '18px', height: '18px', cursor: editavelConclusao ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                        />
                        {editavelTitulos ? (
                            <input
                                type="text"
                                value={etapa.titulo}
                                onChange={(e) => renomearEtapa(etapa.id, e.target.value)}
                                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.92rem', color: '#0f172a', padding: '0.2rem' }}
                            />
                        ) : (
                            <span style={{ flex: 1, fontSize: '0.92rem', color: etapa.concluida ? '#16a34a' : '#0f172a', textDecoration: etapa.concluida ? 'line-through' : 'none' }}>
                                {etapa.titulo}
                            </span>
                        )}
                        {editavelTitulos && (
                            <button type="button" onClick={() => removerEtapa(etapa.id)} aria-label={`Remover etapa ${etapa.titulo}`} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem' }}>
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {editavelTitulos && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                    <input
                        type="text"
                        value={novaEtapa}
                        onChange={(e) => setNovaEtapa(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarEtapa(); } }}
                        placeholder="Nova etapa, ex: Levantamento de requisitos"
                        style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem' }}
                    />
                    <button type="button" onClick={adicionarEtapa} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + Adicionar
                    </button>
                </div>
            )}

            {!editavelTitulos && !editavelConclusao && etapas.length > 0 && (
                <p style={{ margin: '0.75rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    As etapas só podem ser marcadas como concluídas depois que esta Matriz for aprovada pelo Comitê.
                </p>
            )}
        </div>
    );
}
