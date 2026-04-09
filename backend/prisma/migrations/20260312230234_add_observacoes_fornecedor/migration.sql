/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Fornecedor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoria` to the `Fornecedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Fornecedor` table without a default value. This is not possible if the table is not empty.
  - Made the column `nif` on table `Fornecedor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contacto` on table `Fornecedor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN     "categoria" TEXT NOT NULL,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "observacoes" TEXT,
ALTER COLUMN "nif" SET NOT NULL,
ALTER COLUMN "contacto" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_email_key" ON "Fornecedor"("email");
