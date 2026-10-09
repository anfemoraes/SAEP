// src/pages/FormularioMatriz.jsx
import React, { useState, useEffect } from 'react';
import { ChecklistEtapas } from '../components/ChecklistEtapas';
import { calcularPercentualEtapas, etapaTemTarefas } from '../services/progresso';
import { 
    buscarMatriz, 
    criarMatriz, 
    atualizarMatriz, 
    enviarParaComite as enviarMatrizParaComite,
    atualizarProgressoMatriz
} from '../services/matrizes';
import Swal from 'sweetalert2';

export function FormularioMatriz({ 
    modo = 'novo', 
    matrizId, 
    matrizExistente,
    acoesSelecionadas = [], 
    usuarioLogado: _usuarioLogado, 
    onVoltar, 
    onSalvoSucesso 
}) {
    const [loading, setLoading] = useState(false);
    const [carregandoDados, setCarregandoDados] = useState(false);
    const [nome, setNome] = useState('');
    const [acoesComEtapas, setAcoesComEtapas] = useState([]);
    const [statusAtual, setStatusAtual] = useState('RASCUNHO');
    const [comentarioComite, setComentarioComite] = useState('');
    const [dadosLegados, setDadosLegados] = useState(null);

    const preencherCampos = (data) => {
        setNome(data.nome || '');
        // Matrizes criadas antes do Radar 2030 tinham um único 5W2H por matriz.
        // Mantém esses dados visíveis (somente leitura) para consulta.
        const camposLegados = ['oque', 'porque', 'como', 'quando', 'onde', 'quanto', 'observacao'];
        setDadosLegados(camposLegados.some(c => data[c]) ? camposLegados.reduce((acc, c) => ({ ...acc, [c]: data[c] || '' }), {}) : null);
        setStatusAtual(data.status || 'RASCUNHO');
        setComentarioComite(data.comentarioComite || '');

        const acoesData = data.acoes || data.acoesEstrategicas || [];
        if (acoesData.length > 0) {
            setAcoesComEtapas(acoesData.map(a => ({
                acaoId: a.acaoId || a.id,
                acao: a.acao || a,
                etapas: a.etapas || []
            })));
        }
    };

    const carregarMatriz = async (id) => {
        setCarregandoDados(true);
        try {
            const data = await buscarMatriz(id);
            preencherCampos(data);
        } catch (error) {
            console.error('Erro ao carregar matriz:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao carregar',
                text: error.message || 'Não foi possível carregar os dados da matriz.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setCarregandoDados(false);
        }
    };

    useEffect(() => {
        if (modo === 'editar') {
            const id = matrizId || matrizExistente?.id;
            if (id) {
                carregarMatriz(id);
            } else if (matrizExistente) {
                preencherCampos(matrizExistente);
            }
        } else if (modo === 'novo' && acoesSelecionadas.length > 0) {
            setAcoesComEtapas(acoesSelecionadas.map(a => ({ 
                acaoId: a.id, 
                acao: a,
                etapas: a.etapas || [] 
            })));
        }
    }, [modo, matrizId, matrizExistente, acoesSelecionadas]);

    const handleEtapasChange = (acaoId, novasEtapas) => {
        setAcoesComEtapas(prev => prev.map(a => 
            a.acaoId === acaoId ? { ...a, etapas: novasEtapas } : a
        ));
    };

    const calcularPercentualGeral = () => {
        if (acoesComEtapas.length === 0) return 0;
        const soma = acoesComEtapas.reduce((acc, a) => acc + calcularPercentualEtapas(a.etapas), 0);
        return Math.round(soma / acoesComEtapas.length);
    };

    const percentualGeral = calcularPercentualGeral();

    const validarFormulario = () => Boolean(nome.trim());

    const CAMPOS_OBRIGATORIOS_TAREFA = ['titulo', 'porque', 'quem', 'onde', 'quando', 'como', 'quanto'];

    // Para envio ao Comitê Gestor: toda ação precisa de etapas, toda etapa de nome e
    // tarefas, e toda tarefa do 5W2H completo.
    const listarPendenciasDeEnvio = () => {
        const pendencias = [];
        acoesComEtapas.forEach(a => {
            const etapas = a.etapas || [];
            if (etapas.length === 0) {
                pendencias.push(`${a.acaoId}: nenhuma etapa definida`);
                return;
            }
            etapas.forEach((etapa, i) => {
                const rotuloEtapa = `${a.acaoId}, etapa ${i + 1}`;
                if (!etapa.titulo?.trim()) pendencias.push(`${rotuloEtapa}: falta o nome do passo`);
                if (!etapaTemTarefas(etapa)) {
                    pendencias.push(`${rotuloEtapa}: nenhuma tarefa definida`);
                    return;
                }
                etapa.tarefas.forEach((t, j) => {
                    if (CAMPOS_OBRIGATORIOS_TAREFA.some(c => !String(t[c] || '').trim())) {
                        pendencias.push(`${rotuloEtapa}, tarefa ${j + 1}: 5W2H incompleto`);
                    }
                });
            });
        });
        return pendencias;
    };

    const montarPayload = () => {
        return {
            nome: nome.trim(),
            percentual: percentualGeral,
            acoes: acoesComEtapas.map(a => ({
                acaoId: a.acaoId,
                etapas: a.etapas || []
            }))
        };
    };

    const salvarRascunho = async () => {
        if (!validarFormulario()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Informe o nome da matriz antes de salvar.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = montarPayload();
            const idAtual = matrizId || matrizExistente?.id;
            
            if (modo === 'editar' && idAtual) {
                await atualizarMatriz(idAtual, payload);
            } else {
                await criarMatriz(payload);
            }

            Swal.fire({
                icon: 'success',
                title: 'Rascunho salvo!',
                text: 'A matriz foi salva como rascunho com sucesso.',
                timer: 2000,
                showConfirmButton: false
            });

            if (onSalvoSucesso) onSalvoSucesso();
        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao salvar',
                text: error.message || 'Ocorreu um erro ao salvar o rascunho.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    const enviarParaComite = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Preencha todos os campos obrigatórios antes de enviar.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const pendencias = listarPendenciasDeEnvio();
        if (pendencias.length > 0) {
            const lista = pendencias.slice(0, 8).map(p => `<li>${p}</li>`).join('');
            const resto = pendencias.length > 8 ? `<p>e mais ${pendencias.length - 8} pendência(s).</p>` : '';
            await Swal.fire({
                icon: 'warning',
                title: 'Matriz incompleta',
                html: `<p>Complete o detalhamento antes de enviar:</p><ul style="text-align:left">${lista}</ul>${resto}`,
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Confirmar envio',
            text: 'Deseja enviar esta matriz ao Comitê Gestor? Após enviar, não será possível editar.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#e63946',
            confirmButtonText: 'Sim, enviar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const payload = montarPayload();
            const idAtual = matrizId || matrizExistente?.id;
            let targetId = idAtual;

            if (modo === 'editar' && idAtual) {
                await atualizarMatriz(idAtual, payload);
            } else {
                const response = await criarMatriz(payload);
                targetId = response.id;
            }

            await enviarMatrizParaComite(targetId);

            Swal.fire({
                icon: 'success',
                title: 'Enviado com sucesso!',
                text: 'A matriz foi encaminhada para análise do Comitê Gestor.',
                timer: 2000,
                showConfirmButton: false
            });

            if (onSalvoSucesso) onSalvoSucesso();
        } catch (error) {
            console.error('Erro ao enviar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao enviar',
                text: error.message || 'Ocorreu um erro ao enviar a matriz.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    const salvarProgressoAprovado = async () => {
        setLoading(true);
        try {
            const payload = {
                percentual: percentualGeral,
                acoes: acoesComEtapas.map(a => ({
                    acaoId: a.acaoId,
                    etapas: a.etapas || []
                }))
            };
            const idAtual = matrizId || matrizExistente?.id;
            await atualizarProgressoMatriz(idAtual, payload);

            Swal.fire({
                icon: 'success',
                title: 'Progresso atualizado!',
                text: `O andamento da matriz foi salvo com sucesso (${percentualGeral}%).`,
                timer: 2000,
                showConfirmButton: false
            });

            if (onSalvoSucesso) onSalvoSucesso();
        } catch (error) {
            console.error('Erro ao atualizar progresso:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao atualizar',
                text: error.message || 'Ocorreu um erro ao atualizar o progresso da matriz.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    const isEdit = modo === 'editar';
    const titulo = isEdit ? 'Editar Matriz 5W2H' : 'Nova Matriz 5W2H';
    const podeEditar = statusAtual === 'RASCUNHO' || statusAtual === 'PENDENTE';
    const podeEnviar = statusAtual === 'RASCUNHO' || statusAtual === 'PENDENTE';
    const podeSalvarProgresso = statusAtual === 'APROVADO';
    const comentarioAtivo = statusAtual === 'PENDENTE' && comentarioComite;

    if (carregandoDados) {
        return (
            <div className="formulario-container">
                <div className="loading-spinner">Carregando dados...</div>
            </div>
        );
    }

    return (
        <div className="formulario-container">
            <div className="formulario-header">
                <div>
                    <p className="formulario-eyebrow">Formulário 5W2H</p>
                    <h1 className="formulario-title">{titulo}</h1>
                    <p className="formulario-subtitle">
                        {isEdit ? 'Atualize as etapas e tarefas da matriz e mantenha o mesmo registro durante o fluxo.' : 'Defina as etapas da ação e, em cada etapa, as tarefas com o 5W2H. Depois, salve como rascunho ou envie ao Comitê Gestor.'}
                    </p>
                </div>
                <button type="button" onClick={onVoltar} className="formulario-button-tertiary">
                    Voltar
                </button>
            </div>

            <div className="formulario-summary-card">
                <div>
                    <p className="summary-label">Ações estratégicas</p>
                    <p className="summary-value">{acoesComEtapas.length} ação(ões) vinculada(s)</p>
                </div>
                <div>
                    <p className="summary-label">ID da matriz</p>
                    <p className="summary-value">{isEdit ? (matrizId || matrizExistente?.id) : 'Será gerado ao salvar'}</p>
                </div>
                <div>
                    <p className="summary-label">Status atual</p>
                    <span className="summary-badge" style={estiloBadgeStatus(statusAtual)}>
                        {statusAtual}
                    </span>
                </div>
                <div>
                    <p className="summary-label">Andamento geral</p>
                    <p className="summary-value" style={{ fontWeight: 700 }}>{percentualGeral}%</p>
                </div>
            </div>

            {comentarioAtivo && (
                <div className="formulario-alert-card">
                    <p className="alert-title">Solicitação de ajustes do Comitê Gestor</p>
                    <p className="alert-text">{comentarioComite}</p>
                </div>
            )}

            <form onSubmit={enviarParaComite} className="formulario-form">
                {dadosLegados && (
                    <details style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#475569' }}>
                            5W2H da matriz (formato anterior, somente leitura)
                        </summary>
                        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.6rem', fontSize: '0.88rem', color: '#0f172a' }}>
                            {[['O quê?', 'oque'], ['Por quê?', 'porque'], ['Onde?', 'onde'], ['Quando?', 'quando'], ['Como?', 'como'], ['Quanto?', 'quanto'], ['Observações', 'observacao']].map(([rotulo, chave]) => (
                                dadosLegados[chave] ? <p key={chave} style={{ margin: 0, whiteSpace: 'pre-line' }}><strong>{rotulo}</strong> {dadosLegados[chave]}</p> : null
                            ))}
                        </div>
                    </details>
                )}

                {/* Seção 01: Nome da Matriz vem PRIMEIRO */}
                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">01</span>
                            <h2 className="section-title">Nome da matriz</h2>
                        </div>
                        <p className="section-description">Título que identifica a matriz e o projeto.</p>
                    </div>
                    <div>
                        <label className="formulario-label" htmlFor="nome">
                            Nome da Matriz / Ação <span className="required">*</span>
                        </label>
                        <input 
                            id="nome" 
                            type="text" 
                            value={nome} 
                            onChange={(e) => setNome(e.target.value)} 
                            required 
                            className="formulario-input" 
                            placeholder="Ex: Modernização de Servidores"
                            disabled={!podeEditar}
                        />
                    </div>
                </section>

                {/* Seção 02: Etapas e Tarefas vem DEPOIS */}
                <section className="formulario-section">
                    <div className="section-header etapas-section-header">
                        <div>
                            <span className="section-number">02</span>
                            <h2 className="section-title">Etapas e tarefas</h2>
                        </div>
                        <p className="section-description">
                            {podeEditar
                                ? 'Cada ação é dividida em etapas (passos); cada etapa é formada por tarefas, e cada tarefa tem seu 5W2H.'
                                : statusAtual === 'APROVADO'
                                ? 'Marque as tarefas conforme forem concluídas. O percentual da etapa e da ação é calculado automaticamente.'
                                : 'Aguardando a avaliação do Comitê Gestor. Depois de aprovada, as tarefas poderão ser marcadas como concluídas.'}
                        </p>
                    </div>
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {acoesComEtapas.map(acao => (
                            <ChecklistEtapas
                                key={acao.acaoId}
                                acaoId={acao.acaoId}
                                etapas={acao.etapas}
                                onChange={(novasEtapas) => handleEtapasChange(acao.acaoId, novasEtapas)}
                                editavelTitulos={podeEditar}
                                editavelConclusao={statusAtual === 'APROVADO'}
                                disabled={!podeEditar && statusAtual !== 'APROVADO'}
                            />
                        ))}
                    </div>
                </section>

                <div className="formulario-actions">
                    <button 
                        type="button" 
                        onClick={onVoltar} 
                        className="formulario-button-tertiary"
                        disabled={loading}
                    >
                        Voltar
                    </button>
                    
                    {podeEditar && (
                        <>
                            <button 
                                type="button" 
                                onClick={salvarRascunho} 
                                className="formulario-button-secondary"
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar Rascunho'}
                            </button>
                            
                            {podeEnviar && (
                                <button 
                                    type="submit" 
                                    className="formulario-button-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Enviando...' : 'Enviar ao Comitê Gestor'}
                                </button>
                            )}
                        </>
                    )}
                    {podeSalvarProgresso && (
                        <button 
                            type="button" 
                            onClick={salvarProgressoAprovado} 
                            className="formulario-button-primary"
                            disabled={loading}
                            style={{ background: '#16a34a' }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Andamento'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

const estiloBadgeStatus = (status) => {
    const base = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.35rem 0.85rem',
        borderRadius: '999px',
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.01em'
    };

    const statusMap = {
        'APROVADO': { ...base, backgroundColor: '#dcfce7', color: '#166534' },
        'ENVIADO': { ...base, backgroundColor: '#e0f2fe', color: '#0369a1' },
        'PENDENTE': { ...base, backgroundColor: '#fee2e2', color: '#991b1b' },
        'RASCUNHO': { ...base, backgroundColor: '#fef9c3', color: '#a16207' },
    };

    return statusMap[status] || { ...base, backgroundColor: '#f1f5f9', color: '#475569' };
};