import { Router } from 'express';
import { getFornecedores, createFornecedor, toggleEstado, updateObservacoes, updateFornecedor, avaliarFornecedor, getAvaliacaoMediaFornecedor, getMinhaAvaliacaoFornecedor, getAvaliacoesFornecedor, updateProdutoPreco } from '../controllers/FornecedorController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Fornecedores
 *   description: Gestão e avaliação de fornecedores
 */

/**
 * @swagger
 * /api/fornecedores:
 *   get:
 *     summary: Lista todos os fornecedores cadastrados
 *     tags: [Fornecedores]
 *     responses:
 *       200:
 *         description: Lista de fornecedores retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fornecedor'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', getFornecedores);

/**
 * @swagger
 * /api/fornecedores:
 *   post:
 *     summary: Regista um novo fornecedor
 *     tags: [Fornecedores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - nif
 *               - contacto
 *               - email
 *               - categorias
 *             properties:
 *               nome:
 *                 type: string
 *               nif:
 *                 type: string
 *               contacto:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               categorias:
 *                 type: array
 *                 items:
 *                   type: string
 *               observacoes:
 *                 type: string
 *               produtoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Fornecedor criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fornecedor'
 *       400:
 *         description: Dados de entrada inválidos (ex. NIF ou Email duplicado, categorias erradas)
 *       500:
 *         description: Erro ao criar fornecedor
 */
router.post('/', createFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   put:
 *     summary: Atualiza os dados de um fornecedor existente
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - nif
 *               - contacto
 *               - email
 *               - categorias
 *             properties:
 *               nome:
 *                 type: string
 *               nif:
 *                 type: string
 *               contacto:
 *                 type: string
 *               email:
 *                 type: string
 *               categorias:
 *                 type: array
 *                 items:
 *                   type: string
 *               observacoes:
 *                 type: string
 *               estado:
 *                 type: boolean
 *               valorMinimoEncomenda:
 *                 type: number
 *               prazoMedioEntrega:
 *                 type: integer
 *               custoTransporte:
 *                 type: number
 *               metodoPagamento:
 *                 type: string
 *               diasEntrega:
 *                 type: string
 *               produtoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Fornecedor atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fornecedor'
 *       400:
 *         description: Dados de entrada inválidos
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao atualizar fornecedor
 */
router.put('/:id', updateFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}/avaliacoes:
 *   post:
 *     summary: Cria ou atualiza (upsert) uma avaliação para o fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - utilizadorId
 *               - qualidade
 *               - pontualidade
 *               - comunicacao
 *               - preco
 *               - conformidade
 *             properties:
 *               utilizadorId:
 *                 type: integer
 *               qualidade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               pontualidade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comunicacao:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               preco:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               conformidade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avaliação atualizada com sucesso
 *       201:
 *         description: Avaliação criada com sucesso
 *       400:
 *         description: Erro de validação nos critérios (valores devem ser de 1 a 5)
 *       404:
 *         description: Fornecedor ou Utilizador não encontrado
 *       500:
 *         description: Erro ao registar avaliação
 */
router.post('/:id/avaliacoes', avaliarFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}/avaliacoes:
 *   get:
 *     summary: Lista todas as avaliações de um fornecedor específico
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     responses:
 *       200:
 *         description: Listagem de avaliações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Avaliacao'
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao obter avaliações
 */
router.get('/:id/avaliacoes', getAvaliacoesFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}/minha-avaliacao:
 *   get:
 *     summary: Obtém a avaliação efetuada por um utilizador específico para este fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *       - in: query
 *         name: utilizadorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do utilizador avaliador
 *     responses:
 *       200:
 *         description: Avaliação do utilizador retornada com sucesso (ou null se ainda não avaliou)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Avaliacao'
 *       400:
 *         description: Parâmetro utilizadorId em falta ou inválido
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao obter avaliação
 */
router.get('/:id/minha-avaliacao', getMinhaAvaliacaoFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}/avaliacao-media:
 *   get:
 *     summary: Obtém a média consolidada das avaliações do fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     responses:
 *       200:
 *         description: Média de avaliações calculada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAvaliacoes:
 *                   type: integer
 *                 media:
 *                   type: number
 *                   nullable: true
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao obter média de avaliação
 */
router.get('/:id/avaliacao-media', getAvaliacaoMediaFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}/estado:
 *   patch:
 *     summary: Alterna o estado ativo/inativo de um fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     responses:
 *       200:
 *         description: Estado do fornecedor alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fornecedor'
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao alterar estado
 */
router.patch('/:id/estado', toggleEstado);

/**
 * @swagger
 * /api/fornecedores/{id}/observacoes:
 *   patch:
 *     summary: Atualiza as observações internas de um fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Observações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fornecedor'
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao atualizar observações
 */
router.patch('/:id/observacoes', updateObservacoes);

/**
 * @swagger
 * /api/fornecedores/{id}/produtos/{produtoId}/preco:
 *   patch:
 *     summary: Atualiza o preço específico de um produto oferecido por este fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *       - in: path
 *         name: produtoId
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
 *             required:
 *               - preco
 *             properties:
 *               preco:
 *                 type: number
 *     responses:
 *       200:
 *         description: Preço específico atualizado com sucesso
 *       400:
 *         description: Preço inválido
 *       500:
 *         description: Erro ao atualizar preço
 */
router.patch('/:id/produtos/:produtoId/preco', updateProdutoPreco);

export default router;
