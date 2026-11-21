CREATE TYPE "StatusProntuario" AS ENUM ('EM_ANALISE', 'FINALIZADO');

CREATE TABLE "prontuarios" (
    "id" SERIAL NOT NULL,
    "paciente" VARCHAR(150) NOT NULL,
    "medico" VARCHAR(150) NOT NULL,
    "data" DATE NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "observacoes" TEXT NOT NULL,
    "status" "StatusProntuario" NOT NULL DEFAULT 'EM_ANALISE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prontuarios_pkey" PRIMARY KEY ("id")
);
