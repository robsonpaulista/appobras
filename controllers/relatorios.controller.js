import { googleSheetsService } from '../services/googleSheets.service.js';

class RelatoriosController {
  async diario(req, res) {
    try {
      const { obraId, dataInicio, dataFim } = req.query;

      const relatorio = await googleSheetsService.gerarRelatorioDiario({
        obraId,
        dataInicio,
        dataFim,
      });

      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de diário:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
  }

  async profissionais(req, res) {
    try {
      const { obraId, dataInicio, dataFim } = req.query;

      const relatorio = await googleSheetsService.gerarRelatorioProfissionais({
        obraId,
        dataInicio,
        dataFim,
      });

      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de profissionais:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
  }

  async servicos(req, res) {
    try {
      const { obraId, dataInicio, dataFim } = req.query;

      const relatorio = await googleSheetsService.gerarRelatorioServicos({
        obraId,
        dataInicio,
        dataFim,
      });

      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de serviços:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
  }

  async pendencias(req, res) {
    try {
      const { obraId, status } = req.query;

      const relatorio = await googleSheetsService.gerarRelatorioPendencias({
        obraId,
        status,
      });

      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de pendências:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
  }
}

export const relatoriosController = new RelatoriosController();





