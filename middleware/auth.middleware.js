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

export const requireAdmin = async (req, res, next) => {
  // Debug: verificar sessão
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔒 Verificando admin - Sessão:', {
      hasSession: !!req.session,
      userId: req.session?.userId,
      isAdmin: req.session?.isAdmin,
      isAdminType: typeof req.session?.isAdmin,
    });
  }

  // Se não tiver sessão ou userId, negar acesso
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Se não tiver isAdmin na sessão, buscar do Google Sheets
  if (req.session.isAdmin === undefined) {
    try {
      const { googleSheetsService } = await import('../services/googleSheets.service.js');
      const usuarios = await googleSheetsService.buscarUsuarios();
      const usuario = usuarios.find(u => u.id === req.session.userId);
      
      if (usuario) {
        const isAdminStr = String(usuario.isAdmin || '').trim().toLowerCase();
        req.session.isAdmin = isAdminStr === 'true' || usuario.isAdmin === true || isAdminStr === '1' || usuario.isAdmin === 1;
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('📋 requireAdmin - Atualizado da planilha:', {
            isAdminRaw: usuario.isAdmin,
            isAdminCalculated: req.session.isAdmin,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário no requireAdmin:', error);
    }
  }

  const isAdmin = req.session.isAdmin === true || String(req.session.isAdmin || '').trim().toLowerCase() === 'true' || req.session.isAdmin === 1;
  
  if (isAdmin) {
    return next();
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('❌ Acesso negado - não é admin');
  }
  
  res.status(403).json({ error: 'Acesso negado. Requer permissões de administrador.' });
};









