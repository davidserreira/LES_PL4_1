import prisma from './src/lib/prisma';

async function main() {
    try {
        const pedido = await prisma.pedidoCompra.create({
            data: {
                valorTotalEstimado: 10000,
                linhas: {
                    create: [
                        {
                            produtoId: 1,
                            quantidade: 2,
                            precoUnitario: 5000,
                            valorTotal: 10000
                        }
                    ]
                }
            },
            include: {
                linhas: true
            }
        });
        console.log("Success:", JSON.stringify(pedido));
    } catch (e) {
        console.error("Prisma Error:", e);
    }
}
main();
