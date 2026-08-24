// src/services/progresso.js
// Calcula o percentual de andamento de cada Ação a partir do checklist de etapas
// definido no formulário, e agrega esse percentual por Objetivo (OG), Eixo (LAE)
// e Setor responsável — alimentando o Painel CETRAN 2030.

import { carregarBanco } from './storage';
import { acoesEstrategicas } from './acoes_data';

/**
 * Percentual de conclusão de uma lista de etapas.
 * Sem etapas definidas ainda = 0%, não "indefinido", para não quebrar médias.
 */
export function calcularPercentualEtapas(etapas) {
    if (!etapas || etapas.length === 0) return 0;
    const concluidas = etapas.filter(e => e.concluida).length;
    return Math.round((concluidas / etapas.length) * 100);
}

/**
 * Divide um campo "setor" tipo "CTSIST, Secretaria-Executiva" em uma lista limpa.
 * Ações sem setor definido caem em "Não classificado" para não sumirem da agregação.
 */
export function listarSetoresDaAcao(setorTexto) {
    if (!setorTexto || !setorTexto.trim()) return ['Não classificado'];
    return setorTexto.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Varre todos os registros (Matrizes) com status "Aprovado" e monta um mapa
 * { acaoId: percentual } com o andamento oficial de cada Ação estratégica.
 * Só Matrizes aprovadas contam — antes disso o checklist só está sendo planejado.
 * Se a mesma Ação aparecer em mais de uma Matriz aprovada, usa a mais recente.
 */
export function obterPercentuaisPorAcao() {
    const db = carregarBanco();
    const registros = db?.registros || [];
    const aprovados = registros
        .filter(r => r.status === 'Aprovado')
        .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

    const percentualPorAcao = {};
    aprovados.forEach(registro => {
        (registro.acoesEstrategicas || []).forEach(acaoNaMatriz => {
            percentualPorAcao[acaoNaMatriz.id] = calcularPercentualEtapas(acaoNaMatriz.etapas);
        });
    });
    return percentualPorAcao;
}

const media = (valores) => {
    if (!valores.length) return 0;
    return Math.round(valores.reduce((soma, v) => soma + v, 0) / valores.length);
};

/**
 * Agrega o percentual por Objetivo (og), Projeto e Setor.
 * Ações que ainda não têm Matriz aprovada entram com 0% — assim o painel mostra
 * o andamento real do plano todo, não só do que já foi medido.
 * Agregação sempre por média simples entre os itens do grupo (não ponderada).
 */
export function agregarProgresso() {
    const percentualPorAcao = obterPercentuaisPorAcao();

    const porObjetivo = {};
    const porProjeto = {};
    const porSetor = {};
    const nomeDoProjeto = {};

    acoesEstrategicas.forEach(acao => {
        const percentual = percentualPorAcao[acao.id] ?? 0;

        if (acao.og) {
            (porObjetivo[acao.og] ||= []).push(percentual);
        }
        if (acao.projetoCodigo) {
            (porProjeto[acao.projetoCodigo] ||= []).push(percentual);
            if (!nomeDoProjeto[acao.projetoCodigo]) {
                nomeDoProjeto[acao.projetoCodigo] = acao.projetoNome || acao.projetoCodigo;
            }
        }
        listarSetoresDaAcao(acao.setor).forEach(setor => {
            (porSetor[setor] ||= []).push(percentual);
        });
    });

    const paraLista = (mapa, rotulos) =>
        Object.entries(mapa)
            .map(([chave, valores]) => ({
                chave,
                rotulo: rotulos ? `${chave}: ${rotulos[chave]}` : chave,
                percentual: media(valores),
                totalAcoes: valores.length
            }))
            .sort((a, b) => a.chave.localeCompare(b.chave, 'pt-BR', { numeric: true }));

    return {
        objetivos: paraLista(porObjetivo),
        projetos: paraLista(porProjeto, nomeDoProjeto),
        setores: paraLista(porSetor)
    };
}

/** Extrai um rótulo curto de exibição a partir do texto completo do OG/LAE/Projeto. */
export function rotuloCurto(textoCompleto) {
    if (!textoCompleto) return '';
    const [codigo] = textoCompleto.split(':');
    return codigo.trim();
}
