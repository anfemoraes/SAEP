// src/services/dashboard.js
import { api } from './api';

export function obterKpis() {
  return api.get('/dashboard/kpis');
}

export function obterGraficos() {
  return api.get('/dashboard/graficos');
}

export function obterResumo() {
  return api.get('/dashboard/resumo');
}

export function obterMatrizesAprovadas() {
  return api.get('/dashboard/matrizes/aprovadas');
}
