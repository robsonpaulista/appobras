import express from 'express';
import { buscarDadosDashboard } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, buscarDadosDashboard);

export const dashboardRoutes = router;



