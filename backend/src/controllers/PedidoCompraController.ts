import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createPedidoCompra = async (req: Request, res: Response): Promise<any> => {
    try {
        const { criadoPorId, linhas } = req.body;

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
                criadoPorId: criadoPorId || null,
                valorTotalEstimado,
                linhas: {
                    create: linhasPreparadas
                }
            },
            include: {
                linhas: true // retornar as linhas na resposta
            }
        });

        return res.status(201).json(pedido);

    } catch (error) {
        console.error('Erro ao criar Pedido de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao criar pedido de compra.' });
    }
};

export const getAllPedidosCompra = async (req: Request, res: Response): Promise<any> => {
    try {
        const pedidos = await prisma.pedidoCompra.findMany({
            include: { linhas: true }
        });
        return res.json(pedidos);
    } catch (error) {
        console.error('Erro ao listar Pedidos de Compra:', error);
        return res.status(500).json({ error: 'Erro interno ao listar pedidos de compra.' });
    }
};
