import React, { useState, useEffect } from 'react';
import * as usuariosService from '../services/usuarios';
import * as acoesService from '../services/acoes';
import { ApiError } from '../services/api';
import { ehAdmin, ehAdminGeral, podeAlterarRole, labelRole, labelPrazo } from '../services/permissoes';
import Swal from 'sweetalert2';

const PRAZO_OPCOES = [
    { value: 'CURTO_PRAZO', label: 'Curto Prazo' },
    { value: 'MEDIO_PRAZO', label: 'Médio Prazo' },
    { value: 'LONGO_PRAZO', label: 'Longo Prazo' },
];

const ROLE_OPCOES_TODAS = [
    { value: 'USUARIO', label: 'Usuário do Setor' },
    { value: 'COMITE', label: 'Conselheiro' },
    { value: 'ADMIN_SETOR', label: 'Admin do Setor' },
    { value: 'ADMIN_GERAL', label: 'Admin Geral' },
];

export function PainelAdmin({ usuarioLogado }) {
    const [usuarios, setUsuarios] = useState([]);
    const [acoes, setAcoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [termoBusca, setTermoBusca] = useState('');

    const [modalNovoUsuarioAberto, setModalNovoUsuarioAberto] = useState(false);
    const [modalNovaAcaoAberto, setModalNovaAcaoAberto] = useState(false);
    const [novoUsuario, setNovoUsuario] = useState({ email: '', senha: '', role: 'USUARIO', setor: '' });
    const [novaAcao, setNovaAcao] = useState({
        id: '', diretriz: '', lae: '', og: '', prazo: 'MEDIO_PRAZO', setor: '', meta: '', indicador: ''
    });
    const [salvandoUsuario, setSalvandoUsuario] = useState(false);
    const [salvandoAcao, setSalvandoAcao] = useState(false);

    const acessoPermitido = ehAdmin(usuarioLogado);
    // Admin de Setor não escolhe role acima do próprio nível e não define setor manualmente
    // (o backend já força o setor do próprio admin para os usuários que ele cria).
    const opcoesRoleParaCriacao = usuarioLogado?.role === 'ADMIN_GERAL'
        ? ROLE_OPCOES_TODAS
        : ROLE_OPCOES_TODAS.filter(o => o.value !== 'ADMIN_GERAL');

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const [listaUsuarios, listaAcoes] = await Promise.all([
                usuariosService.listarUsuarios(),
                acoesService.listarAcoes(),
            ]);
            setUsuarios(listaUsuarios || []);
            setAcoes(listaAcoes || []);
            setErro(null);
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os dados administrativos.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        if (acessoPermitido) carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acessoPermitido]);

    if (!acessoPermitido) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#e63946' }}>Acesso Restrito</h2>
                <p style={{ color: '#64748b' }}>Esta área é exclusiva para Admin do Setor e Admin Geral.</p>
            </div>
        );
    }

    const usuariosFiltrados = usuarios.filter(u => u.email.toLowerCase().includes(termoBusca.toLowerCase()));

    // ---------- Usuários ----------

    const handleNovoUsuario = async (e) => {
        e.preventDefault();

        if (!novoUsuario.email || !novoUsuario.senha) {
            Swal.fire({ icon: 'warning', title: 'Campos obrigatórios', text: 'Preencha e-mail e senha.', confirmButtonColor: '#2563eb' });
            return;
        }

        if ((novoUsuario.role === 'USUARIO' || novoUsuario.role === 'ADMIN_SETOR') && usuarioLogado.role === 'ADMIN_GERAL' && !novoUsuario.setor) {
            Swal.fire({ icon: 'warning', title: 'Setor obrigatório', text: 'Informe o setor para este perfil.', confirmButtonColor: '#2563eb' });
            return;
        }

        setSalvandoUsuario(true);
        try {
            const payload = { email: novoUsuario.email, senha: novoUsuario.senha, role: novoUsuario.role };
            // Admin de Setor não manda "setor" — o backend usa o dele automaticamente.
            if (usuarioLogado.role === 'ADMIN_GERAL') {
                payload.setor = novoUsuario.setor || undefined;
            }

            await usuariosService.criarUsuario(payload);
            setNovoUsuario({ email: '', senha: '', role: 'USUARIO', setor: '' });
            setModalNovoUsuarioAberto(false);
            carregarDados();

            Swal.fire({ icon: 'success', title: 'Usuário criado!', timer: 1800, showConfirmButton: false });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível criar o usuário.';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        } finally {
            setSalvandoUsuario(false);
        }
    };

    const handleAlternarAtivo = async (usuario) => {
        if (usuario.id === usuarioLogado.id) {
            Swal.fire({ icon: 'error', title: 'Ação não permitida', text: 'Você não pode ativar/desativar a própria conta.', confirmButtonColor: '#2563eb' });
            return;
        }

        const acao = usuario.ativo ? 'desativar' : 'ativar';
        const result = await Swal.fire({
            title: `${acao === 'desativar' ? 'Desativar' : 'Reativar'} usuário?`,
            text: `Deseja ${acao} o acesso de ${usuario.email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: acao === 'desativar' ? '#e63946' : '#16a34a',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Sim, ${acao}`,
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            if (usuario.ativo) {
                await usuariosService.desativarUsuario(usuario.id);
            } else {
                await usuariosService.ativarUsuario(usuario.id);
            }
            carregarDados();
            Swal.fire({ icon: 'success', title: `Usuário ${acao === 'desativar' ? 'desativado' : 'reativado'}!`, timer: 1500, showConfirmButton: false });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : `Não foi possível ${acao} o usuário.`;
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        }
    };

    const handleRemoverUsuario = async (usuario) => {
        if (usuario.id === usuarioLogado.id) {
            Swal.fire({ icon: 'error', title: 'Ação não permitida', text: 'Você não pode remover a própria conta.', confirmButtonColor: '#2563eb' });
            return;
        }

        const result = await Swal.fire({
            title: 'Remover usuário definitivamente?',
            text: `Isso não pode ser desfeito. Considere desativar em vez de remover. Deseja remover ${usuario.email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            await usuariosService.removerUsuario(usuario.id);
            carregarDados();
            Swal.fire({ icon: 'success', title: 'Removido!', timer: 1500, showConfirmButton: false });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível remover o usuário.';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        }
    };

    const handleAtualizarRole = async (usuario, novaRole) => {
        const result = await Swal.fire({
            title: 'Alterar perfil?',
            text: `Deseja alterar o perfil de ${usuario.email} para ${labelRole(novaRole)}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, alterar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            await usuariosService.atualizarRoleUsuario(usuario.id, novaRole);
            carregarDados();
            Swal.fire({ icon: 'success', title: 'Perfil alterado!', timer: 1500, showConfirmButton: false });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível alterar o perfil.';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        }
    };

    // ---------- Ações Estratégicas ----------

    const handleNovaAcao = async (e) => {
        e.preventDefault();

        if (!novaAcao.id || !novaAcao.diretriz || !novaAcao.meta || !novaAcao.indicador) {
            Swal.fire({ icon: 'warning', title: 'Campos obrigatórios', text: 'Preencha ID, diretriz, meta e indicador.', confirmButtonColor: '#2563eb' });
            return;
        }

        setSalvandoAcao(true);
        try {
            await acoesService.criarAcao({
                ...novaAcao,
                linhaPlanilha: acoes.length + 1,
            });
            setNovaAcao({ id: '', diretriz: '', lae: '', og: '', prazo: 'MEDIO_PRAZO', setor: '', meta: '', indicador: '' });
            setModalNovaAcaoAberto(false);
            carregarDados();
            Swal.fire({ icon: 'success', title: 'Ação criada!', timer: 1800, showConfirmButton: false });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível criar a ação.';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        } finally {
            setSalvandoAcao(false);
        }
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

        if (!result.isConfirmed) return;

        try {
            await acoesService.removerAcao(id);
            carregarDados();
            Swal.fire({ icon: 'success', title: 'Ação removida!', timer: 1500, showConfirmButton: false });
        } catch (err) {
            const mensagem = err instanceof ApiError ? err.message : 'Não foi possível remover a ação (ela pode estar vinculada a uma matriz).';
            Swal.fire({ icon: 'error', title: 'Erro', text: mensagem, confirmButtonColor: '#2563eb' });
        }
    };

    const exportarUsuarios = () => {
        const dados = usuarios.map(u => ({ email: u.email, perfil: u.role, setor: u.setor, ativo: u.ativo }));
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usuarios_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const contagemPorRole = (role) => usuarios.filter(u => u.role === role).length;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Administrador</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    {usuarioLogado.role === 'ADMIN_GERAL'
                        ? 'Gerenciamento global de acessos, usuários e ações base do SISCETRAN.'
                        : `Gerenciamento dos usuários e ações do setor ${usuarioLogado.setor || '-'}.`}
                </p>
            </div>

            {erro && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    ⚠️ {erro}
                </div>
            )}

            {/* Cards de Estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <CardStat titulo="Total de Usuários" valor={usuarios.length} cor="#2563eb" />
                <CardStat titulo="Admins Gerais" valor={contagemPorRole('ADMIN_GERAL')} cor="#7c3aed" />
                <CardStat titulo="Admins de Setor" valor={contagemPorRole('ADMIN_SETOR')} cor="#0891b2" />
                <CardStat titulo="Conselheiros" valor={contagemPorRole('COMITE')} cor="#d97706" />
            </div>

            {/* Seção de Usuários */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#334155', margin: 0 }}>👥 Usuários {usuarioLogado.role === 'ADMIN_SETOR' ? `do setor ${usuarioLogado.setor}` : 'Cadastrados'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={exportarUsuarios} style={estiloBotaoAcao('#22c55e')}>Exportar</button>
                        <button onClick={() => setModalNovoUsuarioAberto(true)} style={estiloBotaoAcao('#2563eb')}>Novo Usuário</button>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar usuário por e-mail..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px', padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px' }}>E-mail</th>
                                <th style={{ padding: '12px' }}>Setor</th>
                                <th style={{ padding: '12px' }}>Perfil</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carregando ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</td></tr>
                            ) : usuariosFiltrados.length > 0 ? (
                                usuariosFiltrados.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                                            {u.email} {u.id === usuarioLogado.id && '⭐'}
                                        </td>
                                        <td style={{ padding: '12px', color: '#64748b' }}>{u.setor || '-'}</td>
                                        <td style={{ padding: '12px' }}>
                                            {podeAlterarRole(usuarioLogado) ? (
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleAtualizarRole(u, e.target.value)}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
                                                >
                                                    {ROLE_OPCOES_TODAS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span style={estiloBadgeRole(u.role)}>{labelRole(u.role)}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: u.ativo ? '#dcfce7' : '#fee2e2', color: u.ativo ? '#16a34a' : '#dc2626' }}>
                                                {u.ativo ? 'Ativo' : 'Desativado'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleAlternarAtivo(u)}
                                                disabled={u.id === usuarioLogado.id}
                                                style={{ background: 'transparent', border: 'none', color: u.ativo ? '#d97706' : '#16a34a', cursor: u.id === usuarioLogado.id ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginRight: '10px', opacity: u.id === usuarioLogado.id ? 0.4 : 1 }}
                                            >
                                                {u.ativo ? 'Desativar' : 'Ativar'}
                                            </button>
                                            {ehAdminGeral(usuarioLogado) && (
                                                <button
                                                    onClick={() => handleRemoverUsuario(u)}
                                                    disabled={u.id === usuarioLogado.id}
                                                    style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: u.id === usuarioLogado.id ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: u.id === usuarioLogado.id ? 0.4 : 1 }}
                                                >
                                                    Remover
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum usuário encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Seção de Ações Estratégicas */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#334155', margin: 0 }}>📋 Ações Estratégicas Base</h3>
                    <button onClick={() => setModalNovaAcaoAberto(true)} style={estiloBotaoAcao('#8b5cf6')}>➕ Nova Ação</button>
                </div>

                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>Diretriz</th>
                                <th style={{ padding: '12px' }}>Setor</th>
                                <th style={{ padding: '12px' }}>Prazo</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carregando ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</td></tr>
                            ) : acoes.length > 0 ? acoes.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{a.id}</td>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{a.diretriz}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{a.setor || a.responsavel || '-'}</td>
                                    <td style={{ padding: '12px' }}>{labelPrazo(a.prazo)}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => handleRemoverAcao(a.id)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>
                                            🗑️ Remover
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhuma ação cadastrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Novo Usuário */}
            {modalNovoUsuarioAberto && (
                <div style={estiloOverlay}>
                    <div style={estiloModal(500)}>
                        <span onClick={() => setModalNovoUsuarioAberto(false)} style={estiloFechar}>&times;</span>
                        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Cadastrar Novo Usuário</h3>

                        <form onSubmit={handleNovoUsuario}>
                            <label style={estiloLabel}>E-mail *</label>
                            <input type="email" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} required placeholder="exemplo@petrans.pa.gov.br" style={estiloInput} />

                            <label style={estiloLabel}>Senha * (mín. 8 caracteres, 1 maiúscula, 1 número)</label>
                            <input type="text" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} required placeholder="Senha@123" style={estiloInput} />

                            <label style={estiloLabel}>Perfil de Acesso *</label>
                            <select value={novoUsuario.role} onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value })} style={estiloInput}>
                                {opcoesRoleParaCriacao.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>

                            {usuarioLogado.role === 'ADMIN_GERAL' ? (
                                <>
                                    <label style={estiloLabel}>Setor {(novoUsuario.role === 'USUARIO' || novoUsuario.role === 'ADMIN_SETOR') ? '*' : '(opcional)'}</label>
                                    <input type="text" value={novoUsuario.setor} onChange={(e) => setNovoUsuario({ ...novoUsuario, setor: e.target.value })} placeholder="Ex: CTSIST" style={estiloInput} />
                                </>
                            ) : (
                                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                                    O setor será definido automaticamente como <strong>{usuarioLogado.setor}</strong> (o seu).
                                </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setModalNovoUsuarioAberto(false)} style={estiloBotaoCancelar}>Cancelar</button>
                                <button type="submit" disabled={salvandoUsuario} style={estiloBotaoConfirmar('#2563eb')}>
                                    {salvandoUsuario ? 'Criando...' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Nova Ação */}
            {modalNovaAcaoAberto && (
                <div style={estiloOverlay}>
                    <div style={estiloModal(600)}>
                        <span onClick={() => setModalNovaAcaoAberto(false)} style={estiloFechar}>&times;</span>
                        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Cadastrar Nova Ação Estratégica</h3>

                        <form onSubmit={handleNovaAcao}>
                            <label style={estiloLabel}>ID da Ação (Ex: AE 5.1.1.1) *</label>
                            <input type="text" value={novaAcao.id} onChange={(e) => setNovaAcao({ ...novaAcao, id: e.target.value })} required placeholder="AE 1.1.1.1" style={estiloInput} />

                            <label style={estiloLabel}>Diretriz Estratégica *</label>
                            <textarea value={novaAcao.diretriz} onChange={(e) => setNovaAcao({ ...novaAcao, diretriz: e.target.value })} required rows="2" placeholder="Descreva a diretriz..." style={estiloInput}></textarea>

                            <label style={estiloLabel}>Meta *</label>
                            <input type="text" value={novaAcao.meta} onChange={(e) => setNovaAcao({ ...novaAcao, meta: e.target.value })} required placeholder="Ex: 100% dos processos digitalizados" style={estiloInput} />

                            <label style={estiloLabel}>Indicador *</label>
                            <input type="text" value={novaAcao.indicador} onChange={(e) => setNovaAcao({ ...novaAcao, indicador: e.target.value })} required placeholder="Ex: % de conclusão" style={estiloInput} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={estiloLabel}>LAE (opcional)</label>
                                    <input type="text" value={novaAcao.lae} onChange={(e) => setNovaAcao({ ...novaAcao, lae: e.target.value })} placeholder="Ex: LAE 1" style={estiloInput} />
                                </div>
                                <div>
                                    <label style={estiloLabel}>OG (opcional)</label>
                                    <input type="text" value={novaAcao.og} onChange={(e) => setNovaAcao({ ...novaAcao, og: e.target.value })} placeholder="Ex: OG 3" style={estiloInput} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={estiloLabel}>Setor Responsável (opcional)</label>
                                    <input type="text" value={novaAcao.setor} onChange={(e) => setNovaAcao({ ...novaAcao, setor: e.target.value })} placeholder="Ex: CTSIST" style={estiloInput} />
                                </div>
                                <div>
                                    <label style={estiloLabel}>Prazo *</label>
                                    <select value={novaAcao.prazo} onChange={(e) => setNovaAcao({ ...novaAcao, prazo: e.target.value })} style={estiloInput}>
                                        {PRAZO_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setModalNovaAcaoAberto(false)} style={estiloBotaoCancelar}>Cancelar</button>
                                <button type="submit" disabled={salvandoAcao} style={estiloBotaoConfirmar('#8b5cf6')}>
                                    {salvandoAcao ? 'Criando...' : 'Criar Ação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CardStat({ titulo, valor, cor }) {
    return (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h4 style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase' }}>{titulo}</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: cor, margin: '0.3rem 0' }}>{valor}</p>
        </div>
    );
}

function estiloBotaoAcao(cor) {
    return { background: cor, color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' };
}

function estiloBotaoConfirmar(cor) {
    return { background: cor, color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
}

const estiloBotaoCancelar = { background: '#e2e8f0', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' };

const estiloOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' };

function estiloModal(maxWidth) {
    return { background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: `${maxWidth}px`, maxHeight: '90vh', overflowY: 'auto', position: 'relative' };
}

const estiloFechar = { position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' };

const estiloLabel = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' };

const estiloInput = { width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', background: '#fff' };

function estiloBadgeRole(role) {
    let bg = '#e2e8f0';
    let color = '#475569';
    if (role === 'ADMIN_GERAL') { bg = '#ede9fe'; color = '#7c3aed'; }
    else if (role === 'ADMIN_SETOR') { bg = '#cffafe'; color = '#0891b2'; }
    else if (role === 'COMITE') { bg = '#fef3c7'; color = '#d97706'; }
    else if (role === 'USUARIO') { bg = '#e0f2fe'; color = '#0284c7'; }

    return { padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: bg, color: color };
}
