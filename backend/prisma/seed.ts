import { Role, EstadoEncomenda, PrioridadePedido, TipoPedido } from '@prisma/client';
import prisma from '../src/lib/prisma';

const SEED_TAG = '[SEED-DEMO]';

async function ensureProduto(
    nome: string,
    data: {
        stock: number;
        stockMinimo: number;
        preco: number;
        categoria: string;
        descricao: string;
        fornecedorIds: number[];
        fornecedorPreferencialId?: number;
        precosFornecedores?: { fornecedorId: number; preco: number }[];
    }
) {
    const existing = await prisma.produto.findFirst({ where: { nome } });
    const fornecedorLinks = data.fornecedorIds.map((id) => ({ id }));
    const scalar = {
        stock: data.stock,
        stockMinimo: data.stockMinimo,
        preco: data.preco,
        categoria: data.categoria,
        descricao: data.descricao,
        fornecedorPreferencialId: data.fornecedorPreferencialId ?? data.fornecedorIds[0],
    };

    const produto = existing
        ? await prisma.produto.update({
              where: { id: existing.id },
              data: { ...scalar, fornecedores: { set: fornecedorLinks } },
          })
        : await prisma.produto.create({
              data: { nome, ...scalar, fornecedores: { connect: fornecedorLinks } },
          });

    if (data.precosFornecedores) {
        for (const pf of data.precosFornecedores) {
            await prisma.produtoFornecedor.upsert({
                where: {
                    produtoId_fornecedorId: { produtoId: produto.id, fornecedorId: pf.fornecedorId },
                },
                update: { preco: pf.preco },
                create: { produtoId: produto.id, fornecedorId: pf.fornecedorId, preco: pf.preco },
            });
        }
    }

    return produto;
}

