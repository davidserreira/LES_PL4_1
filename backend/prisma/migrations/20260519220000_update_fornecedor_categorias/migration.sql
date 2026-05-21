-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN "categorias" TEXT[];

-- Migrate Data
UPDATE "Fornecedor" SET "categorias" = ARRAY["categoria"] WHERE "categoria" IS NOT NULL;

-- Drop Old Column
ALTER TABLE "Fornecedor" DROP COLUMN "categoria";
