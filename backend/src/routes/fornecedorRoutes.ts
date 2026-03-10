import { Router } from 'express';
import { getFornecedores, createFornecedor } from '../controllers/FornecedorController';

const router = Router();

router.get('/', getFornecedores);
router.post('/', createFornecedor);

export default router;
