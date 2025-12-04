import express from 'express';
import { prestadoresController } from '../controllers/prestadores.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, prestadoresController.listar);
router.get('/:id', requireAuth, prestadoresController.buscarPorId);
router.post('/', requireAuth, prestadoresController.criar);
router.put('/:id', requireAuth, prestadoresController.atualizar);
router.delete('/:id', requireAuth, prestadoresController.deletar);

export const prestadoresRoutes = router;


