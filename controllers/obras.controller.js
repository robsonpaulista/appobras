import { googleSheetsService } from '../services/googleSheets.service.js';

class ObrasController {
  async listar(req, res) {
    try {
      const obras = await googleSheetsService.buscarObras();
      res.json(obras);
    } catch (error) {
      console.error('Erro ao listar obras:', error);
      res.status(500).json({ error: 'Erro ao listar obras', details: error.message });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const obras = await googleSheetsService.buscarObras();
      const obra = obras.find(o => o.id === id);

      if (!obra) {
        return res.status(404).json({ error: 'Obra não encontrada' });
      }

      res.json(obra);
    } catch (error) {
      console.error('Erro ao buscar obra:', error);
      res.status(500).json({ error: 'Erro ao buscar obra', details: error.message });
    }
  }

  async criar(req, res) {
    try {
      console.log('=== CRIAR OBRA ===');
      console.log('Body recebido:', req.body);
      const { descricao, local, previsaoInicio, previsaoFim, valorPrevisto } = req.body;
      console.log('Descrição extraída:', descricao);

      if (!descricao || !descricao.trim()) {
        console.log('ERRO: Descrição vazia');
        return res.status(400).json({ error: 'Descrição da obra é obrigatória' });
      }

      const novaObra = await googleSheetsService.criarObra({
        descricao: descricao.trim(),
        local: local || '',
        previsaoInicio: previsaoInicio || '',
        previsaoFim: previsaoFim || '',
        valorPrevisto: valorPrevisto || '0',
      });

      res.json({
        success: true,
        message: 'Obra criada com sucesso',
        obra: novaObra,
      });
    } catch (error) {
      console.error('Erro ao criar obra:', error);
      res.status(500).json({ error: 'Erro ao criar obra', details: error.message });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { descricao, local, previsaoInicio, previsaoFim, valorPrevisto, ativo } = req.body;

      const obraAtualizada = await googleSheetsService.atualizarObra(id, {
        descricao,
        local,
        previsaoInicio,
        previsaoFim,
        valorPrevisto,
        ativo,
      });

      res.json({
        success: true,
        message: 'Obra atualizada com sucesso',
        obra: obraAtualizada,
      });
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      res.status(500).json({ error: 'Erro ao atualizar obra', details: error.message });
    }
  }

  async deletar(req, res) {
    try {
      const { id } = req.params;
      await googleSheetsService.deletarObra(id);
      res.json({ success: true, message: 'Obra deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar obra:', error);
      res.status(500).json({ error: 'Erro ao deletar obra', details: error.message });
    }
  }
}

export const obrasController = new ObrasController();




