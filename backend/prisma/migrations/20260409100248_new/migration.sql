/*
  Warnings:

  - You are about to drop the column `ativo` on the `Produto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN     "custoTransporte" DOUBLE PRECISION,
ADD COLUMN     "diasEntrega" TEXT,
ADD COLUMN     "metodoPagamento" TEXT,
ADD COLUMN     "prazoMedioEntrega" INTEGER,
ADD COLUMN     "valorMinimoEncomenda" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Produto" DROP COLUMN "ativo";
