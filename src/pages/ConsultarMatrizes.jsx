// src/pages/ConsultarMatrizes.jsx
import React, { useState } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import Swal from 'sweetalert2';

export function ConsultarMatrizes({ usuarioLogado }) {
    const [db, setDb] = useState(carregarBanco());
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [termoBusca, setTermoBusca] = useState('');
    const [matrizSelecionada, setMatrizSelecionada] = useState(null);

    const registros = db.registros || [];

    const registrosFiltrados = registros.filter(reg => {
        const matchStatus = filtroStatus === 'TODOS' || reg.status === filtroStatus;
        const matchTermo = (reg.id + reg.nome + reg.criadoPor + reg.oque).toLowerCase().includes(termoBusca.toLowerCase());
        return matchStatus && matchTermo;
    });

    const handleExcluir = async (id) => {
        const result = await Swal.fire({
            title: 'Excluir registro?',
            text: 'Esta ação não poderá ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const dbAtualizado = carregarBanco();
            dbAtualizado.registros = dbAtualizado.registros.filter(r => r.id !== id);
            salvarBanco(dbAtualizado);
            setDb(dbAtualizado);

            Swal.fire({
                icon: 'success',
                title: 'Excluído!',
                text: 'O registro foi removido com sucesso.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Consultar Matrizes 5W2H</h2>
                
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder=" Buscar por ID, nome ou autor..." 
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        style={{ padding: '0.5rem 1rem', width: '250px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                    />
                    <select 
                        value={filtroStatus} 
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', fontSize: '0.9rem' }}
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="Rascunho">Rascunho</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Pendente">Pendente / Reprovado</option>
                    </select>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Nome da Ação</th>
                            <th style={{ padding: '12px' }}>Autor</th>
                            <th style={{ padding: '12px' }}>Custo (Quanto)</th>
                            <th style={{ padding: '12px' }}>Progresso</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrosFiltrados.length > 0 ? (
                            registrosFiltrados.map(reg => (
                                <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{reg.id}</td>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{reg.nome}</td>
                                    <td style={{ padding: '12px', color: '#64748b' }}>{reg.criadoPor}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{reg.quanto}</td>
                                    <td style={{ padding: '12px' }}>{reg.percentual}%</td>
                                    <td style={{ padding: '12px' }}><span style={estiloBadgeStatus(reg.status)}>{reg.status}</span></td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => setMatrizSelecionada(reg)} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}>Ver</button>
                                        <button onClick={() => handleExcluir(reg.id)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>Excluir</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalhes da Matriz */}
            {matrizSelecionada && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <span onClick={() => setMatrizSelecionada(null)} style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' }}>&times;</span>
                        
                        <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Detalhes da Matriz: {matrizSelecionada.id}</h3>
                        
                        <p><strong>Nome:</strong> {matrizSelecionada.nome}</p>
                        <p><strong>O quê?:</strong> {matrizSelecionada.oque}</p>
                        <p><strong>Por quê?:</strong> {matrizSelecionada.porque}</p>
                        <p><strong>Onde?:</strong> {matrizSelecionada.onde}</p>
                        <p><strong>Quando?:</strong> {matrizSelecionada.quando}</p>
                        <p><strong>Como?:</strong> {matrizSelecionada.como}</p>
                        <p><strong>Quanto?:</strong> {matrizSelecionada.quanto}</p>
                        <p><strong>Impacto:</strong> {matrizSelecionada.impacto}</p>
                        <p><strong>Progresso:</strong> {matrizSelecionada.percentual}%</p>
                        <p><strong>Status atual:</strong> <span style={estiloBadgeStatus(matrizSelecionada.status)}>{matrizSelecionada.status}</span></p>
                        <p><strong>Parecer do Comitê:</strong> {matrizSelecionada.comentarioComite || '-'}</p>

                        <button onClick={() => setMatrizSelecionada(null)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem', width: '100%', fontWeight: 'bold' }}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function estiloBadgeStatus(status) {
    let bg = '#e2e8f0';
    let color = '#475569';
    if (status === 'Aprovado') { bg = '#dcfce7'; color = '#16a34a'; }
    else if (status === 'Enviado') { bg = '#e0f2fe'; color = '#0284c7'; }
    else if (status === 'Pendente') { bg = '#fee2e2'; color = '#dc2626'; }
    else if (status === 'Rascunho') { bg = '#fef9c3'; color = '#ca8a04'; }

    return {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: color
    };
}