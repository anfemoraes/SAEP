// src/components/Footer.jsx
import React from 'react';

export function Footer() {
    return (
        <footer style={{ 
            background: '#ffffff', 
            borderTop: '1px solid #e2e8f0', 
            padding: '1.5rem 2rem', 
            textAlign: 'center', 
            color: '#64748b', 
            fontSize: '0.85rem',
            marginTop: 'auto'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>
                    SAEP &mdash; Sistema de Ações Estratégicas do PETRANS
                </p>
                <p style={{ margin: 0 }}>
                    Conselho Estadual de Trânsito do Estado do Pará &copy; {new Date().getFullYear()} &mdash; Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}