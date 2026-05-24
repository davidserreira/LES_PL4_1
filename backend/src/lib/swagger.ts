import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'StockVet API REST 🐾',
            version: '1.0.0',
            description: 'Documentação interativa da API REST da Clínica Veterinária (StockVet). Desenvolvida para a cadeira de Laboratório de Engenharia de Software (LES). Permite testar endpoints e visualizar a estrutura de dados em tempo real.',
            contact: {
                name: 'Grupo PL4_1',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local (Desenvolvimento)',
            },
        ],
        components: {
            schemas: {
                Role: {
                    type: 'string',
                    enum: ['ADMINISTRADOR', 'RESPONSAVEL_STOCK', 'RESPONSAVEL_FINANCEIRO'],
                },
                TipoPedido: {
                    type: 'string',
                    enum: ['MANUAL', 'AUTOMATICO'],
                },
                PrioridadePedido: {
                    type: 'string',
                    enum: ['NORMAL', 'ALTA', 'URGENTE'],
                },
                EstadoEncomenda: {
                    type: 'string',
                    enum: ['EMITIDA', 'ENVIADA', 'ENTREGUE', 'CANCELADA', 'ENTREGUE_PARCIAL', 'ENCERRADA'],
                },
                Utilizador: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        role: { $ref: '#/components/schemas/Role' },
                        ativo: { type: 'boolean' },
                    },
                },
                Produto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nome: { type: 'string' },
                        criadoEm: { type: 'string', format: 'date-time' },
                        stock: { type: 'number' },
                        stockMinimo: { type: 'number' },
                        categoria: { type: 'string', nullable: true },
                        descricao: { type: 'string', nullable: true },
                        preco: { type: 'number' },
                        fornecedorPreferencialId: { type: 'integer', nullable: true },
                    },
                },
                Fornecedor: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nome: { type: 'string' },
                        nif: { type: 'string' },
                        contacto: { type: 'string' },
                        categorias: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        criadoEm: { type: 'string', format: 'date-time' },
                        email: { type: 'string', format: 'email' },
                        estado: { type: 'boolean' },
                        observacoes: { type: 'string', nullable: true },
                        custoTransporte: { type: 'number', nullable: true },
                        diasEntrega: { type: 'string', nullable: true },
                        metodoPagamento: { type: 'string', nullable: true },
                        prazoMedioEntrega: { type: 'integer', nullable: true },
                        valorMinimoEncomenda: { type: 'number', nullable: true },
                    },
                },
                Avaliacao: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        fornecedorId: { type: 'integer' },
                        utilizadorId: { type: 'integer' },
                        comunicacao: { type: 'integer' },
                        conformidade: { type: 'integer' },
                        pontualidade: { type: 'integer' },
                        preco: { type: 'integer' },
                        qualidade: { type: 'integer' },
                        comentario: { type: 'string', nullable: true },
                        dataCriacao: { type: 'string', format: 'date-time' },
                    },
                },
                PedidoCompra: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        estado: { type: 'string' },
                        criadoEm: { type: 'string', format: 'date-time' },
                        atualizadoEm: { type: 'string', format: 'date-time' },
                        criadoPorId: { type: 'integer', nullable: true },
                        valorTotalEstimado: { type: 'number' },
                        prioridade: { $ref: '#/components/schemas/PrioridadePedido' },
                        tipo: { $ref: '#/components/schemas/TipoPedido' },
                        observacoes: { type: 'string', nullable: true },
                        revertido: { type: 'boolean' },
                    },
                },
                LinhaPedidoCompra: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        pedidoCompraId: { type: 'integer' },
                        produtoId: { type: 'integer' },
                        quantidade: { type: 'number' },
                        precoUnitario: { type: 'number' },
                        valorTotal: { type: 'number' },
                        fornecedorId: { type: 'integer', nullable: true },
                    },
                },
                Encomenda: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        codigoFormatado: { type: 'string' },
                        estado: { $ref: '#/components/schemas/EstadoEncomenda' },
                        dataEmissao: { type: 'string', format: 'date-time' },
                        dataEntregaPrevista: { type: 'string', format: 'date-time', nullable: true },
                        dataEntregaReal: { type: 'string', format: 'date-time', nullable: true },
                        valorTotal: { type: 'number' },
                        observacoes: { type: 'string', nullable: true },
                        fornecedorId: { type: 'integer' },
                        pedidoCompraId: { type: 'integer' },
                    },
                },
                LinhaEncomenda: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        encomendaId: { type: 'integer' },
                        produtoId: { type: 'integer' },
                        quantidade: { type: 'number' },
                        precoUnitario: { type: 'number' },
                        valorTotal: { type: 'number' },
                        quantidadeRecebida: { type: 'number' },
                    },
                },
            },
        },
    },
    // Apontar para onde estão as nossas definições de rotas com anotações JSDoc
    apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
