/*
  Warnings:

  - You are about to drop the `MovimentoStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MovimentoStock" DROP CONSTRAINT "MovimentoStock_encomendaId_fkey";

-- DropForeignKey
ALTER TABLE "MovimentoStock" DROP CONSTRAINT "MovimentoStock_produtoId_fkey";

-- DropTable
DROP TABLE "MovimentoStock";
