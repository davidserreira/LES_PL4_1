/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'ENCOMENDADO');

-- CreateEnum
CREATE TYPE "EstadoOrdem" AS ENUM ('RASCUNHO', 'EMITIDA', 'PARCIALMENTE_ENTREGUE', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Utilizador" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaProduto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "CategoriaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT,
    "descricao" TEXT,
    "categoriaId" INTEGER NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "emailContacto" TEXT,
    "telefoneContacto" TEXT,
    "morada" TEXT,
    "nif" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoFornecedor" (
    "id" SERIAL NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    "dataAvaliacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pontuacao" DOUBLE PRECISION NOT NULL,
    "criterios" TEXT,
    "comentarios" TEXT,
    "avaliadorId" INTEGER,

    CONSTRAINT "AvaliacaoFornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "condicoesPagamento" TEXT,
    "prazosEntrega" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "urlDocumento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecoProdutoContrato" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "precoNegociado" DOUBLE PRECISION NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'EUR',

    CONSTRAINT "PrecoProdutoContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoCompraInterno" (
    "id" SERIAL NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDENTE',
    "justificacao" TEXT,
    "departamento" TEXT,

    CONSTRAINT "PedidoCompraInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedidoCompraInterno" (
    "id" SERIAL NOT NULL,
    "pedidoCompraId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidadeSolicitada" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItemPedidoCompraInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemCompra" (
    "id" SERIAL NOT NULL,
    "dataOrdem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEsperada" TIMESTAMP(3),
    "fornecedorId" INTEGER NOT NULL,
    "contratoId" INTEGER,
    "estado" "EstadoOrdem" NOT NULL DEFAULT 'EMITIDA',
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "OrdemCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrdemCompra" (
    "id" SERIAL NOT NULL,
    "ordemCompraId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidadeEncomendada" DOUBLE PRECISION NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "precoTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItemOrdemCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rececao" (
    "id" SERIAL NOT NULL,
    "ordemCompraId" INTEGER NOT NULL,
    "dataRececao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recetorId" INTEGER,
    "guiaRemessa" TEXT,

    CONSTRAINT "Rececao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRececao" (
    "id" SERIAL NOT NULL,
    "rececaoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidadeRecebida" DOUBLE PRECISION NOT NULL,
    "aceite" BOOLEAN NOT NULL DEFAULT false,
    "notasQualidade" TEXT,
    "movimentoId" INTEGER,

    CONSTRAINT "ItemRececao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoStock" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "tipoMovimento" "TipoMovimento" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,

    CONSTRAINT "MovimentoStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProduto_nome_key" ON "CategoriaProduto"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_sku_key" ON "Produto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_nif_key" ON "Fornecedor"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "ItemRececao_movimentoId_key" ON "ItemRececao"("movimentoId");

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaProduto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoFornecedor" ADD CONSTRAINT "AvaliacaoFornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoFornecedor" ADD CONSTRAINT "AvaliacaoFornecedor_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoProdutoContrato" ADD CONSTRAINT "PrecoProdutoContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoProdutoContrato" ADD CONSTRAINT "PrecoProdutoContrato_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoCompraInterno" ADD CONSTRAINT "PedidoCompraInterno_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedidoCompraInterno" ADD CONSTRAINT "ItemPedidoCompraInterno_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "PedidoCompraInterno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedidoCompraInterno" ADD CONSTRAINT "ItemPedidoCompraInterno_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemCompra" ADD CONSTRAINT "OrdemCompra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemCompra" ADD CONSTRAINT "OrdemCompra_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrdemCompra" ADD CONSTRAINT "ItemOrdemCompra_ordemCompraId_fkey" FOREIGN KEY ("ordemCompraId") REFERENCES "OrdemCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrdemCompra" ADD CONSTRAINT "ItemOrdemCompra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rececao" ADD CONSTRAINT "Rececao_ordemCompraId_fkey" FOREIGN KEY ("ordemCompraId") REFERENCES "OrdemCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rececao" ADD CONSTRAINT "Rececao_recetorId_fkey" FOREIGN KEY ("recetorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRececao" ADD CONSTRAINT "ItemRececao_rececaoId_fkey" FOREIGN KEY ("rececaoId") REFERENCES "Rececao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRececao" ADD CONSTRAINT "ItemRececao_movimentoId_fkey" FOREIGN KEY ("movimentoId") REFERENCES "MovimentoStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoStock" ADD CONSTRAINT "MovimentoStock_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
