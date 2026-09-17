BEGIN;

CREATE TABLE "MatrizRevisao" (
  "id" TEXT NOT NULL,
  "matrizId" TEXT NOT NULL,
  "numero" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criadoPorId" TEXT,
  "observacao" TEXT,
  CONSTRAINT "MatrizRevisao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatrizRevisao_matrizId_numero_key"
  ON "MatrizRevisao" ("matrizId", "numero");
CREATE INDEX "MatrizRevisao_matrizId_idx"
  ON "MatrizRevisao" ("matrizId");
CREATE INDEX "MatrizRevisao_criadoPorId_idx"
  ON "MatrizRevisao" ("criadoPorId");

ALTER TABLE "Voto" ADD COLUMN "revisaoId" TEXT;

INSERT INTO "MatrizRevisao" ("id", "matrizId", "numero", "criadoPorId", "observacao")
SELECT
  'rev_' || md5(m."id" || ':1'),
  m."id",
  1,
  m."criadoPorId",
  'Revisão inicial criada durante a migração.'
FROM "Matriz" m;

UPDATE "Voto" v
SET "revisaoId" = r."id"
FROM "MatrizRevisao" r
WHERE r."matrizId" = v."matrizId"
  AND r."numero" = 1;

ALTER TABLE "Voto"
  ALTER COLUMN "revisaoId" SET NOT NULL;

DROP INDEX IF EXISTS "Voto_matrizId_usuarioId_key";
CREATE UNIQUE INDEX "Voto_revisaoId_usuarioId_key"
  ON "Voto" ("revisaoId", "usuarioId");
CREATE INDEX "Voto_revisaoId_idx"
  ON "Voto" ("revisaoId");
CREATE INDEX "Voto_usuarioId_idx"
  ON "Voto" ("usuarioId");

ALTER TABLE "MatrizRevisao"
  ADD CONSTRAINT "MatrizRevisao_matrizId_fkey"
  FOREIGN KEY ("matrizId") REFERENCES "Matriz" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatrizRevisao"
  ADD CONSTRAINT "MatrizRevisao_criadoPorId_fkey"
  FOREIGN KEY ("criadoPorId") REFERENCES "Usuario" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Voto"
  ADD CONSTRAINT "Voto_revisaoId_fkey"
  FOREIGN KEY ("revisaoId") REFERENCES "MatrizRevisao" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
