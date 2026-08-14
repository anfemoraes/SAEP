import React, { useState, useEffect } from 'react';
import { listarMatrizesComite, votarComite, avaliarComite, estatisticasComite } from '../services/comite';
import { ApiError } from '../services/api';
import { podeVotar, podeAprovarDefinitivamente, labelStatus } from '../services/permissoes';
import Swal from 'sweetalert2';

export function PainelComite({ usuarioLogado }) {
    const [registros, setRegistros] = useState([]);
    const [stats, setStats] = useState({ total: 0, enviados: 0, aprovados: 0, pendentes: 0, rascunhos: 0 });
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [matrizAberta, setMatrizAberta] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState('ENVIADO');

    const [meuVoto, setMeuVoto] = useState('APROVAR');
    const [comentarioVoto, setComentarioVoto] = useState('');
    const [salvandoVoto, setSalvandoVoto] = useState(false);

    const [decisaoFinal, setDecisaoFinal] = useState('APROVADO');
    const [comentarioDecisao, setComentarioDecisao] = useState('');
    const [salvandoDecisao, setSalvandoDecisao] = useState(false);

    const acessoPermitido = podeVotar(usuarioLogado);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const [matrizes, estatisticas] = await Promise.all([
                listarMatrizesComite(filtroStatus === 'TODOS' ? undefined : filtroStatus),
                estatisticasComite(),
            ]);
            setRegistros(matrizes || []);
            setStats(estatisticas);
            setErro(null);
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar o painel do comitê.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        if (acessoPermitido) carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroStatus, acessoPermitido]);

    if (!acessoPermitido) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#e63946' }}>Acesso Restrito</h2>
                <p style={{ color: '#64748b' }}>Esta área é exclusiva para Conselheiros e o Admin Geral.</p>
            </div>
        );
    }

    const abrirMatriz = (matriz) => {
        setMatrizAberta(matriz);
        const meuVotoExistente = matriz.votos?.find(v => v.usuario?.id === usuarioLogado.id);
        setMeuVoto(meuVotoExistente?.voto || 'APROVAR');
        setComentarioVoto(meuVotoExistente?.comentario || '');
        setDecisaoFinal('APROVADO');
        setComentarioDecisao(matriz.comentarioComite || '');
    };

    const handleRegistrarVoto = async (e) => {
        e.preventDefault();
        setSalvandoVoto(true);
        try {
            await votarComite(matrizAberta.id, meuVoto, comentarioVoto);
            Swal.fire({ icon: 'success', title: 'Voto registrado!', timer: 1500, showConfirmButton: false });
            const matrizesAtualizadas = await listarMatrizesComite(filtroStatus === 'TODOS' ? undefined : filtroStatus);
            setRegistros(matrizesAtualizadas || []);
            setMatrizAberta(null);
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível registrar o voto.';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        } finally {
            setSalvandoVoto(false);
        }
    };

    const handleDecisaoFinal = async (e) => {
        e.preventDefault();

        if (!comentarioDecisao.trim()) {
            Swal.fire({ icon: 'warning', title: 'Comentário obrigatório', text: 'Justifique a decisão final.', confirmButtonColor: '#2563eb' });
            return;
        }

        const confirmacao = await Swal.fire({
            title: 'Confirmar decisão final',
            text: `Deseja marcar esta matriz como "${labelStatus(decisaoFinal)}"? Esta é a decisão definitiva.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#e63946',
            confirmButtonText: 'Sim, confirmar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacao.isConfirmed) return;

        setSalvandoDecisao(true);
        try {
            await avaliarComite(matrizAberta.id, decisaoFinal, comentarioDecisao.trim());
            Swal.fire({ icon: 'success', title: 'Decisão registrada!', timer: 1800, showConfirmButton: false });
            setMatrizAberta(null);
            carregarDados();
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível registrar a decisão.';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        } finally {
            setSalvandoDecisao(false);
        }
    };

    const podeVotarNestaMatriz = matrizAberta?.status === 'ENVIADO';
    const podeDecidirNestaMatriz = podeAprovarDefinitivamente(usuarioLogado) && matrizAberta?.status === 'ENVIADO';

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Comitê / Conselheiros</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    Registre seu voto consultivo nas matrizes enviadas. A decisão final é sempre do Admin Geral.
                </p>
            </div>

            {erro && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    ⚠️ {erro}
                </div>
            )}

            {/* Cards de Estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <CardStat titulo="Aguardando Avaliação" valor={stats.enviados} cor="#0284c7" />
                <CardStat titulo="Aprovadas" valor={stats.aprovados} cor="#16a34a" />
                <CardStat titulo="Pendentes / Ajustes" valor={stats.pendentes} cor="#dc2626" />
                <CardStat titulo="Total de Matrizes" valor={stats.total} cor="#1e293b" />
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['TODOS', 'ENVIADO', 'APROVADO', 'PENDENTE'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFiltroStatus(status)}
                        style={{
                            padding: '0.4rem 1rem',
                            border: filtroStatus === status ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: filtroStatus === status ? '#eff6ff' : '#fff',
                            color: filtroStatus === status ? '#2563eb' : '#475569',
                            cursor: 'pointer',
                            fontWeight: filtroStatus === status ? 'bold' : 'normal',
                        }}
                    >
                        {status === 'TODOS' ? '📋 Todas' :
                         status === 'ENVIADO' ? '⏳ Aguardando' :
                         status === 'APROVADO' ? '✅ Aprovadas' : '⚠️ Pendentes'}
                    </button>
                ))}
            </div>

            {/* Tabela */}
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px' }}>Nome da Ação</th>
                            <th style={{ padding: '12px' }}>Criado Por</th>
                            <th style={{ padding: '12px' }}>Custo</th>
                            <th style={{ padding: '12px' }}>Votos</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</td></tr>
                        ) : registros.length > 0 ? (
                            registros.map(reg => (
                                <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{reg.nome}</td>
                                    <td style={{ padding: '12px', color: '#64748b' }}>{reg.criadoPor?.email}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{reg.quanto || 'R$ 0,00'}</td>
                                    <td style={{ padding: '12px' }}>{(reg.votos || []).length}</td>
                                    <td style={{ padding: '12px' }}><span style={estiloBadgeStatus(reg.status)}>{labelStatus(reg.status)}</span></td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => abrirMatriz(reg)}
                                            style={{ background: reg.status === 'ENVIADO' ? '#d97706' : '#64748b', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            {reg.status === 'ENVIADO' ? '🏛️ Analisar' : '👁️ Ver'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhuma matriz encontrada com este status.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Análise */}
            {matrizAberta && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <span onClick={() => setMatrizAberta(null)} style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' }}>&times;</span>

                        <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            {matrizAberta.nome}
                        </h3>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '0.88rem' }}>
                            <p style={{ margin: '0 0 6px 0' }}><strong>O quê?:</strong> {matrizAberta.oque}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Por quê?:</strong> {matrizAberta.porque}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Onde / Quando:</strong> {matrizAberta.onde} | {matrizAberta.quando}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Como?:</strong> {matrizAberta.como}</p>
                            <p style={{ margin: 0 }}>
                                <strong>Custo:</strong> {matrizAberta.quanto || 'R$ 0,00'} |
                                <strong> Impacto:</strong> {matrizAberta.impacto} |
                                <strong> Progresso:</strong> {matrizAberta.percentual || 0}%
                            </p>
                        </div>

                        {/* Votos já registrados */}
                        {matrizAberta.votos && matrizAberta.votos.length > 0 && (
                            <div style={{ marginBottom: '1.2rem' }}>
                                <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Votos registrados ({matrizAberta.votos.length}):</strong>
                                {matrizAberta.votos.map(v => (
                                    <p key={v.id} style={{ fontSize: '0.85rem', margin: '4px 0 0 0', color: '#64748b' }}>
                                        {v.usuario?.email} — <strong style={{ color: v.voto === 'APROVAR' ? '#16a34a' : '#dc2626' }}>{v.voto}</strong>
                                        {v.comentario ? `: ${v.comentario}` : ''}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Registrar meu voto (Conselheiro ou Admin Geral) */}
                        {podeVotarNestaMatriz && (
                            <form onSubmit={handleRegistrarVoto} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: podeDecidirNestaMatriz ? '1.5rem' : 0 }}>
                                <h4 style={{ margin: '0 0 0.8rem 0', color: '#1e293b', fontSize: '0.95rem' }}>Meu voto consultivo</h4>
                                <div style={{ marginBottom: '0.8rem' }}>
                                    <select value={meuVoto} onChange={(e) => setMeuVoto(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                        <option value="APROVAR">✅ Aprovar</option>
                                        <option value="REJEITAR">⚠️ Rejeitar</option>
                                    </select>
                                </div>
                                <textarea rows="2" value={comentarioVoto} onChange={(e) => setComentarioVoto(e.target.value)} placeholder="Comentário (opcional)" style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '0.8rem' }}></textarea>
                                <button type="submit" disabled={salvandoVoto} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: salvandoVoto ? 'wait' : 'pointer' }}>
                                    {salvandoVoto ? 'Salvando...' : 'Registrar meu voto'}
                                </button>
                            </form>
                        )}

                        {/* Decisão final — só Admin Geral */}
                        {podeDecidirNestaMatriz && (
                            <form onSubmit={handleDecisaoFinal} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.8rem 0', color: '#7c3aed', fontSize: '0.95rem' }}>Decisão final (Admin Geral)</h4>
                                <div style={{ marginBottom: '0.8rem' }}>
                                    <select value={decisaoFinal} onChange={(e) => setDecisaoFinal(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                        <option value="APROVADO">✅ Aprovado</option>
                                        <option value="PENDENTE">⚠️ Pendente / Solicitar Ajustes</option>
                                    </select>
                                </div>
                                <textarea rows="3" value={comentarioDecisao} onChange={(e) => setComentarioDecisao(e.target.value)} required placeholder="Justificativa da decisão final..." style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '0.8rem' }}></textarea>
                                <button type="submit" disabled={salvandoDecisao} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: salvandoDecisao ? 'wait' : 'pointer' }}>
                                    {salvandoDecisao ? 'Salvando...' : 'Confirmar decisão final'}
                                </button>
                            </form>
                        )}

                        {!podeVotarNestaMatriz && !podeDecidirNestaMatriz && (
                            <p style={{ color: '#64748b', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                Esta matriz já foi decidida e não aceita novos votos.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function CardStat({ titulo, valor, cor }) {
    return (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>{titulo}</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: cor, margin: '0.3rem 0' }}>{valor}</p>
        </div>
    );
}

function estiloBadgeStatus(status) {
    const styles = {
        ENVIADO: { bg: '#e0f2fe', color: '#0284c7' },
        APROVADO: { bg: '#dcfce7', color: '#16a34a' },
        PENDENTE: { bg: '#fee2e2', color: '#dc2626' },
        RASCUNHO: { bg: '#fef9c3', color: '#ca8a04' }
    };
    const s = styles[status] || { bg: '#e2e8f0', color: '#475569' };
    return { padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: s.bg, color: s.color };
}
