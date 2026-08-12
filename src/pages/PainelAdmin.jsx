import React, { useState } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import { acoesEstrategicas } from '../services/acoes_data';
import Swal from 'sweetalert2';

export function PainelAdmin({ usuarioLogado }) {
    const [db, setDb] = useState(carregarBanco());
    const [termoBusca, setTermoBusca] = useState('');
    const [modalNovoUsuarioAberto, setModalNovoUsuarioAberto] = useState(false);
    const [modalNovaAcaoAberto, setModalNovaAcaoAberto] = useState(false);
    const [novoUsuario, setNovoUsuario] = useState({ email: '', senha: '', role: 'usuario' });
    const [novaAcao, setNovaAcao] = useState({ 
        id: '', 
        diretriz: '', 
        lae: '', 
        og: '', 
        prazo: 'Médio Prazo', 
        setor: '' 
    });

    const usuarios = db.usuarios || [];
    
    // Verifica se o usuário tem permissão de admin
    if (!usuarioLogado || usuarioLogado.role !== 'admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#e63946' }}>Acesso Restrito</h2>
                <p style={{ color: '#64748b' }}>Esta área é exclusiva para administradores do sistema.</p>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Faça login com uma conta de administrador para acessar.</p>
            </div>
        );
    }

    // Filtra usuários pela busca
    const usuariosFiltrados = usuarios.filter(u => 
        u.email.toLowerCase().includes(termoBusca.toLowerCase())
    );

    const handleNovoUsuario = async (e) => {
        e.preventDefault();
        
        if (!novoUsuario.email || !novoUsuario.senha) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Preencha todos os campos para criar o usuário.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Verifica se usuário já existe
        if (usuarios.find(u => u.email === novoUsuario.email)) {
            Swal.fire({
                icon: 'error',
                title: 'Usuário já existe',
                text: `O e-mail ${novoUsuario.email} já está cadastrado.`,
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const dbAtualizado = carregarBanco();
        dbAtualizado.usuarios.push({
            email: novoUsuario.email.toLowerCase(),
            senha: novoUsuario.senha,
            role: novoUsuario.role
        });
        
        salvarBanco(dbAtualizado);
        setDb(dbAtualizado);
        setNovoUsuario({ email: '', senha: '', role: 'usuario' });
        setModalNovoUsuarioAberto(false);

        Swal.fire({
            icon: 'success',
            title: 'Usuário criado!',
            text: `O usuário ${novoUsuario.email} foi cadastrado com sucesso.`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const handleRemoverUsuario = async (email) => {
        if (email === usuarioLogado?.email) {
            Swal.fire({
                icon: 'error',
                title: 'Ação não permitida',
                text: 'Você não pode remover o seu próprio usuário logado.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Remover usuário?',
            text: `Deseja revogar o acesso de ${email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const dbAtualizado = carregarBanco();
            dbAtualizado.usuarios = dbAtualizado.usuarios.filter(u => u.email !== email);
            salvarBanco(dbAtualizado);
            setDb(dbAtualizado);

            Swal.fire({
                icon: 'success',
                title: 'Removido!',
                text: 'O usuário foi removido do sistema.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const handleAtualizarRole = async (email, novaRole) => {
        const result = await Swal.fire({
            title: 'Alterar perfil?',
            text: `Deseja alterar o perfil de ${email} para ${novaRole.toUpperCase()}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, alterar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const dbAtualizado = carregarBanco();
            dbAtualizado.usuarios = dbAtualizado.usuarios.map(u => 
                u.email === email ? { ...u, role: novaRole } : u
            );
            salvarBanco(dbAtualizado);
            setDb(dbAtualizado);

            Swal.fire({
                icon: 'success',
                title: 'Perfil alterado!',
                text: `O perfil foi atualizado para ${novaRole.toUpperCase()}.`,
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const handleNovaAcao = async (e) => {
        e.preventDefault();
        
        if (!novaAcao.id || !novaAcao.diretriz || !novaAcao.setor) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Preencha todos os campos obrigatórios.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Verifica se ação já existe
        if (acoesEstrategicas.find(a => a.id === novaAcao.id)) {
            Swal.fire({
                icon: 'error',
                title: 'Ação já existe',
                text: `O ID ${novaAcao.id} já está cadastrado.`,
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Adiciona a nova ação ao arquivo de dados (simulado)
        acoesEstrategicas.push({
            ...novaAcao,
            linhaPlanilha: acoesEstrategicas.length + 1
        });

        setNovaAcao({ id: '', diretriz: '', lae: '', og: '', prazo: 'Médio Prazo', setor: '' });
        setModalNovaAcaoAberto(false);

        Swal.fire({
            icon: 'success',
            title: 'Ação criada!',
            text: `A ação ${novaAcao.id} foi cadastrada com sucesso.`,
            timer: 2000,
            showConfirmButton: false
        });

        // Força recarregamento da página para atualizar a lista de ações
        window.location.reload();
    };

    const handleRemoverAcao = async (id) => {
        const result = await Swal.fire({
            title: 'Remover ação?',
            text: `Deseja remover a ação ${id}? Isso pode afetar matrizes existentes.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const index = acoesEstrategicas.findIndex(a => a.id === id);
            if (index !== -1) {
                acoesEstrategicas.splice(index, 1);
                Swal.fire({
                    icon: 'success',
                    title: 'Ação removida!',
                    timer: 1500,
                    showConfirmButton: false
                });
                window.location.reload();
            }
        }
    };

    const exportarUsuarios = () => {
        const dados = usuarios.map(u => ({
            email: u.email,
            perfil: u.role,
            senha: u.senha
        }));
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usuarios_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Exportado!',
            text: 'Os dados dos usuários foram exportados.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Administrador</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    Gerenciamento global de acessos, usuários e ações base do SISCETRAN.
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '1rem', 
                marginBottom: '2rem' 
            }}>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Total de Usuários
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', margin: '0.3rem 0' }}>
                        {usuarios.length}
                    </p>
                </div>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Administradores
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', margin: '0.3rem 0' }}>
                        {usuarios.filter(u => u.role === 'admin').length}
                    </p>
                </div>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Conselheiros
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706', margin: '0.3rem 0' }}>
                        {usuarios.filter(u => u.role === 'comite').length}
                    </p>
                </div>
                <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>
                        Total de Matrizes
                    </h4>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: '0.3rem 0' }}>
                        {(db.registros || []).length}
                    </p>
                </div>
            </div>

            {/* Seção de Usuários */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{ color: '#334155', margin: 0 }}>👥 Usuários Cadastrados</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                            onClick={exportarUsuarios}
                            style={{ 
                                background: '#22c55e', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem'
                            }}
                        >
                             Exportar
                        </button>
                        <button 
                            onClick={() => setModalNovoUsuarioAberto(true)}
                            style={{ 
                                background: '#2563eb', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem'
                            }}
                        >
                             Novo Usuário
                        </button>
                    </div>
                </div>

                {/* Busca de Usuários */}
                <div style={{ marginBottom: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Buscar usuário por e-mail..." 
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        style={{ 
                            width: '100%', 
                            maxWidth: '400px',
                            padding: '0.6rem 1rem', 
                            border: '1px solid #cbd5e1', 
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ 
                    background: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    overflow: 'hidden', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px' }}>E-mail / Usuário</th>
                                <th style={{ padding: '12px' }}>Perfil (Role)</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.length > 0 ? (
                                usuariosFiltrados.map(u => (
                                    <tr key={u.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                                            {u.email} {u.email === usuarioLogado?.email && '⭐'}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <select 
                                                value={u.role}
                                                onChange={(e) => handleAtualizarRole(u.email, e.target.value)}
                                                style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px', 
                                                    border: '1px solid #cbd5e1',
                                                    background: '#fff',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="usuario">Usuário</option>
                                                <option value="comite">Conselheiro</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleRemoverUsuario(u.email)} 
                                                style={{ 
                                                    background: 'transparent', 
                                                    border: 'none', 
                                                    color: '#dc2626', 
                                                    cursor: 'pointer', 
                                                    fontWeight: 'bold',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    transition: 'background 0.2s',
                                                    ':hover': { background: '#fee2e2' }
                                                }}
                                                disabled={u.email === usuarioLogado?.email}
                                            >
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Seção de Ações Estratégicas Base */}
            <div>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{ color: '#334155', margin: 0 }}>📋 Ações Estratégicas Base</h3>
                    <button 
                        onClick={() => setModalNovaAcaoAberto(true)}
                        style={{ 
                            background: '#8b5cf6', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                        }}
                    >
                        ➕ Nova Ação
                    </button>
                </div>

                <div style={{ 
                    background: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    overflow: 'hidden', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>Diretriz</th>
                                <th style={{ padding: '12px' }}>LAE</th>
                                <th style={{ padding: '12px' }}>OG</th>
                                <th style={{ padding: '12px' }}>Setor</th>
                                <th style={{ padding: '12px' }}>Prazo</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {acoesEstrategicas.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{a.id}</td>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{a.diretriz}</td>
                                    <td style={{ padding: '12px' }}>{a.lae || '-'}</td>
                                    <td style={{ padding: '12px' }}>{a.og || '-'}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{a.setor}</td>
                                    <td style={{ padding: '12px' }}>{a.prazo}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleRemoverAcao(a.id)} 
                                            style={{ 
                                                background: 'transparent', 
                                                border: 'none', 
                                                color: '#dc2626', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold' 
                                            }}
                                        >
                                            🗑️ Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Novo Usuário */}
            {modalNovoUsuarioAberto && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(0,0,0,0.5)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 1000, 
                    padding: '1rem' 
                }}>
                    <div style={{ 
                        background: '#fff', 
                        padding: '2rem', 
                        borderRadius: '8px', 
                        width: '100%', 
                        maxWidth: '500px', 
                        position: 'relative' 
                    }}>
                        <span 
                            onClick={() => setModalNovoUsuarioAberto(false)} 
                            style={{ 
                                position: 'absolute', 
                                top: '15px', 
                                right: '20px', 
                                cursor: 'pointer', 
                                fontSize: '1.5rem', 
                                color: '#64748b' 
                            }}
                        >
                            &times;
                        </span>
                        
                        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Cadastrar Novo Usuário</h3>
                        
                        <form onSubmit={handleNovoUsuario}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    E-mail *
                                </label>
                                <input 
                                    type="email" 
                                    value={novoUsuario.email} 
                                    onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                                    required
                                    placeholder="exemplo@email.com"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    Senha *
                                </label>
                                <input 
                                    type="text" 
                                    value={novoUsuario.senha} 
                                    onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                                    required
                                    placeholder="senha123"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    Perfil de Acesso *
                                </label>
                                <select 
                                    value={novoUsuario.role} 
                                    onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value })}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px',
                                        background: '#fff'
                                    }}
                                >
                                    <option value="usuario">Usuário Comum</option>
                                    <option value="comite">Conselheiro (Comitê)</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setModalNovoUsuarioAberto(false)}
                                    style={{ 
                                        background: '#e2e8f0', 
                                        border: 'none', 
                                        padding: '0.6rem 1.2rem', 
                                        borderRadius: '6px', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer', 
                                        color: '#475569' 
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    style={{ 
                                        background: '#2563eb', 
                                        color: '#fff', 
                                        border: 'none', 
                                        padding: '0.6rem 1.5rem', 
                                        borderRadius: '6px', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    Criar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Nova Ação */}
            {modalNovaAcaoAberto && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(0,0,0,0.5)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 1000, 
                    padding: '1rem' 
                }}>
                    <div style={{ 
                        background: '#fff', 
                        padding: '2rem', 
                        borderRadius: '8px', 
                        width: '100%', 
                        maxWidth: '600px', 
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative' 
                    }}>
                        <span 
                            onClick={() => setModalNovaAcaoAberto(false)} 
                            style={{ 
                                position: 'absolute', 
                                top: '15px', 
                                right: '20px', 
                                cursor: 'pointer', 
                                fontSize: '1.5rem', 
                                color: '#64748b' 
                            }}
                        >
                            &times;
                        </span>
                        
                        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Cadastrar Nova Ação Estratégica</h3>
                        
                        <form onSubmit={handleNovaAcao}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    ID da Ação (Ex: AE 5.1.1.1) *
                                </label>
                                <input 
                                    type="text" 
                                    value={novaAcao.id} 
                                    onChange={(e) => setNovaAcao({ ...novaAcao, id: e.target.value })}
                                    required
                                    placeholder="AE 1.1.1.1"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '600', 
                                    color: '#475569', 
                                    marginBottom: '6px' 
                                }}>
                                    Diretriz Estratégica *
                                </label>
                                <textarea 
                                    value={novaAcao.diretriz} 
                                    onChange={(e) => setNovaAcao({ ...novaAcao, diretriz: e.target.value })}
                                    required
                                    rows="2"
                                    placeholder="Descreva a diretriz estratégica..."
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.6rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '6px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '600', 
                                        color: '#475569', 
                                        marginBottom: '6px' 
                                    }}>
                                        Linha de Ação Estratégica (LAE)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={novaAcao.lae} 
                                        onChange={(e) => setNovaAcao({ ...novaAcao, lae: e.target.value })}
                                        placeholder="Ex: LAE 1"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.6rem', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '6px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '600', 
                                        color: '#475569', 
                                        marginBottom: '6px' 
                                    }}>
                                        Objetivo de Governo (OG)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={novaAcao.og} 
                                        onChange={(e) => setNovaAcao({ ...novaAcao, og: e.target.value })}
                                        placeholder="Ex: OG 3"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.6rem', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '6px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '600', 
                                        color: '#475569', 
                                        marginBottom: '6px' 
                                    }}>
                                        Setor Responsável *
                                    </label>
                                    <input 
                                        type="text" 
                                        value={novaAcao.setor} 
                                        onChange={(e) => setNovaAcao({ ...novaAcao, setor: e.target.value })}
                                        required
                                        placeholder="Ex: SETRAN"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.6rem', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '6px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '600', 
                                        color: '#475569', 
                                        marginBottom: '6px' 
                                    }}>
                                        Prazo *
                                    </label>
                                    <select 
                                        value={novaAcao.prazo} 
                                        onChange={(e) => setNovaAcao({ ...novaAcao, prazo: e.target.value })}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.6rem', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '6px',
                                            background: '#fff'
                                        }}
                                    >
                                        <option value="Curto Prazo">Curto Prazo</option>
                                        <option value="Médio Prazo">Médio Prazo</option>
                                        <option value="Longo Prazo">Longo Prazo</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setModalNovaAcaoAberto(false)}
                                    style={{ 
                                        background: '#e2e8f0', 
                                        border: 'none', 
                                        padding: '0.6rem 1.2rem', 
                                        borderRadius: '6px', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer', 
                                        color: '#475569' 
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    style={{ 
                                        background: '#8b5cf6', 
                                        color: '#fff', 
                                        border: 'none', 
                                        padding: '0.6rem 1.5rem', 
                                        borderRadius: '6px', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    Criar Ação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function estiloBadgeRole(role) {
    let bg = '#e2e8f0';
    let color = '#475569';
    if (role === 'admin') { bg = '#ede9fe'; color = '#7c3aed'; }
    else if (role === 'comite') { bg = '#fef3c7'; color = '#d97706'; }
    else if (role === 'usuario') { bg = '#e0f2fe'; color = '#0284c7'; }

    return {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: color
    };
}