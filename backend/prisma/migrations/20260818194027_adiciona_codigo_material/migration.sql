/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `materiais` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "materiais" ADD COLUMN     "codigo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "materiais_codigo_key" ON "materiais"("codigo");
