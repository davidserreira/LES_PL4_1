-- CreateEnum
CREATE TYPE "PrioridadePedido" AS ENUM ('NORMAL', 'ALTA', 'URGENTE');

-- AlterTable
ALTER TABLE "PedidoCompra" ADD COLUMN     "prioridade" "PrioridadePedido" NOT NULL DEFAULT 'NORMAL';
