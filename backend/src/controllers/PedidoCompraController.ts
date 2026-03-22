import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const formatPedidoCode = (id: number, tipo: string, dataCriacao: Date) => {
    const prefix = tipo === 'AUTOMATICO' ? 'PA' : 'PM';
    const ano = dataCriacao.getFullYear();
    return `${prefix}-${ano}-${String(id).padStart(3, '0')}`;
};

export const mapPedidoToDTO = (pedido: any) => ({
    ...pedido,
    codigoFormatado: formatPedidoCode(pedido.id, pedido.tipo, pedido.criadoEm)
});

export const createPedidoCompra = async (req: Request, res: Response): Promise<any> => {
    try {
        const { criadoPorId, linhas, prioridade, estado, observacoes } = req.body;
        const isDraft = estado === 'RASCUNHO';

        if (!isDraft) {
            if (!linhas || !Array.isArray(linhas) || linhas.length === 0) {
                return res.status(400).json({ error: 'O pedido tem de ter pelo menos uma linha.' });
            }
        }

        const validLinhas = (linhas || []).filter((l: any) => l.produtoId && l.quantidade > 0);

        if (!isDraft && validLinhas.length !== (linhas || []).length) {
            return res.status(400).json({ error: 'Todas as linhas devem ter produtoId e quantidade maior que zero.' });
        }

        // Eliminar duplicados caso mandem o mesmo produto, ou apenas procurar:
        const produtoIds = validLinhas.map((l: any) => l.produtoId);
        
        // Buscar preços dos produtos na base de dados (regra: backend define os preços)
        const produtos = produtoIds.length > 0 ? await prisma.produto.findMany({
            where: { id: { in: produtoIds } }
        }) : [];

        // Confirmar se todos os produtos requisitados existem
        const produtosEncontradosIds = produtos.map((p: any) => p.id);
        const produtosEmFalta = produtoIds.filter((id: number) => !produtosEncontradosIds.includes(id));

        if (produtosEmFalta.length > 0) {
            return res.status(400).json({ error: `Os seguintes produtos não existem: ${produtosEmFalta.join(', ')}.` });
        }

        // Mapa para pesquisa rápida dos preços
        const produtoPrecoMap = new Map<number, number>();
        produtos.forEach((p: any) => {
            produtoPrecoMap.set(p.id, p.preco);
        });

        let valorTotalEstimado = 0;
        
        const linhasPreparadas = validLinhas.map((linha: any) => {
            const precoUnitario = produtoPrecoMap.get(linha.produtoId) || 0;
            const valorTotal = precoUnitario * linha.quantidade;
            valorTotalEstimado += valorTotal;

            return {
                produtoId: linha.produtoId,
                quantidade: linha.quantidade,
                precoUnitario,
                valorTotal
            };
        });

        // Criação atómica: Cabeçalho + Linhas
        const pedido = await prisma.pedidoCompra.create({
            data: {
                estado: isDraft ? 'RASCUNHO' : 'PENDENTE',
                // O Prisma (client gerado) pode não expor diretamente o campo FK `criadoPorId`
                // para o create input. Em vez disso, usamos a relação `criadoPor` com connect.
                criadoPor: criadoPorId ? { connect: { id: criadoPorId } } : undefined,
                prioridade: prioridade || 'NORMAL',
                observacoes: observacoes ?? null,
                valorTotalEstimado,
                linhas: {
                    create: linhasPreparadas
                }
            },
            include: {
                linhas: {
                    include: {
                        produto: true,
                    }
                }, // retornar as linhas na resposta
                criadoPor: true, // permitir ao frontend mostrar o utilizador real
            }
        });

        return res.status(201).json(mapPedidoToDTO(pedido));

    } catch (error: any) {
        console.error('Erro ao criar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao criar pedido de compra.', detail: error.message });
    }
};

export const getAllPedidosCompra = async (req: Request, res: Response): Promise<any> => {
    try {
        const pedidos = await prisma.pedidoCompra.findMany({
            include: {
                linhas: {
                    include: {
                        produto: true,
                    }
                },
                criadoPor: true,
            },
            orderBy: { id: 'desc' },
        });
        return res.json(pedidos.map(mapPedidoToDTO));
    } catch (error) {
        console.error('Erro ao listar Pedidos de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao listar pedidos de compra.' });
    }
};

