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

        if (!nif) {
            return res.status(400).json({ error: 'O NIF é obrigatório' });
        }

        if (!contacto) {
            return res.status(400).json({ error: 'O contacto telefónico é obrigatório' });
        }

        const fornecedor = await prisma.fornecedor.create({
            data: {
                nome,
                nif,
                contacto,
            }
        });
        res.status(201).json(fornecedor);
    } catch (error: any) {
        console.error('Erro ao criar fornecedor:', error);

        // Handle unique constraint violation on NIF
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Já existe um fornecedor com este NIF' });
        }

        res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
    }
};
