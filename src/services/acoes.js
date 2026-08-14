// src/services/acoes.js
import { api } from './api';

export function listarAcoes(filtros = {}) {
  const query = new URLSearchParams();
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) query.set(chave, valor);
  });
  const qs = query.toString();
  return api.get(`/acoes${qs ? `?${qs}` : ''}`);
}

export function buscarAcao(id) {
  return api.get(`/acoes/${encodeURIComponent(id)}`);
}

export function criarAcao(dados) {
  return api.post('/acoes', dados);
}

export function atualizarAcao(id, dados) {
  return api.put(`/acoes/${encodeURIComponent(id)}`, dados);
}

export function removerAcao(id) {
  return api.delete(`/acoes/${encodeURIComponent(id)}`);
}
