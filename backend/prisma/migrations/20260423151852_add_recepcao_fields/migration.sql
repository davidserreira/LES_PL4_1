-- CreateEnum
CREATE TYPE "EstadoEncomenda" AS ENUM ('EMITIDA', 'ENVIADA', 'ENTREGUE', 'CANCELADA');

-- AlterTable
ALTER TABLE "LinhaPedidoCompra" ADD COLUMN     "fornecedorId" INTEGER;

-- CreateTable
CREATE TABLE "Encomenda" (
    "id" SERIAL NOT NULL,
    "codigoFormatado" TEXT NOT NULL,
    "estado" "EstadoEncomenda" NOT NULL DEFAULT 'EMITIDA',
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEntregaPrevista" TIMESTAMP(3),
    "dataEntregaReal" TIMESTAMP(3),
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "fornecedorId" INTEGER NOT NULL,
    "pedidoCompraId" INTEGER NOT NULL,

    CONSTRAINT "Encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinhaEncomenda" (
    "id" SERIAL NOT NULL,
    "encomendaId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "quantidadeRecebida" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LinhaEncomenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Encomenda_codigoFormatado_key" ON "Encomenda"("codigoFormatado");

-- AddForeignKey
ALTER TABLE "LinhaPedidoCompra" ADD CONSTRAINT "LinhaPedidoCompra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encomenda" ADD CONSTRAINT "Encomenda_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encomenda" ADD CONSTRAINT "Encomenda_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "PedidoCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaEncomenda" ADD CONSTRAINT "LinhaEncomenda_encomendaId_fkey" FOREIGN KEY ("encomendaId") REFERENCES "Encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaEncomenda" ADD CONSTRAINT "LinhaEncomenda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
