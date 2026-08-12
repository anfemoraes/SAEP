// src/services/storage.js

const DB_KEY = "siscetran_db";

export function carregarBanco() {
    try {
        const dadosSalvos = localStorage.getItem(DB_KEY);
        const registrosLegados = localStorage.getItem("registros");
        
        const usuariosMock = [
            { email: "usuario@email.com", senha: "usuario123", role: "usuario" },
            { email: "comite@email.com", senha: "comite123", role: "comite" },
            { email: "admin@email.com", senha: "admin123", role: "admin" }
        ];

        // Se já existe banco salvo
        if (dadosSalvos) {
            const db = JSON.parse(dadosSalvos);
            
            // Garante que a estrutura está correta
            if (!db.usuarios || db.usuarios.length === 0) {
                db.usuarios = usuariosMock;
            }
            
            if (!Array.isArray(db.registros)) {
                db.registros = [];
            }
            
            return db;
        }

        // Migração de dados do sistema antigo
        let registrosMigrados = [];
        if (registrosLegados) {
            try {
                registrosMigrados = JSON.parse(registrosLegados);
                if (!Array.isArray(registrosMigrados)) {
                    registrosMigrados = [];
                }
            } catch (e) {
                registrosMigrados = [];
            }
        }

        // Cria banco novo
        const bancoInicial = {
            usuarios: usuariosMock,
            registros: registrosMigrados
        };

        localStorage.setItem(DB_KEY, JSON.stringify(bancoInicial));
        return bancoInicial;
        
    } catch (error) {
        console.error('Erro ao carregar banco:', error);
        // Retorna banco vazio em caso de erro
        return {
            usuarios: [
                { email: "usuario@email.com", senha: "usuario123", role: "usuario" },
                { email: "comite@email.com", senha: "comite123", role: "comite" },
                { email: "admin@email.com", senha: "admin123", role: "admin" }
            ],
            registros: []
        };
    }
}

export function salvarBanco(db) {
    try {
        // CORRIGIDO: Usa o db recebido, não uma variável undefined
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        
        // Dispara evento para notificar outros componentes
        window.dispatchEvent(new Event('storage'));
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar banco:', error);
        return false;
    }
}

export function carregarSessao() {
    try {
        const usuarioSalvo = localStorage.getItem("usuarioLogadoDados");
        return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        return null;
    }
}

export function salvarSessao(usuario) {
    try {
        localStorage.setItem("usuarioLogadoDados", JSON.stringify(usuario));
        localStorage.setItem("usuarioLogado", "true");
        return true;
    } catch (error) {
        console.error('Erro ao salvar sessão:', error);
        return false;
    }
}

export function limparSessao() {
    try {
        localStorage.removeItem("usuarioLogadoDados");
        localStorage.removeItem("usuarioLogado");
        return true;
    } catch (error) {
        console.error('Erro ao limpar sessão:', error);
        return false;
    }
}

// Utilitário para obter registros de forma segura
export function carregarRegistros() {
    const db = carregarBanco();
    return db.registros || [];
}

// Utilitário para obter usuários de forma segura
export function carregarUsuarios() {
    const db = carregarBanco();
    return db.usuarios || [];
}