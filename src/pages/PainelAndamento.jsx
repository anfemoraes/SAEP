// src/pages/PainelAndamento.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { listarMatrizes } from '../services/matrizes';
import { acoesEstrategicas } from '../services/acoes_data';
import { exportarMatrizesAprovadasCSV, exportarMatrizesAprovadasExcel } from '../services/exportService';
import { ApiError } from '../services/api';
import { ehAdmin } from '../services/permissoes';
import Swal from 'sweetalert2';

const STATUS_INFO = {
    RASCUNHO: { rotulo: 'Rascunhos salvos',                cor: '#fbbf24', corTexto: '#ca8a04' },
    ENVIADO:  { rotulo: 'Aguardando Análise (Enviados)',   cor: '#38bdf8', corTexto: '#0284c7' },
    APROVADO: { rotulo: 'Aprovados pelo Comitê',           cor: '#4ade80', corTexto: '#16a34a' },
    PENDENTE: { rotulo: 'Pendentes / Ajustes solicitados', cor: '#f87171', corTexto: '#dc2626' }
};

export function PainelAndamento({ usuarioLogado, onNavigate, telas }) {
    const [matrizes, setMatrizes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const carregarDados = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await listarMatrizes();
            setMatrizes(Array.isArray(dados) ? dados : []);
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Não foi possível carregar as matrizes.';
            Swal.fire({ icon: 'error', title: 'Erro ao carregar', text: msg, confirmButtonColor: '#2563eb' });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (usuarioLogado) {
            carregarDados();
        } else {
            setCarregando(false);
        }
    }, [carregarDados, usuarioLogado]);

    const totalAcoesBase = acoesEstrategicas.length;
    const totalRegistros = matrizes.length;

    const contagem = useMemo(() => {
        const base = { RASCUNHO: 0, ENVIADO: 0, APROVADO: 0, PENDENTE: 0 };
        matrizes.forEach(m => {
            if (base[m.status] !== undefined) base[m.status] += 1;
        });
        return base;
    }, [matrizes]);

    const somaProgresso = matrizes.reduce((acc, curr) => acc + (parseFloat(curr.percentual) || 0), 0);
    const progressoMedio = totalRegistros > 0 ? (somaProgresso / totalRegistros).toFixed(1) : '0.0';

    const dadosStatus = useMemo(() => (
        Object.entries(STATUS_INFO).map(([chave, info]) => ({
            chave,
            rotulo: info.rotulo,
            cor: info.cor,
            corTexto: info.corTexto,
            valor: contagem[chave] || 0
        }))
    ), [contagem]);

    const isAdmin = ehAdmin(usuarioLogado);

    const handleExportarCSV = () => {
        if (!isAdmin) return;

        const resultado = exportarMatrizesAprovadasCSV(matrizes);
        if (resultado.sucesso) {
            Swal.fire({
                icon: 'success',
                title: 'CSV gerado com sucesso!',
                text: `${resultado.quantidade} matriz(es) aprovada(s) exportada(s) para CSV.`,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({ icon: 'info', title: 'Nada para exportar', text: resultado.mensagem, confirmButtonColor: '#2563eb' });
        }
    };

    const handleExportarExcel = () => {
        if (!isAdmin) return;

        const resultado = exportarMatrizesAprovadasExcel(matrizes);
        if (resultado.sucesso) {
            Swal.fire({
                icon: 'success',
                title: 'Excel gerado com sucesso!',
                text: `${resultado.quantidade} matriz(es) aprovada(s) exportada(s) para .xlsx.`,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({ icon: 'info', title: 'Nada para exportar', text: resultado.mensagem, confirmButtonColor: '#2563eb' });
        }
    };

    if (!usuarioLogado) {
        return (
            <div className="painel-estado">
                <i className="bi bi-lock-fill painel-estado-icon" aria-hidden="true"></i>
                <h2 className="painel-estado-title">Acesso restrito</h2>
                <p className="painel-estado-text">
                    Faça login no topo da página para visualizar os indicadores e o andamento das matrizes.
                </p>
            </div>
        );
    }

    if (carregando) {
        return (
            <div className="painel-estado">
                <i className="bi bi-arrow-repeat painel-estado-icon" aria-hidden="true"></i>
                <p className="painel-estado-text">Carregando dados do painel...</p>
            </div>
        );
    }

    const semDados = totalRegistros === 0;

    const acoesRapidas = [
        { rotulo: 'Ações Estratégicas', tela: telas?.ACOES },
        { rotulo: 'Minhas Matrizes',    tela: telas?.CONSULTAR },
        { rotulo: 'Meus Rascunhos',     tela: telas?.RASCUNHOS },
        { rotulo: 'Painel CETRAN 2030', tela: telas?.CETRAN2030 }
    ].filter(a => a.tela);

    return (
        <div className="painel-container">
            <div className="painel-header">
                <div>
                    <p className="painel-eyebrow">Indicadores</p>
                    <h2 className="painel-title">Painel de Andamento</h2>
                    <p className="painel-subtitle">
                        Visão consolidada do progresso e monitoramento das matrizes 5W2H do PETRANS.
                    </p>
                </div>

                {isAdmin && (
                    <div className="painel-actions">
                        <button
                            type="button"
                            className="button button-info"
                            onClick={handleExportarCSV}
                            disabled={semDados}
                        >
                            <i className="bi bi-filetype-csv" aria-hidden="true"></i>
                            Exportar CSV
                        </button>

                        <button
                            type="button"
                            className="button button-success"
                            onClick={handleExportarExcel}
                            disabled={semDados}
                        >
                            <i className="bi bi-file-earmark-excel" aria-hidden="true"></i>
                            Exportar Excel
                        </button>
                    </div>
                )}
            </div>

            <div className="painel-metrics-grid">
                <div className="painel-metric">
                    <i className="bi bi-diagram-3 painel-metric-icon" aria-hidden="true"></i>
                    <span className="painel-metric-label">Ações Estratégicas Base</span>
                    <span className="painel-metric-value">{totalAcoesBase}</span>
                </div>

                <div className="painel-metric is-azul-escuro">
                    <i className="bi bi-clipboard-data painel-metric-icon" aria-hidden="true"></i>
                    <span className="painel-metric-label">Matrizes Criadas</span>
                    <span className="painel-metric-value">{totalRegistros}</span>
                </div>

                <div className="painel-metric is-verde">
                    <i className="bi bi-check2-circle painel-metric-icon" aria-hidden="true"></i>
                    <span className="painel-metric-label">Aprovadas pelo Comitê</span>
                    <span className="painel-metric-value">{contagem.APROVADO}</span>
                </div>

                <div className="painel-metric is-amarelo">
                    <i className="bi bi-graph-up-arrow painel-metric-icon" aria-hidden="true"></i>
                    <span className="painel-metric-label">Progresso Médio Geral</span>
                    <span className="painel-metric-value">{progressoMedio}%</span>
                </div>
            </div>

            <div className="painel-grid-2">
                <div className="painel-card">
                    <h3 className="painel-card-title">Status das Matrizes</h3>
                    <ul className="painel-status-list">
                        {dadosStatus.map(item => (
                            <li key={item.chave} className="painel-status-item">
                                <span className="painel-status-label">
                                    <span className="painel-status-dot" style={{ background: item.cor }} />
                                    {item.rotulo}
                                </span>
                                <span className="painel-status-value" style={{ color: item.corTexto }}>
                                    {item.valor}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="painel-card">
                    <h3 className="painel-card-title">Acesso Rápido</h3>
                    <div className="painel-quick-actions">
                        {acoesRapidas.map(acao => (
                            <button
                                key={acao.rotulo}
                                type="button"
                                className="button button-primary button-block"
                                onClick={() => onNavigate?.(acao.tela)}
                            >
                                {acao.rotulo}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="painel-card">
                <h3 className="painel-card-title">Transparência de Dados</h3>
                <p className="painel-text">
                    Os dados exibidos neste painel são carregados em tempo real da API do SISCETRAN.
                    As diretrizes seguem estritamente o planejamento estratégico do PETRANS / CETRAN-PA.
                </p>
            </div>
        </div>
    );
}