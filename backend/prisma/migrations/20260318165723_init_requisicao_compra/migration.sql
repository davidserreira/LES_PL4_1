/*
  Warnings:

  - You are about to drop the column `dataPedido` on the `PedidoCompra` table. All the data in the column will be lost.
  - You are about to drop the column `fornecedorId` on the `PedidoCompra` table. All the data in the column will be lost.
  - You are about to drop the column `responsavelId` on the `PedidoCompra` table. All the data in the column will be lost.
  - You are about to drop the `ItemPedido` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `atualizadoEm` to the `PedidoCompra` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_pedidoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoCompra" DROP CONSTRAINT "PedidoCompra_fornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoCompra" DROP CONSTRAINT "PedidoCompra_responsavelId_fkey";

-- AlterTable
ALTER TABLE "PedidoCompra" DROP COLUMN "dataPedido",
DROP COLUMN "fornecedorId",
DROP COLUMN "responsavelId",
ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criadoPorId" INTEGER,
ADD COLUMN     "valorTotalEstimado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "ItemPedido";

-- CreateTable
CREATE TABLE "LinhaPedidoCompra" (
    "id" SERIAL NOT NULL,
    "pedidoCompraId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LinhaPedidoCompra_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PedidoCompra" ADD CONSTRAINT "PedidoCompra_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaPedidoCompra" ADD CONSTRAINT "LinhaPedidoCompra_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "PedidoCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaPedidoCompra" ADD CONSTRAINT "LinhaPedidoCompra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
