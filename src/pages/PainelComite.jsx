// src/pages/PainelComite.jsx
import React, { useState } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import Swal from 'sweetalert2';

export function PainelComite({ usuarioLogado }) {
    const [db, setDb] = useState(carregarBanco());
    const [matrizEmAvaliacao, setMatrizEmAvaliacao] = useState(null);
    const [parecer, setParecer] = useState('Aprovado');
    const [comentario, setComentario] = useState('');

    const registros = db.registros || [];
    // Filtra apenas as matrizes que estão aguardando avaliação (Enviado)
    const pendentesComite = registros.filter(r => r.status === 'Enviado');

    const handleSalvarParecer = (e) => {
        e.preventDefault();
        if (!matrizEmAvaliacao) return;

        const dbAtualizado = carregarBanco();
        
        dbAtualizado.registros = dbAtualizado.registros.map(reg => {
            if (reg.id === matrizEmAvaliacao.id) {
                return {
                    ...reg,
                    status: parecer, // "Aprovado" ou "Pendente" (para correção)
                    comentarioComite: comentario.trim() || 'Sem observações do comitê.',
                    avaliadoPor: usuarioLogado ? usuarioLogado.email : 'comite@email.com',
                    dataAvaliacao: new Date().toLocaleString()
                };
            }
            return reg;
        });

        salvarBanco(dbAtualizado);
        setDb(dbAtualizado);
        setMatrizEmAvaliacao(null);
        setComentario('');

        Swal.fire({
            icon: 'success',
            title: 'Parecer emitido com sucesso!',
            text: `A matriz ${matrizEmAvaliacao.id} foi atualizada para o status: ${parecer}.`,
            timer: 2200,
            showConfirmButton: false
        });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Comitê Estratégico</p>
                        <h1 style={{ fontSize: '2.2rem', color: '#0f172a', margin: '0.5rem 0 0 0', lineHeight: 1.1 }}>Painel do Comitê</h1>
                    </div>
                    <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '760px', lineHeight: 1.75, margin: 0 }}>
                        Avalie as matrizes estratégicas enviadas para análise do Comitê. As matrizes aprovadas ou com solicitação de ajuste são mantidas no mesmo registro, garantindo continuidade no fluxo.
                    </p>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 18px 55px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '16px', fontWeight: 700 }}>ID</th>
                                <th style={{ padding: '16px', fontWeight: 700 }}>Nome da Ação</th>
                                <th style={{ padding: '16px', fontWeight: 700 }}>Autor</th>
                                <th style={{ padding: '16px', fontWeight: 700 }}>Setor</th>
                                <th style={{ padding: '16px', fontWeight: 700 }}>Custo</th>
                                <th style={{ padding: '16px', fontWeight: 700 }}>Progresso</th>
                                <th style={{ padding: '16px', fontWeight: 700 }}>Status</th>
                                <th style={{ padding: '16px', fontWeight: 700, textAlign: 'center' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendentesComite.length > 0 ? (
                                pendentesComite.map(reg => (
                                    <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px', fontWeight: '700', color: '#2563eb', verticalAlign: 'top' }}>{reg.id}</td>
                                        <td style={{ padding: '16px', color: '#0f172a', verticalAlign: 'top', maxWidth: '220px', whiteSpace: 'normal' }}>{reg.nome}</td>
                                        <td style={{ padding: '16px', color: '#475569', verticalAlign: 'top' }}>{reg.criadoPor}</td>
                                        <td style={{ padding: '16px', color: '#475569', verticalAlign: 'top' }}>{reg.setor || '-'}</td>
                                        <td style={{ padding: '16px', color: '#0f172a', fontWeight: '600', verticalAlign: 'top' }}>{reg.quanto || '-'}</td>
                                        <td style={{ padding: '16px', color: '#0f172a', verticalAlign: 'top' }}>{reg.percentual}%</td>
                                        <td style={{ padding: '16px', verticalAlign: 'top' }}><span style={estiloBadgeStatus(reg.status)}>{reg.status}</span></td>
                                        <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top' }}>
                                            <button 
                                                onClick={() => {
                                                    setMatrizEmAvaliacao(reg);
                                                    setParecer('Aprovado');
                                                    setComentario('');
                                                }} 
                                                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '999px', cursor: 'pointer', fontWeight: '700', transition: 'transform 0.2s ease', minWidth: '140px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                Avaliar Matriz
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', maxWidth: '560px' }}>
                                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem' }}>Nenhuma matriz aguardando avaliação.</h3>
                                            <p style={{ margin: 0, lineHeight: 1.75 }}>As matrizes enviadas pelos usuários aparecerão aqui para análise do Comitê.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Avaliação do Comitê */}
            {matrizEmAvaliacao && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '18px', width: '100%', maxWidth: '1000px', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', position: 'relative', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.16)' }}>
                        <button onClick={() => setMatrizEmAvaliacao(null)} style={{ position: 'absolute', top: '18px', right: '18px', border: 'none', background: 'transparent', fontSize: '1.7rem', color: '#475569', cursor: 'pointer', lineHeight: 1 }} aria-label="Fechar painel de avaliação">×</button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <p style={{ margin: 0, color: '#2563eb', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Modo de avaliação</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.9rem', color: '#0f172a' }}>Avaliar Matriz: {matrizEmAvaliacao.id}</h2>
                                    <p style={{ margin: 0, color: '#475569', fontSize: '1rem', maxWidth: '780px', lineHeight: 1.75 }}>Revise os dados enviados pelo usuário, indique o parecer e registre o comentário do Comitê. A atualização mantém o mesmo registro sem duplicação.</p>
                                </div>
                            </div>

                            <section style={{ display: 'grid', gap: '1rem', background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Identificação</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>ID</span><span style={estiloInfoValue}>{matrizEmAvaliacao.id}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Ação estratégica</span><span style={estiloInfoValue}>{matrizEmAvaliacao.nome}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Autor</span><span style={estiloInfoValue}>{matrizEmAvaliacao.criadoPor}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Setor responsável</span><span style={estiloInfoValue}>{matrizEmAvaliacao.setor || '-'}</span></div>
                                </div>
                            </section>

                            <section style={{ display: 'grid', gap: '1rem', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>5W2H</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>O quê?</span><span style={estiloInfoValue}>{matrizEmAvaliacao.oque}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Por quê?</span><span style={estiloInfoValue}>{matrizEmAvaliacao.porque}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Onde?</span><span style={estiloInfoValue}>{matrizEmAvaliacao.onde}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Quando?</span><span style={estiloInfoValue}>{matrizEmAvaliacao.quando}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Como?</span><span style={estiloInfoValue}>{matrizEmAvaliacao.como}</span></div>
                                    <div style={estiloInfoItem}><span style={estiloInfoLabel}>Quanto?</span><span style={estiloInfoValue}>{matrizEmAvaliacao.quanto || '-'}</span></div>
                                </div>
                            </section>

                            <section style={{ display: 'grid', gap: '1rem', background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Indicadores</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                                    <div style={estiloMetricCard}><span style={estiloMetricLabel}>Progresso</span><strong style={estiloMetricValue}>{matrizEmAvaliacao.percentual}%</strong></div>
                                    <div style={estiloMetricCard}><span style={estiloMetricLabel}>Custo</span><strong style={estiloMetricValue}>{matrizEmAvaliacao.quanto || '-'}</strong></div>
                                    <div style={estiloMetricCard}><span style={estiloMetricLabel}>Impacto</span><strong style={estiloMetricValue}>{matrizEmAvaliacao.impacto || '-'}</strong></div>
                                    <div style={estiloMetricCard}><span style={estiloMetricLabel}>Prazo</span><strong style={estiloMetricValue}>{matrizEmAvaliacao.quando || '-'}</strong></div>
                                </div>
                            </section>

                            <section style={{ display: 'grid', gap: '1rem', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Parecer do Comitê</h3>
                                        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', lineHeight: 1.6 }}>Selecione o parecer e registre o comentário de forma clara. O status será aplicado ao mesmo registro.</p>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eef2ff', borderRadius: '999px', padding: '0.65rem 0.9rem', color: '#3730a3', fontWeight: 700, fontSize: '0.95rem' }}>
                                        <span>Atual</span>
                                        <span style={estiloBadgeStatus(matrizEmAvaliacao.status)}>{matrizEmAvaliacao.status}</span>
                                    </div>
                                </div>

                                {matrizEmAvaliacao.comentarioComite && matrizEmAvaliacao.comentarioComite !== '-' && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem', color: '#92400e' }}>
                                        <p style={{ margin: 0, fontWeight: 700 }}>Comentário anterior do Comitê</p>
                                        <p style={{ margin: '0.65rem 0 0 0', lineHeight: 1.7 }}>{matrizEmAvaliacao.comentarioComite}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSalvarParecer} style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Parecer / Voto do Comitê *</label>
                                        <select 
                                            value={parecer} 
                                            onChange={(e) => setParecer(e.target.value)}
                                            style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#fff', fontSize: '0.95rem', color: '#0f172a' }}
                                        >
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Pendente">Pendente / Solicitar Correção</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Parecer Técnico / Justificativa de Correção *</label>
                                        <textarea 
                                            rows="4" 
                                            value={comentario} 
                                            onChange={(e) => setComentario(e.target.value)} 
                                            required 
                                            placeholder="Digite as observações, o voto fundamentado ou a correção necessária..."
                                            style={{ width: '100%', minHeight: '140px', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '14px', boxSizing: 'border-box', resize: 'vertical', fontSize: '0.95rem', color: '#0f172a' }}
                                        ></textarea>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                                        <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.95rem 1.2rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                                            Emitir Parecer Oficial
                                        </button>
                                        <button type="button" onClick={() => setMatrizEmAvaliacao(null)} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '0.95rem 1.2rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                                            Fechar sem salvar
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const estiloBadgeStatus = (status) => {
    const base = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.45rem 0.85rem',
        borderRadius: '999px',
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.01em'
    };

    if (status === 'Aprovado') {
        return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
    }
    if (status === 'Enviado') {
        return { ...base, backgroundColor: '#e0f2fe', color: '#0369a1' };
    }
    if (status === 'Pendente') {
        return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
    }
    if (status === 'Rascunho') {
        return { ...base, backgroundColor: '#fef9c3', color: '#a16207' };
    }
    return { ...base, backgroundColor: '#f1f5f9', color: '#475569' };
};

const estiloInfoItem = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    background: '#fff',
    borderRadius: '14px',
    padding: '1rem',
    border: '1px solid #e2e8f0'
};

const estiloInfoLabel = {
    fontSize: '0.84rem',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
};

const estiloInfoValue = {
    fontSize: '0.98rem',
    color: '#0f172a',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap'
};

const estiloMetricCard = {
    background: '#fff',
    borderRadius: '16px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
};

const estiloMetricLabel = {
    color: '#64748b',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
};

const estiloMetricValue = {
    color: '#0f172a',
    fontSize: '1.25rem',
    fontWeight: 700
};