export const cancelarPedido = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        const { userId, role } = req.body;

        if (!id) return res.status(400).json({ error: 'ID do pedido inválido.' });

        if (!role || (role !== 'ADMINISTRADOR' && role !== 'RESPONSAVEL_STOCK')) {
            return res.status(403).json({ error: 'Sem permissão para cancelar pedidos de compra.' });
        }

        const pedido = await prisma.pedidoCompra.findUnique({ where: { id } });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido de compra não encontrado.' });
        }

        if (pedido.estado === 'CANCELADO') {
            return res.status(400).json({ error: 'Pedido já se encontra cancelado.' });
        }

        const pedidoAtualizado = await prisma.pedidoCompra.update({
            where: { id },
            data: { estado: 'CANCELADO' },
            include: {
                linhas: {
                    include: {
                        produto: true,
                    }
                },
                criadoPor: true,
            }
        });

        return res.json(mapPedidoToDTO(pedidoAtualizado));
    } catch (error) {
        console.error('Erro ao cancelar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao cancelar pedido de compra.' });
    }
};

export const aprovarPedido = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        const { userId, role } = req.body;

        if (!id) return res.status(400).json({ error: 'ID do pedido inválido.' });

        if (!role || (role !== 'RESPONSAVEL_FINANCEIRO' && role !== 'ADMINISTRADOR')) {
            return res.status(403).json({ error: 'Apenas Administradores ou Responsáveis Financeiros podem aprovar pedidos.' });
        }

        const pedido = await prisma.pedidoCompra.findUnique({ where: { id } });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido de compra não encontrado.' });
        }

        if (pedido.estado !== 'PENDENTE') {
            return res.status(400).json({ error: `Não é possível aprovar um pedido no estado: ${pedido.estado}.` });
        }

        const pedidoAtualizado = await prisma.pedidoCompra.update({
            where: { id },
            data: { estado: 'APROVADO' },
            include: {
                linhas: {
                    include: {
                        produto: true,
                    }
                },
                criadoPor: true,
            }
        });

        return res.json(mapPedidoToDTO(pedidoAtualizado));
    } catch (error) {
        console.error('Erro ao aprovar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao aprovar pedido de compra.' });
    }
};

export const recusarPedido = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        const { userId, role } = req.body;

        if (!id) return res.status(400).json({ error: 'ID do pedido inválido.' });

        if (!role || (role !== 'RESPONSAVEL_FINANCEIRO' && role !== 'ADMINISTRADOR')) {
            return res.status(403).json({ error: 'Apenas Administradores ou Responsáveis Financeiros podem recusar pedidos.' });
        }

        const pedido = await prisma.pedidoCompra.findUnique({ where: { id } });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido de compra não encontrado.' });
        }

        if (pedido.estado !== 'PENDENTE') {
            return res.status(400).json({ error: `Não é possível recusar um pedido no estado: ${pedido.estado}.` });
        }

        const pedidoAtualizado = await prisma.pedidoCompra.update({
            where: { id },
            data: { estado: 'RECUSADO' },
            include: {
                linhas: {
                    include: {
                        produto: true,
                    }
                },
                criadoPor: true,
            }
        });

        return res.json(mapPedidoToDTO(pedidoAtualizado));
    } catch (error) {
        console.error('Erro ao recusar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao recusar pedido de compra.' });
    }
};

export const getRascunhos = async (req: Request, res: Response): Promise<any> => {
    try {
        const pedidos = await prisma.pedidoCompra.findMany({
            where: { estado: 'RASCUNHO' },
            include: {
                linhas: { include: { produto: true } },
                criadoPor: true,
            },
            orderBy: { id: 'desc' },
        });
        return res.json(pedidos.map(mapPedidoToDTO));
    } catch (error) {
        console.error('Erro ao listar Rascunhos:', error);
        return res.status(500).json({ error: 'Erro interno ao listar rascunhos.' });
    }
};

