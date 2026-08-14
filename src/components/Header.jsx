// src/components/Header.jsx
import React, { useState } from 'react';
import * as authService from '../services/auth';
import { ApiError } from '../services/api';
import { ehComiteOuAdminGeral, ehAdmin, labelRole } from '../services/permissoes';
import logoImg from '../assets/logo.png';
import Swal from 'sweetalert2';

export function Header({ onNavigate, usuarioLogado, setUsuarioLogado, telaAtual }) {
    const [modalLoginAberto, setModalLoginAberto] = useState(false);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [carregando, setCarregando] = useState(false);

    const estaLogado = Boolean(usuarioLogado);
    const ehComiteOuAdmin = ehComiteOuAdminGeral(usuarioLogado);
    const podeAdministrar = ehAdmin(usuarioLogado);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);

        try {
            const usuario = await authService.login(email.trim().toLowerCase(), senha);
            setUsuarioLogado(usuario);
            setModalLoginAberto(false);
            setEmail('');
            setSenha('');
            Swal.fire({
                icon: 'success',
                title: 'Login realizado!',
                text: `Bem-vindo, ${usuario.email} (${labelRole(usuario.role)})`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível fazer login.';
            const senhaExpirada = mensagem.toLowerCase().includes('expirou');

            if (senhaExpirada) {
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Senha expirada',
                    text: mensagem,
                    showCancelButton: true,
                    confirmButtonText: 'Recuperar senha',
                    cancelButtonText: 'Fechar',
                    confirmButtonColor: '#2563eb'
                });
                if (result.isConfirmed) {
                    setModalLoginAberto(false);
                    onNavigate('recuperar-senha');
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no login',
                    text: mensagem,
                    confirmButtonColor: '#2563eb'
                });
            }
        } finally {
            setCarregando(false);
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
            authService.logout();
            setUsuarioLogado(null);
            onNavigate('home');
            Swal.fire({
                icon: 'success',
                title: 'Logout realizado!',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const estiloBotaoNav = (tela) => ({
        background: telaAtual === tela ? '#2563eb' : 'transparent',
        color: telaAtual === tela ? '#ffffff' : '#475569',
        border: 'none',
        cursor: 'pointer',
        fontWeight: telaAtual === tela ? '600' : '500',
        padding: '0.4rem 0.8rem',
        borderRadius: '4px',
        transition: 'all 0.2s ease'
    });

    return (
        <header className="header-container" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '0.5rem'
        }}>
            <div className="header-brand" onClick={() => onNavigate('home')} style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <img src={logoImg} alt="Logo SISCETRAN" style={{ height: '35px', objectFit: 'contain' }} />
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b' }}>
                    SISCETRAN <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>PETRANS</span>
                </span>
            </div>

            <nav className="header-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {estaLogado && (
                    <>
                        <button onClick={() => onNavigate('acoes')} style={estiloBotaoNav('acoes')}>Ações</button>
                        <button onClick={() => onNavigate('consultar')} style={estiloBotaoNav('consultar')}>Consultar</button>
                        <button onClick={() => onNavigate('dashboard')} style={estiloBotaoNav('dashboard')}>Dashboard</button>
                    </>
                )}
                {ehComiteOuAdmin && (
                    <button onClick={() => onNavigate('comite')} style={estiloBotaoNav('comite')}>Comitê</button>
                )}
                {podeAdministrar && (
                    <button onClick={() => onNavigate('admin')} style={estiloBotaoNav('admin')}>Admin</button>
                )}

                {estaLogado && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748b', borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
                        <span>
                            {usuarioLogado.email} <strong style={{ color: '#2563eb' }}>({labelRole(usuarioLogado.role)}{usuarioLogado.setor ? ` · ${usuarioLogado.setor}` : ''})</strong>
                        </span>
                        <button
                            onClick={() => onNavigate('trocar-senha')}
                            style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}
                        >
                            Trocar senha
                        </button>
                    </div>
                )}

                <button
                    onClick={() => estaLogado ? handleLogoutClick() : setModalLoginAberto(true)}
                    style={{
                        background: estaLogado ? '#e63946' : '#2563eb',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {estaLogado ? 'Logout' : 'Login'}
                </button>
            </nav>

            {/* Modal de Login */}
            {modalLoginAberto && (
                <div className="modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: '#fff',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '400px',
                        position: 'relative'
                    }}>
                        <span className="close" onClick={() => setModalLoginAberto(false)} style={{
                            position: 'absolute',
                            top: '10px',
                            right: '15px',
                            cursor: 'pointer',
                            fontSize: '1.5rem'
                        }}>&times;</span>
                        <h2 style={{ marginBottom: '1rem' }}>Entrar no SISCETRAN</h2>
                        <form onSubmit={handleLoginSubmit}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>E-mail:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Senha:</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <input
                                    type={mostrarSenha ? "text" : "password"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        paddingRight: '40px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <i
                                    className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`}
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        fontSize: '1.1rem'
                                    }}
                                ></i>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setModalLoginAberto(false); onNavigate('recuperar-senha'); }}
                                style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.82rem', padding: 0, marginBottom: '1rem', textDecoration: 'underline' }}
                            >
                                Esqueci minha senha
                            </button>

                            <button type="submit" disabled={carregando} style={{
                                width: '100%',
                                background: '#2563eb',
                                color: '#fff',
                                padding: '0.6rem',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: carregando ? 'wait' : 'pointer',
                                opacity: carregando ? 0.7 : 1
                            }}>
                                {carregando ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
}
