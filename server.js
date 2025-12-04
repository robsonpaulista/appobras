import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { diarioRoutes } from './routes/diario.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { locaisRoutes } from './routes/locais.routes.js';
import { obrasRoutes } from './routes/obras.routes.js';
import { prestadoresRoutes } from './routes/prestadores.routes.js';
import comprasRoutes from './routes/compras.routes.js';
import financeiroRoutes from './routes/financeiro.routes.js';
import { relatoriosRoutes } from './routes/relatorios.routes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'diario-obra-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
}));
app.use(express.static(join(__dirname, 'public')));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Rotas da API (devem vir antes das rotas de páginas)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/diario', diarioRoutes);
app.use('/api/locais', locaisRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/prestadores', prestadoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Debug: Log de rotas registradas
console.log('Rotas da API registradas:');
console.log('  - /api/auth/login');
console.log('  - /api/auth/logout');
console.log('  - /api/auth/me');

// Middleware de tratamento de erros para rotas da API (apenas se não for uma rota conhecida)
app.use('/api/*', (req, res, next) => {
  // Se chegou aqui, a rota não foi encontrada
  console.log(`Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

// Rotas de páginas (devem vir depois das rotas da API)
// Rota padrão (dashboard)
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'login.html'));
});

app.get('/locais.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'locais.html'));
});

app.get('/compras.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'compras.html'));
});

app.get('/obras.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'obras.html'));
});

app.get('/prestadores.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'prestadores.html'));
});

app.get('/relatorios.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'relatorios.html'));
});

app.get('/servicos-executados.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'servicos-executados.html'));
});

app.get('/pendencias.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'pendencias.html'));
});

app.get('/financeiro.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'financeiro.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

app.get('/diario-obra.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Catch-all para páginas não encontradas
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Rota não encontrada' });
  } else {
    res.status(404).sendFile(join(__dirname, 'public', 'dashboard.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

