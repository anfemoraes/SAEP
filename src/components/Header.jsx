// src/components/Header.jsx
import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import Swal from 'sweetalert2';
import { login as apiLogin, logout as apiLogout } from '../services/auth';
import { ApiError } from '../services/api';


export function Header({ telas = {}, telaAtual, onNavigate, usuarioLogado, setUsuarioLogado }) {
    const [modalLoginAberto, setModalLoginAberto] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);
    const [email, setEmail] = useState('');
    const [senha, Senha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const {
        HOME = 'home',
        ACOES = 'acoes',
        CONSULTAR = 'consultar',
        RASCUNHOS = 'rascunhos',
        ANDAMENTO = 'andamento',
        CETRAN2030 = 'cetran2030',
        COMITE = 'comite',
        ADMIN = 'admin'
    } = telas;

    const estaLogado = Boolean(usuarioLogado);
    const ehComiteOuAdmin = Boolean(usuarioLogado && ['COMITE', 'ADMIN_SETOR', 'ADMIN_GERAL'].includes(usuarioLogado.role));
    const ehAdmin = Boolean(usuarioLogado && ['ADMIN_SETOR', 'ADMIN_GERAL'].includes(usuarioLogado.role));

        const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const usuarioEncontrado = await apiLogin(email.trim().toLowerCase(), senha);
            setUsuarioLogado(usuarioEncontrado);
            setModalLoginAberto(false);
            setEmail('');
            Senha('');
            Swal.fire({
                icon: 'success',
                title: 'Login realizado!',
                text: `Bem-vindo, ${usuarioEncontrado.email}`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível fazer login. Tente novamente.';
            Swal.fire({
                icon: 'error',
                title: 'Erro no login',
                text: mensagem,
                confirmButtonColor: '#2563eb'
            });
        }
    };
    const handleLogoutClick = async () => {
        const result = await Swal.fire({
            title: 'Sair da sessão?',
            text: 'Você tem certeza que deseja fazer logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, sair',
            cancelButtonText: 'Cancelar'
        });

            if (result.isConfirmed) {
            apiLogout();
            setUsuarioLogado(null);
            handleNavigate(HOME);
            Swal.fire({
                icon: 'success',
                title: 'Logout realizado!',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    return (
        <header className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
            <div className="header-brand" onClick={() => handleNavigate(HOME)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={logoImg} alt="Logo SISCETRAN" style={{ height: '35px', objectFit: 'contain' }} />
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b' }}>
                    SISCETRAN <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>PETRANS</span>
                </span>
            </div>

            {/* Menu Desktop */}
            <nav className="header-nav" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {estaLogado && (
                    <>
                        <button className="button" onClick={() => handleNavigate(ACOES)} style={estiloBotaoNav(telaAtual === ACOES)}>Ações Estratégicas</button>
                        <button className="button" onClick={() => handleNavigate(CONSULTAR)} style={estiloBotaoNav(telaAtual === CONSULTAR)}>Minhas Matrizes</button>
                        <button className="button" onClick={() => handleNavigate(RASCUNHOS)} style={estiloBotaoNav(telaAtual === RASCUNHOS)}>Meus Rascunhos</button>
                        <button className="button" onClick={() => handleNavigate(ANDAMENTO)} style={estiloBotaoNav(telaAtual === ANDAMENTO)}>Andamento</button>
                        <button className="button" onClick={() => handleNavigate(CETRAN2030)} style={estiloBotaoNav(telaAtual === CETRAN2030)}>Painel CETRAN 2030</button>
                    </>
                )}
                {ehComiteOuAdmin && (
                    <button className="button" onClick={() => handleNavigate(COMITE)} style={{ ...estiloBotaoNav(telaAtual === COMITE), background: '#d97706', color: '#fff' }}>Comitê</button>
                )}
                {ehAdmin && (
                    <button className="button" onClick={() => handleNavigate(ADMIN)} style={{ ...estiloBotaoNav(telaAtual === ADMIN), background: '#7c3aed', color: '#fff' }}>Administração</button>
                )}

                <button 
                    className={`button ${estaLogado ? 'is-logged-in' : ''}`} 
                    onClick={() => estaLogado ? handleLogoutClick() : setModalLoginAberto(true)}
                    style={{ background: estaLogado ? '#e63946' : '#2563eb', color: '#fff', padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                    {estaLogado ? 'Logout' : 'Login'}
                </button>
            </nav>

            {/* Botão Mobile Toggle (caso queira controlar via CSS ou estado) */}
            <button className="header-mobile-toggle" onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu" type="button" style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                ☰
            </button>

            {/* Modal de Login com Olho de Visualizar Senha */}
            {modalLoginAberto && (
                <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <span className="close" onClick={() => setModalLoginAberto(false)} style={{ position: 'absolute', top: '10px', right: '15px', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</span>
                        <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>Login do Conselheiro</h2>
                        <form onSubmit={handleLoginSubmit}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Usuário:</label>
                            <input 
                                type="text" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                            
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Senha:</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                <input 
                                    type={mostrarSenha ? "text" : "password"} 
                                    value={senha} 
                                    onChange={(e) => Senha(e.target.value)} 
                                    required 
                                    style={{ width: '100%', padding: '0.6rem', paddingRight: '40px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                                <i 
                                    className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`} 
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem' }}
                                ></i>
                            </div>
                            
                            <button type="submit" className="button" style={{ width: '100%', background: '#2563eb', color: '#fff', padding: '0.7rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Entrar</button>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
}

const estiloBotaoNav = (ativo) => ({
    background: ativo ? '#2563eb' : 'transparent',
    border: 'none',
    color: ativo ? '#fff' : '#475569',
    cursor: 'pointer',
    fontWeight: '500',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    boxShadow: ativo ? '0 2px 10px rgba(37, 99, 235, 0.18)' : 'none',
    textAlign: 'center',
    width: 'auto' // Removido o 100% que quebrava o layout horizontal do desktop
});