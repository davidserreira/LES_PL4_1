import { Router } from 'express';
import { getRelatorioFinanceiro } from '../controllers/RelatorioController';

const router = Router();

router.get('/financeiro', getRelatorioFinanceiro);

export default router;
