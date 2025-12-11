import express from 'express';
import { usuariosController } from '../controllers/usuarios.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação e permissões de administrador
router.get('/', requireAuth, requireAdmin, usuariosController.listar);
router.get('/:id', requireAuth, requireAdmin, usuariosController.buscarPorId);
router.post('/', requireAuth, requireAdmin, usuariosController.criar);
router.put('/:id', requireAuth, requireAdmin, usuariosController.atualizar);
router.delete('/:id', requireAuth, requireAdmin, usuariosController.deletar);

export const usuariosRoutes = router;







