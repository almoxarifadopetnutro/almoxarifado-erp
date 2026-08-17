-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMINISTRADOR', 'ALMOXARIFE');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('EPI', 'LIMPEZA', 'ESCRITORIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "AcaoRegistro" AS ENUM ('CRIACAO', 'ALTERACAO', 'EXCLUSAO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'ALMOXARIFE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "unidade" TEXT NOT NULL,
    "estoqueAtual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estoqueMinimo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "fornecedor" TEXT,
    "setorDestino" TEXT,
    "motivo" TEXT,
    "observacao" TEXT,
    "materialId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "acao" "AcaoRegistro" NOT NULL,
    "detalhes" TEXT,
    "usuarioNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
