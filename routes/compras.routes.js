import express from 'express';
import { criarCompra, buscarCompras, deletarCompra, atualizarCompra, obterAnexo } from '../controllers/compras.controller.js';
import { requireAuth as authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/compras');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `compra-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, JPG e PNG são permitidos'));
    }
  }
});

const router = express.Router();

router.post('/', authMiddleware, upload.single('anexo'), criarCompra);
router.get('/', authMiddleware, buscarCompras);
router.put('/:id', authMiddleware, upload.single('anexo'), atualizarCompra);
router.delete('/:id', authMiddleware, deletarCompra);
router.get('/anexo/:id', authMiddleware, obterAnexo);

export default router;

