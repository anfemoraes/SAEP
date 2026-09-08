import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface DadoBackfill {
  id: string;
  projetoCodigo: string | null;
  projetoNome: string | null;
  projetoTema: string | null;
  og: string | null;
  lae: string | null;
}

async function main() {
  const arquivo = join(__dirname, 'backfill-dados.json');

  const dados: DadoBackfill[] = JSON.parse(
    readFileSync(arquivo, 'utf8'),
  );

  console.log(`Registros no arquivo: ${dados.length}`);

  let atualizados = 0;
  let naoEncontrados = 0;

  for (const acao of dados) {
    const existente = await prisma.acao.findUnique({
      where: { id: acao.id },
      select: { id: true },
    });

    if (!existente) {
      console.warn(`Ação não encontrada: ${acao.id}`);
      naoEncontrados++;
      continue;
    }

    await prisma.acao.update({
      where: { id: acao.id },
      data: {
        projetoCodigo: acao.projetoCodigo,
        projetoNome: acao.projetoNome,
        projetoTema: acao.projetoTema,
        og: acao.og,
        lae: acao.lae,
      },
    });

    atualizados++;
  }

  console.log('');
  console.log('Backfill concluído.');
  console.log(`Atualizados: ${atualizados}`);
  console.log(`Não encontrados: ${naoEncontrados}`);
}

main()
  .catch((error) => {
    console.error('❌ Erro no backfill:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });