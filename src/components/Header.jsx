// src/components/Header.jsx
import React, { useState } from 'react';
import { carregarSessao, salvarSessao, limparSessao, carregarBanco } from '../services/storage';
import logoImg from '../assets/logo.png';
import Swal from 'sweetalert2';

export function Header({ onNavigate, usuarioLogado, setUsuarioLogado }) {
    const [modalLoginAberto, setModalLoginAberto] = useState(false);
    const [email, setEmail] = useState('');
    const [senha, Senha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const db = carregarBanco();
    const estaLogado = Boolean(usuarioLogado);
    const ehComiteOuAdmin = Boolean(usuarioLogado && (usuarioLogado.role === 'comite' || usuarioLogado.role === 'admin'));
    const ehAdmin = Boolean(usuarioLogado && usuarioLogado.role === 'admin');

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        const usuarioEncontrado = db.usuarios.find(u => u.email === email.trim().toLowerCase() && u.senha === senha);

        if (usuarioEncontrado) {
            salvarSessao(usuarioEncontrado);
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
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro no login',
                text: 'E-mail ou senha incorretos!',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleLogoutClick = async () => {
        const result = await Swal.fire({
            title: 'Sair da sessao?',
            text: 'Voce tem certeza que deseja fazer logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, sair',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            limparSessao();
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

    return (
        <header className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            <div className="header-brand" onClick={() => onNavigate('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <img src={logoImg} alt="Logo SISCETRAN" style={{ height: '35px', objectFit: 'contain' }} />
    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b' }}>
        SISCETRAN <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>PETRANS</span>
    </span>
</div>

            <nav className="header-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {estaLogado && (
                    <>
                        <button className="button" onClick={() => onNavigate('acoes')} style={estiloBotaoNav}>Ações</button>
                        <button className="button" onClick={() => onNavigate('consultar')} style={estiloBotaoNav}>Consultar</button>
                        <button className="button" onClick={() => onNavigate('rascunhos')} style={estiloBotaoNav}>Meus Rascunhos</button>
                        <button className="button" onClick={() => onNavigate('andamento')} style={estiloBotaoNav}>Andamento</button>
                    </>
                )}
                {ehComiteOuAdmin && (
                    <button className="button" onClick={() => onNavigate('comite')} style={{ ...estiloBotaoNav, background: '#d97706', color: '#fff' }}>Comite</button>
                )}
                {ehAdmin && (
                    <button className="button" onClick={() => onNavigate('admin')} style={{ ...estiloBotaoNav, background: '#7c3aed', color: '#fff' }}>Admin</button>
                )}

                <button 
                    className={`button ${estaLogado ? 'is-logged-in' : ''}`} 
                    onClick={() => estaLogado ? handleLogoutClick() : setModalLoginAberto(true)}
                    style={{ background: estaLogado ? '#e63946' : '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                    {estaLogado ? 'Logout' : 'Login'}
                </button>
            </nav>

            {/* Modal de Login com Olho de Visualizar Senha */}
            {modalLoginAberto && (
                <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <span className="close" onClick={() => setModalLoginAberto(false)} style={{ position: 'absolute', top: '10px', right: '15px', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</span>
                        <h2 style={{ marginBottom: '1rem' }}>Login do Conselheiro</h2>
                        <form onSubmit={handleLoginSubmit}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Usuario:</label>
                            <input 
                                type="text" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                            
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Senha:</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                <input 
                                    type={mostrarSenha ? "text" : "password"} 
                                    value={senha} 
                                    onChange={(e) => Senha(e.target.value)} 
                                    required 
                                    style={{ width: '100%', padding: '0.5rem', paddingRight: '40px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                                <i 
                                    className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`} 
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem' }}
                                ></i>
                            </div>
                            
                            <button type="submit" className="button" style={{ width: '100%', background: '#2563eb', color: '#fff', padding: '0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Entrar</button>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
}

const estiloBotaoNav = {
    background: 'transparent',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    fontWeight: '500',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px'
};