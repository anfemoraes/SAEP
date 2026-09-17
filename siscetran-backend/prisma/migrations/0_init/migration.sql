-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USUARIO', 'COMITE', 'ADMIN_SETOR', 'ADMIN_GERAL');

-- CreateEnum
CREATE TYPE "TipoVoto" AS ENUM ('APROVAR', 'REJEITAR');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "Impacto" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "Prazo" AS ENUM ('CURTO_PRAZO', 'MEDIO_PRAZO', 'LONGO_PRAZO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USUARIO',
    "setor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaTrocaSenha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voto" (
    "id" TEXT NOT NULL,
    "matrizId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "voto" "TipoVoto" NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matriz" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "oque" TEXT NOT NULL,
    "porque" TEXT NOT NULL,
    "como" TEXT NOT NULL,
    "quando" TEXT NOT NULL,
    "onde" TEXT NOT NULL,
    "quanto" TEXT NOT NULL,
    "impacto" "Impacto" NOT NULL DEFAULT 'MEDIO',
    "observacao" TEXT,
    "percentual" INTEGER NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'RASCUNHO',
    "comentarioComite" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "avaliadoPorId" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAvaliacao" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matriz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcoesMatriz" (
    "id" TEXT NOT NULL,
    "matrizId" TEXT NOT NULL,
    "acaoId" TEXT NOT NULL,
    "etapas" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "AcoesMatriz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acao" (
    "id" TEXT NOT NULL,
    "og" TEXT,
    "lae" TEXT,
    "projetoCodigo" TEXT,
    "projetoNome" TEXT,
    "projetoTema" TEXT,
    "diretriz" TEXT NOT NULL,
    "prazo" "Prazo" NOT NULL,
    "setor" TEXT,
    "meta" TEXT NOT NULL,
    "indicador" TEXT NOT NULL,
    "restricoes" TEXT,
    "linhaPlanilha" INTEGER NOT NULL,
    "responsavel" TEXT,
    "dadosIncompletos" TEXT[],

    CONSTRAINT "Acao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_resetToken_key" ON "Usuario"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Voto_matrizId_usuarioId_key" ON "Voto"("matrizId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AcoesMatriz_matrizId_acaoId_key" ON "AcoesMatriz"("matrizId", "acaoId");

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_matrizId_fkey" FOREIGN KEY ("matrizId") REFERENCES "Matriz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matriz" ADD CONSTRAINT "Matriz_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matriz" ADD CONSTRAINT "Matriz_avaliadoPorId_fkey" FOREIGN KEY ("avaliadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcoesMatriz" ADD CONSTRAINT "AcoesMatriz_matrizId_fkey" FOREIGN KEY ("matrizId") REFERENCES "Matriz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcoesMatriz" ADD CONSTRAINT "AcoesMatriz_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "Acao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
