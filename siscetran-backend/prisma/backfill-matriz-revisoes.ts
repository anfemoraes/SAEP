import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matrizes = await prisma.matriz.findMany({
    select: {
      id: true,
      criadoPorId: true,
      votos: {
        select: {
          id: true,
          revisaoId: true,
          usuarioId: true,
          voto: true,
          comentario: true,
          createdAt: true,
        },
      },
    },
  });

  for (const matriz of matrizes) {
    let revisao = await prisma.matrizRevisao.findFirst({
      where: { matrizId: matriz.id },
      orderBy: { numero: 'asc' },
    });

    if (!revisao) {
      revisao = await prisma.matrizRevisao.create({
        data: {
          matrizId: matriz.id,
          numero: 1,
          criadoPorId: matriz.criadoPorId,
          observacao: 'Revisão inicial criada por backfill de dados existentes.',
        },
      });
    }

    for (const voto of matriz.votos) {
      if (voto.revisaoId && voto.revisaoId !== revisao.id) {
        continue;
      }

      await prisma.voto.update({
        where: { id: voto.id },
        data: {
          revisaoId: revisao.id,
        },
      });
    }
  }

  console.log(`Backfill concluído para ${matrizes.length} matrizes.`);
}

main()
  .catch((error) => {
    console.error('Erro no backfill de revisões:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
