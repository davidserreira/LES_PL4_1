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
                precosFornecedores: {
                    select: { fornecedorId: true, preco: true }
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
        const { nome, stock, stockMinimo, preco, categoria, descricao, fornecedoresData, fornecedorPreferencialId } = req.body;
        
        let finalPreferencialId = fornecedorPreferencialId;
        const fData = fornecedoresData || [];
        
        if (fData.length === 1) {
            finalPreferencialId = fData[0].id;
        } else if (fData.length > 1) {
            if (!finalPreferencialId) {
                return res.status(400).json({ error: 'Deve selecionar um fornecedor preferencial quando existem múltiplos fornecedores.' });
            }
            if (!fData.some((f: any) => f.id === finalPreferencialId)) {
                return res.status(400).json({ error: 'O fornecedor preferencial deve fazer parte da lista de fornecedores selecionados.' });
            }
        } else {
            finalPreferencialId = null;
        }

        // Definir preço do produto como o do fornecedor preferencial
        let finalPreco = preco ? parseFloat(preco) : 0;
        if (finalPreferencialId) {
            const prefSupplier = fData.find((f: any) => f.id === finalPreferencialId);
            if (prefSupplier && prefSupplier.preco !== undefined) {
                finalPreco = parseFloat(prefSupplier.preco);
            }
        }

        const produto = await prisma.produto.create({
            data: {
                nome,
                stock: parseFloat(stock),
                stockMinimo: parseFloat(stockMinimo),
                preco: finalPreco,
                categoria,
                descricao,
                fornecedorPreferencialId: finalPreferencialId,
                fornecedores: fData.length > 0 ? {
                    connect: fData.map((f: any) => ({ id: f.id }))
                } : undefined,
                precosFornecedores: fData.length > 0 ? {
                    create: fData.map((f: any) => ({
                        fornecedorId: f.id,
                        preco: parseFloat(f.preco || 0)
                    }))
                } : undefined
            },
            include: { fornecedores: true, fornecedorPreferencial: true, precosFornecedores: true }
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
        const { nome, stock, stockMinimo, preco, categoria, descricao, fornecedoresData, fornecedorPreferencialId } = req.body;
        
        let finalPreferencialId = fornecedorPreferencialId;
        if (fornecedoresData !== undefined) {
            if (fornecedoresData.length === 1) {
                finalPreferencialId = fornecedoresData[0].id;
            } else if (fornecedoresData.length > 1) {
                if (!finalPreferencialId) {
                    return res.status(400).json({ error: 'Deve selecionar um fornecedor preferencial quando existem múltiplos fornecedores.' });
                }
                if (!fornecedoresData.some((f: any) => f.id === finalPreferencialId)) {
                    return res.status(400).json({ error: 'O fornecedor preferencial deve fazer parte da lista de fornecedores selecionados.' });
                }
            } else {
                finalPreferencialId = null;
            }
        }

        let finalPreco = preco !== undefined ? parseFloat(preco) : undefined;
        if (finalPreferencialId && fornecedoresData) {
            const prefSupplier = fornecedoresData.find((f: any) => f.id === finalPreferencialId);
            if (prefSupplier && prefSupplier.preco !== undefined) {
                finalPreco = parseFloat(prefSupplier.preco);
            }
        }

        if (fornecedoresData !== undefined) {
            await prisma.produtoFornecedor.deleteMany({
                where: { produtoId: parseInt(id) }
            });
        }

        const produto = await prisma.produto.update({
            where: { id: parseInt(id) },
            data: {
                nome,
                stock: stock !== undefined ? parseFloat(stock) : undefined,
                stockMinimo: stockMinimo !== undefined ? parseFloat(stockMinimo) : undefined,
                preco: finalPreco,
                categoria,
                descricao,
                fornecedorPreferencialId: finalPreferencialId,
                fornecedores: fornecedoresData !== undefined ? {
                    set: fornecedoresData.map((f: any) => ({ id: f.id }))
                } : undefined,
                precosFornecedores: fornecedoresData !== undefined ? {
                    create: fornecedoresData.map((f: any) => ({
                        fornecedorId: f.id,
                        preco: parseFloat(f.preco || 0)
                    }))
                } : undefined
            },
            include: { fornecedores: true, fornecedorPreferencial: true, precosFornecedores: true }
        });
        return res.json(produto);
    } catch (error: any) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
    }
};

export const deleteProduto = async (req: Request, res: Response): Promise<any> => {
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
            // Em vez de retornar erro, inativa o produto
            const produtoInativado = await prisma.produto.update({
                where: { id: parseInt(req.params.id) },
                data: { ativo: false }
            });
            return res.status(200).json({ 
                message: 'Produto inativado por estar associado a pedidos.',
                code: 'HAS_RELATIONS',
                produto: produtoInativado
            });
        }
        console.error('Erro ao eliminar produto:', error);
        res.status(500).json({ error: 'Erro ao eliminar produto', details: error.message });
    }
};

export const reativarProduto = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const produto = await prisma.produto.update({
            where: { id: parseInt(id) },
            data: { ativo: true },
            include: { fornecedores: true, fornecedorPreferencial: true, precosFornecedores: true }
        });
        return res.json(produto);
    } catch (error: any) {
        console.error('Erro ao reativar produto:', error);
        res.status(500).json({ error: 'Erro ao reativar produto', details: error.message });
    }
};

