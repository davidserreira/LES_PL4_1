import { Router } from 'express';
import { createPedidoCompra, getAllPedidosCompra, confirmPedidoCompra } from '../controllers/PedidoCompraController';

const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);
router.put('/:id/confirmar', confirmPedidoCompra);

export default router;
