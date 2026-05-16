/*
  Warnings:

  - The primary key for the `ProdutoFornecedor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[produtoId,fornecedorId]` on the table `ProdutoFornecedor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "EstadoEncomenda" ADD VALUE 'ENCERRADA';

-- DropForeignKey
ALTER TABLE "ProdutoFornecedor" DROP CONSTRAINT "ProdutoFornecedor_fornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "ProdutoFornecedor" DROP CONSTRAINT "ProdutoFornecedor_produtoId_fkey";

-- AlterTable
ALTER TABLE "ProdutoFornecedor" DROP CONSTRAINT "ProdutoFornecedor_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ProdutoFornecedor_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoFornecedor_produtoId_fornecedorId_key" ON "ProdutoFornecedor"("produtoId", "fornecedorId");

-- AddForeignKey
ALTER TABLE "ProdutoFornecedor" ADD CONSTRAINT "ProdutoFornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoFornecedor" ADD CONSTRAINT "ProdutoFornecedor_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
