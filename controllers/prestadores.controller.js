import { googleSheetsService } from '../services/googleSheets.service.js';

class PrestadoresController {
  async listar(req, res) {
    try {
      const prestadores = await googleSheetsService.buscarPrestadores();
      res.json(prestadores);
    } catch (error) {
      console.error('Erro ao listar prestadores:', error);
      res.status(500).json({ error: 'Erro ao listar prestadores', details: error.message });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const prestadores = await googleSheetsService.buscarPrestadores();
      const prestador = prestadores.find(p => p.id === id);

      if (!prestador) {
        return res.status(404).json({ error: 'Prestador não encontrado' });
      }

      res.json(prestador);
    } catch (error) {
      console.error('Erro ao buscar prestador:', error);
      res.status(500).json({ error: 'Erro ao buscar prestador', details: error.message });
    }
  }

  async criar(req, res) {
    try {
      const { nome, funcao, valorDiaria } = req.body;

      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome do prestador é obrigatório' });
      }

      const novoPrestador = await googleSheetsService.criarPrestador({
        nome: nome.trim(),
        funcao: funcao || '',
        valorDiaria: valorDiaria || '0',
      });

      res.json({
        success: true,
        message: 'Prestador criado com sucesso',
        prestador: novoPrestador,
      });
    } catch (error) {
      console.error('Erro ao criar prestador:', error);
      res.status(500).json({ error: 'Erro ao criar prestador', details: error.message });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, funcao, valorDiaria } = req.body;

      const prestadorAtualizado = await googleSheetsService.atualizarPrestador(id, {
        nome,
        funcao,
        valorDiaria,
      });

      res.json({
        success: true,
        message: 'Prestador atualizado com sucesso',
        prestador: prestadorAtualizado,
      });
    } catch (error) {
      console.error('Erro ao atualizar prestador:', error);
      res.status(500).json({ error: 'Erro ao atualizar prestador', details: error.message });
    }
  }

  async deletar(req, res) {
    try {
      const { id } = req.params;
      await googleSheetsService.deletarPrestador(id);
      res.json({ success: true, message: 'Prestador deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar prestador:', error);
      res.status(500).json({ error: 'Erro ao deletar prestador', details: error.message });
    }
  }
}

export const prestadoresController = new PrestadoresController();












