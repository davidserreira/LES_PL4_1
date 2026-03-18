import { Router } from 'express';
import { createPedidoCompra, getAllPedidosCompra } from '../controllers/PedidoCompraController';

const router = Router();

router.post('/', createPedidoCompra);
router.get('/', getAllPedidosCompra);

export default router;
