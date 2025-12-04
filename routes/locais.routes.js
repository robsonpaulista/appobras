import express from 'express';
import { locaisController } from '../controllers/locais.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, locaisController.listar);
router.post('/', requireAuth, locaisController.criar);
router.put('/:id', requireAuth, locaisController.atualizar);
router.delete('/:id', requireAuth, locaisController.deletar);

export const locaisRoutes = router;





