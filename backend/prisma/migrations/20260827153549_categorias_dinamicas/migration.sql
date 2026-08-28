-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_codigo_key" ON "categorias"("codigo");

-- AlterTable: converte a coluna categoria para texto livre, preservando os valores existentes
ALTER TABLE "materiais" ALTER COLUMN "categoria" TYPE TEXT USING "categoria"::TEXT;

-- DropEnum: remove o tipo antigo, agora sem uso
DROP TYPE IF EXISTS "Categoria";
