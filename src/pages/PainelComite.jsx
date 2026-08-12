import React, { useState } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import Swal from 'sweetalert2';

export function PainelComite({ usuarioLogado }) {
    const [db, setDb] = useState(carregarBanco());
    const [matrizEmAvaliacao, setMatrizEmAvaliacao] = useState(null);
    const [parecer, setParecer] = useState('Aprovado');
    const [comentario, setComentario] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Enviado'); // 'Todos', 'Enviado', 'Aprovado', 'Pendente'

    const registros = db.registros || [];
    
    // Filtra as matrizes baseado no status selecionado
    const registrosFiltrados = filtroStatus === 'Todos' 
        ? registros 
        : registros.filter(r => r.status === filtroStatus);

    // Estatísticas para o comitê
    const stats = {
        total: registros.length,
        enviados: registros.filter(r => r.status === 'Enviado').length,
        aprovados: registros.filter(r => r.status === 'Aprovado').length,
        pendentes: registros.filter(r => r.status === 'Pendente').length,
        rascunhos: registros.filter(r => r.status === 'Rascunho').length
    };

    const handleSalvarParecer = async (e) => {
        e.preventDefault();
        
        if (!matrizEmAvaliacao) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhuma matriz selecionada',
                text: 'Por favor, selecione uma matriz para avaliar.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        if (!comentario.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Comentário obrigatório',
                text: 'Por favor, adicione um comentário ou justificativa para o parecer.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const confirmacao = await Swal.fire({
            title: 'Confirmar parecer',
            text: `Deseja marcar esta matriz como "${parecer}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#e63946',
            confirmButtonText: 'Sim, confirmar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacao.isConfirmed) return;

        const dbAtualizado = carregarBanco();
        
        dbAtualizado.registros = dbAtualizado.registros.map(reg => {
            if (reg.id === matrizEmAvaliacao.id) {
                return {
                    ...reg,
                    status: parecer,
                    comentarioComite: comentario.trim(),
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
        setParecer('Aprovado');

        Swal.fire({
            icon: 'success',
            title: 'Parecer emitido!',
            text: `A matriz ${matrizEmAvaliacao.id} foi marcada como "${parecer}".`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            'Enviado': { bg: '#e0f2fe', color: '#0284c7' },
            'Aprovado': { bg: '#dcfce7', color: '#16a34a' },
            'Pendente': { bg: '#fee2e2', color: '#dc2626' },
            'Rascunho': { bg: '#fef9c3', color: '#ca8a04' }
        };
        return styles[status] || { bg: '#e2e8f0', color: '#475569' };
    };

    // Verifica se o usuário tem permissão para acessar
    if (!usuarioLogado || (usuarioLogado.role !== 'comite' && usuarioLogado.role !== 'admin')) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#e63946' }}>Acesso Restrito</h2>
                <p style={{ color: '#64748b' }}>Esta área é exclusiva para membros do comitê e administradores.</p>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Faça login com uma conta de comitê ou admin para acessar.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Comitê / Conselheiros</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    Analise as matrizes enviadas e emita os pareceres oficiais institucionais.
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
            }}>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Aguardando Avaliação
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7', margin: '0.3rem 0' }}>
                        {stats.enviados}
                    </p>
                </div>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Aprovadas
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', margin: '0.3rem 0' }}>
                        {stats.aprovados}
                    </p>
                </div>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Pendentes / Ajustes
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', margin: '0.3rem 0' }}>
                        {stats.pendentes}
                    </p>
                </div>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Total de Matrizes
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: '0.3rem 0' }}>
                        {stats.total}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1rem',
                flexWrap: 'wrap'
            }}>
                {['Todos', 'Enviado', 'Aprovado', 'Pendente'].map(status => (
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
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {status === 'Todos' ? '📋 Todas' : 
                         status === 'Enviado' ? '⏳ Aguardando' :
                         status === 'Aprovado' ? '✅ Aprovadas' : '⚠️ Pendentes'}
                    </button>
                ))}
            </div>

            {/* Tabela de Matrizes */}
            <div style={{ 
                background: '#fff', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                overflow: 'hidden', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Nome da Ação</th>
                            <th style={{ padding: '12px' }}>Criado Por</th>
                            <th style={{ padding: '12px' }}>Custo</th>
                            <th style={{ padding: '12px' }}>Progresso</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrosFiltrados.length > 0 ? (
                            registrosFiltrados.map(reg => {
                                const statusStyle = getStatusBadgeStyle(reg.status);
                                const isPending = reg.status === 'Enviado';
                                
                                return (
                                    <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{reg.id}</td>
                                        <td style={{ padding: '12px', color: '#1e293b' }}>{reg.nome}</td>
                                        <td style={{ padding: '12px', color: '#64748b' }}>{reg.criadoPor}</td>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{reg.quanto || 'R$ 0,00'}</td>
                                        <td style={{ padding: '12px' }}>{reg.percentual || 0}%</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                backgroundColor: statusStyle.bg,
                                                color: statusStyle.color
                                            }}>
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {isPending ? (
                                                <button 
                                                    onClick={() => setMatrizEmAvaliacao(reg)} 
                                                    style={{ 
                                                        background: '#d97706', 
                                                        color: '#fff', 
                                                        border: 'none', 
                                                        padding: '0.4rem 1rem', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer', 
                                                        fontWeight: 'bold' 
                                                    }}
                                                >
                                                    🏛️ Avaliar
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        setMatrizEmAvaliacao(reg);
                                                        setParecer(reg.status === 'Aprovado' ? 'Aprovado' : 'Pendente');
                                                        setComentario(reg.comentarioComite || '');
                                                    }}
                                                    style={{ 
                                                        background: '#64748b', 
                                                        color: '#fff', 
                                                        border: 'none', 
                                                        padding: '0.4rem 1rem', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer', 
                                                        fontWeight: 'bold' 
                                                    }}
                                                >
                                                    👁️ Ver Parecer
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    {filtroStatus === 'Enviado' 
                                        ? 'Nenhuma matriz pendente de análise no momento.' 
                                        : 'Nenhuma matriz encontrada com este status.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Avaliação do Comitê */}
            {matrizEmAvaliacao && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(0,0,0,0.5)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 1000, 
                    padding: '1rem' 
                }}>
                    <div style={{ 
                        background: '#fff', 
                        padding: '2rem', 
                        borderRadius: '8px', 
                        width: '100%', 
                        maxWidth: '650px', 
                        maxHeight: '90vh', 
                        overflowY: 'auto', 
                        position: 'relative' 
                    }}>
                        <span 
                            onClick={() => setMatrizEmAvaliacao(null)} 
                            style={{ 
                                position: 'absolute', 
                                top: '15px', 
                                right: '20px', 
                                cursor: 'pointer', 
                                fontSize: '1.5rem', 
                                color: '#64748b' 
                            }}
                        >
                            &times;
                        </span>
                        
                        <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            {matrizEmAvaliacao.status === 'Enviado' ? 'Avaliar' : 'Detalhes do Parecer'} - {matrizEmAvaliacao.id}
                        </h3>
                        
                        <div style={{ 
                            background: '#f8fafc', 
                            padding: '1rem', 
                            borderRadius: '6px', 
                            marginBottom: '1.2rem', 
                            fontSize: '0.88rem' 
                        }}>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Nome:</strong> {matrizEmAvaliacao.nome}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>O quê?:</strong> {matrizEmAvaliacao.oque}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Por quê?:</strong> {matrizEmAvaliacao.porque}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Onde / Quando:</strong> {matrizEmAvaliacao.onde} | {matrizEmAvaliacao.quando}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Como?:</strong> {matrizEmAvaliacao.como}</p>
                            <p style={{ margin: '0 0 6px 0' }}>
                                <strong>Custo:</strong> {matrizEmAvaliacao.quanto || 'R$ 0,00'} | 
                                <strong> Impacto:</strong> {matrizEmAvaliacao.impacto} | 
                                <strong> Progresso:</strong> {matrizEmAvaliacao.percentual || 0}%
                            </p>
                            {matrizEmAvaliacao.status !== 'Enviado' && (
                                <p style={{ margin: '6px 0 0 0' }}>
                                    <strong>Avaliado por:</strong> {matrizEmAvaliacao.avaliadoPor || 'N/A'} | 
                                    <strong> Data:</strong> {matrizEmAvaliacao.dataAvaliacao || 'N/A'}
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSalvarParecer}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    Parecer do Comitê *
                                </label>
                                <select 
                                    value={parecer} 
                                    onChange={(e) => setParecer(e.target.value)}
                                    disabled={matrizEmAvaliacao.status !== 'Enviado'}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px', 
                                        background: matrizEmAvaliacao.status !== 'Enviado' ? '#f1f5f9' : '#fff',
                                        cursor: matrizEmAvaliacao.status !== 'Enviado' ? 'not-allowed' : 'default'
                                    }}
                                >
                                    <option value="Aprovado">✅ Aprovado</option>
                                    <option value="Pendente">⚠️ Pendente / Solicitar Ajustes</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    Comentário / Justificativa *
                                </label>
                                <textarea 
                                    rows="3" 
                                    value={comentario} 
                                    onChange={(e) => setComentario(e.target.value)} 
                                    required={matrizEmAvaliacao.status === 'Enviado'}
                                    disabled={matrizEmAvaliacao.status !== 'Enviado'}
                                    placeholder="Digite as observações ou o motivo de ajustes..."
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px', 
                                        boxSizing: 'border-box',
                                        background: matrizEmAvaliacao.status !== 'Enviado' ? '#f1f5f9' : '#fff',
                                        cursor: matrizEmAvaliacao.status !== 'Enviado' ? 'not-allowed' : 'default'
                                    }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setMatrizEmAvaliacao(null)} 
                                    style={{ 
                                        background: '#e2e8f0', 
                                        border: 'none', 
                                        padding: '0.6rem 1.2rem', 
                                        borderRadius: '6px', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer', 
                                        color: '#475569' 
                                    }}
                                >
                                    Fechar
                                </button>
                                {matrizEmAvaliacao.status === 'Enviado' && (
                                    <button 
                                        type="submit" 
                                        style={{ 
                                            background: '#2563eb', 
                                            color: '#fff', 
                                            border: 'none', 
                                            padding: '0.6rem 1.5rem', 
                                            borderRadius: '6px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Salvar Parecer
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}