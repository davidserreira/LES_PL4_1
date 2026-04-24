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

// PATCH /encomendas/:id/estado
export const atualizarEstado = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    if (!estado) return res.status(400).json({ error: 'Estado não fornecido.' });

    try {
        const encomenda = await prisma.encomenda.findUnique({ where: { id } });
        if (!encomenda) return res.status(404).json({ error: 'Encomenda não encontrada.' });

        // Validação básica de estados (ex: EMITIDA -> ENVIADA -> ENTREGUE)
        const fluxos: Record<string, string[]> = {
            'EMITIDA': ['ENVIADA', 'CANCELADA'],
            'ENVIADA': ['ENTREGUE', 'ENTREGUE_PARCIAL', 'CANCELADA'],
            'ENTREGUE_PARCIAL': ['ENTREGUE', 'CANCELADA'],
            'ENTREGUE': [],
            'CANCELADA': []
        };

        if (!fluxos[encomenda.estado].includes(estado)) {
            return res.status(400).json({ 
                error: `Transição de estado inválida de ${encomenda.estado} para ${estado}.` 
            });
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Se passar para ENTREGUE, garantir que o stock é atualizado para o que falta
            if (estado === 'ENTREGUE') {
                const linhas = await tx.linhaEncomenda.findMany({
                    where: { encomendaId: id }
                });

                for (const linha of linhas) {
                    const falta = linha.quantidade - linha.quantidadeRecebida;
                    if (falta > 0) {
                        await tx.produto.update({
                            where: { id: linha.produtoId },
                            data: { stock: { increment: falta } }
                        });
                        await tx.linhaEncomenda.update({
                            where: { id: linha.id },
                            data: { quantidadeRecebida: linha.quantidade }
                        });
                    }
                }
            }

            return await tx.encomenda.update({
                where: { id },
                data: { 
                    estado,
                    dataEntregaReal: estado === 'ENTREGUE' ? new Date() : undefined
                }
            });
        });

        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao atualizar estado.' });
    }
};

// PATCH /encomendas/:id/receber
export const receberEncomenda = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { itens } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID de encomenda inválido.' });
    if (!Array.isArray(itens)) return res.status(400).json({ error: 'Lista de itens inválida.' });

    try {
        console.log(`[RECECAO] Processando encomenda #${id}`, itens);

        const encomenda = await prisma.encomenda.findUnique({
            where: { id },
            include: { linhas: true }
        });

        if (!encomenda) return res.status(404).json({ error: 'Encomenda não encontrada.' });

        if (encomenda.estado === 'ENTREGUE') {
            return res.status(400).json({ error: 'Esta encomenda já foi totalmente entregue.' });
        }

        if (encomenda.estado !== 'ENVIADA' && encomenda.estado !== 'ENTREGUE_PARCIAL') {
            return res.status(400).json({ error: 'A encomenda tem de estar em estado ENVIADA ou ENTREGUE_PARCIAL para ser recebida.' });
        }

        await prisma.$transaction(async (tx) => {
            for (const item of itens) {
                const linhaId = Number(item.linhaId);
                const qtdNovaRecebida = Number(item.quantidadeRecebida);

                if (isNaN(linhaId) || isNaN(qtdNovaRecebida) || qtdNovaRecebida <= 0) continue;

                // Buscar a linha atual para saber o acumulado e o produtoId
                const linha = await tx.linhaEncomenda.findUnique({
                    where: { id: linhaId },
                    select: { produtoId: true, quantidade: true, quantidadeRecebida: true }
                });

                if (!linha) continue;

                // Calcular novo acumulado (não ultrapassar o total pedido)
                const novoAcumulado = Math.min(
                    linha.quantidadeRecebida + qtdNovaRecebida,
                    linha.quantidade
                );
                const qtdEfetiva = novoAcumulado - linha.quantidadeRecebida;

                if (qtdEfetiva <= 0) continue;

                // Atualizar quantidadeRecebida acumulada na linha
                await tx.linhaEncomenda.update({
                    where: { id: linhaId },
                    data: { quantidadeRecebida: novoAcumulado }
                });

                // Incrementar stock do produto apenas com a quantidade nova desta receção
                await tx.produto.update({
                    where: { id: linha.produtoId },
                    data: { stock: { increment: qtdEfetiva } }
                });

                console.log(`[RECECAO] Produto #${linha.produtoId} stock +${qtdEfetiva} (acumulado: ${novoAcumulado}/${linha.quantidade})`);
            }

            // Reler todas as linhas atualizadas para avaliar se está completa
            const linhasAtualizadas = await tx.linhaEncomenda.findMany({
                where: { encomendaId: id }
            });

            const todasCompletas = linhasAtualizadas.every(l => l.quantidadeRecebida >= l.quantidade);
            const novoEstado = todasCompletas ? 'ENTREGUE' : 'ENTREGUE_PARCIAL';

            await tx.encomenda.update({
                where: { id },
                data: {
                    estado: novoEstado,
                    dataEntregaReal: todasCompletas ? new Date() : null
                }
            });

            console.log(`[RECECAO] Encomenda #${id} → ${novoEstado}`);
        });

        return res.json({ message: 'Receção registada com sucesso!' });
    } catch (err: any) {
        console.error('[RECECAO] Erro fatal:', err);
        return res.status(500).json({
            error: 'Erro interno ao registar receção.',
            details: err.message
        });
    }
};
