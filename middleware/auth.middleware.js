export const requireAuth = (req, res, next) => {
  // Debug: verificar sessão
  if (process.env.NODE_ENV !== 'production') {
    console.log('Verificando autenticação:', {
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionId: req.sessionID,
    });
  }
  
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
};

export const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado. Requer permissões de administrador.' });
};









