import { Router } from 'express';
import { UtilizadorController } from '../controllers/UtilizadorController';

const router = Router();

router.get('/', UtilizadorController.listar);
router.get('/:id', UtilizadorController.obter);
router.post('/', UtilizadorController.criar);
router.put('/:id', UtilizadorController.atualizar);
router.delete('/:id', UtilizadorController.remover);
router.post('/login', UtilizadorController.login);

export default router;
