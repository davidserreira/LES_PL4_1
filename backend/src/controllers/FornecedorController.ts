import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAvaliacoesFornecedor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fornecedorId = parseInt(id);

        const fornecedor = await prisma.fornecedor.findUnique({ where: { id: fornecedorId } });
        if (!fornecedor) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        const avaliacoes = await prisma.avaliacao.findMany({
            where: { fornecedorId },
            include: {
                utilizador: {
                    select: {
                        id: true,
                        username: true,
                    }
                }
            },
            orderBy: { dataCriacao: 'desc' }
        });

        res.json(avaliacoes);
    } catch (error: any) {
        console.error('Erro ao obter avaliações:', error);
        res.status(500).json({ error: 'Erro ao obter listagem de avaliações do fornecedor', details: error.message });
    }
};

export const getFornecedores = async (req: Request, res: Response) => {
    try {
        const fornecedores = await prisma.fornecedor.findMany({
            include: {
                produtos: {
                    select: { id: true, nome: true, categoria: true, stock: true }
                },
                avaliacoes: true
            },
            orderBy: { nome: 'asc' }
        });
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao procurar fornecedores' });
    }
};

export const createFornecedor = async (req: Request, res: Response) => {
    try {
        const { nome, nif, contacto, email, categoria, observacoes, produtoIds } = req.body;

        // Basic validation
        if (!nome) return res.status(400).json({ error: 'O nome é obrigatório' });
        if (!nif) return res.status(400).json({ error: 'O NIF é obrigatório' });
        if (!contacto) return res.status(400).json({ error: 'O contacto telefónico é obrigatório' });
        if (!email) return res.status(400).json({ error: 'O email é obrigatório' });
        if (!categoria) return res.status(400).json({ error: 'A categoria é obrigatória' });

        const fornecedor = await prisma.fornecedor.create({
            data: {
                nome,
                nif,
                contacto,
                email,
                categoria,
                observacoes: observacoes || null,
                produtos: produtoIds && produtoIds.length > 0 ? {
                    connect: produtoIds.map((id: number) => ({ id }))
                } : undefined
            }
        });
        res.status(201).json(fornecedor);
    } catch (error: any) {
        console.error('Erro ao criar fornecedor:', error);

        // Handle unique constraint violation on NIF or Email
        if (error.code === 'P2002') {
            const target = error.meta?.target || '';
            const field = String(target).includes('email') ? 'Email' : 'NIF';
            return res.status(400).json({ error: `Já existe um fornecedor com este ${field}` });
        }

        res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
    }
};

export const toggleEstado = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fornecedor = await prisma.fornecedor.findUnique({
            where: { id: parseInt(id) }
        });

        if (!fornecedor) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        const updated = await prisma.fornecedor.update({
            where: { id: parseInt(id) },
            data: { estado: !fornecedor.estado }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao alterar estado do fornecedor' });
    }
};

export const updateObservacoes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { observacoes } = req.body;

        const fornecedor = await prisma.fornecedor.findUnique({
            where: { id: parseInt(id) }
        });

        if (!fornecedor) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        const updated = await prisma.fornecedor.update({
            where: { id: parseInt(id) },
            data: { observacoes: observacoes || null }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao atualizar observações do fornecedor' });
    }
};

export const updateFornecedor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            nome, nif, contacto, email, categoria, observacoes, estado,
            valorMinimoEncomenda, 
            prazoMedioEntrega, 
            custoTransporte, 
            metodoPagamento, 
            diasEntrega,
            produtoIds
        } = req.body;

        const existing = await prisma.fornecedor.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        if (!nome) return res.status(400).json({ error: 'O nome é obrigatório' });
        if (!nif) return res.status(400).json({ error: 'O NIF é obrigatório' });
        if (!contacto) return res.status(400).json({ error: 'O contacto telefónico é obrigatório' });
        if (!email) return res.status(400).json({ error: 'O email é obrigatório' });
        if (!categoria) return res.status(400).json({ error: 'A categoria é obrigatória' });

        const updated = await prisma.fornecedor.update({
            where: { id: parseInt(id) },
            data: {
                nome,
                nif,
                contacto,
                email,
                categoria,
                observacoes: observacoes ?? existing.observacoes,
                estado: typeof estado === 'boolean' ? estado : existing.estado,
                valorMinimoEncomenda: valorMinimoEncomenda !== undefined ? valorMinimoEncomenda : existing.valorMinimoEncomenda,
                prazoMedioEntrega: prazoMedioEntrega !== undefined ? prazoMedioEntrega : existing.prazoMedioEntrega,
                custoTransporte: custoTransporte !== undefined ? custoTransporte : existing.custoTransporte,
                metodoPagamento: metodoPagamento !== undefined ? metodoPagamento : existing.metodoPagamento,
                diasEntrega: diasEntrega !== undefined ? diasEntrega : existing.diasEntrega,
                produtos: produtoIds !== undefined ? {
                    set: produtoIds.map((id: number) => ({ id }))
                } : undefined
            }
        });

        res.json(updated);
    } catch (error: any) {
        console.error('Erro ao atualizar fornecedor:', error);

        if (error.code === 'P2002') {
            const target = error.meta?.target || '';
            const field = String(target).includes('email') ? 'Email' : 'NIF';
            return res.status(400).json({ error: `Já existe um fornecedor com este ${field}` });
        }

        res.status(500).json({ error: 'Erro ao atualizar fornecedor', details: error.message });
    }
};

