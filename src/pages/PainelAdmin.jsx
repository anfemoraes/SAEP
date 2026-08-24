// src/pages/PainelAdmin.jsx
import React, { useState } from 'react';
import { carregarBanco, salvarBanco } from '../services/storage';
import { acoesEstrategicas } from '../services/acoes_data';
import Swal from 'sweetalert2';

export function PainelAdmin({ usuarioLogado }) {
    const [db, setDb] = useState(carregarBanco());
    const usuarios = db.usuarios || [];

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

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Painel do Administrador</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Gerenciamento global de acessos, usuários e ações base do SISCETRAN.</p>
            </div>

            {/* Seção de Usuários */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1rem' }}>Usuários Cadastrados</h3>
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px' }}>E-mail / Usuário</th>
                                <th style={{ padding: '12px' }}>Perfil (Role)</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{u.email}</td>
                                    <td style={{ padding: '12px' }}><span style={estiloBadgeRole(u.role)}>{u.role.toUpperCase()}</span></td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleRemoverUsuario(u.email)} 
                                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Seção de Ações Estratégicas Base */}
            <div>
                <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1rem' }}>Ações Estratégicas Base Integradas</h3>
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{a.id}</td>
                                    <td style={{ padding: '12px', color: '#1e293b' }}>{a.diretriz}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{a.setor}</td>
                                    <td style={{ padding: '12px' }}>{a.prazo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
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