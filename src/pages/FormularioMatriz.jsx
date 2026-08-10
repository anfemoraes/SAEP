// src/pages/FormularioMatriz.jsx
import React, { useState, useEffect } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import Swal from 'sweetalert2';

export function FormularioMatriz({ acoesSelecionadas, usuarioLogado, onVoltar, onSalvoSucesso }) {
    const [nome, setNome] = useState('');
    const [oque, setOque] = useState('');
    const [porque, setPorque] = useState('');
    const [como, setComo] = useState('');
    const [quando, setQuando] = useState('');
    const [onde, setOnde] = useState('');
    const [quanto, setQuanto] = useState('');
    const [impacto, setImpacto] = useState('medio');
    const [observacao, setObservacao] = useState('');
    const [percentual, setPercentual] = useState('0');

    // Ao carregar, se houver ações selecionadas, pega o percentual padrão ou define 0
    useEffect(() => {
        if (acoesSelecionadas && acoesSelecionadas.length > 0) {
            const primeiraAcao = acoesSelecionadas[0];
            if (primeiraAcao.percentualDefinido !== undefined) {
                setPercentual(primeiraAcao.percentualDefinido);
            }
        }
    }, [acoesSelecionadas]);

    // Máscara interativa para o campo "Quanto" (Moeda BRL)
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

        const db = carregarBanco();
        const novoRegistro = {
            id: gerarID(),
            dataCriacao: new Date().toLocaleString(),
            status: "Rascunho",
            comentarioComite: "-",
            criadoPor: usuarioLogado ? usuarioLogado.email : 'usuario@email.com',
            acoesEstrategicas: acoesSelecionadas.map(a => ({
                id: a.id,
                linhaPlanilha: a.linhaPlanilha,
                diretriz: a.diretriz
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
            percentual: parseFloat(percentual) || 0
        };

        db.registros.push(novoRegistro);
        salvarBanco(db);

        Swal.fire({
            icon: 'success',
            title: 'Rascunho salvo!',
            text: `Registro ${novoSavedId(novoRegistro.id)} salvo com sucesso. Você pode editá-lo ou enviá-lo depois.`,
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

        const db = carregarBanco();
        const novoRegistro = {
            id: gerarID(),
            dataCriacao: new Date().toLocaleString(),
            status: "Enviado",
            comentarioComite: "-",
            avaliadoPor: null,
            dataAvaliacao: null,
            criadoPor: usuarioLogado ? usuarioLogado.email : 'usuario@email.com',
            acoesEstrategicas: acoesSelecionadas.map(a => ({
                id: a.id,
                linhaPlanilha: a.linhaPlanilha,
                diretriz: a.diretriz
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
            percentual: parseFloat(percentual) || 0
        };

        db.registros.push(novoRegistro);
        salvarBanco(db);

        Swal.fire({
            icon: 'success',
            title: 'Enviado com sucesso!',
            text: 'O detalhamento foi encaminhado para a análise dos conselheiros.',
            timer: 2000,
            showConfirmButton: false
        });

        onSalvoSucesso();
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Detalhamento da Matriz 5W2H</h2>
                <button type="button" onClick={onVoltar} style={estiloBotaoVoltar}>Voltar para Ações</button>
            </div>

            {/* Visor das Ações Vinculadas */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>Diretrizes Estratégicas Vinculadas ({acoesSelecionadas.length}):</strong>
                {acoesSelecionadas.map(a => (
                    <div key={`${a.id}-${a.linhaPlanilha}`} style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px' }}>
                        ✓ <strong>{a.id}</strong> - {a.diretriz}
                    </div>
                ))}
            </div>

            <form onSubmit={handleEnviarComite} style={{ background: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1.2rem' }}>
                    <label style={estiloLabel}>Nome da Ação / Projeto *</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={estiloInput} placeholder="Ex: Modernização de Servidores" />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label style={estiloLabel}>O quê? (Descrição detalhada) *</label>
                    <textarea rows="3" value={oque} onChange={(e) => setOque(e.target.value)} required style={estiloInput} placeholder="O que será feito..."></textarea>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label style={estiloLabel}>Por quê? (Justificativa) *</label>
                    <textarea rows="3" value={porque} onChange={(e) => setPorque(e.target.value)} required style={estiloInput} placeholder="Por que essa ação é necessária..."></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div>
                        <label style={estiloLabel}>Onde? (Local de execução) *</label>
                        <input type="text" value={onde} onChange={(e) => setOnde(e.target.value)} required style={estiloInput} placeholder="Ex: Sede do Cetran/PA" />
                    </div>
                    <div>
                        <label style={estiloLabel}>Quando? (Prazo / Data limite) *</label>
                        <input type="date" value={quando} onChange={(e) => setQuando(e.target.value)} required style={estiloInput} />
                    </div>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label style={estiloLabel}>Como? (Metodologia / Passos) *</label>
                    <textarea rows="3" value={como} onChange={(e) => setComo(e.target.value)} required style={estiloInput} placeholder="Como será executado..."></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div>
                        <label style={estiloLabel}>Quanto? (Custo estimado R$) *</label>
                        <input type="text" value={quanto} onChange={handleQuantoChange} required style={estiloInput} placeholder="R$ 0,00" />
                    </div>
                    <div>
                        <label style={estiloLabel}>Progresso (%) *</label>
                        <input type="number" min="0" max="100" value={percentual} onChange={(e) => setPercentual(e.target.value)} required style={estiloInput} placeholder="0 a 100" />
                    </div>
                    <div>
                        <label style={estiloLabel}>Impacto *</label>
                        <select value={impacto} onChange={(e) => setImpacto(e.target.value)} style={estiloInput}>
                            <option value="baixo">Baixo</option>
                            <option value="medio">Médio</option>
                            <option value="alto">Alto</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={estiloLabel}>Observações adicionais</label>
                    <textarea rows="2" value={observacao} onChange={(e) => setObservacao(e.target.value)} style={estiloInput} placeholder="Notas extras se houver..."></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={handleSalvarRascunho} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Salvar Rascunho
                    </button>
                    <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Enviar para o Comitê
                    </button>
                </div>
            </form>
        </div>
    );
}

function novosavedId(id) {
    return id;
}

const estiloLabel = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px'
};

const estiloInput = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1e293b'
};

const estiloBotaoVoltar = {
    background: '#e2e8f0',
    border: 'none',
    color: '#475569',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer'
};