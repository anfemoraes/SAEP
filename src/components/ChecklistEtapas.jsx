// src/components/ChecklistEtapas.jsx
import React, { useState } from 'react';
import {
    calcularPercentualEtapa,
    calcularPercentualEtapas,
    contarTarefas,
    criarEtapaVazia,
    criarTarefaVazia,
    CAMPOS_5W2H_TAREFA
} from '../services/progresso';
import Swal from 'sweetalert2';

function corDoProgresso(percentual) {
    if (percentual >= 70) return '#16a34a';
    if (percentual >= 40) return '#d97706';
    return '#dc2626';
}

const estiloLabel = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' };
const estiloInput = { width: '100%', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit' };

function BarraProgresso({ percentual }) {
    return (
        <div style={{ height: '8px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percentual}%`, background: corDoProgresso(percentual), transition: 'width 0.3s ease' }} />
        </div>
    );
}

/** Campos 5W2H de uma tarefa (modo edição). */
function FormularioTarefa({ tarefa, onChange }) {
    const atualizar = (chave, valor) => onChange({ ...tarefa, [chave]: valor });
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginTop: '0.6rem' }}>
            {CAMPOS_5W2H_TAREFA.map(campo => (
                <div key={campo.chave} style={{ gridColumn: campo.tipo === 'textarea' ? '1 / -1' : 'auto' }}>
                    <label style={estiloLabel}>{campo.rotulo}</label>
                    {campo.tipo === 'textarea' ? (
                        <textarea
                            rows={2}
                            value={tarefa[campo.chave] || ''}
                            onChange={(e) => atualizar(campo.chave, e.target.value)}
                            placeholder={campo.dica}
                            style={{ ...estiloInput, resize: 'vertical' }}
                        />
                    ) : (
                        <input
                            type={campo.tipo}
                            value={tarefa[campo.chave] || ''}
                            onChange={(e) => atualizar(campo.chave, e.target.value)}
                            placeholder={campo.dica}
                            style={estiloInput}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

/** Leitura do 5W2H de uma tarefa (fora do modo edição). */
function DetalhesTarefa({ tarefa }) {
    const campos = CAMPOS_5W2H_TAREFA.filter(c => c.chave !== 'titulo');
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.6rem' }}>
            {campos.map(campo => (
                <div key={campo.chave} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.65rem', gridColumn: campo.tipo === 'textarea' ? '1 / -1' : 'auto' }}>
                    <span style={estiloLabel}>{campo.rotulo}</span>
                    <span style={{ fontSize: '0.86rem', color: '#0f172a', whiteSpace: 'pre-line' }}>{tarefa[campo.chave] || '-'}</span>
                </div>
            ))}
        </div>
    );
}

function CartaoTarefa({ tarefa, indice, editavelTitulos, editavelConclusao, onChange, onRemover }) {
    const [aberta, setAberta] = useState(editavelTitulos && !tarefa.titulo);

    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                    type="checkbox"
                    checked={Boolean(tarefa.concluida)}
                    disabled={!editavelConclusao}
                    onChange={() => onChange({ ...tarefa, concluida: !tarefa.concluida, concluidaEm: !tarefa.concluida ? new Date().toISOString() : null })}
                    aria-label={`Tarefa ${indice + 1} concluída`}
                    style={{ width: '18px', height: '18px', cursor: editavelConclusao ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                />
                <span style={{ flex: 1, fontSize: '0.9rem', color: tarefa.concluida ? '#16a34a' : '#0f172a', textDecoration: tarefa.concluida ? 'line-through' : 'none' }}>
                    <strong style={{ color: '#64748b', marginRight: '0.4rem' }}>Tarefa {indice + 1}</strong>
                    {tarefa.titulo || <em style={{ color: '#94a3b8' }}>sem descrição</em>}
                </span>
                <button type="button" onClick={() => setAberta(!aberta)} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    {aberta ? 'Ocultar 5W2H' : (editavelTitulos ? 'Editar 5W2H' : 'Ver 5W2H')}
                </button>
                {editavelTitulos && (
                    <button type="button" onClick={onRemover} aria-label={`Remover tarefa ${indice + 1}`} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem' }}>
                        ×
                    </button>
                )}
            </div>
            {aberta && (editavelTitulos
                ? <FormularioTarefa tarefa={tarefa} onChange={onChange} />
                : <DetalhesTarefa tarefa={tarefa} />)}
        </div>
    );
}

function CartaoEtapa({ etapa, indice, editavelTitulos, editavelConclusao, onChange, onRemover }) {
    const tarefas = Array.isArray(etapa.tarefas) ? etapa.tarefas : [];
    const percentual = calcularPercentualEtapa(etapa);
    const etapaLegada = tarefas.length === 0 && !editavelTitulos;

    const atualizarTarefa = (id, nova) => onChange({ ...etapa, tarefas: tarefas.map(t => t.id === id ? nova : t) });

    const removerTarefa = async (id) => {
        const r = await Swal.fire({
            title: 'Excluir tarefa?',
            text: 'Os dados 5W2H desta tarefa serão perdidos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        });
        if (!r.isConfirmed) return;
        onChange({ ...etapa, tarefas: tarefas.filter(t => t.id !== id) });
    };

    return (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', background: '#f8fafc', display: 'grid', gap: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Etapa {indice + 1}</span>
                {editavelTitulos ? (
                    <input
                        type="text"
                        value={etapa.titulo}
                        onChange={(e) => onChange({ ...etapa, titulo: e.target.value })}
                        placeholder="Nome do Passo, ex: Levantamento de requisitos"
                        style={{ ...estiloInput, flex: 1, minWidth: '200px', fontWeight: 600 }}
                    />
                ) : (
                    <span style={{ flex: 1, fontWeight: 700, color: '#0f172a' }}>{etapa.titulo || 'Etapa sem nome'}</span>
                )}
                <span style={{ fontWeight: 800, color: corDoProgresso(percentual) }}>{percentual}%</span>
                {editavelTitulos && (
                    <button type="button" onClick={onRemover} aria-label={`Remover etapa ${etapa.titulo}`} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>
                        ×
                    </button>
                )}
            </div>

            <BarraProgresso percentual={percentual} />

            {etapaLegada && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#475569' }}>
                    <input
                        type="checkbox"
                        checked={Boolean(etapa.concluida)}
                        disabled={!editavelConclusao}
                        onChange={() => onChange({ ...etapa, concluida: !etapa.concluida })}
                    />
                    Etapa sem tarefas detalhadas (formato anterior)
                </label>
            )}

            <div style={{ display: 'grid', gap: '0.5rem' }}>
                {tarefas.map((tarefa, i) => (
                    <CartaoTarefa
                        key={tarefa.id}
                        tarefa={tarefa}
                        indice={i}
                        editavelTitulos={editavelTitulos}
                        editavelConclusao={editavelConclusao}
                        onChange={(nova) => atualizarTarefa(tarefa.id, nova)}
                        onRemover={() => removerTarefa(tarefa.id)}
                    />
                ))}
            </div>

            {editavelTitulos && (
                <button
                    type="button"
                    onClick={() => onChange({ ...etapa, tarefas: [...tarefas, criarTarefaVazia()] })}
                    style={{ justifySelf: 'start', background: '#fff', color: '#2563eb', border: '1px dashed #2563eb', borderRadius: '10px', padding: '0.45rem 0.9rem', fontWeight: 600, cursor: 'pointer' }}
                >
                    + Adicionar tarefa
                </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                <div>
                    <label style={estiloLabel}>Impacto da etapa na ação</label>
                    {editavelTitulos ? (
                        <select value={etapa.impacto || 'MEDIO'} onChange={(e) => onChange({ ...etapa, impacto: e.target.value })} style={estiloInput}>
                            <option value="BAIXO">Baixo</option>
                            <option value="MEDIO">Médio</option>
                            <option value="ALTO">Alto</option>
                        </select>
                    ) : (
                        <span style={{ fontSize: '0.88rem', color: '#0f172a' }}>{{ BAIXO: 'Baixo', MEDIO: 'Médio', ALTO: 'Alto' }[etapa.impacto] || '-'}</span>
                    )}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={estiloLabel}>Observações</label>
                    {editavelTitulos ? (
                        <textarea
                            rows={2}
                            value={etapa.observacao || ''}
                            onChange={(e) => onChange({ ...etapa, observacao: e.target.value })}
                            placeholder="Fatos ou circunstâncias a considerar na realização da etapa"
                            style={{ ...estiloInput, resize: 'vertical' }}
                        />
                    ) : (
                        <span style={{ fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'pre-line' }}>{etapa.observacao || '-'}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Detalhamento de uma Ação: Etapas -> Tarefas, com 5W2H por tarefa.
 *
 * - editavelTitulos: permite criar/remover/renomear etapas e tarefas e preencher o
 *   5W2H (fase de planejamento, antes da Matriz ser aprovada pelo Comitê Gestor).
 * - editavelConclusao: permite marcar tarefas como concluídas (só depois da
 *   aprovação). Cada tarefa concluída faz o percentual da etapa e da ação subir.
 */
export function ChecklistEtapas({ acaoId, acaoLabel, etapas = [], onChange, editavelTitulos, editavelConclusao }) {
    const [novaEtapa, setNovaEtapa] = useState('');
    const percentual = calcularPercentualEtapas(etapas);
    const { total, concluidas } = contarTarefas(etapas);

    const adicionarEtapa = () => {
        const titulo = novaEtapa.trim();
        if (!titulo) return;
        onChange([...etapas, criarEtapaVazia(titulo)]);
        setNovaEtapa('');
    };

    const removerEtapa = async (id, titulo) => {
        const resultado = await Swal.fire({
            title: 'Excluir etapa?',
            text: `Você deseja excluir a etapa "${titulo}" e todas as suas tarefas?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        });
        if (!resultado.isConfirmed) return;
        onChange(etapas.filter(e => e.id !== id));
    };

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{acaoId}</p>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.5 }}>{acaoLabel}</p>
                    {total > 0 && (
                        <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>{concluidas} de {total} tarefas concluídas em {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'}</p>
                    )}
                </div>
                <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: corDoProgresso(percentual) }}>{percentual}%</span>
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}><BarraProgresso percentual={percentual} /></div>

            {etapas.length === 0 && (
                <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    {editavelTitulos ? 'Nenhuma etapa definida ainda. Adicione as etapas (passos) da ação e, dentro de cada uma, as tarefas com o 5W2H.' : 'Nenhuma etapa foi definida para esta ação.'}
                </p>
            )}

            <div style={{ display: 'grid', gap: '0.9rem' }}>
                {etapas.map((etapa, i) => (
                    <CartaoEtapa
                        key={etapa.id}
                        etapa={etapa}
                        indice={i}
                        editavelTitulos={editavelTitulos}
                        editavelConclusao={editavelConclusao}
                        onChange={(nova) => onChange(etapas.map(e => e.id === etapa.id ? nova : e))}
                        onRemover={() => removerEtapa(etapa.id, etapa.titulo)}
                    />
                ))}
            </div>

            {editavelTitulos && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                    <input
                        type="text"
                        value={novaEtapa}
                        onChange={(e) => setNovaEtapa(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarEtapa(); } }}
                        placeholder="Nova etapa (Nome do Passo), ex: Levantamento de requisitos"
                        style={{ ...estiloInput, flex: 1 }}
                    />
                    <button type="button" onClick={adicionarEtapa} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + Adicionar etapa
                    </button>
                </div>
            )}

            {!editavelTitulos && !editavelConclusao && etapas.length > 0 && (
                <p style={{ margin: '0.75rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    As tarefas só podem ser marcadas como concluídas depois que esta Matriz for aprovada pelo Comitê Gestor.
                </p>
            )}
        </div>
    );
}