const isValidRating = (value: unknown) => {
    const n = typeof value === 'string' ? Number(value) : value;
    return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
};

export const avaliarFornecedor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fornecedorId = parseInt(id);
        const { utilizadorId, qualidade, pontualidade, comunicacao, preco, conformidade, comentario } = req.body;

        const fornecedor = await prisma.fornecedor.findUnique({ where: { id: fornecedorId } });
        if (!fornecedor) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        const userIdNum = typeof utilizadorId === 'string' ? Number(utilizadorId) : utilizadorId;
        if (!userIdNum || !Number.isInteger(userIdNum)) {
            return res.status(400).json({ error: 'utilizadorId é obrigatório.' });
        }

        const utilizador = await prisma.utilizador.findUnique({ where: { id: userIdNum } });
        if (!utilizador) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        if (![qualidade, pontualidade, comunicacao, preco, conformidade].every(isValidRating)) {
            return res.status(400).json({ error: 'Todos os critérios devem ter um valor inteiro entre 1 e 5.' });
        }

        const payload = {
            qualidade: Number(qualidade),
            pontualidade: Number(pontualidade),
            comunicacao: Number(comunicacao),
            preco: Number(preco),
            conformidade: Number(conformidade),
            comentario: comentario || null,
        };

        const existing = await prisma.avaliacao.findUnique({
            where: { fornecedorId_utilizadorId: { fornecedorId, utilizadorId: userIdNum } }
        });

        const avaliacao = await prisma.avaliacao.upsert({
            where: { fornecedorId_utilizadorId: { fornecedorId, utilizadorId: userIdNum } },
            create: {
                fornecedorId,
                utilizadorId: userIdNum,
                ...payload
            },
            update: payload
        });

        res.status(existing ? 200 : 201).json({ ...avaliacao, updated: Boolean(existing) });
    } catch (error: any) {
        console.error('Erro ao avaliar fornecedor:', error);
        res.status(500).json({ error: 'Erro ao registar avaliação do fornecedor', details: error.message });
    }
};

export const getMinhaAvaliacaoFornecedor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fornecedorId = parseInt(id);
        const { utilizadorId } = req.query;

        const userIdNum = typeof utilizadorId === 'string' ? Number(utilizadorId) : NaN;
        if (!userIdNum || !Number.isInteger(userIdNum)) {
            return res.status(400).json({ error: 'utilizadorId é obrigatório.' });
        }

        const fornecedor = await prisma.fornecedor.findUnique({ where: { id: fornecedorId } });
        if (!fornecedor) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        const avaliacao = await prisma.avaliacao.findUnique({
            where: { fornecedorId_utilizadorId: { fornecedorId, utilizadorId: userIdNum } }
        });

        res.json(avaliacao);
    } catch (error: any) {
        console.error('Erro ao obter minha avaliação:', error);
        res.status(500).json({ error: 'Erro ao obter avaliação do fornecedor', details: error.message });
    }
};

export const getAvaliacaoMediaFornecedor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fornecedorId = parseInt(id);

        const fornecedor = await prisma.fornecedor.findUnique({ where: { id: fornecedorId } });
        if (!fornecedor) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        const result = await prisma.avaliacao.aggregate({
            where: { fornecedorId },
            _count: { id: true },
            _avg: {
                qualidade: true,
                pontualidade: true,
                comunicacao: true,
                preco: true,
                conformidade: true,
            }
        });

        const total = result._count.id;
        if (!total) {
            return res.json({ totalAvaliacoes: 0, media: null });
        }

        const avgs = result._avg;
        const media =
            ((avgs.qualidade ?? 0) +
                (avgs.pontualidade ?? 0) +
                (avgs.comunicacao ?? 0) +
                (avgs.preco ?? 0) +
                (avgs.conformidade ?? 0)) / 5;

        res.json({ totalAvaliacoes: total, media });
    } catch (error: any) {
        console.error('Erro ao obter média de avaliação:', error);
        res.status(500).json({ error: 'Erro ao obter média de avaliação do fornecedor', details: error.message });
    }
};
