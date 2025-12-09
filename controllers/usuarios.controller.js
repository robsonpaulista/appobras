import { googleSheetsService } from '../services/googleSheets.service.js';
import bcrypt from 'bcryptjs';

class UsuariosController {
  async listar(req, res) {
    try {
      const usuarios = await googleSheetsService.buscarUsuarios();
      // Não retornar senhaHash por segurança
      const usuariosSemSenha = usuarios.map(u => {
        const isAdminStr = String(u.isAdmin || '').trim().toLowerCase();
        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          isAdmin: isAdminStr === 'true' || u.isAdmin === true,
          dataCriacao: u.dataCriacao,
        };
      });
      res.json(usuariosSemSenha);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários', details: error.message });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const usuarios = await googleSheetsService.buscarUsuarios();
      const usuario = usuarios.find(u => u.id === id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não retornar senhaHash por segurança
      const isAdminStr = String(usuario.isAdmin || '').trim().toLowerCase();
      res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        isAdmin: isAdminStr === 'true' || usuario.isAdmin === true,
        dataCriacao: usuario.dataCriacao,
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário', details: error.message });
    }
  }

  async criar(req, res) {
    try {
      const { nome, email, senha, isAdmin } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      // Validar senha
      if (senha.length < 4) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
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
          isAdmin: novoUsuario.isAdmin,
        },
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, senha, isAdmin } = req.body;

      // Validar email se fornecido
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Email inválido' });
        }

        // Verificar se email já existe em outro usuário
        const usuarios = await googleSheetsService.buscarUsuarios();
        const emailExistente = usuarios.find(u => u.email === email && u.id !== id);
        if (emailExistente) {
          return res.status(400).json({ error: 'Email já cadastrado para outro usuário' });
        }
      }

      // Validar senha se fornecida
      if (senha && senha.length < 4) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
      }

      // Não permitir que usuário remova seu próprio status de admin
      if (req.session.userId === id && isAdmin === false) {
        return res.status(403).json({ error: 'Você não pode remover seu próprio status de administrador' });
      }

      const usuarioAtualizado = await googleSheetsService.atualizarUsuario(id, {
        nome,
        email,
        senha,
        isAdmin,
      });

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        user: usuarioAtualizado,
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar usuário', details: error.message });
    }
  }

  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Não permitir que usuário delete a si mesmo
      if (req.session.userId === id) {
        return res.status(403).json({ error: 'Você não pode deletar sua própria conta' });
      }

      await googleSheetsService.deletarUsuario(id);

      res.json({
        success: true,
        message: 'Usuário deletado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro ao deletar usuário', details: error.message });
    }
  }
}

export const usuariosController = new UsuariosController();

