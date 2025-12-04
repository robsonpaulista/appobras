import { googleSheetsService } from '../services/googleSheets.service.js';

class LocaisController {
  async listar(req, res) {
    try {
      const locais = await googleSheetsService.buscarLocais();
      res.json(locais);
    } catch (error) {
      console.error('Erro ao listar locais:', error);
      res.status(500).json({ error: 'Erro ao listar locais', details: error.message });
    }
  }

  async criar(req, res) {
    try {
      const { nome, descricao } = req.body;

      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome do local é obrigatório' });
      }

      // Verificar se já existe
      const locais = await googleSheetsService.buscarLocais();
      if (locais.some(l => l.nome.toLowerCase() === nome.toLowerCase().trim())) {
        return res.status(400).json({ error: 'Local com este nome já existe' });
      }

      const novoLocal = await googleSheetsService.criarLocal({
        nome: nome.trim(),
        descricao: descricao || '',
      });

      res.json({
        success: true,
        message: 'Local criado com sucesso',
        local: novoLocal,
      });
    } catch (error) {
      console.error('Erro ao criar local:', error);
      res.status(500).json({ error: 'Erro ao criar local', details: error.message });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao } = req.body;

      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome do local é obrigatório' });
      }

      const localAtualizado = await googleSheetsService.atualizarLocal(id, {
        nome: nome.trim(),
        descricao: descricao || '',
      });

      res.json({
        success: true,
        message: 'Local atualizado com sucesso',
        local: localAtualizado,
      });
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      res.status(500).json({ error: 'Erro ao atualizar local', details: error.message });
    }
  }

  async deletar(req, res) {
    try {
      const { id } = req.params;
      await googleSheetsService.deletarLocal(id);
      res.json({ success: true, message: 'Local deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar local:', error);
      res.status(500).json({ error: 'Erro ao deletar local', details: error.message });
    }
  }
}

export const locaisController = new LocaisController();





