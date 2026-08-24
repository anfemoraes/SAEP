// src/pages/FormularioMatriz.jsx
import React, { useState, useEffect } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import { ChecklistEtapas } from '../components/ChecklistEtapas';
import { calcularPercentualEtapas } from '../services/progresso';
import Swal from 'sweetalert2';

export function FormularioMatriz({ modo = 'novo', matrizId, matrizExistente, acoesSelecionadas, usuarioLogado, onVoltar, onSalvoSucesso }) {
    const [nome, setNome] = useState('');
    const [oque, setOque] = useState('');
    const [porque, setPorque] = useState('');
    const [como, setComo] = useState('');
    const [quando, setQuando] = useState('');
    const [onde, setOnde] = useState('');
    const [quanto, setQuanto] = useState('');
    const [impacto, setImpacto] = useState('medio');
    const [observacao, setObservacao] = useState('');
    const [acoesComEtapas, setAcoesComEtapas] = useState([]);

    useEffect(() => {
        if (matrizExistente) {
            setNome(matrizExistente.nome || '');
            setOque(matrizExistente.oque || '');
            setPorque(matrizExistente.porque || '');
            setComo(matrizExistente.como || '');
            setQuando(matrizExistente.quando || '');
            setOnde(matrizExistente.onde || '');
            setQuanto(matrizExistente.quanto || '');
            setImpacto(matrizExistente.impacto || 'medio');
            setObservacao(matrizExistente.observacao || '');
            setAcoesComEtapas((matrizExistente.acoesEstrategicas || []).map(a => ({ ...a, etapas: a.etapas || [] })));
            return;
        }

        setAcoesComEtapas((acoesSelecionadas || []).map(a => ({ id: a.id, linhaPlanilha: a.linhaPlanilha, diretriz: a.diretriz, etapas: [] })));
    }, [acoesSelecionadas, matrizExistente]);

    const handleEtapasChange = (acaoId, novasEtapas) => {
        setAcoesComEtapas(prev => prev.map(a => a.id === acaoId ? { ...a, etapas: novasEtapas } : a));
    };

    const percentualGeral = acoesComEtapas.length > 0
        ? Math.round(acoesComEtapas.reduce((soma, a) => soma + calcularPercentualEtapas(a.etapas), 0) / acoesComEtapas.length)
        : 0;

    const handleQuantoChange = (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (!valor) {
            setQuanto('');
            return;
        }
        valor = (parseInt(valor, 10) / 100).toFixed(2);
        const formatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
        setQuanto(formatado);
    };

    const parseCurrencyInput = (valor) => {
        if (!valor) return 0;
        const textoLimpo = String(valor).replace(/\s/g, '').replace(/R\$|\./g, '').replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
        return parseFloat(textoLimpo) || 0;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const gerarID = () => {
        return 'MAT-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    };

    const validarFormulario = () => {
        return nome.trim() && oque.trim() && porque.trim() && como.trim() && quando && onde.trim() && quanto && impacto;
    };

    const statusAoSalvarRascunho = () => {
        if (matrizExistente?.status === 'Pendente') {
            return 'Pendente';
        }
        return 'Rascunho';
    };

    const criarRegistro = (status) => {
        return {
            id: matrizExistente?.id || gerarID(),
            dataCriacao: matrizExistente?.dataCriacao || new Date().toLocaleString(),
            status,
            comentarioComite: matrizExistente?.comentarioComite || '-',
            criadoPor: usuarioLogado?.email || matrizExistente?.criadoPor || 'usuario@email.com',
            acoesEstrategicas: acoesComEtapas.map(a => ({
                id: a.id,
                linhaPlanilha: a.linhaPlanilha,
                diretriz: a.diretriz,
                etapas: a.etapas || []
            })),
            nome,
            oque,
            porque,
            como,
            quando,
            onde,
            quanto: formatCurrency(parseCurrencyInput(quanto)),
            impacto,
            observacao,
            percentual: percentualGeral,
            avaliadoPor: matrizExistente?.avaliadoPor || null,
            dataAvaliacao: matrizExistente?.dataAvaliacao || null
        };
    };

    const salvarRegistro = (registro) => {
        const db = carregarBanco();
        if (matrizExistente) {
            db.registros = db.registros.map(r => r.id === registro.id ? registro : r);
        } else {
            db.registros.push(registro);
        }
        salvarBanco(db);
    };

    const handleSalvarRascunho = () => {
        if (!validarFormulario()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Por favor, preencha os campos principais do formulário antes de salvar o rascunho.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const registro = criarRegistro(statusAoSalvarRascunho());
        salvarRegistro(registro);

        Swal.fire({
            icon: 'success',
            title: 'Rascunho salvo!',
            text: `Registro ${registro.id} salvo com sucesso. Você pode editá-lo ou enviá-lo depois.`,
            timer: 2200,
            showConfirmButton: false
        });

        onSalvoSucesso();
    };

    const handleEnviarComite = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Por favor, preencha todos os campos obrigatórios.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Confirmar envio',
            text: 'Deseja enviar este detalhamento 5W2H para a avaliação oficial do comitê?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#e63946',
            confirmButtonText: 'Sim, enviar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        const registro = criarRegistro('Enviado');
        salvarRegistro(registro);

        Swal.fire({
            icon: 'success',
            title: 'Enviado com sucesso!',
            text: 'O detalhamento foi encaminhado para a análise dos conselheiros.',
            timer: 2000,
            showConfirmButton: false
        });

        onSalvoSucesso();
    };

    const isEdit = Boolean(matrizExistente);
    const titulo = isEdit ? 'Editar Matriz 5W2H' : 'Nova Matriz 5W2H';
    const statusAtual = matrizExistente?.status;
    const comentarioAtivo = statusAtual === 'Pendente' && matrizExistente?.comentarioComite && matrizExistente.comentarioComite !== '-';
    const acaoRelacionada = acoesSelecionadas && acoesSelecionadas.length > 0 ? acoesSelecionadas[0].diretriz || acoesSelecionadas[0].id : 'Nenhuma diretriz selecionada';

    return (
        <div className="formulario-container">
            <div className="formulario-header">
                <div>
                    <p className="formulario-eyebrow">Formulário 5W2H</p>
                    <h1 className="formulario-title">{titulo}</h1>
                    <p className="formulario-subtitle">{isEdit ? 'Atualize os campos da matriz e mantenha o mesmo registro durante o fluxo.' : 'Preencha as informações da nova matriz para envio ao Comitê.'}</p>
                </div>
                <button type="button" onClick={onVoltar} className="formulario-button-tertiary">Voltar</button>
            </div>

            <div className="formulario-summary-card">
                <div>
                    <p className="summary-label">Ação estratégica</p>
                    <p className="summary-value">{acaoRelacionada}</p>
                </div>
                <div>
                    <p className="summary-label">ID da matriz</p>
                    <p className="summary-value">{matrizExistente?.id || 'Será gerado ao salvar'}</p>
                </div>
                <div>
                    <p className="summary-label">Status atual</p>
                    <span className="summary-badge" style={estiloBadgeStatus(statusAtual || 'Rascunho')}>{statusAtual || 'Rascunho'}</span>
                </div>
                <div>
                    <p className="summary-label">Andamento geral</p>
                    <p className="summary-value" style={{ fontWeight: 700 }}>{percentualGeral}%</p>
                </div>
            </div>

            {comentarioAtivo && (
                <div className="formulario-alert-card">
                    <p className="alert-title">Solicitação de ajustes do Comitê</p>
                    <p className="alert-text">{matrizExistente.comentarioComite}</p>
                </div>
            )}

            <form onSubmit={handleEnviarComite} className="formulario-form">
                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">01</span>
                            <h2 className="section-title">Nome da ação</h2>
                        </div>
                        <p className="section-description">Título que identifica a matriz e o projeto.</p>
                    </div>
                    <div>
                        <label className="formulario-label" htmlFor="nome">Nome da Ação / Projeto <span className="required">*</span></label>
                        <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="formulario-input" placeholder="Ex: Modernização de Servidores" />
                    </div>
                </section>

                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">02</span>
                            <h2 className="section-title">O quê?</h2>
                        </div>
                        <p className="section-description">Descreva com clareza o que será feito.</p>
                    </div>
                    <label className="formulario-label" htmlFor="oque">O quê? (Descrição detalhada) <span className="required">*</span></label>
                    <textarea id="oque" rows="5" value={oque} onChange={(e) => setOque(e.target.value)} required className="formulario-textarea" placeholder="O que será feito..."></textarea>
                </section>

                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">03</span>
                            <h2 className="section-title">Por quê?</h2>
                        </div>
                        <p className="section-description">Explique a justificativa e objetivos da ação.</p>
                    </div>
                    <label className="formulario-label" htmlFor="porque">Por quê? (Justificativa) <span className="required">*</span></label>
                    <textarea id="porque" rows="5" value={porque} onChange={(e) => setPorque(e.target.value)} required className="formulario-textarea" placeholder="Por que essa ação é necessária..."></textarea>
                </section>

                <section className="formulario-section formulario-grid-2">
                    <div>
                        <div className="section-header section-header-small">
                            <span className="section-number">04</span>
                            <h2 className="section-title">Onde?</h2>
                        </div>
                        <label className="formulario-label" htmlFor="onde">Onde? (Local de execução) <span className="required">*</span></label>
                        <input id="onde" type="text" value={onde} onChange={(e) => setOnde(e.target.value)} required className="formulario-input" placeholder="Ex: Sede do Cetran/PA" />
                    </div>
                    <div>
                        <div className="section-header section-header-small">
                            <span className="section-number">05</span>
                            <h2 className="section-title">Quando?</h2>
                        </div>
                        <label className="formulario-label" htmlFor="quando">Quando? (Prazo / Data limite) <span className="required">*</span></label>
                        <input id="quando" type="date" value={quando} onChange={(e) => setQuando(e.target.value)} required className="formulario-input" />
                    </div>
                </section>

                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">06</span>
                            <h2 className="section-title">Como?</h2>
                        </div>
                        <p className="section-description">Detalhe a metodologia, passos e estratégia.</p>
                    </div>
                    <label className="formulario-label" htmlFor="como">Como? (Metodologia / Passos) <span className="required">*</span></label>
                    <textarea id="como" rows="5" value={como} onChange={(e) => setComo(e.target.value)} required className="formulario-textarea" placeholder="Como será executado..."></textarea>
                </section>

                <section className="formulario-section formulario-grid-2">
                    <div>
                        <div className="section-header section-header-small">
                            <span className="section-number">07</span>
                            <h2 className="section-title">Quanto?</h2>
                        </div>
                        <label className="formulario-label" htmlFor="quanto">Quanto? (Custo estimado R$) <span className="required">*</span></label>
                        <input id="quanto" type="text" value={quanto} onChange={handleQuantoChange} required className="formulario-input" placeholder="R$ 0,00" />
                    </div>
                    <div>
                        <label className="formulario-label" htmlFor="impacto">Impacto <span className="required">*</span></label>
                        <select id="impacto" value={impacto} onChange={(e) => setImpacto(e.target.value)} className="formulario-input" style={{ appearance: 'none' }}>
                            <option value="baixo">Baixo</option>
                            <option value="medio">Médio</option>
                            <option value="alto">Alto</option>
                        </select>
                    </div>
                </section>

                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">08</span>
                            <h2 className="section-title">Observações</h2>
                        </div>
                        <p className="section-description">Registre notas adicionais ou lembretes sobre a ação.</p>
                    </div>
                    <label className="formulario-label" htmlFor="observacao">Observações adicionais</label>
                    <textarea id="observacao" rows="4" value={observacao} onChange={(e) => setObservacao(e.target.value)} className="formulario-textarea" placeholder="Notas extras se houver..."></textarea>
                </section>

                <section className="formulario-section">
                    <div className="section-header">
                        <div>
                            <span className="section-number">09</span>
                            <h2 className="section-title">Etapas de execução</h2>
                        </div>
                        <p className="section-description">
                            {statusAtual === 'Aprovado'
                                ? 'Marque as etapas conforme forem concluídas. O percentual de andamento desta ação é calculado automaticamente.'
                                : 'Defina os passos necessários para concluir cada ação. Depois de aprovada pelo Comitê, essas etapas poderão ser marcadas como concluídas.'}
                        </p>
                    </div>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {acoesComEtapas.map(acao => (
                            <ChecklistEtapas
                                key={acao.id}
                                acaoId={acao.id}
                                acaoLabel={acao.diretriz}
                                etapas={acao.etapas}
                                onChange={(novasEtapas) => handleEtapasChange(acao.id, novasEtapas)}
                                editavelTitulos={statusAtual !== 'Aprovado'}
                                editavelConclusao={statusAtual === 'Aprovado'}
                            />
                        ))}
                    </div>
                </section>

                <div className="formulario-actions">
                    <button type="button" onClick={onVoltar} className="formulario-button-tertiary">Voltar</button>
                    <button type="button" onClick={handleSalvarRascunho} className="formulario-button-secondary">Salvar Rascunho</button>
                    <button type="submit" className="formulario-button-primary">Enviar para o Comitê</button>
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
