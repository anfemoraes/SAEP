// src/services/usuarios.js
import { api } from './api';

export function listarUsuarios(busca = '') {
  const qs = busca ? `?busca=${encodeURIComponent(busca)}` : '';
  return api.get(`/usuarios${qs}`);
}

export function buscarUsuario(id) {
  return api.get(`/usuarios/${id}`);
}

export function criarUsuario(dados) {
  return api.post('/usuarios', dados);
}

export function atualizarUsuario(id, dados) {
  return api.put(`/usuarios/${id}`, dados);
}

export function atualizarRoleUsuario(id, role) {
  return api.put(`/usuarios/${id}/role`, { role });
}

export function ativarUsuario(id) {
  return api.put(`/usuarios/${id}/ativar`);
}

export function desativarUsuario(id) {
  return api.put(`/usuarios/${id}/desativar`);
}

export function removerUsuario(id) {
  return api.delete(`/usuarios/${id}`);
}
