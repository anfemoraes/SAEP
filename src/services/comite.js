// src/services/comite.js
import { api } from './api';

export function listarPendentes() {
  return api.get('/comite/pendentes');
}

export function estatisticasComite() {
  return api.get('/comite/estatisticas');
}

export function listarMatrizesComite(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return api.get(`/comite/matrizes${qs}`);
}

export function buscarMatrizComite(id) {
  return api.get(`/comite/matrizes/${id}`);
}

export function votarComite(id, voto, comentario) {
  return api.post(`/comite/matrizes/${id}/votar`, { voto, comentario });
}

/** Decisão final — só Admin Geral. */
export function avaliarComite(id, status, comentario) {
  return api.put(`/comite/matrizes/${id}/avaliar`, { status, comentario });
}
