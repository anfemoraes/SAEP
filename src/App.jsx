// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { usuarioEmCache, revalidarSessao } from './services/auth';
import { acoesEstrategicas } from './services/acoes_data';
import { AcoesEstrategicas } from './pages/AcoesEstrategicas';
import { FormularioMatriz } from './pages/FormularioMatriz';
import { ConsultarMatrizes } from './pages/ConsultarMatrizes';
import { PainelComite } from './pages/PainelComite';
import {PainelAdmin} from './pages/PainelAdmin';
import bgIcon from './assets/favicon.png';
import { Footer } from './components/Footer';
import { PainelAndamento } from './pages/PainelAndamento';
import { PainelCetran2030 } from './pages/PainelCetran2030';

export default function App() {
    const TELAS = {
        HOME: 'home',
        ACOES: 'acoes',
        FORMULARIO: 'formulario',
        CONSULTAR: 'consultar',
        RASCUNHOS: 'rascunhos',
        ANDAMENTO: 'andamento',
        CETRAN2030: 'cetran2030',
        COMITE: 'comite',
        ADMIN: 'admin'
    };

        const [usuarioLogado, setUsuarioLogado] = useState(usuarioEmCache());
    const [telaAtual, setTelaAtual] = useState(TELAS.HOME);

    useEffect(() => {
        if (usuarioEmCache()) {
            revalidarSessao().then((usuario) => setUsuarioLogado(usuario));
        }
    }, []);
    const [acoesSelecionadas, setAcoesSelecionadas] = useState([]);
    const [modoFormulario, setModoFormulario] = useState('novo');
    const [matrizAtual, setMatrizAtual] = useState(null);
    const [paginaAnterior, setPaginaAnterior] = useState(TELAS.ACOES);

    const abrirFormularioNovo = (acoes) => {
        setAcoesSelecionadas(acoes);
        setModoFormulario('novo');
        setMatrizAtual(null);
        setPaginaAnterior(TELAS.ACOES);
        setTelaAtual(TELAS.FORMULARIO);
    };

    const abrirFormularioEdicao = (registro, origem) => {
        setAcoesSelecionadas(registro.acoesEstrategicas || []);
        setModoFormulario('editar');
        setMatrizAtual(registro);
        setPaginaAnterior(origem || TELAS.CONSULTAR);
        setTelaAtual(TELAS.FORMULARIO);
    };

    const voltarPaginaAnterior = () => setTelaAtual(paginaAnterior || TELAS.CONSULTAR);

    const handleSalvoSucesso = () => {
        setTelaAtual(paginaAnterior === TELAS.RASCUNHOS ? TELAS.RASCUNHOS : TELAS.CONSULTAR);
    };

    // Função para alternar entre as telas principais
    const renderizarTela = () => {
        switch (telaAtual) {
            case TELAS.HOME:
                return (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        {/* Imagem de background usada como selo/ícone de destaque */}
                        <img 
                            src={bgIcon} 
                            alt="Destaque SISCETRAN" 
                            style={{ 
                                width: '90px', 
                                height: '90px', 
                                borderRadius: '50%', 
                                objectFit: 'cover', 
                                border: '3px solid #2563eb', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                marginBottom: '1.5rem' 
                            }} 
                        />

                        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '1rem' }}>SISCETRAN</h1>
                        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                            Sistema de Ações Estratégicas do PETRANS. Gerencie matrizes, acompanhe o andamento de metas e envie análises para o comitê com total segurança.
                        </p>
                        {usuarioLogado ? (
                            <button 
                                onClick={() => setTelaAtual(TELAS.ACOES)}
                                style={{ background: '#2563eb', color: '#fff', padding: '0.8rem 1.5rem', fontSize: '1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Acessar Ações Estratégicas
                            </button>
                        ) : (
                            <p style={{ color: '#d97706', fontWeight: '500' }}>Faça login no topo para começar a utilizar o sistema.</p>
                        )}
                    </div>
                );
            case TELAS.ACOES:
                return (
                    <AcoesEstrategicas 
                        onSelecionarAcoes={(acoes) => abrirFormularioNovo(acoes)} 
                    />
                );
            case TELAS.FORMULARIO:
                return (
                    <FormularioMatriz 
                        modo={modoFormulario}
                        matrizId={matrizAtual?.id}
                        matrizExistente={matrizAtual}
                        acoesSelecionadas={acoesSelecionadas} 
                        usuarioLogado={usuarioLogado} 
                        onVoltar={voltarPaginaAnterior} 
                        onSalvoSucesso={handleSalvoSucesso} 
                    />
                );
            case TELAS.CONSULTAR:
                return <ConsultarMatrizes usuarioLogado={usuarioLogado} modo="todas" onNavigate={(tela) => setTelaAtual(tela)} onEditar={(registro) => abrirFormularioEdicao(registro, TELAS.CONSULTAR)} />;
            case TELAS.RASCUNHOS:
                return <ConsultarMatrizes usuarioLogado={usuarioLogado} modo="rascunhos" onNavigate={(tela) => setTelaAtual(tela)} onEditar={(registro) => abrirFormularioEdicao(registro, TELAS.RASCUNHOS)} />;
            case TELAS.COMITE:
                return <PainelComite usuarioLogado={usuarioLogado} />;
            case TELAS.ANDAMENTO:
                return <PainelAndamento />;
            case TELAS.CETRAN2030:
                return <PainelCetran2030 />;
            case TELAS.ADMIN:
                return <PainelAdmin usuarioLogado={usuarioLogado} />;
            default:
                return <div style={{ padding: '2rem' }}><h2>Página não encontrada</h2></div>;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent', fontFamily: 'sans-serif', margin: 0 }}>
            <Header 
                telaAtual={telaAtual}
                onNavigate={(novaTela) => setTelaAtual(novaTela)} 
                usuarioLogado={usuarioLogado} 
                setUsuarioLogado={setUsuarioLogado} 
                telas={TELAS}
            />

            <main style={{ flex: 1 }}>
                {renderizarTela()}
            </main>

            <Footer />
        </div>
    );
}