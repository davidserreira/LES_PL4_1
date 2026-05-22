import { Router } from 'express';
import { getRelatorioFinanceiro } from '../controllers/RelatorioController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Consultas de métricas e relatórios financeiros da clínica
 */

/**
 * @swagger
 * /api/relatorios/financeiro:
 *   get:
 *     summary: Gera um relatório financeiro consolidado de encomendas
 *     tags: [Relatórios]
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial do período (padrão: 30 dias atrás)"
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final do período (padrão: hoje)"
 *       - in: query
 *         name: fornecedorId
 *         schema:
 *           type: integer
 *         description: ID de um fornecedor específico para filtrar
 *     responses:
 *       200:
 *         description: Relatório financeiro gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valorTotalEfetivo:
 *                   type: number
 *                   description: Total faturado/entregue de encomendas ativas concluídas
 *                 valorPendente:
 *                   type: number
 *                   description: Total pendente de encomendas em trânsito
 *                 topFornecedores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nome:
 *                         type: string
 *                       total:
 *                         type: number
 *                 distribuicaoFornecedores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nome:
 *                         type: string
 *                       total:
 *                         type: number
 *                 encomendas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Encomenda'
 *       500:
 *         description: Erro ao gerar relatório
 */
router.get('/financeiro', getRelatorioFinanceiro);

export default router;
