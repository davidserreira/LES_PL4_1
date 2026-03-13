import { Router } from 'express';
import { getFornecedores, createFornecedor, toggleEstado, updateObservacoes, updateFornecedor } from '../controllers/FornecedorController';

const router = Router();

router.get('/', getFornecedores);
router.post('/', createFornecedor);
router.put('/:id', updateFornecedor);
router.patch('/:id/estado', toggleEstado);
router.patch('/:id/observacoes', updateObservacoes);

export default router;
