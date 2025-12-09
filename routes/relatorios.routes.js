import express from 'express';
import { relatoriosController } from '../controllers/relatorios.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/diario', requireAuth, relatoriosController.diario);
router.get('/profissionais', requireAuth, relatoriosController.profissionais);
router.get('/servicos', requireAuth, relatoriosController.servicos);
router.get('/pendencias', requireAuth, relatoriosController.pendencias);

export const relatoriosRoutes = router;









