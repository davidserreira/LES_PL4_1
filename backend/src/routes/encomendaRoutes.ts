import { Router } from 'express';
import { gerarEncomendas, getAllEncomendas, getEncomendaById } from '../controllers/EncomendaController';

const router = Router();

router.post('/gerar/:pedidoId', gerarEncomendas);
router.get('/', getAllEncomendas);
router.get('/:id', getEncomendaById);

export default router;
