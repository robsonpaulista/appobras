import express from 'express';
import { obrasController } from '../controllers/obras.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, obrasController.listar);
router.get('/:id', requireAuth, obrasController.buscarPorId);
router.post('/', requireAuth, obrasController.criar);
router.put('/:id', requireAuth, obrasController.atualizar);
router.delete('/:id', requireAuth, obrasController.deletar);

export const obrasRoutes = router;















