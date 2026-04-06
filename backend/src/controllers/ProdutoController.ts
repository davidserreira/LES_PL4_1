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

export const createProduto = async (req: Request, res: Response) => {
    try {
        const { nome, stock, stockMinimo, preco, categoria, descricao, fornecedorIds } = req.body;
        
        const produto = await prisma.produto.create({
            data: {
                nome,
                stock: parseFloat(stock),
                stockMinimo: parseFloat(stockMinimo),
                preco: preco ? parseFloat(preco) : 0,
                categoria,
                descricao,
                fornecedores: fornecedorIds && fornecedorIds.length > 0 ? {
                    connect: fornecedorIds.map((id: number) => ({ id }))
                } : undefined
            },
            include: { fornecedores: true }
        });
        res.status(201).json(produto);
    } catch (error: any) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto', details: error.message });
    }
};

export const updateProduto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nome, stock, stockMinimo, preco, categoria, descricao, fornecedorIds } = req.body;
        
        const produto = await prisma.produto.update({
            where: { id: parseInt(id) },
            data: {
                nome,
                stock: stock !== undefined ? parseFloat(stock) : undefined,
                stockMinimo: stockMinimo !== undefined ? parseFloat(stockMinimo) : undefined,
                preco: preco !== undefined ? parseFloat(preco) : undefined,
                categoria,
                descricao,
                // Replace the entire relation list instead of manually disconnecting
                fornecedores: fornecedorIds !== undefined ? {
                    set: fornecedorIds.map((id: number) => ({ id }))
                } : undefined
            },
            include: { fornecedores: true }
        });
        res.json(produto);
    } catch (error: any) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
    }
};

export const deleteProduto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.produto.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error: any) {
        console.error('Erro ao eliminar produto:', error);
        res.status(500).json({ error: 'Erro ao eliminar produto', details: error.message });
    }
};
