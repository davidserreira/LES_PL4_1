import { Router } from 'express';
import { UtilizadorController } from '../controllers/UtilizadorController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Utilizadores
 *   description: Gestão de utilizadores e autenticação
 */

/**
 * @swagger
 * /api/utilizadores:
 *   get:
 *     summary: Lista todos os utilizadores registados
 *     tags: [Utilizadores]
 *     responses:
 *       200:
 *         description: Lista de utilizadores retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Utilizador'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', UtilizadorController.listar);

/**
 * @swagger
 * /api/utilizadores/{id}:
 *   get:
 *     summary: Obtém os detalhes de um utilizador específico por ID
 *     tags: [Utilizadores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do utilizador
 *     responses:
 *       200:
 *         description: Utilizador retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilizador'
 *       404:
 *         description: Utilizador não encontrado
 *       500:
 *         description: Erro ao obter utilizador
 */
router.get('/:id', UtilizadorController.obter);

/**
 * @swagger
 * /api/utilizadores:
 *   post:
 *     summary: Cria um novo utilizador
 *     tags: [Utilizadores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 default: '123456'
 *               role:
 *                 $ref: '#/components/schemas/Role'
 *               ativo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Utilizador criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilizador'
 *       400:
 *         description: Nome de utilizador já está em uso
 *       500:
 *         description: Erro ao criar utilizador
 */
router.post('/', UtilizadorController.criar);

/**
 * @swagger
 * /api/utilizadores/{id}:
 *   put:
 *     summary: Atualiza os dados de um utilizador existente
 *     tags: [Utilizadores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do utilizador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 $ref: '#/components/schemas/Role'
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Utilizador atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilizador'
 *       500:
 *         description: Erro ao atualizar utilizador
 */
router.put('/:id', UtilizadorController.atualizar);

/**
 * @swagger
 * /api/utilizadores/{id}:
 *   delete:
 *     summary: Elimina um utilizador
 *     tags: [Utilizadores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do utilizador
 *     responses:
 *       204:
 *         description: Utilizador removido com sucesso (sem conteúdo)
 *       500:
 *         description: Erro ao remover utilizador
 */
router.delete('/:id', UtilizadorController.remover);

/**
 * @swagger
 * /api/utilizadores/login:
 *   post:
 *     summary: Realiza a autenticação de um utilizador
 *     tags: [Utilizadores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login efetuado com sucesso (retorna dados do utilizador sem a password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utilizador'
 *       401:
 *         description: Credenciais inválidas (username ou password incorretos)
 *       403:
 *         description: Conta inativa (utilizador inativo no sistema)
 *       500:
 *         description: Erro ao processar login
 */
router.post('/login', UtilizadorController.login);

export default router;
