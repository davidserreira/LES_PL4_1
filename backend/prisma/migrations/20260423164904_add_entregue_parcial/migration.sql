-- AlterEnum
ALTER TYPE "EstadoEncomenda" ADD VALUE 'ENTREGUE_PARCIAL';

-- AlterTable
ALTER TABLE "LinhaEncomenda" ADD COLUMN     "quantidadeRecebida" DOUBLE PRECISION NOT NULL DEFAULT 0;
