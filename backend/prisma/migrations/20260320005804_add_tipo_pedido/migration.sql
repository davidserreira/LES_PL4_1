-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('MANUAL', 'AUTOMATICO');

-- AlterTable
ALTER TABLE "PedidoCompra" ADD COLUMN     "tipo" "TipoPedido" NOT NULL DEFAULT 'MANUAL';
