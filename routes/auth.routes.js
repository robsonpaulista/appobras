import express from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.post('/register', authController.register);

export const authRoutes = router;





