import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Clearing Fornecedores to allow schema changes...');
        // We delete Avaliacao and PedidoCompra first if they have foreign keys pointing to Fornecedor
        await prisma.avaliacao.deleteMany({});
        await prisma.pedidoCompra.deleteMany({});
        await prisma.fornecedor.deleteMany({});
        console.log('Successfully cleared Fornecedores.');
    } catch (error) {
        console.error('Error clearing database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