export const updateRascunho = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        const { userId, role, linhas, prioridade, estado, observacoes } = req.body;

        if (!id) return res.status(400).json({ error: 'ID do pedido inválido.' });

        if (!role || (role !== 'RESPONSAVEL_STOCK' && role !== 'ADMINISTRADOR')) {
            return res.status(403).json({ error: 'Apenas Administradores ou Gestores de Stock podem editar rascunhos.' });
        }

        const pedido = await prisma.pedidoCompra.findUnique({ where: { id }, include: { linhas: true } });
        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });
        if (pedido.estado !== 'RASCUNHO') return res.status(400).json({ error: 'Este pedido não é um rascunho.' });

        const isDraft = estado === 'RASCUNHO';

        if (!isDraft) {
            if (!linhas || !Array.isArray(linhas) || linhas.length === 0) {
                return res.status(400).json({ error: 'Para finalizar o pedido, é necessário ter pelo menos uma linha.' });
            }
        }

        const validLinhas = (linhas || []).filter((l: any) => l.produtoId && l.quantidade > 0);

        if (!isDraft && validLinhas.length !== (linhas || []).length) {
            return res.status(400).json({ error: 'Todas as linhas devem ter produtoId e quantidade maior que zero para finalizar o pedido.' });
        }

        const produtoIds = validLinhas.map((l: any) => l.produtoId);
        const produtos = produtoIds.length > 0 ? await prisma.produto.findMany({ where: { id: { in: produtoIds } } }) : [];

        const produtosEncontradosIds = produtos.map((p: any) => p.id);
        const produtosEmFalta = produtoIds.filter((pid: number) => !produtosEncontradosIds.includes(pid));
        if (produtosEmFalta.length > 0) {
            return res.status(400).json({ error: `Os seguintes produtos não existem: ${produtosEmFalta.join(', ')}.` });
        }

        const produtoPrecoMap = new Map<number, number>();
        produtos.forEach((p: any) => produtoPrecoMap.set(p.id, p.preco));

        let valorTotalEstimado = 0;
        const linhasPreparadas = validLinhas.map((linha: any) => {
            const precoUnitario = produtoPrecoMap.get(linha.produtoId) || 0;
            const valorTotal = precoUnitario * linha.quantidade;
            valorTotalEstimado += valorTotal;
            return {
                produtoId: linha.produtoId,
                quantidade: linha.quantidade,
                precoUnitario,
                valorTotal
            };
        });

        // Delete old lines
        await prisma.linhaPedidoCompra.deleteMany({ where: { pedidoCompraId: id } });

        const pedidoAtualizado = await prisma.pedidoCompra.update({
            where: { id },
            data: {
                estado: isDraft ? 'RASCUNHO' : 'PENDENTE',
                prioridade: prioridade || pedido.prioridade,
                observacoes: observacoes ?? null,
                valorTotalEstimado,
                linhas: { create: linhasPreparadas }
            },
            include: { linhas: { include: { produto: true } }, criadoPor: true }
        });

        return res.json(mapPedidoToDTO(pedidoAtualizado));
    } catch (error: any) {
        console.error('Erro ao atualizar rascunho:', error);
        return res.status(500).json({ error: 'Erro interno ao atualizar rascunho.', detail: error.message });
    }
};

export const deleteRascunho = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        const { userId, role } = req.body;

        if (!id) return res.status(400).json({ error: 'ID do pedido inválido.' });
        if (!role || (role !== 'RESPONSAVEL_STOCK' && role !== 'ADMINISTRADOR')) {
            return res.status(403).json({ error: 'Apenas Administradores ou Gestores de Stock podem eliminar rascunhos.' });
        }

        const pedido = await prisma.pedidoCompra.findUnique({ where: { id } });
        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });
        if (pedido.estado !== 'RASCUNHO') return res.status(400).json({ error: 'Apenas rascunhos podem ser eliminados.' });

        await prisma.linhaPedidoCompra.deleteMany({ where: { pedidoCompraId: id } });
        await prisma.pedidoCompra.delete({ where: { id } });

        return res.json({ success: true });
    } catch (error) {
        console.error('Erro ao eliminar Rascunho:', error);
        return res.status(500).json({ error: 'Erro interno ao eliminar rascunho.' });
    }
};
