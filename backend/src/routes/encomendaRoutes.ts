import { Router } from 'express';
import { 
    gerarEncomendas, 
    getAllEncomendas, 
    getEncomendaById, 
    atualizarEstado, 
    receberEncomenda,
    getHistoricoStock
} from '../controllers/EncomendaController';

const router = Router();

router.post('/gerar/:pedidoId', gerarEncomendas);
router.get('/historico', getHistoricoStock);
router.get('/', getAllEncomendas);
router.get('/:id', getEncomendaById);
router.patch('/:id/estado', atualizarEstado);
router.patch('/:id/receber', receberEncomenda);

export default router;
