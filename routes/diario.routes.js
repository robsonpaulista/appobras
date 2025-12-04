import express from 'express';
import multer from 'multer';
import { diarioController } from '../controllers/diario.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  },
});

router.post('/registrar', requireAuth, upload.array('fotos', 10), diarioController.registrar);
router.get('/servicos-executados', requireAuth, diarioController.buscarServicosExecutados);
router.put('/servicos-executados/:id', requireAuth, diarioController.atualizarServico);
router.delete('/servicos-executados/:id', requireAuth, diarioController.deletarServico);
router.get('/pendencias-registradas', requireAuth, diarioController.buscarPendenciasRegistradas);
router.get('/pendencias', requireAuth, diarioController.buscarPendencias);
router.put('/pendencias/:id', requireAuth, diarioController.atualizarPendencia);
router.delete('/pendencias/:id', requireAuth, diarioController.deletarPendencia);

export const diarioRoutes = router;

