import { Role } from '@prisma/client';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('🌱 Iniciando o seeding da base de dados...');

    // 1. Criar Utilizadores Gestores
    const gestor = await prisma.utilizador.upsert({
        where: { username: 'gestor' },
        update: { password: '1234' },
        create: {
            username: 'gestor',
            password: '1234',
            role: Role.RESPONSAVEL_STOCK
        }
    });
    console.log(`✅ Utilizador: Gestor de Stock (${gestor.id})`);

    const admin = await prisma.utilizador.upsert({
        where: { username: 'admin' },
        update: { password: '1234' },
        create: {
            username: 'admin',
            password: '1234',
            role: Role.ADMINISTRADOR
        }
    });
    console.log(`✅ Utilizador: Admin (${admin.id})`);

    const financeiro = await prisma.utilizador.upsert({
        where: { username: 'financeiro' },
        update: { password: '1234' },
        create: {
            username: 'financeiro',
            password: '1234',
            role: Role.RESPONSAVEL_FINANCEIRO
        }
    });
    console.log(`✅ Utilizador: Financeiro (${financeiro.id})`);

    // 2. Criar Fornecedores de teste
    const fornecedorA = await prisma.fornecedor.upsert({
        where: { nif: '123456789' },
        update: {
            valorMinimoEncomenda: 80.00,
            prazoMedioEntrega: 3,
            custoTransporte: 12.00
        },
        create: {
            nome: 'PetFood Elite Lda',
            nif: '123456789',
            contacto: '912345678',
            email: 'encomendas@petfood.pt',
            estado: true,
            categoria: 'Alimentação',
            observacoes: 'Fornecedor principal de rações premium.',
            valorMinimoEncomenda: 80.00,
            prazoMedioEntrega: 3,
            custoTransporte: 12.00
        }
    });

    const fornecedorB = await prisma.fornecedor.upsert({
        where: { nif: '987654321' },
        update: {
            valorMinimoEncomenda: 150.00,
            prazoMedioEntrega: 7,
            custoTransporte: 25.00
        },
        create: {
            nome: 'VetPharma SA',
            nif: '987654321',
            contacto: '210987654',
            email: 'labs@vetpharma.pt',
            estado: true,
            categoria: 'Medicamentos',
            observacoes: 'Material cirúrgico e vacinação.',
            valorMinimoEncomenda: 150.00,
            prazoMedioEntrega: 7,
            custoTransporte: 25.00
        }
    });
    
    await prisma.avaliacao.upsert({
        where: { fornecedorId_utilizadorId: { fornecedorId: fornecedorA.id, utilizadorId: admin.id } },
        update: {},
        create: { fornecedorId: fornecedorA.id, utilizadorId: admin.id, qualidade: 5, pontualidade: 4, preco: 4, comunicacao: 5, conformidade: 5 }
    });

    await prisma.avaliacao.upsert({
        where: { fornecedorId_utilizadorId: { fornecedorId: fornecedorB.id, utilizadorId: admin.id } },
        update: {},
        create: { fornecedorId: fornecedorB.id, utilizadorId: admin.id, qualidade: 4, pontualidade: 3, preco: 2, comunicacao: 4, conformidade: 5 }
    });

    console.log(`✅ Fornecedores criados e Avaliados.`);

    // 3. Criar Produtos de teste
    const produtosExistentes = await prisma.produto.count();

    if (produtosExistentes === 0) {
        // Criar produtos associados a fornecedores
        await prisma.produto.create({
            data: {
                nome: 'Ração Cães Adultos 15kg',
                stock: 5,
                stockMinimo: 10,
                preco: 45.99,
                categoria: 'Alimentação',
                descricao: 'Ração grain-free para porte médio.',
                fornecedores: { connect: [{ id: fornecedorA.id }] }
            }
        });
        await prisma.produto.create({
            data: {
                nome: 'Vacina Antirrábica',
                stock: 20,
                stockMinimo: 15,
                preco: 12.50,
                categoria: 'Medicamentos',
                descricao: 'Vacina anual dose individual.',
                fornecedores: { connect: [{ id: fornecedorB.id }] }
            }
        });
        await prisma.produto.create({
            data: {
                nome: 'Coleira Antiparasitária (Cães Grandes)',
                stock: 2,
                stockMinimo: 5,
                preco: 28.50,
                categoria: 'Acessórios',
                descricao: 'Proteção eficaz contra carraças e pulgas durante 6 meses.',
                fornecedores: { connect: [{ id: fornecedorA.id }, { id: fornecedorB.id }] }
            }
        });
        await prisma.produto.create({
            data: {
                nome: 'Comprimidos Desparasitantes',
                stock: 50,
                stockMinimo: 20,
                preco: 8.00,
                categoria: 'Medicamentos',
                descricao: 'Caixa com 10 pastilhas.',
                fornecedores: { connect: [{ id: fornecedorB.id }] }
            }
        });
        await prisma.produto.create({
            data: {
                nome: 'Biscoitos Dentais',
                stock: 8,
                stockMinimo: 20,
                preco: 4.50,
                categoria: 'Snacks',
                descricao: 'Limpa o tártaro ao mesmo tempo que recompensa o cão.',
                fornecedores: { connect: [{ id: fornecedorA.id }] }
            }
        });
        console.log(`✅ Foram inseridos 5 Produtos de teste, associados a fornecedores.`);
    } else {
        console.log(`⚠️ Já existem ${produtosExistentes} Produtos na base de dados. Nenhuma ração/produto novo adicionado.`);
    }

    // 4. Criar um Pedido de Compra e Encomenda se não existir nenhum
    const pedidosExistentes = await prisma.pedidoCompra.count();
    if (pedidosExistentes === 0) {
        const produto1 = await prisma.produto.findFirst({ where: { nome: 'Ração Cães Adultos 15kg' } });
        const produto2 = await prisma.produto.findFirst({ where: { nome: 'Biscoitos Dentais' } });

        if (produto1 && produto2) {
            const pedido = await prisma.pedidoCompra.create({
                data: {
                    estado: 'PROCESSADO',
                    prioridade: 'NORMAL',
                    tipo: 'MANUAL',
                    valorTotalEstimado: (2 * produto1.preco) + (5 * produto2.preco),
                    criadoPorId: gestor.id,
                    observacoes: 'Pedido gerado automaticamente no seed',
                    linhas: {
                        create: [
                            { produtoId: produto1.id, quantidade: 2, precoUnitario: produto1.preco, valorTotal: 2 * produto1.preco, fornecedorId: fornecedorA.id },
                            { produtoId: produto2.id, quantidade: 5, precoUnitario: produto2.preco, valorTotal: 5 * produto2.preco, fornecedorId: fornecedorA.id }
                        ]
                    }
                }
            });
            console.log(`✅ Pedido de Compra criado (${pedido.id})`);

            const encomenda = await prisma.encomenda.create({
                data: {
                    codigoFormatado: 'EC-2026-001',
                    estado: 'ENVIADA',
                    valorTotal: pedido.valorTotalEstimado,
                    fornecedorId: fornecedorA.id,
                    pedidoCompraId: pedido.id,
                    observacoes: 'Encomenda de teste.',
                    dataEntregaPrevista: new Date(new Date().setDate(new Date().getDate() + 3)),
                    linhas: {
                        create: [
                            { produtoId: produto1.id, quantidade: 2, precoUnitario: produto1.preco, valorTotal: 2 * produto1.preco },
                            { produtoId: produto2.id, quantidade: 5, precoUnitario: produto2.preco, valorTotal: 5 * produto2.preco }
                        ]
                    }
                }
            });
            console.log(`✅ Encomenda de Teste criada (${encomenda.codigoFormatado})`);
        }
    }

    console.log('🎉 Seeding concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
