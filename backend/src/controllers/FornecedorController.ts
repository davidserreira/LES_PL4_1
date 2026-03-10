import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getFornecedores = async (req: Request, res: Response) => {
    try {
        const fornecedores = await prisma.fornecedor.findMany({
            orderBy: { nome: 'asc' }
        });
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao procurar fornecedores' });
    }
};

export const createFornecedor = async (req: Request, res: Response) => {
    try {
        const { nome, nif, contacto } = req.body;

        // Basic validation
        if (!nome) {
            return res.status(400).json({ error: 'O nome é obrigatório' });
        }

        const fornecedor = await prisma.fornecedor.create({
            data: {
                nome,
                nif: nif || null,
                contacto: contacto || null,
            }
        });
        res.status(201).json(fornecedor);
    } catch (error: any) {
        console.error('Erro ao criar fornecedor:', error);

        // Handle unique constraint violation on NIF
        if (error.code === 'P2002' && error.meta?.target?.includes('nif')) {
            return res.status(400).json({ error: 'Já existe um fornecedor com este NIF' });
        }

        res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
    }
};
