import { Router } from 'express';
import { 
    createPedidoCompra, 
    getAllPedidosCompra, 
    getPedidoById,
    cancelarPedido, 
    aprovarPedido, 
    recusarPedido,
    getRascunhos,
    updateRascunho,
    deleteRascunho,
    editarPedido,
    updateStatusAdmin,
    reverterPedido
} from '../controllers/PedidoCompraController';


const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);
router.get('/rascunhos', getRascunhos);
router.get('/:id', getPedidoById);
router.put('/:id', updateRascunho);
router.put('/:id/editar', editarPedido);
router.delete('/:id/rascunho', deleteRascunho);
router.patch('/:id/cancelar', cancelarPedido);
router.patch('/:id/aprovar', aprovarPedido);
router.patch('/:id/recusar', recusarPedido);
router.patch('/:id/status-admin', updateStatusAdmin);
router.patch('/:id/reverter', reverterPedido);

export default router;
