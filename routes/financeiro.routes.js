import express from 'express';
import { buscarDadosFinanceiros, registrarPagamento } from '../controllers/financeiro.controller.js';
import { requireAuth as authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, buscarDadosFinanceiros);
router.post('/pagamento', authMiddleware, registrarPagamento);

export default router;





