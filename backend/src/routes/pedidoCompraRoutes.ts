import { Router } from 'express';
import { createPedidoCompra, getAllPedidosCompra, cancelarPedido } from '../controllers/PedidoCompraController';

const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);
router.patch('/:id/cancelar', cancelarPedido);

export default router;
