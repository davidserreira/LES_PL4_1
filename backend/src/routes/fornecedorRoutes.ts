import { Router } from 'express';
import { getFornecedores, createFornecedor, toggleEstado, updateObservacoes, updateFornecedor, avaliarFornecedor, getAvaliacaoMediaFornecedor, getMinhaAvaliacaoFornecedor, getAvaliacoesFornecedor, updateProdutoPreco } from '../controllers/FornecedorController';

const router = Router();

router.get('/', getFornecedores);
router.post('/', createFornecedor);
router.put('/:id', updateFornecedor);
router.post('/:id/avaliacoes', avaliarFornecedor);
router.get('/:id/avaliacoes', getAvaliacoesFornecedor);
router.get('/:id/minha-avaliacao', getMinhaAvaliacaoFornecedor);
router.get('/:id/avaliacao-media', getAvaliacaoMediaFornecedor);
router.patch('/:id/estado', toggleEstado);
router.patch('/:id/observacoes', updateObservacoes);
router.patch('/:id/produtos/:produtoId/preco', updateProdutoPreco);

export default router;
