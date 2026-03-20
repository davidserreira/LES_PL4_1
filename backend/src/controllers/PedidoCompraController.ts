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
        const { criadoPorId, linhas, prioridade } = req.body;

        if (!linhas || !Array.isArray(linhas) || linhas.length === 0) {
            return res.status(400).json({ error: 'O pedido tem de ter pelo menos uma linha.' });
        }

        // Validação básica das linhas
        for (const linha of linhas) {
            if (!linha.quantidade || linha.quantidade <= 0) {
                return res.status(400).json({ error: 'A quantidade de cada linha tem de ser maior que zero.' });
            }
            if (!linha.produtoId) {
                return res.status(400).json({ error: 'É necessário especificar o produtoId em cada linha.' });
            }
        }

        // Eliminar duplicados caso mandem o mesmo produto, ou apenas procurar:
        const produtoIds = linhas.map((l: any) => l.produtoId);
        
        // Buscar preços dos produtos na base de dados (regra: backend define os preços)
        const produtos = await prisma.produto.findMany({
            where: { id: { in: produtoIds } }
        });

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
        
        const linhasPreparadas = linhas.map((linha: any) => {
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
                // O Prisma (client gerado) pode não expor diretamente o campo FK `criadoPorId`
                // para o create input. Em vez disso, usamos a relação `criadoPor` com connect.
                criadoPor: criadoPorId ? { connect: { id: criadoPorId } } : undefined,
                prioridade: prioridade || 'NORMAL',
                valorTotalEstimado,
                linhas: {
                    create: linhasPreparadas
                }
            },
            include: {
                linhas: true, // retornar as linhas na resposta
                criadoPor: true, // permitir ao frontend mostrar o utilizador real
            }
        });

        return res.status(201).json(mapPedidoToDTO(pedido));

    } catch (error) {
        console.error('Erro ao criar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao criar pedido de compra.' });
    }
};

export const getAllPedidosCompra = async (req: Request, res: Response): Promise<any> => {
    try {
        const pedidos = await prisma.pedidoCompra.findMany({
            include: {
                linhas: {
                    include: {
                        produto: true
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

export const updatePedidoCompra = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID de pedido inválido.' });
        }

        const { prioridade, linhas } = req.body;

        if (!linhas || !Array.isArray(linhas) || linhas.length === 0) {
            return res.status(400).json({ error: 'O pedido tem de ter pelo menos uma linha.' });
        }

        for (const linha of linhas) {
            if (!linha.quantidade || linha.quantidade <= 0) {
                return res.status(400).json({ error: 'A quantidade de cada linha tem de ser maior que zero.' });
            }
            if (!linha.produtoId) {
                return res.status(400).json({ error: 'É necessário especificar o produtoId em cada linha.' });
            }
        }

        const produtoIds = linhas.map((l: any) => l.produtoId);
        
        const produtos = await prisma.produto.findMany({
            where: { id: { in: produtoIds } }
        });

        const produtosEncontradosIds = produtos.map((p: any) => p.id);
        const produtosEmFalta = produtoIds.filter((id: number) => !produtosEncontradosIds.includes(id));

        if (produtosEmFalta.length > 0) {
            return res.status(400).json({ error: `Os seguintes produtos não existem: ${produtosEmFalta.join(', ')}.` });
        }

        const produtoPrecoMap = new Map<number, number>();
        produtos.forEach((p: any) => {
            produtoPrecoMap.set(p.id, p.preco);
        });

        let valorTotalEstimado = 0;
        
        const linhasPreparadas = linhas.map((linha: any) => {
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

        const pedidoToUpdate = await prisma.pedidoCompra.findUnique({ where: { id } });
        if (!pedidoToUpdate) {
            return res.status(404).json({ error: 'Pedido de compra não encontrado.' });
        }

        const pedidoAtualizado = await prisma.pedidoCompra.update({
            where: { id },
            data: {
                prioridade: prioridade || pedidoToUpdate.prioridade,
                valorTotalEstimado,
                linhas: {
                    deleteMany: {},
                    create: linhasPreparadas
                }
            },
            include: {
                linhas: {
                    include: {
                        produto: true
                    }
                },
                criadoPor: true,
            }
        });

        return res.json(mapPedidoToDTO(pedidoAtualizado));
    } catch (error) {
        console.error('Erro ao atualizar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao atualizar pedido de compra.' });
    }
};

export const cancelPedidoCompra = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido.' });
        }

        const pedidoToCancel = await prisma.pedidoCompra.findUnique({ where: { id } });
        if (!pedidoToCancel) {
            return res.status(404).json({ error: 'Pedido de compra não encontrado.' });
        }

        if (pedidoToCancel.estado === 'CANCELADO') {
            return res.status(400).json({ error: 'O pedido já se encontra cancelado.' });
        }

        const pedidoCancelado = await prisma.pedidoCompra.update({
            where: { id },
            data: { estado: 'CANCELADO' },
            include: {
                linhas: { include: { produto: true } },
                criadoPor: true,
            }
        });

        return res.json(mapPedidoToDTO(pedidoCancelado));
    } catch (error) {
        console.error('Erro ao cancelar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao cancelar pedido de compra.' });
    }
};
