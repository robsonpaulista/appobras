import express from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout); // Logout não precisa auth, permite limpar sessão inválida
router.get('/me', requireAuth, authController.getCurrentUser);
// Rota de registro protegida - apenas admins podem criar usuários
router.post('/register', requireAuth, requireAdmin, authController.register);

export const authRoutes = router;









