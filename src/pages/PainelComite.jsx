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
                    status: parecer,
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
            title: 'Parecer emitido!',
            text: `A matriz ${matrizEmAvaliacao.id} foi marcada como ${parecer}.`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Comitê / Conselheiros</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Analise as matrizes enviadas e emita os pareceres oficiais institucionais.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Nome da Ação</th>
                            <th style={{ padding: '12px' }}>Criado Por</th>
                            <th style={{ padding: '12px' }}>Custo</th>
                            <th style={{ padding: '12px' }}>Progresso</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ação de Análise</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendentesComite.length > 0 ? (
                            pendentesComite.map(reg => (
                                <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{reg.id}</td>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{reg.nome}</td>
                                    <td style={{ padding: '12px', color: '#64748b' }}>{reg.criadoPor}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{reg.quanto}</td>
                                    <td style={{ padding: '12px' }}>{reg.percentual}%</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => setMatrizEmAvaliacao(reg)} 
                                            style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Avaliar Matriz
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    Nenhuma matriz pendente de análise no momento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Avaliação do Comitê */}
            {matrizEmAvaliacao && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <span onClick={() => setMatrizEmAvaliacao(null)} style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' }}>&times;</span>
                        
                        <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Avaliar Matriz: {matrizEmAvaliacao.id}</h3>
                        
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '0.88rem' }}>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Nome:</strong> {matrizEmAvaliacao.nome}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>O quê?:</strong> {matrizEmAvaliacao.oque}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Por quê?:</strong> {matrizEmAvaliacao.porque}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Onde / Quando:</strong> {matrizEmAvaliacao.onde} | {matrizEmAvaliacao.quando}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Como?:</strong> {matrizEmAvaliacao.como}</p>
                            <p style={{ margin: '0 0 6px 0' }}><strong>Custo:</strong> {matrizEmAvaliacao.quanto} | <strong>Impacto:</strong> {matrizEmAvaliacao.impacto}</p>
                        </div>

                        <form onSubmit={handleSalvarParecer}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Parecer do Comitê *</label>
                                <select 
                                    value={parecer} 
                                    onChange={(e) => setParecer(e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                                >
                                    <option value="Aprovado">Aprovado</option>
                                    <option value="Pendente">Pendente / Solicitar Ajustes</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Comentário / Justificativa *</label>
                                <textarea 
                                    rows="3" 
                                    value={comentario} 
                                    onChange={(e) => setComentario(e.target.value)} 
                                    required 
                                    placeholder="Digite as observações ou o motivo de ajustes..."
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setMatrizEmAvaliacao(null)} style={{ background: '#e2e8f0', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Salvar Parecer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}