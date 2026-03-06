import { Router } from 'express';
import * as ProdutoController from '../controllers/ProdutoController';

const router = Router();

router.get('/', ProdutoController.getProdutos);
router.post('/', ProdutoController.createProduto);
router.delete('/:id', ProdutoController.deleteProduto);

export default router;
