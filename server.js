import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Configurar trust proxy para Vercel
// O Vercel funciona como proxy reverso, então precisamos confiar nele
if (isVercel || isProduction) {
  app.set('trust proxy', 1); // Confiar no primeiro proxy (Vercel)
}

// Validar SESSION_SECRET em produção (mas não bloquear inicialização no Vercel)
if (isProduction && !process.env.SESSION_SECRET) {
  console.error('AVISO: SESSION_SECRET não definido em produção!');
  console.error('Configure SESSION_SECRET nas variáveis de ambiente do Vercel.');
  // Não fazer exit(1) pois pode causar problemas no Vercel durante deploy
}

// Headers de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://unpkg.com"],
      connectSrc: ["'self'", "https://unpkg.com"], // Permitir unpkg.com para source maps
    },
  },
  crossOriginEmbedderPolicy: false, // Necessário para alguns recursos
}));

// Configurar CORS adequadamente
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : (isProduction ? [] : ['http://localhost:3000']);

// Adicionar domínio do Vercel automaticamente se estiver em produção
if (isProduction && process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (isProduction && process.env.VERCEL) {
  // Permitir requisições do próprio Vercel
  allowedOrigins.push('https://*.vercel.app');
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Em desenvolvimento, permitir localhost
    if (!isProduction && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // No Vercel, permitir o próprio domínio automaticamente
    if (isVercel) {
      // Permitir qualquer origem do Vercel
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }
    }
    
    // Em produção, verificar lista de origens permitidas
    if (isProduction && allowedOrigins.length > 0) {
      // Verificar match exato ou wildcard
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const pattern = allowed.replace('*', '.*');
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        return callback(null, true);
      } else {
        // Log para debug mas não bloquear em produção inicial
        console.warn(`CORS bloqueado para origem: ${origin}`);
        return callback(new Error('Não permitido pelo CORS'));
      }
    }
    
    // Se não houver lista definida em produção, permitir todas (temporário)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP por janela
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Limitar tamanho do payload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? 'temp-secret-change-in-production' : 'dev-secret-key-change-in-production');

if (isProduction && !process.env.SESSION_SECRET) {
  console.warn('⚠️  ATENÇÃO: Usando SESSION_SECRET temporário. Configure uma chave segura nas variáveis de ambiente!');
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Não usar nome padrão
  cookie: {
    secure: isProduction || isVercel ? true : false, // HTTPS apenas em produção/Vercel
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: isProduction || isVercel ? 'lax' : 'lax', // 'lax' funciona melhor com proxies
    // Não definir domain no Vercel para funcionar em todos os subdomínios
    domain: (isVercel ? undefined : process.env.COOKIE_DOMAIN) || undefined,
  },
  // Em produção, usar store adequado (Redis, etc)
  // Por enquanto, usar memória (não recomendado para múltiplas instâncias)
}));

// Servir arquivos estáticos ANTES de qualquer rota
// Isso garante que CSS, JS e outros assets sejam servidos corretamente
app.use(express.static(join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
}));
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

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Exportar para Vercel (serverless function)
export default app;

// Iniciar servidor apenas em desenvolvimento local
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

