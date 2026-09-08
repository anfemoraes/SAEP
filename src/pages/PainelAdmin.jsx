// src/pages/PainelAdmin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    listarUsuarios,
    criarUsuario,
    removerUsuario,
    ativarUsuario,
    desativarUsuario,
    atualizarRoleUsuario
} from '../services/usuarios';
import { acoesEstrategicas } from '../services/acoes_data';
import { ApiError } from '../services/api';
import Swal from 'sweetalert2';

const ROLES = ['USUARIO', 'ADMIN_SETOR', 'COMITE', 'ADMIN_GERAL'];

const formVazio = { email: '', senha: '', role: 'USUARIO', setor: '' };

export function PainelAdmin({ usuarioLogado }) {
    const [usuarios, setUsuarios] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [form, setForm] = useState(formVazio);
    const [busca, setBusca] = useState('');

    const carregarUsuarios = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await listarUsuarios(busca);
            setUsuarios(Array.isArray(dados) ? dados : []);
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Erro ao carregar usuários.';
            Swal.fire({ icon: 'error', title: 'Erro', text: msg, confirmButtonColor: '#2563eb' });
        } finally {
            setCarregando(false);
        }
    }, [busca]);

    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios]);

    const handleCriarUsuario = async (e) => {
        e.preventDefault();
        if (!form.email || !form.senha) {
            Swal.fire({ icon: 'warning', title: 'Campos obrigatórios', text: 'Preencha e-mail e senha.', confirmButtonColor: '#2563eb' });
            return;
        }
        setEnviando(true);
        try {
            await criarUsuario({ email: form.email, senha: form.senha, role: form.role, setor: form.setor || undefined });
            Swal.fire({ icon: 'success', title: 'Usuário criado!', timer: 1500, showConfirmButton: false });
            setForm(formVazio);
            setMostrarForm(false);
            carregarUsuarios();
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Erro ao criar usuário.';
            Swal.fire({ icon: 'error', title: 'Erro', text: msg, confirmButtonColor: '#2563eb' });
        } finally {
            setEnviando(false);
        }
    };

    const handleRemover = async (usuario) => {
        if (usuario.id === usuarioLogado?.id) {
            Swal.fire({ icon: 'error', title: 'Ação não permitida', text: 'Você não pode remover sua própria conta.', confirmButtonColor: '#2563eb' });
            return;
        }
        const result = await Swal.fire({
            title: 'Remover usuário?',
            text: `Deseja revogar o acesso de ${usuario.email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;
        try {
            await removerUsuario(usuario.id);
            Swal.fire({ icon: 'success', title: 'Removido!', timer: 1500, showConfirmButton: false });
            carregarUsuarios();
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Erro ao remover usuário.';
            Swal.fire({ icon: 'error', title: 'Erro', text: msg, confirmButtonColor: '#2563eb' });
        }
    };

    const handleToggleAtivo = async (usuario) => {
        if (usuario.id === usuarioLogado?.id) {
            Swal.fire({ icon: 'error', title: 'Ação não permitida', text: 'Você não pode desativar sua própria conta.', confirmButtonColor: '#2563eb' });
            return;
        }
        try {
            if (usuario.ativo) {
                await desativarUsuario(usuario.id);
            } else {
                await ativarUsuario(usuario.id);
            }
            carregarUsuarios();
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Erro ao alterar status do usuário.';
            Swal.fire({ icon: 'error', title: 'Erro', text: msg, confirmButtonColor: '#2563eb' });
        }
    };

    const handleAlterarRole = async (usuario, novaRole) => {
        if (usuario.id === usuarioLogado?.id) {
            Swal.fire({ icon: 'error', title: 'Ação não permitida', text: 'Você não pode alterar sua própria role.', confirmButtonColor: '#2563eb' });
            return;
        }
        try {
            await atualizarRoleUsuario(usuario.id, novaRole);
            carregarUsuarios();
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Erro ao alterar role.';
            Swal.fire({ icon: 'error', title: 'Erro', text: msg, confirmButtonColor: '#2563eb' });
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Administrador</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Gerenciamento global de acessos, usuários e ações base do SISCETRAN.</p>
            </div>

            {/* Seção de Usuários */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ color: '#334155', margin: 0 }}>Usuários Cadastrados</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Buscar por e-mail..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            style={{ padding: '0.5rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', minWidth: '200px' }}
                        />
                        <button
                            onClick={() => setMostrarForm(v => !v)}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {mostrarForm ? 'Cancelar' : '+ Novo Usuário'}
                        </button>
                    </div>
                </div>

                {/* Formulário de criação */}
                {mostrarForm && (
                    <form onSubmit={handleCriarUsuario} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={estiloLabel}>E-mail *</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="usuario@cetran.pa.gov.br"
                                required
                                style={estiloInput}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={estiloLabel}>Senha *</label>
                            <input
                                type="password"
                                value={form.senha}
                                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                                placeholder="Mín. 8 caracteres"
                                required
                                style={estiloInput}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={estiloLabel}>Perfil (Role)</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={estiloInput}>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={estiloLabel}>Setor (opcional)</label>
                            <input
                                type="text"
                                value={form.setor}
                                onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}
                                placeholder="Ex: CTSIST"
                                style={estiloInput}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                            <button
                                type="submit"
                                disabled={enviando}
                                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {enviando ? 'Criando...' : 'Criar Usuário'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Tabela de usuários */}
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {carregando ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando usuários...</p>
                    ) : usuarios.length === 0 ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum usuário encontrado.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                    <th style={{ padding: '12px' }}>E-mail</th>
                                    <th style={{ padding: '12px' }}>Perfil</th>
                                    <th style={{ padding: '12px' }}>Setor</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: u.ativo ? 1 : 0.5 }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{u.email}</td>
                                        <td style={{ padding: '12px' }}>
                                            {u.id === usuarioLogado?.id ? (
                                                <span style={estiloBadgeRole(u.role)}>{u.role}</span>
                                            ) : (
                                                <select
                                                    value={u.role}
                                                    onChange={e => handleAlterarRole(u, e.target.value)}
                                                    style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 'bold', ...corRole(u.role) }}
                                                >
                                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', color: '#475569' }}>{u.setor || '—'}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: u.ativo ? '#dcfce7' : '#fee2e2', color: u.ativo ? '#166534' : '#991b1b' }}>
                                                {u.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            {u.id !== usuarioLogado?.id && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleAtivo(u)}
                                                        style={{ background: 'transparent', border: '1px solid #cbd5e1', color: u.ativo ? '#d97706' : '#16a34a', cursor: 'pointer', borderRadius: '6px', padding: '4px 10px', fontSize: '0.82rem', fontWeight: 600 }}
                                                    >
                                                        {u.ativo ? 'Desativar' : 'Ativar'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemover(u)}
                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                                                    >
                                                        Remover
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Seção de Ações Estratégicas Base */}
            <div>
                <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1rem' }}>
                    Ações Estratégicas Base Integradas ({acoesEstrategicas.length})
                </h3>
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>Diretriz</th>
                                <th style={{ padding: '12px' }}>Setor</th>
                                <th style={{ padding: '12px' }}>Prazo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {acoesEstrategicas.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb', whiteSpace: 'nowrap' }}>{a.id}</td>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{a.diretriz}</td>
                                    <td style={{ padding: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{a.setor}</td>
                                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{a.prazo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const estiloLabel = { fontSize: '0.82rem', fontWeight: 600, color: '#475569' };
const estiloInput = { padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };

function corRole(role) {
    if (role === 'ADMIN_GERAL' || role === 'ADMIN_SETOR') return { background: '#ede9fe', color: '#7c3aed' };
    if (role === 'COMITE') return { background: '#fef3c7', color: '#d97706' };
    return { background: '#e0f2fe', color: '#0284c7' };
}

function estiloBadgeRole(role) {
    return {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        display: 'inline-block',
        ...corRole(role)
    };
}