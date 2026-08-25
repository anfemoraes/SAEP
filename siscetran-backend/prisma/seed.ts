import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { acoesFrontend, converterAcaoParaPrisma } from './acoes-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ADMIN_GERAL: acesso total, sem setor fixo.
  await prisma.usuario.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: {
      email: 'admin@email.com',
      senha: await bcrypt.hash('admin123', 10),
      role: 'ADMIN_GERAL',
      ultimaTrocaSenha: new Date(),
    },
  });

  // ADMIN_SETOR: gerencia usuários e matrizes apenas do setor CTSIST.
  await prisma.usuario.upsert({
    where: { email: 'adminsetor@email.com' },
    update: {},
    create: {
      email: 'adminsetor@email.com',
      senha: await bcrypt.hash('adminsetor123', 10),
      role: 'ADMIN_SETOR',
      setor: 'CTSIST',
      ultimaTrocaSenha: new Date(),
    },
  });

  // COMITE: conselheiro, vota nas matrizes enviadas, vê todas.
  await prisma.usuario.upsert({
    where: { email: 'comite@email.com' },
    update: {},
    create: {
      email: 'comite@email.com',
      senha: await bcrypt.hash('comite123', 10),
      role: 'COMITE',
      ultimaTrocaSenha: new Date(),
    },
  });

  // USUARIO: cria/edita apenas suas próprias matrizes, do setor CTSIST.
  await prisma.usuario.upsert({
    where: { email: 'usuario@email.com' },
    update: {},
    create: {
      email: 'usuario@email.com',
      senha: await bcrypt.hash('usuario123', 10),
      role: 'USUARIO',
      setor: 'CTSIST',
      ultimaTrocaSenha: new Date(),
    },
  });

  console.log(`👤 Admin Geral:  admin@email.com / admin123`);
  console.log(`👤 Admin Setor:  adminsetor@email.com / adminsetor123 (setor: CTSIST)`);
  console.log(`👤 Conselheiro:  comite@email.com / comite123`);
  console.log(`👤 Usuário:      usuario@email.com / usuario123 (setor: CTSIST)`);

  // Ações estratégicas (importadas de acoes_data.js do frontend)
  if (acoesFrontend.length === 0) {
    console.warn(
      '⚠️  Nenhuma ação estratégica encontrada em prisma/acoes-seed.ts. ' +
        'Cole os dados de acoes_data.js em `acoesFrontend` para popular a tabela Acao.',
    );
  } else {
    let criadas = 0;
    let erros = 0;

    for (let i = 0; i < acoesFrontend.length; i++) {
      const acaoFrontend = acoesFrontend[i];
      try {
        const dados = converterAcaoParaPrisma(acaoFrontend, i + 1);
        await prisma.acao.upsert({
          where: { id: dados.id },
          update: dados,
          create: dados,
        });
        criadas++;
      } catch (error) {
        erros++;
        const mensagemErro = error instanceof Error ? error.message : String(error);
        console.error(`❌ Erro ao importar ação ${acaoFrontend.id}:`, mensagemErro);
      }
    }

    console.log(`📋 Ações estratégicas importadas: ${criadas} (erros: ${erros})`);
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });