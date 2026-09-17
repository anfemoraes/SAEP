// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { usuarioEmCache, revalidarSessao } from './services/auth';
import { AcoesEstrategicas } from './pages/AcoesEstrategicas';
import { FormularioMatriz } from './pages/FormularioMatriz';
import { ConsultarMatrizes } from './pages/ConsultarMatrizes';
import { PainelComite } from './pages/PainelComite';
import { PainelAdmin } from './pages/PainelAdmin';
import { Footer } from './components/Footer';
import { PainelAndamento } from './pages/PainelAndamento';
import { PainelCetran2030 } from './pages/PainelCetran2030';

const TELAS = {
    HOME: 'home',
    ACOES: 'acoes',
    FORMULARIO: 'formulario',
    CONSULTAR: 'consultar',
    RASCUNHOS: 'rascunhos',
    CETRAN2030: 'cetran2030',
    COMITE: 'comite',
    ADMIN: 'admin'
};

export default function App() {
    const [usuarioLogado, setUsuarioLogado] = useState(usuarioEmCache());
    const [telaAtual, setTelaAtual] = useState(TELAS.HOME);

    // Ref para saber se o usuário estava deslogado no render anterior.
    // Assim só redirecionamos para o painel quando ocorrer uma transição null -> usuário.
    const estavaDeslogadoRef = useRef(!usuarioEmCache());

    useEffect(() => {
        if (usuarioEmCache()) {
            revalidarSessao().then((usuario) => setUsuarioLogado(usuario));
        }
    }, []);

    // Opção A: quando o usuário faz login (null -> usuário), cai direto no painel.
    useEffect(() => {
        if (usuarioLogado && estavaDeslogadoRef.current) {
            setTelaAtual(TELAS.HOME);
        }
        estavaDeslogadoRef.current = !usuarioLogado;
    }, [usuarioLogado]);

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
        const acoes = (registro.acoes || registro.acoesEstrategicas || []).map(a => a.acao || a);
        setAcoesSelecionadas(acoes);
        setModoFormulario('editar');
        setMatrizAtual(registro);
        setPaginaAnterior(origem || TELAS.CONSULTAR);
        setTelaAtual(TELAS.FORMULARIO);
    };

    const voltarPaginaAnterior = () => setTelaAtual(paginaAnterior || TELAS.CONSULTAR);

    const handleSalvoSucesso = () => {
        setTelaAtual(paginaAnterior === TELAS.RASCUNHOS ? TELAS.RASCUNHOS : TELAS.CONSULTAR);
    };

    const renderizarTela = () => {
        switch (telaAtual) {
            case TELAS.HOME:
                return (
                    <PainelAndamento
                        usuarioLogado={usuarioLogado}
                        onNavigate={(tela) => setTelaAtual(tela)}
                        telas={TELAS}
                    />
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