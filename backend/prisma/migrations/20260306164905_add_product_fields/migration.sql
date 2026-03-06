-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "preco" DOUBLE PRECISION NOT NULL DEFAULT 0;
