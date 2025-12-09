import { googleSheetsService } from '../services/googleSheets.service.js';
import bcrypt from 'bcryptjs';

class AuthController {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário no Google Sheets
      const usuarios = await googleSheetsService.buscarUsuarios();
      const usuario = usuarios.find(u => u.email === email);

      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Criar sessão
      req.session.userId = usuario.id;
      req.session.userEmail = usuario.email;
      req.session.userName = usuario.nome;
      req.session.isAdmin = usuario.isAdmin === 'true' || usuario.isAdmin === true;

      // Salvar sessão explicitamente
      req.session.save((err) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
        }
      });

      res.json({
        success: true,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          isAdmin: req.session.isAdmin,
        },
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
    }
  }

  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao fazer logout' });
      }
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    });
  }

  async getCurrentUser(req, res) {
    if (req.session && req.session.userId) {
      try {
        // Sempre buscar do Google Sheets para garantir dados atualizados
        const usuarios = await googleSheetsService.buscarUsuarios();
        const usuario = usuarios.find(u => u.id === req.session.userId);

        if (usuario) {
          // Determinar se é admin (aceitar 'true', 'TRUE', 'True', true, '1', 1)
          const isAdminStr = String(usuario.isAdmin || '').trim().toLowerCase();
          const isAdminValue = isAdminStr === 'true' || usuario.isAdmin === true || isAdminStr === '1' || usuario.isAdmin === 1;
          
          // Atualizar sessão com dados do usuário
          req.session.userName = usuario.nome;
          req.session.userEmail = usuario.email;
          req.session.isAdmin = isAdminValue;

          // Debug em desenvolvimento
          if (process.env.NODE_ENV !== 'production') {
            console.log('📋 getCurrentUser - Usuário encontrado:', {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              isAdminRaw: usuario.isAdmin,
              isAdminType: typeof usuario.isAdmin,
              isAdminCalculated: isAdminValue,
            });
          }

          return res.json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            isAdmin: isAdminValue,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      }
    }
    res.status(401).json({ error: 'Não autenticado' });
  }

  async register(req, res) {
    try {
      const { nome, email, senha, isAdmin } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // Verificar se usuário já existe
      const usuarios = await googleSheetsService.buscarUsuarios();
      if (usuarios.some(u => u.email === email)) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Criar novo usuário
      const novoUsuario = await googleSheetsService.criarUsuario({
        nome,
        email,
        senhaHash,
        isAdmin: isAdmin || false,
      });

      res.json({
        success: true,
        message: 'Usuário criado com sucesso',
        user: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ error: 'Erro ao registrar usuário', details: error.message });
    }
  }
}

export const authController = new AuthController();









