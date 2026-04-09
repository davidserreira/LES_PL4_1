import { Router } from 'express';
import { 
    createPedidoCompra, 
    getAllPedidosCompra, 
    cancelarPedido, 
    aprovarPedido, 
    recusarPedido,
    getRascunhos,
    updateRascunho,
    deleteRascunho,
    editarPedido,
    updateStatusAdmin
} from '../controllers/PedidoCompraController';


const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);
router.get('/rascunhos', getRascunhos);
router.put('/:id', updateRascunho);
router.put('/:id/editar', editarPedido);
router.delete('/:id/rascunho', deleteRascunho);
router.patch('/:id/cancelar', cancelarPedido);
router.patch('/:id/aprovar', aprovarPedido);
router.patch('/:id/recusar', recusarPedido);
router.patch('/:id/status-admin', updateStatusAdmin);

export default router;

