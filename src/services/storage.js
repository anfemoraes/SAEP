// src/services/storage.js

const DB_KEY = "siscetran_db";

export function carregarBanco() {
    const dadosSalvos = JSON.parse(localStorage.getItem(DB_KEY));
    const registrosLegados = JSON.parse(localStorage.getItem("registros"));

    const usuariosMock = [
        { email: "usuario@email.com", senha: "usuario123", role: "usuario" },
        { email: "comite@email.com", senha: "comite123", role: "comite" },
        { email: "admin@email.com", senha: "admin123", role: "admin" }
    ];

    if (dadosSalvos && Array.isArray(dadosSalvos.registros)) {
        if (!dadosSalvos.usuarios || dadosSalvos.usuarios.length === 0) {
            dadosSalvos.usuarios = usuariosMock;
            localStorage.setItem(DB_KEY, JSON.stringify(dadosSalvos));
        }
        return dadosSalvos;
    }

    const bancoInicial = {
        usuarios: usuariosMock,
        registros: Array.isArray(registrosLegados) ? registrosLegados : []
    };

    localStorage.setItem(DB_KEY, JSON.stringify(bancoInicial));
    return bancoInicial;
}

export function salvarBanco(db) {
    db.registros = registros;
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function carregarSessao() {
    const usuarioSalvo = localStorage.getItem("usuarioLogadoDados");
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
}

export function salvarSessao(usuario) {
    localStorage.setItem("usuarioLogadoDados", JSON.stringify(usuario));
    localStorage.setItem("usuarioLogado", "true");
}

export function limparSessao() {
    localStorage.removeItem("usuarioLogadoDados");
    localStorage.removeItem("usuarioLogado");
}