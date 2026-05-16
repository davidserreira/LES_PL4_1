import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getRelatorioFinanceiro = async (req: Request, res: Response) => {
    try {
        const { dataInicio, dataFim, fornecedorId } = req.query;

        // Default: 30 days ago to now if not provided
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 30);
        
        const dateStart = dataInicio ? new Date(dataInicio as string) : defaultStart;
        const dateEnd = dataFim ? new Date(dataFim as string) : new Date();
        dateEnd.setHours(23, 59, 59, 999);

        const whereEncomenda: any = {
            dataEmissao: {
                gte: dateStart,
                lte: dateEnd,
            }
        };

        if (fornecedorId) {
            whereEncomenda.fornecedorId = Number(fornecedorId);
        }

        const encomendas = await prisma.encomenda.findMany({
            where: whereEncomenda,
            include: { fornecedor: true }
        });

        const valorTotalEfetivo = encomendas
            .filter(e => e.estado === 'ENTREGUE' || e.estado === 'ENCERRADA')
            .reduce((acc, curr) => acc + curr.valorTotal, 0);

        const valorPendente = encomendas
            .filter(e => e.estado === 'EMITIDA' || e.estado === 'ENVIADA' || e.estado === 'ENTREGUE_PARCIAL')
            .reduce((acc, curr) => acc + curr.valorTotal, 0);

        const fornecedoresMap: Record<number, { nome: string; total: number }> = {};
        encomendas.forEach(e => {
            if (e.estado === 'ENTREGUE' || e.estado === 'ENCERRADA') {
                if (!fornecedoresMap[e.fornecedorId]) {
                    fornecedoresMap[e.fornecedorId] = { nome: e.fornecedor.nome, total: 0 };
                }
                fornecedoresMap[e.fornecedorId].total += e.valorTotal;
            }
        });

        const distribuicaoFornecedores = Object.values(fornecedoresMap)
            .sort((a, b) => b.total - a.total);

        const topFornecedores = distribuicaoFornecedores.slice(0, 5);

        res.json({
            valorTotalEfetivo,
            valorPendente,
            topFornecedores,
            distribuicaoFornecedores,
            encomendas: encomendas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatório financeiro' });
    }
};
