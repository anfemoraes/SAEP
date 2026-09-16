// src/pages/PainelCetran2030.jsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';
import { agregarProgresso, rotuloCurto } from '../services/progresso';
import { listarMatrizes } from '../services/matrizes';
import { ApiError } from '../services/api';
import Swal from 'sweetalert2';

ChartJS.register(RadialLinearScale, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend);

const corDoProgresso = (percentual) => {
    if (percentual >= 70) return '#16a34a';
    if (percentual >= 40) return '#d97706';
    return '#dc2626';
};

// Plugin do Chart.js que desenha o percentual no centro da rosquinha (gauge).
const textoCentralPlugin = {
    id: 'textoCentral',
    afterDraw(chart) {
        const config = chart.options?.plugins?.textoCentral;
        if (!config) return;
        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 1.7rem Inter, sans-serif';
        ctx.fillStyle = config.color || '#0f172a';
        ctx.fillText(`${config.label}%`, centerX, centerY);
        ctx.restore();
    }
};
ChartJS.register(textoCentralPlugin);

function Gauge({ percentual, altura = 190 }) {
    const cor = corDoProgresso(percentual);
    const data = {
        datasets: [{
            data: [percentual, 100 - percentual],
            backgroundColor: [cor, '#e2e8f0'],
            borderWidth: 0
        }]
    };
    const options = {
        cutout: '76%',
        rotation: -90,
        circumference: 360,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            textoCentral: { label: percentual, color: cor }
        }
    };
    return (
        <div style={{ height: altura, position: 'relative' }}>
            <Doughnut data={data} options={options} />
        </div>
    );
}

function CartaoGraficoBase({ eyebrow, titulo, seletor, children, rodape }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{eyebrow}</p>
                <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{titulo}</h3>
            </div>
            {seletor}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
            {rodape}
        </div>
    );
}

const estiloSelect = {
    width: '100%',
    padding: '0.55rem 0.7rem',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.88rem',
    color: '#0f172a',
    background: '#fff'
};

export function PainelCetran2030() {
    const [matrizes, setMatrizes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [projetoSelecionadoA, setProjetoSelecionadoA] = useState(0);
    const [projetoSelecionadoB, setProjetoSelecionadoB] = useState(1);
    const [setorSelecionado, setSetorSelecionado] = useState(0);

    const carregarDados = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await listarMatrizes();
            setMatrizes(Array.isArray(dados) ? dados : []);
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Não foi possível carregar os dados.';
            Swal.fire({ icon: 'error', title: 'Erro ao carregar', text: msg, confirmButtonColor: '#2563eb' });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const { objetivos, projetos, setores } = useMemo(() => agregarProgresso(matrizes), [matrizes]);

    const dadosRadar = {
        labels: objetivos.map(o => rotuloCurto(o.chave)),
        datasets: [{
            label: 'Andamento por Objetivo',
            data: objetivos.map(o => o.percentual),
            backgroundColor: 'rgba(37, 99, 235, 0.18)',
            borderColor: '#2563eb',
            borderWidth: 2,
            pointBackgroundColor: '#2563eb',
            pointRadius: 3
        }]
    };

    const opcoesRadar = {
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0,
                max: 100,
                ticks: { stepSize: 25, backdropColor: 'transparent', color: '#94a3b8', font: { size: 10 } },
                grid: { color: '#e2e8f0' },
                angleLines: { color: '#e2e8f0' },
                pointLabels: { color: '#475569', font: { size: 10 } }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => objetivos[items[0].dataIndex]?.chave || '',
                    label: (item) => `${item.parsed.r}% de andamento médio`
                }
            }
        }
    };

    const eixoAtualA = projetos[projetoSelecionadoA];
    const eixoAtualB = projetos[Math.min(projetoSelecionadoB, projetos.length - 1)];
    const setorAtual = setores[setorSelecionado];

    if (carregando) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <p>Carregando dados do painel...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1180px', margin: '0 auto' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.13em', textTransform: 'uppercase' }}>Painel de andamento</p>
            <h1 style={{ margin: '0.5rem 0 0.5rem 0', fontSize: 'clamp(1.8rem, 2.2vw, 2.3rem)', color: '#0f172a' }}>Painel CETRAN 2030</h1>
            <p style={{ margin: '0 0 2rem 0', color: '#64748b', maxWidth: '720px', lineHeight: 1.7 }}>
                Andamento das ações estratégicas do PETRANS, calculado automaticamente a partir das etapas concluídas em cada Matriz já aprovada pelo Comitê.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <CartaoGraficoBase
                    eyebrow={`${objetivos.length} objetivos`}
                    titulo="Objetivos gerais (OG)"
                    rodape={<p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Cada eixo do radar é um Objetivo Geral; passe o mouse para ver o nome completo.</p>}
                >
                    <div style={{ height: '260px', width: '100%' }}>
                        <Radar data={dadosRadar} options={opcoesRadar} />
                    </div>
                </CartaoGraficoBase>

                <CartaoGraficoBase
                    eyebrow="Projeto"
                    titulo={eixoAtualA ? eixoAtualA.rotulo : '—'}
                    seletor={
                        <select style={estiloSelect} value={projetoSelecionadoA} onChange={(e) => setProjetoSelecionadoA(Number(e.target.value))}>
                            {projetos.map((projeto, i) => (
                                <option key={projeto.chave} value={i}>{projeto.rotulo}</option>
                            ))}
                        </select>
                    }
                    rodape={<p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{eixoAtualA?.totalAcoes || 0} ações vinculadas a este projeto.</p>}
                >
                    <Gauge percentual={eixoAtualA?.percentual || 0} />
                </CartaoGraficoBase>

                <CartaoGraficoBase
                    eyebrow="Projeto"
                    titulo={eixoAtualB ? eixoAtualB.rotulo : '—'}
                    seletor={
                        <select style={estiloSelect} value={Math.min(projetoSelecionadoB, projetos.length - 1)} onChange={(e) => setProjetoSelecionadoB(Number(e.target.value))}>
                            {projetos.map((projeto, i) => (
                                <option key={projeto.chave} value={i}>{projeto.rotulo}</option>
                            ))}
                        </select>
                    }
                    rodape={<p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{eixoAtualB?.totalAcoes || 0} ações vinculadas a este projeto.</p>}
                >
                    <Gauge percentual={eixoAtualB?.percentual || 0} />
                </CartaoGraficoBase>

                <CartaoGraficoBase
                    eyebrow="Setor responsável"
                    titulo={setorAtual?.chave || '—'}
                    seletor={
                        <select style={estiloSelect} value={setorSelecionado} onChange={(e) => setSetorSelecionado(Number(e.target.value))}>
                            {setores.map((setor, i) => (
                                <option key={setor.chave} value={i}>{setor.chave}</option>
                            ))}
                        </select>
                    }
                    rodape={<p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{setorAtual?.totalAcoes || 0} ações sob responsabilidade deste setor.</p>}
                >
                    <Gauge percentual={setorAtual?.percentual || 0} />
                </CartaoGraficoBase>
            </div>
        </div>
    );
}