async function main() {
    console.log('🌱 Iniciando seed de dados de demonstração...\n');

    // ─── Utilizadores ───────────────────────────────────────────────
    const admin = await prisma.utilizador.upsert({
        where: { username: 'admin' },
        update: { password: '1234', ativo: true },
        create: { username: 'admin', password: '1234', role: Role.ADMINISTRADOR },
    });
    const gestor = await prisma.utilizador.upsert({
        where: { username: 'gestor' },
        update: { password: '1234', ativo: true },
        create: { username: 'gestor', password: '1234', role: Role.RESPONSAVEL_STOCK },
    });
    const financeiro = await prisma.utilizador.upsert({
        where: { username: 'financeiro' },
        update: { password: '1234', ativo: true },
        create: { username: 'financeiro', password: '1234', role: Role.RESPONSAVEL_FINANCEIRO },
    });
    console.log('✅ Utilizadores: admin / gestor / financeiro (password: 1234)');

    // ─── Fornecedores ───────────────────────────────────────────────
    const fornecedorA = await prisma.fornecedor.upsert({
        where: { nif: '123456789' },
        update: {
            nome: 'PetFood Elite Lda',
            estado: true,
            valorMinimoEncomenda: 80,
            prazoMedioEntrega: 3,
            custoTransporte: 12,
        },
        create: {
            nome: 'PetFood Elite Lda',
            nif: '123456789',
            contacto: '912345678',
            email: 'encomendas@petfood.pt',
            estado: true,
            categoria: 'Alimentação',
            observacoes: 'Fornecedor principal de rações premium.',
            valorMinimoEncomenda: 80,
            prazoMedioEntrega: 3,
            custoTransporte: 12,
            metodoPagamento: 'Transferência 30 dias',
        },
    });

    const fornecedorB = await prisma.fornecedor.upsert({
        where: { nif: '987654321' },
        update: {
            nome: 'VetPharma SA',
            estado: true,
            valorMinimoEncomenda: 150,
            prazoMedioEntrega: 7,
            custoTransporte: 25,
        },
        create: {
            nome: 'VetPharma SA',
            nif: '987654321',
            contacto: '210987654',
            email: 'labs@vetpharma.pt',
            estado: true,
            categoria: 'Medicamentos',
            observacoes: 'Material cirúrgico e vacinação.',
            valorMinimoEncomenda: 150,
            prazoMedioEntrega: 7,
            custoTransporte: 25,
            metodoPagamento: 'Multibanco',
        },
    });

    const fornecedorC = await prisma.fornecedor.upsert({
        where: { nif: '501234567' },
        update: { nome: 'Animália Distribuição', estado: true, valorMinimoEncomenda: 50, prazoMedioEntrega: 5 },
        create: {
            nome: 'Animália Distribuição',
            nif: '501234567',
            contacto: '934567890',
            email: 'comercial@animalia.pt',
            estado: true,
            categoria: 'Higiene',
            observacoes: 'Champôs, sprays e acessórios de higiene.',
            valorMinimoEncomenda: 50,
            prazoMedioEntrega: 5,
            custoTransporte: 8,
        },
    });

    const fornecedorD = await prisma.fornecedor.upsert({
        where: { nif: '502987654' },
        update: { nome: 'VetCare Equipamentos', estado: false, valorMinimoEncomenda: 200, prazoMedioEntrega: 14 },
        create: {
            nome: 'VetCare Equipamentos',
            nif: '502987654',
            contacto: '218765432',
            email: 'vendas@vetcare.pt',
            estado: false,
            categoria: 'Equipamento',
            observacoes: 'Fornecedor inativo — útil para testar filtros.',
            valorMinimoEncomenda: 200,
            prazoMedioEntrega: 14,
            custoTransporte: 35,
        },
    });

    for (const [forn, scores] of [
        [fornecedorA, { qualidade: 5, pontualidade: 4, preco: 4, comunicacao: 5, conformidade: 5 }],
        [fornecedorB, { qualidade: 4, pontualidade: 3, preco: 2, comunicacao: 4, conformidade: 5 }],
        [fornecedorC, { qualidade: 4, pontualidade: 5, preco: 4, comunicacao: 3, conformidade: 4 }],
    ] as const) {
        await prisma.avaliacao.upsert({
            where: { fornecedorId_utilizadorId: { fornecedorId: forn.id, utilizadorId: admin.id } },
            update: scores,
            create: { fornecedorId: forn.id, utilizadorId: admin.id, comentario: SEED_TAG, ...scores },
        });
    }
    console.log('✅ 4 fornecedores (3 ativos, 1 inativo) + avaliações');

    // ─── Produtos ───────────────────────────────────────────────────
    const p1 = await ensureProduto('Ração Cães Adultos 15kg', {
        stock: 5,
        stockMinimo: 10,
        preco: 59.99,
        categoria: 'Alimentação',
        descricao: 'Ração grain-free porte médio — stock baixo.',
        fornecedorIds: [fornecedorA.id, fornecedorC.id],
        fornecedorPreferencialId: fornecedorA.id,
        precosFornecedores: [
            { fornecedorId: fornecedorA.id, preco: 38.50 },
            { fornecedorId: fornecedorC.id, preco: 41.00 },
        ],
    });
    const p2 = await ensureProduto('Vacina Antirrábica', {
        stock: 20,
        stockMinimo: 15,
        preco: 25.0,
        categoria: 'Medicamentos',
        descricao: 'Vacina anual dose individual.',
        fornecedorIds: [fornecedorB.id],
        precosFornecedores: [{ fornecedorId: fornecedorB.id, preco: 10.5 }],
    });
    const p3 = await ensureProduto('Coleira Antiparasitária (Cães Grandes)', {
        stock: 2,
        stockMinimo: 5,
        preco: 42.5,
        categoria: 'Acessórios',
        descricao: 'Proteção 6 meses — stock crítico.',
        fornecedorIds: [fornecedorA.id, fornecedorB.id],
        fornecedorPreferencialId: fornecedorA.id,
        precosFornecedores: [
            { fornecedorId: fornecedorA.id, preco: 22.0 },
            { fornecedorId: fornecedorB.id, preco: 24.5 },
        ],
    });
    const p4 = await ensureProduto('Comprimidos Desparasitantes', {
        stock: 50,
        stockMinimo: 20,
        preco: 15.0,
        categoria: 'Medicamentos',
        descricao: 'Caixa com 10 pastilhas.',
        fornecedorIds: [fornecedorB.id],
        precosFornecedores: [{ fornecedorId: fornecedorB.id, preco: 6.5 }],
    });
    const p5 = await ensureProduto('Biscoitos Dentais', {
        stock: 8,
        stockMinimo: 20,
        preco: 7.5,
        categoria: 'Snacks',
        descricao: 'Stock abaixo do mínimo.',
        fornecedorIds: [fornecedorA.id],
        precosFornecedores: [{ fornecedorId: fornecedorA.id, preco: 3.5 }],
    });
    const p6 = await ensureProduto('Champô Hipoalergénico 500ml', {
        stock: 30,
        stockMinimo: 10,
        preco: 22.9,
        categoria: 'Higiene',
        descricao: 'Para pele sensível.',
        fornecedorIds: [fornecedorC.id],
        precosFornecedores: [{ fornecedorId: fornecedorC.id, preco: 11.5 }],
    });
    const p7 = await ensureProduto('Ração Gatos Indoor 10kg', {
        stock: 18,
        stockMinimo: 8,
        preco: 49.0,
        categoria: 'Alimentação',
        descricao: 'Controlo de bolas de pelo.',
        fornecedorIds: [fornecedorA.id],
        precosFornecedores: [{ fornecedorId: fornecedorA.id, preco: 32.0 }],
    });
    const p8 = await ensureProduto('Seringas Descartáveis (cx 100)', {
        stock: 12,
        stockMinimo: 25,
        preco: 35.0,
        categoria: 'Material clínico',
        descricao: 'Stock a repor.',
        fornecedorIds: [fornecedorB.id, fornecedorD.id],
        fornecedorPreferencialId: fornecedorB.id,
        precosFornecedores: [
            { fornecedorId: fornecedorB.id, preco: 18.0 },
            { fornecedorId: fornecedorD.id, preco: 19.5 },
        ],
    });
    const p9 = await ensureProduto('Termómetro Digital Veterinário', {
        stock: 6,
        stockMinimo: 3,
        preco: 30.0,
        categoria: 'Equipamento',
        descricao: 'Leitura rápida.',
        fornecedorIds: [fornecedorD.id],
        precosFornecedores: [{ fornecedorId: fornecedorD.id, preco: 15.0 }],
    });
    const p10 = await ensureProduto('Spray Antisséptico 250ml', {
        stock: 40,
        stockMinimo: 15,
        preco: 14.5,
        categoria: 'Higiene',
        descricao: 'Uso clínico diário.',
        fornecedorIds: [fornecedorC.id, fornecedorB.id],
        precosFornecedores: [
            { fornecedorId: fornecedorC.id, preco: 7.5 },
            { fornecedorId: fornecedorB.id, preco: 8.0 },
        ],
    });
    console.log('✅ 10 produtos (vários níveis de stock + preços por fornecedor)');

    // ─── Pedidos e encomendas de demonstração ─────────────────────────
    const seedPedidos = await prisma.pedidoCompra.count({
        where: { observacoes: { contains: SEED_TAG } },
    });

    if (seedPedidos > 0) {
        console.log(`⚠️  Já existem ${seedPedidos} pedidos ${SEED_TAG}. A saltar pedidos/encomendas.`);
        console.log('\n🎉 Seed concluído (dados base atualizados).');
        return;
    }

    const linha = (produtoId: number, qtd: number, preco: number, fornecedorId: number) => ({
        produtoId,
        quantidade: qtd,
        precoUnitario: preco,
        valorTotal: qtd * preco,
        fornecedorId,
    });

    // RASCUNHO
    await prisma.pedidoCompra.create({
        data: {
            estado: 'RASCUNHO',
            prioridade: 'NORMAL',
            tipo: 'MANUAL',
            valorTotalEstimado: 2 * p7.preco,
            criadoPorId: gestor.id,
            observacoes: `${SEED_TAG} Rascunho — editar e confirmar`,
            linhas: { create: [linha(p7.id, 2, p7.preco, fornecedorA.id)] },
        },
    });

    // PENDENTE (aprovar / recusar)
    await prisma.pedidoCompra.create({
        data: {
            estado: 'PENDENTE',
            prioridade: 'ALTA',
            tipo: 'AUTOMATICO',
            valorTotalEstimado: 10 * p1.preco + 20 * p5.preco,
            criadoPorId: gestor.id,
            observacoes: `${SEED_TAG} Pendente — aguarda aprovação`,
            linhas: {
                create: [
                    linha(p1.id, 10, p1.preco, fornecedorA.id),
                    linha(p5.id, 20, p5.preco, fornecedorA.id),
                ],
            },
        },
    });

    // APROVADO (gerar encomendas)
    await prisma.pedidoCompra.create({
        data: {
            estado: 'APROVADO',
            prioridade: 'URGENTE',
            tipo: 'MANUAL',
            valorTotalEstimado: 5 * p3.preco + 3 * p2.preco,
            criadoPorId: admin.id,
            observacoes: `${SEED_TAG} Aprovado — testar geração de encomendas`,
            linhas: {
                create: [
                    linha(p3.id, 5, p3.preco, fornecedorA.id),
                    linha(p2.id, 3, p2.preco, fornecedorB.id),
                ],
            },
        },
    });

    // RECUSADO / CANCELADO (histórico)
    await prisma.pedidoCompra.create({
        data: {
            estado: 'RECUSADO',
            prioridade: 'NORMAL',
            tipo: 'MANUAL',
            valorTotalEstimado: p9.preco,
            criadoPorId: financeiro.id,
            observacoes: `${SEED_TAG} Recusado — exemplo histórico`,
            linhas: { create: [linha(p9.id, 1, p9.preco, fornecedorD.id)] },
        },
    });
    await prisma.pedidoCompra.create({
        data: {
            estado: 'CANCELADO',
            prioridade: 'NORMAL',
            tipo: 'MANUAL',
            valorTotalEstimado: 4 * p6.preco,
            criadoPorId: gestor.id,
            observacoes: `${SEED_TAG} Cancelado — exemplo histórico`,
            linhas: { create: [linha(p6.id, 4, p6.preco, fornecedorC.id)] },
        },
    });

    // PROCESSADO + encomendas em vários estados
    const pedidoProcessado = await prisma.pedidoCompra.create({
        data: {
            estado: 'PROCESSADO',
            prioridade: 'NORMAL',
            tipo: 'MANUAL',
            valorTotalEstimado: 4 * p1.preco + 6 * p5.preco + 2 * p2.preco,
            criadoPorId: gestor.id,
            observacoes: `${SEED_TAG} Processado — com encomendas em vários estados`,
            linhas: {
                create: [
                    linha(p1.id, 4, p1.preco, fornecedorA.id),
                    linha(p5.id, 6, p5.preco, fornecedorA.id),
                    linha(p2.id, 2, p2.preco, fornecedorB.id),
                ],
            },
        },
    });

    const totalA = 4 * p1.preco + 6 * p5.preco;
    const totalB = 2 * p2.preco;
    const entrega = new Date();
    entrega.setDate(entrega.getDate() + 5);

    await prisma.encomenda.create({
        data: {
            codigoFormatado: 'EC-SEED-001',
            estado: EstadoEncomenda.ENVIADA,
            valorTotal: totalA,
            fornecedorId: fornecedorA.id,
            pedidoCompraId: pedidoProcessado.id,
            observacoes: `${SEED_TAG} Encomenda enviada — PetFood`,
            dataEntregaPrevista: entrega,
            linhas: {
                create: [
                    { produtoId: p1.id, quantidade: 4, precoUnitario: p1.preco, valorTotal: 4 * p1.preco, quantidadeRecebida: 0 },
                    { produtoId: p5.id, quantidade: 6, precoUnitario: p5.preco, valorTotal: 6 * p5.preco, quantidadeRecebida: 0 },
                ],
            },
        },
    });

    await prisma.encomenda.create({
        data: {
            codigoFormatado: 'EC-SEED-002',
            estado: EstadoEncomenda.EMITIDA,
            valorTotal: totalB,
            fornecedorId: fornecedorB.id,
            pedidoCompraId: pedidoProcessado.id,
            observacoes: `${SEED_TAG} Encomenda emitida — VetPharma`,
            dataEntregaPrevista: entrega,
            linhas: {
                create: [
                    { produtoId: p2.id, quantidade: 2, precoUnitario: p2.preco, valorTotal: totalB, quantidadeRecebida: 0 },
                ],
            },
        },
    });

    // Pedido só para receção parcial / total
    const pedidoRececao = await prisma.pedidoCompra.create({
        data: {
            estado: 'PROCESSADO',
            prioridade: 'ALTA',
            tipo: 'MANUAL',
            valorTotalEstimado: 15 * p4.preco + 10 * p6.preco,
            criadoPorId: admin.id,
            observacoes: `${SEED_TAG} Processado — testar receção de stock`,
            linhas: {
                create: [
                    linha(p4.id, 15, p4.preco, fornecedorB.id),
                    linha(p6.id, 10, p6.preco, fornecedorC.id),
                ],
            },
        },
    });

    await prisma.encomenda.create({
        data: {
            codigoFormatado: 'EC-SEED-003',
            estado: EstadoEncomenda.ENTREGUE_PARCIAL,
            valorTotal: 15 * p4.preco,
            fornecedorId: fornecedorB.id,
            pedidoCompraId: pedidoRececao.id,
            observacoes: `${SEED_TAG} Receção parcial`,
            dataEntregaPrevista: entrega,
            linhas: {
                create: [
                    {
                        produtoId: p4.id,
                        quantidade: 15,
                        precoUnitario: p4.preco,
                        valorTotal: 15 * p4.preco,
                        quantidadeRecebida: 8,
                    },
                ],
            },
        },
    });

    await prisma.encomenda.create({
        data: {
            codigoFormatado: 'EC-SEED-004',
            estado: EstadoEncomenda.ENTREGUE,
            valorTotal: 10 * p6.preco,
            fornecedorId: fornecedorC.id,
            pedidoCompraId: pedidoRececao.id,
            observacoes: `${SEED_TAG} Entregue total`,
            dataEntregaReal: new Date(),
            dataEntregaPrevista: entrega,
            linhas: {
                create: [
                    {
                        produtoId: p6.id,
                        quantidade: 10,
                        precoUnitario: p6.preco,
                        valorTotal: 10 * p6.preco,
                        quantidadeRecebida: 10,
                    },
                ],
            },
        },
    });

    await prisma.encomenda.create({
        data: {
            codigoFormatado: 'EC-SEED-005',
            estado: EstadoEncomenda.CANCELADA,
            valorTotal: 3 * p8.preco,
            fornecedorId: fornecedorB.id,
            pedidoCompraId: pedidoRececao.id,
            observacoes: `${SEED_TAG} Encomenda cancelada`,
            linhas: {
                create: [
                    { produtoId: p8.id, quantidade: 3, precoUnitario: p8.preco, valorTotal: 3 * p8.preco, quantidadeRecebida: 0 },
                ],
            },
        },
    });

    await prisma.encomenda.create({
        data: {
            codigoFormatado: 'EC-SEED-006',
            estado: EstadoEncomenda.ENCERRADA,
            valorTotal: 5 * p10.preco,
            fornecedorId: fornecedorC.id,
            pedidoCompraId: pedidoRececao.id,
            observacoes: `${SEED_TAG} Encomenda encerrada`,
            dataEntregaReal: new Date(),
            linhas: {
                create: [
                    { produtoId: p10.id, quantidade: 5, precoUnitario: p10.preco, valorTotal: 5 * p10.preco, quantidadeRecebida: 5 },
                ],
            },
        },
    });

    console.log('✅ Pedidos: RASCUNHO, PENDENTE, APROVADO, PROCESSADO, RECUSADO, CANCELADO');
    console.log('✅ Encomendas: EMITIDA, ENVIADA, ENTREGUE_PARCIAL, ENTREGUE, CANCELADA, ENCERRADA');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('   admin      / 1234  (Administrador)');
    console.log('   gestor     / 1234  (Gestor stock)');
    console.log('   financeiro / 1234  (Financeiro)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
