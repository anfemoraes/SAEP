import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const senhaHash = await bcrypt.hash('admin123', 10);

  // Criar usuários padrão
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: {
      email: 'admin@email.com',
      senha: senhaHash,
      role: 'ADMIN',
    },
  });

  const comite = await prisma.usuario.upsert({
    where: { email: 'comite@email.com' },
    update: {},
    create: {
      email: 'comite@email.com',
      senha: await bcrypt.hash('comite123', 10),
      role: 'COMITE',
    },
  });

  const usuario = await prisma.usuario.upsert({
    where: { email: 'usuario@email.com' },
    update: {},
    create: {
      email: 'usuario@email.com',
      senha: await bcrypt.hash('usuario123', 10),
      role: 'USUARIO',
    },
  });

  console.log('✅ Seed concluído!');
  console.log(`👤 Admin: admin@email.com / admin123`);
  console.log(`👤 Comitê: comite@email.com / comite123`);
  console.log(`👤 Usuário: usuario@email.com / usuario123`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });