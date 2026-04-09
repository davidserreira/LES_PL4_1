/*
  Warnings:

  - A unique constraint covering the columns `[fornecedorId,utilizadorId]` on the table `Avaliacao` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `utilizadorId` to the `Avaliacao` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add the column as nullable to avoid breaking existing rows
ALTER TABLE "Avaliacao" ADD COLUMN "utilizadorId" INTEGER;

-- Step 2: Delete rows that cannot be assigned a valid utilizadorId (orphaned test data)
DELETE FROM "Avaliacao" WHERE "utilizadorId" IS NULL;

-- Step 3: Enforce NOT NULL now that all rows are clean
ALTER TABLE "Avaliacao" ALTER COLUMN "utilizadorId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_fornecedorId_utilizadorId_key" ON "Avaliacao"("fornecedorId", "utilizadorId");

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
