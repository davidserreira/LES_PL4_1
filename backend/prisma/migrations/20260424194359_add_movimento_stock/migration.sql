/*
  Warnings:

  - Made the column `origem` on table `MovimentoStock` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "MovimentoStock" ALTER COLUMN "origem" SET NOT NULL,
ALTER COLUMN "origem" SET DEFAULT 'ENCOMENDA';

-- AddForeignKey
ALTER TABLE "MovimentoStock" ADD CONSTRAINT "MovimentoStock_encomendaId_fkey" FOREIGN KEY ("encomendaId") REFERENCES "Encomenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
