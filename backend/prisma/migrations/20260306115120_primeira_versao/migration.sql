/*
  Warnings:

  - You are about to drop the column `ativo` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `atualizadoEm` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `criadoEm` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `emailContacto` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `morada` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `telefoneContacto` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to drop the column `atualizadoEm` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `categoriaId` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `stockAtual` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `stockMinimo` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `unidadeMedida` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the `AvaliacaoFornecedor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoriaProduto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contrato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemOrdemCompra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemPedidoCompraInterno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemRececao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MovimentoStock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrdemCompra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoCompraInterno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrecoProdutoContrato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rececao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AvaliacaoFornecedor" DROP CONSTRAINT "AvaliacaoFornecedor_avaliadorId_fkey";

-- DropForeignKey
ALTER TABLE "AvaliacaoFornecedor" DROP CONSTRAINT "AvaliacaoFornecedor_fornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "Contrato" DROP CONSTRAINT "Contrato_fornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "ItemOrdemCompra" DROP CONSTRAINT "ItemOrdemCompra_ordemCompraId_fkey";

-- DropForeignKey
ALTER TABLE "ItemOrdemCompra" DROP CONSTRAINT "ItemOrdemCompra_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedidoCompraInterno" DROP CONSTRAINT "ItemPedidoCompraInterno_pedidoCompraId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedidoCompraInterno" DROP CONSTRAINT "ItemPedidoCompraInterno_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemRececao" DROP CONSTRAINT "ItemRececao_movimentoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemRececao" DROP CONSTRAINT "ItemRececao_rececaoId_fkey";

-- DropForeignKey
ALTER TABLE "MovimentoStock" DROP CONSTRAINT "MovimentoStock_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "OrdemCompra" DROP CONSTRAINT "OrdemCompra_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "OrdemCompra" DROP CONSTRAINT "OrdemCompra_fornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoCompraInterno" DROP CONSTRAINT "PedidoCompraInterno_solicitanteId_fkey";

-- DropForeignKey
ALTER TABLE "PrecoProdutoContrato" DROP CONSTRAINT "PrecoProdutoContrato_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "PrecoProdutoContrato" DROP CONSTRAINT "PrecoProdutoContrato_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "Rececao" DROP CONSTRAINT "Rececao_ordemCompraId_fkey";

-- DropForeignKey
ALTER TABLE "Rececao" DROP CONSTRAINT "Rececao_recetorId_fkey";

-- DropIndex
DROP INDEX "Produto_sku_key";

-- AlterTable
ALTER TABLE "Fornecedor" DROP COLUMN "ativo",
DROP COLUMN "atualizadoEm",
DROP COLUMN "criadoEm",
DROP COLUMN "emailContacto",
DROP COLUMN "morada",
DROP COLUMN "telefoneContacto",
ADD COLUMN     "contacto" TEXT;

-- AlterTable
ALTER TABLE "Produto" DROP COLUMN "atualizadoEm",
DROP COLUMN "categoriaId",
DROP COLUMN "descricao",
DROP COLUMN "sku",
DROP COLUMN "stockAtual",
DROP COLUMN "stockMinimo",
DROP COLUMN "unidadeMedida",
ADD COLUMN     "stock" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "AvaliacaoFornecedor";

-- DropTable
DROP TABLE "CategoriaProduto";

-- DropTable
DROP TABLE "Contrato";

-- DropTable
DROP TABLE "ItemOrdemCompra";

-- DropTable
DROP TABLE "ItemPedidoCompraInterno";

-- DropTable
DROP TABLE "ItemRececao";

-- DropTable
DROP TABLE "MovimentoStock";

-- DropTable
DROP TABLE "OrdemCompra";

-- DropTable
DROP TABLE "PedidoCompraInterno";

-- DropTable
DROP TABLE "PrecoProdutoContrato";

-- DropTable
DROP TABLE "Rececao";

-- DropEnum
DROP TYPE "EstadoOrdem";

-- DropEnum
DROP TYPE "EstadoPedido";

-- DropEnum
DROP TYPE "TipoMovimento";

-- CreateTable
CREATE TABLE "PedidoCompra" (
    "id" SERIAL NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "responsavelId" INTEGER NOT NULL,
    "fornecedorId" INTEGER NOT NULL,

    CONSTRAINT "PedidoCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PedidoCompra" ADD CONSTRAINT "PedidoCompra_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoCompra" ADD CONSTRAINT "PedidoCompra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
