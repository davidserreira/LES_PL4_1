import { Router } from 'express';
import { 
    createPedidoCompra, 
    getAllPedidosCompra, 
    getPedidoById,
    cancelarPedido, 
    aprovarPedido, 
    recusarPedido,
    getRascunhos,
    updateRascunho,
    deleteRascunho,
    editarPedido,
    updateStatusAdmin,
    reverterPedido
} from '../controllers/PedidoCompraController';


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pedidos de Compra
 *   description: Gestão do fluxo de pedidos de compra e rascunhos (aprovação, cancelamento, reversão)
 */

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Cria um novo pedido de compra (ou rascunho)
 *     tags: [Pedidos de Compra]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               criadoPorId:
 *                 type: integer
 *                 description: ID do utilizador criador
 *               prioridade:
 *                 $ref: '#/components/schemas/PrioridadePedido'
 *               tipo:
 *                 $ref: '#/components/schemas/TipoPedido'
 *               estado:
 *                 type: string
 *                 enum: [RASCUNHO, PENDENTE]
 *                 description: Estado inicial (RASCUNHO ou PENDENTE)
 *               observacoes:
 *                 type: string
 *               linhas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - produtoId
 *                     - quantidade
 *                   properties:
 *                     produtoId:
 *                       type: integer
 *                     quantidade:
 *                       type: number
 *     responses:
 *       201:
 *         description: Pedido de compra criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoCompra'
 *       400:
 *         description: Erro de validação nos dados fornecidos (linhas vazias, produtos em falta, etc.)
 *       500:
 *         description: Erro interno ao criar pedido
 */
router.post('/', createPedidoCompra);

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Lista todos os pedidos de compra (excluindo ou incluindo rascunhos com base no estado geral)
 *     tags: [Pedidos de Compra]
 *     responses:
 *       200:
 *         description: Lista de pedidos de compra retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PedidoCompra'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', getAllPedidosCompra);

/**
 * @swagger
 * /api/pedidos/rascunhos:
 *   get:
 *     summary: Lista apenas os pedidos de compra em estado de RASCUNHO
 *     tags: [Pedidos de Compra]
 *     responses:
 *       200:
 *         description: Lista de rascunhos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PedidoCompra'
 *       500:
 *         description: Erro interno ao obter rascunhos
 */
router.get('/rascunhos', getRascunhos);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtém os detalhes de um pedido de compra por ID
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoCompra'
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno ao obter pedido
 */
router.get('/:id', getPedidoById);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   put:
 *     summary: Atualiza ou finaliza um rascunho de pedido de compra
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do rascunho
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 description: Perfil do utilizador (ex. RESPONSAVEL_STOCK)
 *               estado:
 *                 type: string
 *                 enum: [RASCUNHO, PENDENTE]
 *               prioridade:
 *                 $ref: '#/components/schemas/PrioridadePedido'
 *               observacoes:
 *                 type: string
 *               linhas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produtoId:
 *                       type: integer
 *                     quantidade:
 *                       type: number
 *     responses:
 *       200:
 *         description: Rascunho atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoCompra'
 *       403:
 *         description: Permissões insuficientes
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno ao atualizar rascunho
 */
router.put('/:id', updateRascunho);

/**
 * @swagger
 * /api/pedidos/{id}/editar:
 *   put:
 *     summary: Edita um pedido PENDENTE (apenas Gestor de Stock ou Admin)
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - linhas
 *             properties:
 *               role:
 *                 type: string
 *               prioridade:
 *                 $ref: '#/components/schemas/PrioridadePedido'
 *               observacoes:
 *                 type: string
 *               linhas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produtoId:
 *                       type: integer
 *                     quantidade:
 *                       type: number
 *     responses:
 *       200:
 *         description: Pedido editado com sucesso
 *       403:
 *         description: Permissões insuficientes
 *       400:
 *         description: Estado do pedido inválido ou dados incorretos
 *       500:
 *         description: Erro interno ao editar pedido
 */
router.put('/:id/editar', editarPedido);

/**
 * @swagger
 * /api/pedidos/{id}/rascunho:
 *   delete:
 *     summary: Elimina permanentemente um rascunho
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do rascunho
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rascunho eliminado com sucesso
 *       403:
 *         description: Permissões insuficientes
 *       400:
 *         description: Pedido não está no estado RASCUNHO
 *       500:
 *         description: Erro ao eliminar rascunho
 */
router.delete('/:id/rascunho', deleteRascunho);

/**
 * @swagger
 * /api/pedidos/{id}/cancelar:
 *   patch:
 *     summary: Cancela um pedido de compra (regras baseadas no estado e perfil)
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pedido cancelado com sucesso
 *       403:
 *         description: Sem permissão para cancelar neste estado
 *       400:
 *         description: Pedido já cancelado ou processado
 *       500:
 *         description: Erro interno
 */
router.patch('/:id/cancelar', cancelarPedido);

/**
 * @swagger
 * /api/pedidos/{id}/aprovar:
 *   patch:
 *     summary: Aprova um pedido de compra PENDENTE (Fase 2 - seleciona fornecedores específicos)
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - linhasAprovadas
 *             properties:
 *               role:
 *                 type: string
 *               linhasAprovadas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - fornecedorId
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID da linha do pedido
 *                     fornecedorId:
 *                       type: integer
 *                       description: ID do fornecedor escolhido para este produto
 *                     quantidade:
 *                       type: number
 *                       description: Opcional - quantidade atualizada
 *     responses:
 *       200:
 *         description: Pedido aprovado com sucesso (estado muda para APROVADO)
 *       403:
 *         description: Permissões insuficientes (apenas Responsável Financeiro ou Admin)
 *       400:
 *         description: Erro nas linhas (fornecedor não associado ao produto, sem linhas aprovadas, etc.)
 *       500:
 *         description: Erro interno ao aprovar
 */
router.patch('/:id/aprovar', aprovarPedido);

/**
 * @swagger
 * /api/pedidos/{id}/recusar:
 *   patch:
 *     summary: Recusa um pedido de compra PENDENTE
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pedido recusado com sucesso
 *       403:
 *         description: Permissões insuficientes
 *       400:
 *         description: Pedido não está PENDENTE
 *       500:
 *         description: Erro ao recusar
 */
router.patch('/:id/recusar', recusarPedido);

/**
 * @swagger
 * /api/pedidos/{id}/status-admin:
 *   patch:
 *     summary: Permite ao ADMINISTRADOR forçar o estado do pedido (Overriding manual)
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - novoEstado
 *             properties:
 *               role:
 *                 type: string
 *               novoEstado:
 *                 type: string
 *                 description: Estado de destino (ex. PENDENTE, APROVADO, PROCESSADO, CANCELADO)
 *     responses:
 *       200:
 *         description: Estado alterado com sucesso
 *       403:
 *         description: Permissões insuficientes
 *       400:
 *         description: Estado inválido
 *       500:
 *         description: Erro ao alterar estado
 */
router.patch('/:id/status-admin', updateStatusAdmin);

/**
 * @swagger
 * /api/pedidos/{id}/reverter:
 *   patch:
 *     summary: Reverte um pedido APROVADO de volta a PENDENTE (se não existirem encomendas ativas)
 *     tags: [Pedidos de Compra]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido revertido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Não é um pedido aprovado ou existem encomendas ativas associadas
 *       500:
 *         description: Erro ao reverter pedido
 */
router.patch('/:id/reverter', reverterPedido);

export default router;
