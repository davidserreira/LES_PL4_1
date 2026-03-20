import { Router } from 'express';
import { createPedidoCompra, getAllPedidosCompra, updatePedidoCompra, cancelPedidoCompra } from '../controllers/PedidoCompraController';

const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);
router.put('/:id', updatePedidoCompra);
router.put('/:id/cancelar', cancelPedidoCompra);

export default router;
