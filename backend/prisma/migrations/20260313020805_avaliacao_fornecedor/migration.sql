/*
  Warnings:

  - You are about to drop the column `pontuacao` on the `Avaliacao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Avaliacao" DROP COLUMN "pontuacao",
ADD COLUMN     "comunicacao" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "conformidade" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "pontualidade" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "preco" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "qualidade" INTEGER NOT NULL DEFAULT 3;
