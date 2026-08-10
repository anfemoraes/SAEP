// src/App.jsx
import React, { useState } from 'react';
import { Header } from './components/Header';
import { carregarSessao } from './services/storage';
import { acoesEstrategicas } from './services/acoes_data';
import { AcoesEstrategicas } from './pages/AcoesEstrategicas';
import { FormularioMatriz } from './pages/FormularioMatriz';
import { ConsultarMatrizes } from './pages/ConsultarMatrizes';
import { PainelComite } from './pages/PainelComite';
import {PainelAdmin} from './pages/PainelAdmin';
import bgIcon from './assets/favicon.png';
import { Footer } from './components/Footer';

export default function App() {
    const [usuarioLogado, setUsuarioLogado] = useState(carregarSessao());
    const [telaAtual, setTelaAtual] = useState('home');
    const [acoesSelecionadas, setAcoesSelecionadas] = useState([]);

    // Função para alternar entre as telas principais
    const renderizarTela = () => {
        switch (telaAtual) {
            case 'home':
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
                                onClick={() => setTelaAtual('acoes')}
                                style={{ background: '#2563eb', color: '#fff', padding: '0.8rem 1.5rem', fontSize: '1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Acessar Ações Estratégicas
                            </button>
                        ) : (
                            <p style={{ color: '#d97706', fontWeight: '500' }}>Faça login no topo para começar a utilizar o sistema.</p>
                        )}
                    </div>
                );
            case 'acoes':
                return (
                    <AcoesEstrategicas 
                        onSelecionarAcoes={(acoes) => {
                            setAcoesSelecionadas(acoes);
                            setTelaAtual('formulario');
                        }} 
                    />
                );
            case 'formulario':
                return (
                    <FormularioMatriz 
                        acoesSelecionadas={acoesSelecionadas} 
                        usuarioLogado={usuarioLogado} 
                        onVoltar={() => setTelaAtual('acoes')} 
                        onSalvoSucesso={() => setTelaAtual('consultar')} 
                    />
                );
            case 'consultar':
                return <ConsultarMatrizes usuarioLogado={usuarioLogado} />;
            case 'rascunhos':
                return <ConsultarMatrizes usuarioLogado={usuarioLogado} />;
                return <div style={{ padding: '2rem' }}><h2>Andamento do Dashboard</h2><p>Aqui ficarão as métricas e gráficos consolidados.</p></div>;
            case 'comite':
                return <PainelComite usuarioLogado={usuarioLogado} />;
            case 'admin':
                return <PainelAdmin usuarioLogado={usuarioLogado} />;
            default:
                return <div style={{ padding: '2rem' }}><h2>Página não encontrada</h2></div>;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent', fontFamily: 'sans-serif', margin: 0 }}>
            <Header 
                onNavigate={(novaTela) => setTelaAtual(novaTela)} 
                usuarioLogado={usuarioLogado} 
                setUsuarioLogado={setUsuarioLogado} 
            />

            <main style={{ flex: 1 }}>
                {renderizarTela()}
            </main>

            <Footer />
        </div>
    );
}