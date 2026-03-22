import { Router } from 'express';
import { createPedidoCompra, getAllPedidosCompra, cancelarPedido, aprovarPedido, recusarPedido, atualizarEstadoPedido } from '../controllers/PedidoCompraController';

const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);
router.patch('/:id/cancelar', cancelarPedido);
router.patch('/:id/aprovar', aprovarPedido);
router.patch('/:id/recusar', recusarPedido);
router.patch('/:id/estado', atualizarEstadoPedido);

export default router;
