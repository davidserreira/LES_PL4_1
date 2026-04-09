import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class UtilizadorController {
    static async listar(req: Request, res: Response) {
        try {
            const utilizadores = await prisma.utilizador.findMany({
                orderBy: { username: 'asc' }
            });
            res.json(utilizadores);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar utilizadores' });
        }
    }

    static async obter(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const utilizador = await prisma.utilizador.findUnique({
                where: { id: Number(id) }
            });
            if (utilizador) {
                res.json(utilizador);
            } else {
                res.status(404).json({ error: 'Utilizador não encontrado' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Erro ao obter utilizador' });
        }
    }

    static async criar(req: Request, res: Response) {
        const { username, password, role } = req.body;
        try {
            const novoUtilizador = await prisma.utilizador.create({
                data: {
                    username,
                    password: password || '123456',
                    role
                }
            });
            res.status(201).json(novoUtilizador);
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(400).json({ error: 'Este nome de utilizador já está em uso' });
            } else {
                res.status(500).json({ error: 'Erro ao criar utilizador' });
            }
        }
    }

    static async atualizar(req: Request, res: Response) {
        const { id } = req.params;
        const { username, password, role, ativo } = req.body;
        
        const data: any = {};
        if (username !== undefined) data.username = username;
        if (password !== undefined) data.password = password;
        if (role !== undefined) data.role = role;
        if (ativo !== undefined) data.ativo = ativo;

        try {
            const utilizadorAtualizado = await prisma.utilizador.update({
                where: { id: Number(id) },
                data
            });
            res.json(utilizadorAtualizado);
        } catch (error) {
            console.error('Erro ao atualizar utilizador:', error);
            res.status(500).json({ error: 'Erro ao atualizar utilizador' });
        }
    }

    static async remover(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await prisma.utilizador.delete({
                where: { id: Number(id) }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao remover utilizador' });
        }
    }
    static async login(req: Request, res: Response) {
        const { username, password } = req.body;
        try {
            const utilizador = await prisma.utilizador.findUnique({
                where: { username }
            });

            if (!utilizador || utilizador.password !== password) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            if (!utilizador.ativo) {
                return res.status(403).json({ error: 'A sua conta encontra-se inativa. Por favor contacte o administrador.' });
            }

            // For now, returning the user object without the password
            const { password: _, ...userWithoutPassword } = utilizador;
            res.json(userWithoutPassword);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao processar login' });
        }
    }
}
