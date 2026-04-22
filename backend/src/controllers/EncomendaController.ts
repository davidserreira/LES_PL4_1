import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Gerar código da encomenda: EC-{ano}-{seq padded 3}
async function gerarCodigoEncomenda(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `EC-${ano}-`;

    const ultima = await prisma.encomenda.findFirst({
        where: { codigoFormatado: { startsWith: prefixo } },
        orderBy: { id: 'desc' }
    });

    let seq = 1;
    if (ultima) {
        const partes = ultima.codigoFormatado.split('-');
        seq = (parseInt(partes[2]) || 0) + 1;
    }

    return `${prefixo}${String(seq).padStart(3, '0')}`;
}

// POST /encomendas/gerar/:pedidoId
export const gerarEncomendas = async (req: Request, res: Response) => {
    const pedidoId = parseInt(req.params.pedidoId);

    if (isNaN(pedidoId)) {
        return res.status(400).json({ error: 'ID de pedido inválido.' });
    }

    try {
        const pedido = await prisma.pedidoCompra.findUnique({
            where: { id: pedidoId },
            include: {
                linhas: {
                    include: {
                        produto: true,
                        fornecedor: true
                    }
                },
                encomendas: true
            }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        if (pedido.estado !== 'APROVADO') {
            return res.status(400).json({ error: 'Só é possível gerar encomendas a partir de pedidos APROVADOS.' });
        }

        if (pedido.encomendas.length > 0) {
            return res.status(400).json({ error: 'Este pedido já tem encomendas geradas.' });
        }

        // Verificar que todas as linhas têm fornecedor
        const linhasSemFornecedor = pedido.linhas.filter(l => !l.fornecedorId);
        if (linhasSemFornecedor.length > 0) {
            return res.status(400).json({ error: 'Existem linhas sem fornecedor selecionado.' });
        }

        // Agrupar linhas por fornecedor
        const grupos = new Map<number, typeof pedido.linhas>();
        for (const linha of pedido.linhas) {
            const fId = linha.fornecedorId!;
            if (!grupos.has(fId)) grupos.set(fId, []);
            grupos.get(fId)!.push(linha);
        }

        const ano = new Date().getFullYear();
        const prefixo = `EC-${ano}-`;

        const ultima = await prisma.encomenda.findFirst({
            where: { codigoFormatado: { startsWith: prefixo } },
            orderBy: { id: 'desc' }
        });

        let nextSeq = 1;
        if (ultima) {
            const partes = ultima.codigoFormatado.split('-');
            nextSeq = (parseInt(partes[2]) || 0) + 1;
        }

        const encomendas = await prisma.$transaction(async (tx) => {
            const criadas = [];

            for (const [fornecedorId, linhas] of grupos.entries()) {
                const fornecedor = await tx.fornecedor.findUnique({ where: { id: fornecedorId } });

                let dataEntregaPrevista: Date | null = null;
                if (fornecedor?.prazoMedioEntrega) {
                    dataEntregaPrevista = new Date();
                    dataEntregaPrevista.setDate(dataEntregaPrevista.getDate() + fornecedor.prazoMedioEntrega);
                }

                const valorTotal = linhas.reduce((acc, l) => acc + l.valorTotal, 0);
                const codigo = `${prefixo}${String(nextSeq).padStart(3, '0')}`;
                nextSeq++;

                const encomenda = await tx.encomenda.create({
                    data: {
                        codigoFormatado: codigo,
                        estado: 'EMITIDA',
                        dataEntregaPrevista,
                        valorTotal,
                        fornecedorId,
                        pedidoCompraId: pedidoId,
                        linhas: {
                            create: linhas.map(l => ({
                                produtoId: l.produtoId,
                                quantidade: l.quantidade,
                                precoUnitario: l.precoUnitario,
                                valorTotal: l.valorTotal
                            }))
                        }
                    },
                    include: {
                        fornecedor: true,
                        linhas: { include: { produto: true } }
                    }
                });

                criadas.push(encomenda);
            }

            // Mudar estado do Pedido para PROCESSADO após emitir encomendas
            await tx.pedidoCompra.update({
                where: { id: pedidoId },
                data: { estado: 'PROCESSADO' }
            });

            return criadas;
        });

        return res.status(201).json(encomendas);
    } catch (err: any) {
        console.error('Erro ao gerar encomendas:', err);
        return res.status(500).json({ error: 'Erro interno ao gerar encomendas.' });
    }
};

// GET /encomendas
export const getAllEncomendas = async (_req: Request, res: Response) => {
    try {
        const encomendas = await prisma.encomenda.findMany({
            orderBy: { dataEmissao: 'desc' },
            include: {
                fornecedor: true,
                pedidoCompra: true,
                linhas: {
                    include: { produto: true }
                }
            }
        });
        return res.json(encomendas);
    } catch (err) {
        console.error('Erro ao listar encomendas:', err);
        return res.status(500).json({ error: 'Erro interno.' });
    }
};

// GET /encomendas/:id
export const getEncomendaById = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    try {
        const encomenda = await prisma.encomenda.findUnique({
            where: { id },
            include: {
                fornecedor: true,
                pedidoCompra: true,
                linhas: { include: { produto: true } }
            }
        });

        if (!encomenda) return res.status(404).json({ error: 'Encomenda não encontrada.' });
        return res.json(encomenda);
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.' });
    }
};
