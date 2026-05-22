import { Router } from 'express';
import * as ProdutoController from '../controllers/ProdutoController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gestão de produtos em stock
 */

/**
 * @swagger
 * /api/produtos:
 *   get:
 *     summary: Lista todos os produtos em stock
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produto'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', ProdutoController.getProdutos);

/**
 * @swagger
 * /api/produtos:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - stock
 *               - stockMinimo
 *             properties:
 *               nome:
 *                 type: string
 *               stock:
 *                 type: number
 *               stockMinimo:
 *                 type: number
 *               preco:
 *                 type: number
 *               categoria:
 *                 type: string
 *               descricao:
 *                 type: string
 *               fornecedorPreferencialId:
 *                 type: integer
 *               fornecedoresData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     preco:
 *                       type: number
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Produto'
 *       400:
 *         description: Dados de entrada inválidos (ex. fornecedor preferencial em falta com múltiplos fornecedores)
 *       500:
 *         description: Erro ao criar produto
 */
router.post('/', ProdutoController.createProduto);

/**
 * @swagger
 * /api/produtos/{id}:
 *   put:
 *     summary: Atualiza um produto existente
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               stock:
 *                 type: number
 *               stockMinimo:
 *                 type: number
 *               preco:
 *                 type: number
 *               categoria:
 *                 type: string
 *               descricao:
 *                 type: string
 *               fornecedorPreferencialId:
 *                 type: integer
 *               fornecedoresData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     preco:
 *                       type: number
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Produto'
 *       400:
 *         description: Erro de validação nos dados fornecidos
 *       500:
 *         description: Erro ao atualizar produto
 */
router.put('/:id', ProdutoController.updateProduto);

/**
 * @swagger
 * /api/produtos/{id}:
 *   delete:
 *     summary: Elimina um produto por ID (ou inativa-o se tiver encomendas/pedidos associados)
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       204:
 *         description: Produto eliminado com sucesso (sem conteúdo)
 *       200:
 *         description: Produto inativado por ter encomendas/pedidos associados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro ao eliminar produto
 */
router.delete('/:id', ProdutoController.deleteProduto);

/**
 * @swagger
 * /api/produtos/{id}/reativar:
 *   patch:
 *     summary: Reativa um produto inativado
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto reativado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Produto'
 *       500:
 *         description: Erro ao reativar produto
 */
router.patch('/:id/reativar', ProdutoController.reativarProduto);

export default router;
