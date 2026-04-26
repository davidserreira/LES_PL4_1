import { Request, Response } from 'express';
import prisma from '../lib/prisma';
// Triggering restart after prisma generate

export const getProdutos = async (req: Request, res: Response) => {
    try {
        const produtos = await prisma.produto.findMany({
            include: {
                fornecedores: {
                    select: { id: true, nome: true, estado: true }
                },
                fornecedorPreferencial: {
                    select: { id: true, nome: true }
                },
                linhasPedido: {
                    include: {
                        pedidoCompra: {
                            select: { id: true, estado: true, criadoEm: true, prioridade: true }
                        }
                    }
                }
            },
            orderBy: { criadoEm: 'desc' }
        });
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao procurar produtos' });
    }
};

export const createProduto = async (req: Request, res: Response): Promise<any> => {
    try {
        const { nome, stock, stockMinimo, preco, categoria, descricao, fornecedorIds, fornecedorPreferencialId } = req.body;
        
        let finalPreferencialId = fornecedorPreferencialId;
        if (fornecedorIds && fornecedorIds.length === 1) {
            finalPreferencialId = fornecedorIds[0];
        } else if (fornecedorIds && fornecedorIds.length > 1) {
            if (!finalPreferencialId) {
                return res.status(400).json({ error: 'Deve selecionar um fornecedor preferencial quando existem múltiplos fornecedores.' });
            }
            if (!fornecedorIds.includes(finalPreferencialId)) {
                return res.status(400).json({ error: 'O fornecedor preferencial deve fazer parte da lista de fornecedores selecionados.' });
            }
        } else {
            finalPreferencialId = null;
        }

        const produto = await prisma.produto.create({
            data: {
                nome,
                stock: parseFloat(stock),
                stockMinimo: parseFloat(stockMinimo),
                preco: preco ? parseFloat(preco) : 0,
                categoria,
                descricao,
                fornecedorPreferencialId: finalPreferencialId,
                fornecedores: fornecedorIds && fornecedorIds.length > 0 ? {
                    connect: fornecedorIds.map((id: number) => ({ id }))
                } : undefined
            },
            include: { fornecedores: true, fornecedorPreferencial: true }
        });
        return res.status(201).json(produto);
    } catch (error: any) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto', details: error.message });
    }
};

export const updateProduto = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { nome, stock, stockMinimo, preco, categoria, descricao, fornecedorIds, fornecedorPreferencialId } = req.body;
        
        let finalPreferencialId = fornecedorPreferencialId;
        if (fornecedorIds !== undefined) {
            if (fornecedorIds.length === 1) {
                finalPreferencialId = fornecedorIds[0];
            } else if (fornecedorIds.length > 1) {
                if (!finalPreferencialId) {
                    return res.status(400).json({ error: 'Deve selecionar um fornecedor preferencial quando existem múltiplos fornecedores.' });
                }
                if (!fornecedorIds.includes(finalPreferencialId)) {
                    return res.status(400).json({ error: 'O fornecedor preferencial deve fazer parte da lista de fornecedores selecionados.' });
                }
            } else {
                finalPreferencialId = null;
            }
        }

        const produto = await prisma.produto.update({
            where: { id: parseInt(id) },
            data: {
                nome,
                stock: stock !== undefined ? parseFloat(stock) : undefined,
                stockMinimo: stockMinimo !== undefined ? parseFloat(stockMinimo) : undefined,
                preco: preco !== undefined ? parseFloat(preco) : undefined,
                categoria,
                descricao,
                fornecedorPreferencialId: finalPreferencialId,
                // Replace the entire relation list instead of manually disconnecting
                fornecedores: fornecedorIds !== undefined ? {
                    set: fornecedorIds.map((id: number) => ({ id }))
                } : undefined
            },
            include: { fornecedores: true, fornecedorPreferencial: true }
        });
        return res.json(produto);
    } catch (error: any) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
    }
};

export const deleteProduto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const force = req.query.force === 'true';

        if (force) {
            // Se forçado, apaga primeiro as LinhasPedidoCompra associadas
            await prisma.linhaPedidoCompra.deleteMany({
                where: { produtoId: parseInt(id) }
            });
        }

        await prisma.produto.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(409).json({ error: 'Produto associado a pedidos', code: 'HAS_RELATIONS' });
        }
        console.error('Erro ao eliminar produto:', error);
        if (error.code === 'P2003') {
            return res.status(409).json({ 
                error: 'Não é possível eliminar este produto pois está associado a pedidos.',
                code: 'HAS_RELATIONS'
            });
        }
        res.status(500).json({ error: 'Erro ao eliminar produto', details: error.message });
    }
};
