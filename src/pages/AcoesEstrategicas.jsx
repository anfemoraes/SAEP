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
        const lae = acao.lae || '';
        const og = acao.og || '';
        const textoCompleto = `${id} ${diretriz} ${setor} ${prazo} ${lae} ${og}`.toLowerCase();
        return textoCompleto.includes(termoBusca.toLowerCase());
    });

    const handleCheckboxChange = (id, linhaPlanilha) => {
        const chaveUnica = `${id}-${linhaPlanilha}`;
        if (selecionadas.includes(chaveUnica)) {
            setSelecionadas(selecionadas.filter(item => item !== chaveUnica));
        } else {
            setSelecionadas([...selecionadas, chaveUnica]);
        }
    };

    // 🆕 Selecionar/Deselecionar todos
    const handleSelecionarTodos = () => {
        if (selecionadas.length === acoesFiltradas.length) {
            // Se todos estão selecionados, desmarca todos
            setSelecionadas([]);
        } else {
            // Seleciona todos os filtrados
            const todasChaves = acoesFiltradas.map(a => `${a.id}-${a.linhaPlanilha}`);
            setSelecionadas(todasChaves);
        }
    };

    // 🆕 Limpar seleção
    const handleLimparSelecao = () => {
        setSelecionadas([]);
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

    // Verifica se todos os filtrados estão selecionados
    const todosSelecionados = acoesFiltradas.length > 0 && 
        acoesFiltradas.every(a => selecionadas.includes(`${a.id}-${a.linhaPlanilha}`));

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', paddingBottom: '5rem' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1.5rem', 
                flexWrap: 'wrap', 
                gap: '1rem' 
            }}>
                <div>
                    <h2 style={{ color: '#1e293b', margin: 0 }}>
                        Ações Estratégicas Disponíveis ({acoesEstrategicas.length})
                    </h2>
                    {selecionadas.length > 0 && (
                        <p style={{ color: '#2563eb', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                            ✅ {selecionadas.length} ação(ões) selecionada(s)
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder=" Buscar por ID, diretriz ou setor..." 
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        style={{ 
                            padding: '0.6rem 1rem', 
                            width: '280px', 
                            border: '1px solid #cbd5e1', 
                            borderRadius: '6px', 
                            fontSize: '0.9rem', 
                            background: '#fff' 
                        }}
                    />
                    {selecionadas.length > 0 && (
                        <button 
                            onClick={handleLimparSelecao}
                            style={{ 
                                background: '#e2e8f0', 
                                border: 'none', 
                                padding: '0.6rem 1rem', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontWeight: '500',
                                color: '#475569'
                            }}
                        >
                            ✕ Limpar
                        </button>
                    )}
                </div>
            </div>

            <div style={{ 
                background: '#fff', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                overflowX: 'auto', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={todosSelecionados}
                                    onChange={handleSelecionarTodos}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    title={todosSelecionados ? "Desmarcar todos" : "Selecionar todos"}
                                />
                            </th>
                            <th style={{ padding: '12px', width: '120px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Diretriz Estratégica</th>
                            <th style={{ padding: '12px', width: '100px' }}>LAE</th>
                            <th style={{ padding: '12px', width: '100px' }}>OG</th>
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
                                    <tr 
                                        key={chaveUnica} 
                                        style={{ 
                                            borderBottom: '1px solid #f1f5f9', 
                                            background: estaSelecionada ? '#eff6ff' : '#fff',
                                            transition: 'background 0.15s ease'
                                        }}
                                    >
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
                                        <td style={{ padding: '12px', color: '#64748b' }}>{acao.lae || '-'}</td>
                                        <td style={{ padding: '12px', color: '#64748b' }}>{acao.og || '-'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={estiloBadgePrazo(acao.prazo)}>{acao.prazo || 'Não definido'}</span>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: '500', color: '#475569' }}>{acao.setor || acao.responsavel || 'Não atribuído'}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    {termoBusca ? (
                                        <>
                                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}> Nenhuma ação encontrada</p>
                                            <p style={{ fontSize: '0.9rem' }}>Tente ajustar os termos da busca ou limpar o filtro.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}> Nenhuma ação estratégica cadastrada</p>
                                            <p style={{ fontSize: '0.9rem' }}>Entre em contato com o administrador do sistema.</p>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Botão Flutuante de Detalhar */}
            {selecionadas.length > 0 && (
                <div style={{ 
                    position: 'fixed', 
                    bottom: '2rem', 
                    right: '2rem', 
                    zIndex: 100,
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                }}>
                    <button 
                        onClick={handleAvancarParaDetalhar}
                        style={{ 
                            background: '#2563eb', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '0.8rem 1.5rem', 
                            borderRadius: '30px', 
                            fontWeight: 'bold', 
                            fontSize: '0.95rem', 
                            cursor: 'pointer', 
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            ':hover': {
                                transform: 'scale(1.02)',
                                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)'
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.02)';
                            e.target.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                        }}
                    >
                        <span>🚀 Detalhar Selecionada(s)</span>
                        <span style={{ 
                            background: 'rgba(255,255,255,0.25)', 
                            borderRadius: '50%', 
                            padding: '2px 8px',
                            fontSize: '0.8rem'
                        }}>
                            {selecionadas.length}
                        </span>
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
    if (prazo.toLowerCase().includes('curto')) { bg = '#dcfce7'; color = '#16a34a'; }
    else if (prazo.toLowerCase().includes('médio')) { bg = '#fef9c3'; color = '#ca8a04'; }
    else if (prazo.toLowerCase().includes('longo')) { bg = '#fee2e2'; color = '#dc2626'; }

    return {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: color
    };
}