// src/pages/AcoesEstrategicas.jsx
import React, { useState } from 'react';
import { acoesEstrategicas } from '../services/acoes_data';
import Swal from 'sweetalert2';
import '../styles/acoesEstrategicas.css';

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
        const chaveUnica = `${id}-${linhaPlanilha}`;
        if (selecionadas.includes(chaveUnica)) {
            setSelecionadas(selecionadas.filter(item => item !== chaveUnica));
        } else {
            setSelecionadas([...selecionadas, chaveUnica]);
        }
    };

    // Computa as ações selecionadas de forma segura antes de usar
    const selectedActions = acoesEstrategicas.filter(a => selecionadas.includes(`${a.id}-${a.linhaPlanilha}`));
    const selectedCount = selectedActions.length;
    const selectedAction = selectedActions[0];

    const handleAvancarParaDetalhar = () => {
        if (selectedCount === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhuma ação selecionada',
                text: 'Por favor, selecione pelo menos uma ação estratégica.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        if (typeof onSelecionarAcoes === 'function') {
            onSelecionarAcoes(selectedActions);
        }
    };

    const handleLimparBusca = () => setTermoBusca('');

    return (
        <div className="acoes-estrategicas-page">
            <div className="acoes-estrategicas-header">
                <div>
                    <p className="page-eyebrow">Planejamento Estratégico</p>
                    <h1 className="page-title">Ações Estratégicas</h1>
                    <p className="page-subtitle">Selecione uma ação estratégica para iniciar o planejamento da matriz 5W2H.</p>
                </div>
                <div className="search-block">
                    <label htmlFor="busca-acao" className="sr-only">Buscar ações estratégicas</label>
                    <div className="search-input-group">
                        <span className="search-icon">🔎</span>
                        <input
                            id="busca-acao"
                            type="text"
                            placeholder="Buscar por ID, diretriz ou setor…"
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            className="search-input"
                        />
                        {termoBusca && (
                            <button type="button" onClick={handleLimparBusca} className="search-clear-button">
                                Limpar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="acoes-panel-grid">
                <div className="panel-card">
                    <div className="table-panel-header">
                        <div>
                            <p className="panel-label">Lista de ações</p>
                            <p className="panel-meta">Ações estratégicas disponíveis para planejamento.</p>
                        </div>
                        <div className="panel-meta">{acoesFiltradas.length} ações encontradas</div>
                    </div>

                    <div className="acoes-table-container">
                        <table className="acoes-table">
                            <thead>
                                <tr>
                                    <th className="check-cell">Sel.</th>
                                    <th className="id-cell">ID</th>
                                    <th>Diretriz Estratégica</th>
                                    <th>Prazo</th>
                                    <th>Setor Responsável</th>
                                </tr>
                            </thead>
                            <tbody>
                                {acoesFiltradas.length > 0 ? (
                                    acoesFiltradas.map(acao => {
                                        const chaveUnica = `${acao.id}-${acao.linhaPlanilha}`;
                                        const estaSelecionada = selecionadas.includes(chaveUnica);
                                        const prazoClasse = prazoClassName(acao.prazo);

                                        return (
                                            <tr key={chaveUnica} className={estaSelecionada ? 'selected-row' : ''} onClick={() => handleCheckboxChange(acao.id, acao.linhaPlanilha)} style={{ cursor: 'pointer' }}>
                                                <td className="check-cell" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={estaSelecionada}
                                                        onChange={() => handleCheckboxChange(acao.id, acao.linhaPlanilha)}
                                                        aria-label={`Selecionar ação ${acao.id}`}
                                                    />
                                                </td>
                                                <td className="id-cell">{acao.id}</td>
                                                <td className="diretriz-cell">{acao.diretriz || 'Não especificada'}</td>
                                                <td>
                                                    <span className={`prazo-badge ${prazoClasse}`}>{acao.prazo || 'Não definido'}</span>
                                                </td>
                                                <td>{acao.setor || acao.responsavel || 'Não atribuído'}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className="no-results-row">
                                        <td colSpan="5">
                                            <div className="no-results-card">
                                                <strong>Nenhuma ação encontrada</strong>
                                                <p>Verifique o termo da busca e tente novamente.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="detail-panel">
                    {selectedCount > 0 ? (
                        <div className="detail-card">
                            <div>
                                <p className="detail-eyebrow">{selectedCount === 1 ? 'Ação selecionada' : 'Ações selecionadas'}</p>
                                <h2 className="detail-title">
                                    {selectedCount === 1 ? (selectedAction?.diretriz || selectedAction?.id) : 'Seleção múltipla ativa'}
                                </h2>
                                <p className="detail-text">{selectedAction?.setor ? `Setor responsável: ${selectedAction.setor}` : 'Setor responsável não atribuído.'}</p>
                                <p className="detail-text"><strong>{selectedCount}</strong> ação{selectedCount > 1 ? 's selecionadas' : ' selecionada'}.</p>
                                <div className="selected-actions-list">
                                    {selectedActions.map(acao => (
                                        <div key={`${acao.id}-${acao.linhaPlanilha}`} className="selected-action-pill">
                                            <strong>{acao.id}</strong>: {acao.diretriz}
                                        </div>
                                    ))}
                                </div>
                                <div className="detail-note">
                                    Use o botão fixo abaixo para iniciar a matriz 5W2H com a seleção atual.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="detail-card blank-state">
                            <div>
                                <p className="detail-eyebrow">Sem seleção</p>
                                <h2 className="detail-title">Selecione uma ação estratégica</h2>
                                <p className="detail-text">Escolha uma ação da lista para iniciar o fluxo de planejamento da matriz 5W2H.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedCount > 0 && (
                <div className="floating-action-button-container">
                    <button className="floating-action-button" onClick={handleAvancarParaDetalhar}>
                        Criar matriz ({selectedCount})
                    </button>
                </div>
            )}
        </div>
    );
}

function prazoClassName(prazo) {
    if (!prazo) return '';
    if (prazo.includes('Curto')) return 'prazo-curto';
    if (prazo.includes('Médio')) return 'prazo-medio';
    if (prazo.includes('Longo')) return 'prazo-longo';
    return '';
}