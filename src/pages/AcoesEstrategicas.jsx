// src/pages/AcoesEstrategicas.jsx
import React, { useState } from 'react';
import { acoesEstrategicas } from '../services/acoes_data';
import Swal from 'sweetalert2';

export function AcoesEstrategicas({ onSelecionarAcoes }) {
    const [termoBusca, setTermoBusca] = useState('');
    const [selecionadas, setSelecionadas] = useState([]);

    // Filtra as ações com segurança contra valores nulos
    const acoesFiltradas = acoesEstrategicas.filter(acao => {
        const id = acao.id || '';
        const diretriz = acao.diretriz || '';
        const setor = acao.setor || '';
        const prazo = acao.prazo || '';
        const textoCompleto = `${id} ${diretriz} ${setor} ${prazo}`.toLowerCase();
        return textoCompleto.includes(termoBusca.toLowerCase());
    });

    const handleCheckboxChange = (id, linhaPlanilha) => {
        // Usamos uma chave composta por ID e linhaPlanilha para evitar conflito se houver IDs duplicados
        const chaveUnica = `${id}-${linhaPlanilha}`;
        if (selecionadas.includes(chaveUnica)) {
            setSelecionadas(selecionadas.filter(item => item !== chaveUnica));
        } else {
            setSelecionadas([...selecionadas, chaveUnica]);
        }
    };

    const handleAvancarParaDetalhar = () => {
        if (selecionadas.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhuma ação selecionada',
                text: 'Por favor, selecione pelo menos uma ação estratégica.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const acoesObj = acoesEstrategicas.filter(a => selecionadas.includes(`${a.id}-${a.linhaPlanilha}`));
        onSelecionarAcoes(acoesObj);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Ações Estratégicas Disponíveis ({acoesEstrategicas.length})</h2>
                <input 
                    type="text" 
                    placeholder="🔍 Buscar por ID, diretriz ou setor..." 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    style={{ padding: '0.6rem 1rem', width: '300px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', background: '#fff' }}
                />
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>Sel.</th>
                            <th style={{ padding: '12px', width: '120px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Diretriz Estratégica</th>
                            <th style={{ padding: '12px', width: '140px' }}>Prazo</th>
                            <th style={{ padding: '12px', width: '180px' }}>Setor Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {acoesFiltradas.length > 0 ? (
                            acoesFiltradas.map(acao => {
                                const chaveUnica = `${acao.id}-${acao.linhaPlanilha}`;
                                const estaSelecionada = selecionadas.includes(chaveUnica);
                                return (
                                    <tr key={chaveUnica} style={{ borderBottom: '1px solid #f1f5f9', background: estaSelecionada ? '#f8fafc' : '#fff' }}>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={estaSelecionada}
                                                onChange={() => handleCheckboxChange(acao.id, acao.linhaPlanilha)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{acao.id}</td>
                                        <td style={{ padding: '12px', color: '#1e293b' }}>{acao.diretriz || 'Não especificada'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={estiloBadgePrazo(acao.prazo)}>{acao.prazo || 'Não definido'}</span>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: '500', color: '#475569' }}>{acao.setor || acao.responsavel || 'Não atribuído'}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    Nenhuma ação estratégica encontrada para a busca.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Botão Flutuante de Detalhar */}
            {selecionadas.length > 0 && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
                    <button 
                        onClick={handleAvancarParaDetalhar}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>Detalhar Selecionada(s) ({selecionadas.length})</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function estiloBadgePrazo(prazo) {
    if (!prazo) return { padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#475569' };
    
    let bg = '#e2e8f0';
    let color = '#475569';
    if (prazo.includes('Curto')) { bg = '#dcfce7'; color = '#16a34a'; }
    else if (prazo.includes('Médio')) { bg = '#fef9c3'; color = '#ca8a04'; }
    else if (prazo.includes('Longo')) { bg = '#fee2e2'; color = '#dc2626'; }

    return {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: color
    };
}