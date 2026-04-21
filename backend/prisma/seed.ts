import { Role } from '@prisma/client';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('🌱 Iniciando o seeding da base de dados...');

    // 1. Criar Utilizadores Gestores (Opcional, mas útil para criar pedidos associados a um criador)
    const gestor = await prisma.utilizador.upsert({
        where: { username: 'gestor' },
        update: {},
        create: {
            username: 'gestor',
            password: 'password123',
            role: Role.RESPONSAVEL_STOCK
        }
    });
    console.log(`✅ Utilizador: Gestor de Stock (${gestor.id})`);

    const admin = await prisma.utilizador.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: 'admin',
            role: Role.ADMINISTRADOR
        }
    });
    console.log(`✅ Utilizador: Admin (${admin.id})`);

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
    // Como os produtos não têm "unique constraint" no nome, verifico se já existem produtos
    const produtosExistentes = await prisma.produto.count();

    if (produtosExistentes === 0) {
        await prisma.produto.createMany({
            data: [
                {
                    nome: 'Ração Cães Adultos 15kg',
                    stock: 5,
                    stockMinimo: 10,
                    preco: 45.99,
                    categoria: 'Alimentação',
                    descricao: 'Ração grain-free para porte médio.'
                },
                {
                    nome: 'Vacina Antirrábica',
                    stock: 20,
                    stockMinimo: 15,
                    preco: 12.50,
                    categoria: 'Medicamentos',
                    descricao: 'Vacina anual dose individual.'
                },
                {
                    nome: 'Coleira Antiparasitária (Cães Grandes)',
                    stock: 2,
                    stockMinimo: 5,
                    preco: 28.50,
                    categoria: 'Acessórios',
                    descricao: 'Proteção eficaz contra carraças e pulgas durante 6 meses.'
                },
                {
                    nome: 'Comprimidos Desparasitantes',
                    stock: 50,
                    stockMinimo: 20,
                    preco: 8.00,
                    categoria: 'Medicamentos',
                    descricao: 'Caixa com 10 pastilhas.'
                },
                {
                    nome: 'Biscoitos Dentais',
                    stock: 8,
                    stockMinimo: 20,
                    preco: 4.50,
                    categoria: 'Snacks',
                    descricao: 'Limpa o tártaro ao mesmo tempo que recompensa o cão.'
                }
            ]
        });
        console.log(`✅ Foram inseridos 5 Produtos de teste.`);
    } else {
        console.log(`⚠️ Já existem ${produtosExistentes} Produtos na base de dados. Nenhuma ração/produto novo adicionado.`);
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
