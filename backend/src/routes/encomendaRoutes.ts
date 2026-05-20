import { Router } from 'express';
import { 
    gerarEncomendas, 
    getAllEncomendas, 
    getEncomendaById, 
    atualizarEstado, 
    receberEncomenda,
    getHistoricoStock,
    encerrarEncomenda
} from '../controllers/EncomendaController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Encomendas
 *   description: Gestão de encomendas a fornecedores, receção de mercadorias e controlo de stock
 */

/**
 * @swagger
 * /api/encomendas/gerar/{pedidoId}:
 *   post:
 *     summary: Gera as encomendas correspondentes a um pedido de compra aprovado
 *     tags: [Encomendas]
 *     parameters:
 *       - in: path
 *         name: pedidoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido de compra aprovado
 *     responses:
 *       201:
 *         description: Encomendas geradas com sucesso (agrupadas por fornecedor)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Encomenda'
 *       400:
 *         description: Pedido não aprovado, sem fornecedores ou encomendas já geradas
 *       404:
 *         description: Pedido de compra não encontrado
 *       500:
 *         description: Erro interno ao gerar encomendas
 */
router.post('/gerar/:pedidoId', gerarEncomendas);

/**
 * @swagger
 * /api/encomendas/historico:
 *   get:
 *     summary: Obtém o histórico completo de receções de stock efetuadas com sucesso
 *     tags: [Encomendas]
 *     responses:
 *       200:
 *         description: Histórico de receções de stock retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   quantidadeRecebida:
 *                     type: number
 *                   produto:
 *                     type: object
 *                   encomenda:
 *                     type: object
 *       500:
 *         description: Erro interno ao obter histórico
 */
router.get('/historico', getHistoricoStock);

/**
 * @swagger
 * /api/encomendas:
 *   get:
 *     summary: Lista todas as encomendas emitidas no sistema
 *     tags: [Encomendas]
 *     responses:
 *       200:
 *         description: Lista de encomendas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Encomenda'
 *       500:
 *         description: Erro interno ao listar encomendas
 */
router.get('/', getAllEncomendas);

/**
 * @swagger
 * /api/encomendas/{id}:
 *   get:
 *     summary: Obtém os detalhes de uma encomenda por ID
 *     tags: [Encomendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da encomenda
 *     responses:
 *       200:
 *         description: Encomenda retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Encomenda'
 *       404:
 *         description: Encomenda não encontrada
 *       500:
 *         description: Erro interno ao obter encomenda
 */
router.get('/:id', getEncomendaById);

/**
 * @swagger
 * /api/encomendas/{id}/estado:
 *   patch:
 *     summary: Atualiza o estado de uma encomenda (valida regras de transição)
 *     tags: [Encomendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da encomenda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 $ref: '#/components/schemas/EstadoEncomenda'
 *     responses:
 *       200:
 *         description: Estado atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Encomenda'
 *       400:
 *         description: Transição de estado inválida
 *       404:
 *         description: Encomenda não encontrada
 *       500:
 *         description: Erro ao atualizar estado
 */
router.patch('/:id/estado', atualizarEstado);

/**
 * @swagger
 * /api/encomendas/{id}/receber:
 *   patch:
 *     summary: Regista a receção de mercadorias (permite receções parciais e incrementa o stock de produtos)
 *     tags: [Encomendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da encomenda a receber
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itens
 *             properties:
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - linhaId
 *                     - quantidadeRecebida
 *                   properties:
 *                     linhaId:
 *                       type: integer
 *                       description: ID da linha da encomenda correspondente ao produto
 *                     quantidadeRecebida:
 *                       type: number
 *                       description: Quantidade recebida nesta remessa
 *     responses:
 *       200:
 *         description: Receção de mercadorias registada com sucesso (atualiza stock do produto)
 *       400:
 *         description: Estado da encomenda inválido ou dados incorretos
 *       404:
 *         description: Encomenda não encontrada
 *       500:
 *         description: Erro interno ao processar receção
 */
router.patch('/:id/receber', receberEncomenda);

/**
 * @swagger
 * /api/encomendas/{id}/encerrar:
 *   patch:
 *     summary: Encerra manualmente uma encomenda que se encontra parcialmente entregue
 *     tags: [Encomendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da encomenda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - observacoes
 *             properties:
 *               observacoes:
 *                 type: string
 *                 description: Motivo para encerramento manual (ex. rutura de stock definitiva no fornecedor)
 *     responses:
 *       200:
 *         description: Encomenda encerrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Encomenda'
 *       400:
 *         description: Encomenda não está em estado de entrega parcial
 *       404:
 *         description: Encomenda não encontrada
 *       500:
 *         description: Erro ao encerrar encomenda
 */
router.patch('/:id/encerrar', encerrarEncomenda);

export default router;
