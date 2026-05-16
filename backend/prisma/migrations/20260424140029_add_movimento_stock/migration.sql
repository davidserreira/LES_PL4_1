-- CreateTable
CREATE TABLE "MovimentoStock" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL DEFAULT 'ENTRADA',
    "origem" TEXT,
    "encomendaId" INTEGER,

    CONSTRAINT "MovimentoStock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovimentoStock" ADD CONSTRAINT "MovimentoStock_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
