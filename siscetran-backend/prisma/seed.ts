import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { acoesFrontend, converterAcaoParaPrisma } from './acoes-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ADMIN_GERAL: acesso total, sem setor fixo.
  await prisma.usuario.upsert({
    where: { email: 'admin.geral@petrans.pa.gov.br' },
    update: {},
    create: {
      email: 'admin.geral@petrans.pa.gov.br',
      senha: await bcrypt.hash('AdminGeral@123', 10),
      role: 'ADMIN_GERAL',
      ultimaTrocaSenha: new Date(),
    },
  });

  // ADMIN_SETOR: gerencia usuários e matrizes apenas do setor CTSIST.
  await prisma.usuario.upsert({
    where: { email: 'admin.ctsist@petrans.pa.gov.br' },
    update: {},
    create: {
      email: 'admin.ctsist@petrans.pa.gov.br',
      senha: await bcrypt.hash('AdminSetor@123', 10),
      role: 'ADMIN_SETOR',
      setor: 'CTSIST',
      ultimaTrocaSenha: new Date(),
    },
  });

  // COMITE: conselheiro, vota nas matrizes enviadas, vê todas.
  await prisma.usuario.upsert({
    where: { email: 'comite@petrans.pa.gov.br' },
    update: {},
    create: {
      email: 'comite@petrans.pa.gov.br',
      senha: await bcrypt.hash('Comite@123', 10),
      role: 'COMITE',
      ultimaTrocaSenha: new Date(),
    },
  });

  // USUARIO: cria/edita apenas suas próprias matrizes, do setor CTSIST.
  await prisma.usuario.upsert({
    where: { email: 'usuario.ctsist@petrans.pa.gov.br' },
    update: {},
    create: {
      email: 'usuario.ctsist@petrans.pa.gov.br',
      senha: await bcrypt.hash('Usuario@123', 10),
      role: 'USUARIO',
      setor: 'CTSIST',
      ultimaTrocaSenha: new Date(),
    },
  });

  console.log(`👤 Admin Geral:  admin.geral@petrans.pa.gov.br / AdminGeral@123`);
  console.log(`👤 Admin Setor:  admin.ctsist@petrans.pa.gov.br / AdminSetor@123 (setor: CTSIST)`);
  console.log(`👤 Conselheiro:  comite@petrans.pa.gov.br / Comite@123`);
  console.log(`👤 Usuário:      usuario.ctsist@petrans.pa.gov.br / Usuario@123 (setor: CTSIST)`);

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
        console.error(`❌ Erro ao importar ação ${acaoFrontend.id}:`, error.message);
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