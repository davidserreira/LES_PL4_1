/*
  Warnings:

  - You are about to drop the column `email` on the `Utilizador` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `Utilizador` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Utilizador` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Utilizador` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'RESPONSAVEL_STOCK', 'RESPONSAVEL_FINANCEIRO');

-- DropIndex
DROP INDEX "Utilizador_email_key";

-- AlterTable
ALTER TABLE "Utilizador" DROP COLUMN "email",
DROP COLUMN "nome",
ADD COLUMN     "password" TEXT NOT NULL DEFAULT '123456',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'RESPONSAVEL_STOCK',
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_username_key" ON "Utilizador"("username");
