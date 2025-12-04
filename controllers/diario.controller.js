import { googleSheetsService } from '../services/googleSheets.service.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DiarioController {
  async registrar(req, res) {
    try {
      const data = req.body.data;
      const profissionais = req.body.profissionais;
      const servicos = req.body.servicos;
      const pendencias = req.body.pendencias;

      // Validar dados obrigatórios
      if (!data) {
        return res.status(400).json({ 
          error: 'Data é obrigatória' 
        });
      }

      // Validar horário (deve ser registrado até 18h)
      const horaAtual = new Date().getHours();
      if (horaAtual >= 18) {
        return res.status(400).json({ 
          error: 'O registro deve ser feito até 18h' 
        });
      }

      // Processar profissionais
      const profissionaisArray = typeof profissionais === 'string' 
        ? JSON.parse(profissionais) 
        : profissionais;

      if (!profissionaisArray || profissionaisArray.length === 0) {
        return res.status(400).json({ 
          error: 'Pelo menos um profissional deve ser registrado' 
        });
      }

      // Processar serviços
      const servicosArray = typeof servicos === 'string' 
        ? JSON.parse(servicos) 
        : servicos || [];

      // Processar pendências
      const pendenciasArray = typeof pendencias === 'string' 
        ? JSON.parse(pendencias) 
        : pendencias || [];

      const obraId = req.body.obraId || req.session?.obraId || '';
      const localId = req.body.localId || '';

      // Registrar no Google Sheets
      await googleSheetsService.registrarProfissionais(data, profissionaisArray, obraId);
      
      if (servicosArray.length > 0) {
        await googleSheetsService.registrarServicos(data, servicosArray, obraId);
      }

      if (pendenciasArray.length > 0) {
        await googleSheetsService.registrarPendencias(data, pendenciasArray, obraId, localId);
      }

      res.json({
        success: true,
        message: 'Diário de obra registrado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao registrar diário:', error);
      res.status(500).json({
        error: 'Erro ao registrar diário de obra',
        details: error.message,
      });
    }
  }

  async buscarServicosExecutados(req, res) {
    try {
      const { obraId, localId, dataInicio, dataFim } = req.query;

      const servicos = await googleSheetsService.buscarServicosExecutados({
        obraId,
        localId,
        dataInicio,
        dataFim,
      });

      res.json(servicos);
    } catch (error) {
      console.error('Erro ao buscar serviços executados:', error);
      res.status(500).json({
        error: 'Erro ao buscar serviços executados',
        details: error.message,
      });
    }
  }

  async buscarPendenciasRegistradas(req, res) {
    try {
      const { obraId, localId, data } = req.query;

      const pendencias = await googleSheetsService.buscarPendenciasRegistradas({
        obraId,
        localId,
        data,
      });

      res.json(pendencias);
    } catch (error) {
      console.error('Erro ao buscar pendências registradas:', error);
      res.status(500).json({
        error: 'Erro ao buscar pendências registradas',
        details: error.message,
      });
    }
  }

  async buscarPendencias(req, res) {
    try {
      const { obraId, localId, status, dataInicio, dataFim } = req.query;

      const pendencias = await googleSheetsService.buscarPendencias({
        obraId,
        localId,
        status,
        dataInicio,
        dataFim,
      });

      res.json(pendencias);
    } catch (error) {
      console.error('Erro ao buscar pendências:', error);
      res.status(500).json({
        error: 'Erro ao buscar pendências',
        details: error.message,
      });
    }
  }

  async atualizarServico(req, res) {
    try {
      const { id } = req.params;
      const { data, obra, atividade, local, profissionaisEnvolvidos, percentualAvancado, observacoes } = req.body;

      if (!atividade || !atividade.trim()) {
        return res.status(400).json({ error: 'Atividade é obrigatória' });
      }

      const servicoAtualizado = await googleSheetsService.atualizarServico(id, {
        data,
        obra,
        atividade: atividade.trim(),
        local,
        profissionaisEnvolvidos,
        percentualAvancado,
        observacoes,
      });

      res.json({
        success: true,
        message: 'Serviço atualizado com sucesso',
        servico: servicoAtualizado,
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      res.status(500).json({ error: 'Erro ao atualizar serviço', details: error.message });
    }
  }

  async deletarServico(req, res) {
    try {
      const { id } = req.params;
      await googleSheetsService.deletarServico(id);
      res.json({ success: true, message: 'Serviço deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      res.status(500).json({ error: 'Erro ao deletar serviço', details: error.message });
    }
  }

  async atualizarPendencia(req, res) {
    try {
      const { id } = req.params;
      const { data, obra, local, descricao, prioridade, status, responsavel } = req.body;

      if (!descricao || !descricao.trim()) {
        return res.status(400).json({ error: 'Descrição é obrigatória' });
      }

      const pendenciaAtualizada = await googleSheetsService.atualizarPendencia(id, {
        data,
        obra,
        local,
        descricao: descricao.trim(),
        prioridade: prioridade || 'Média',
        status: status || 'Pendente',
        responsavel,
      });

      res.json({
        success: true,
        message: 'Pendência atualizada com sucesso',
        pendencia: pendenciaAtualizada,
      });
    } catch (error) {
      console.error('Erro ao atualizar pendência:', error);
      res.status(500).json({ error: 'Erro ao atualizar pendência', details: error.message });
    }
  }

  async deletarPendencia(req, res) {
    try {
      const { id } = req.params;
      await googleSheetsService.deletarPendencia(id);
      res.json({ success: true, message: 'Pendência deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar pendência:', error);
      res.status(500).json({ error: 'Erro ao deletar pendência', details: error.message });
    }
  }
}

export const diarioController = new DiarioController();

