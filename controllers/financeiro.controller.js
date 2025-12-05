import { googleSheetsService } from '../services/googleSheets.service.js';

export async function buscarDadosFinanceiros(req, res) {
  try {
    const { obraId, localId, dataInicio, dataFim } = req.query;

    const dados = await googleSheetsService.buscarDadosFinanceiros({
      obraId,
      localId,
      dataInicio,
      dataFim,
    });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    res.status(500).json({
      error: 'Erro ao buscar dados financeiros',
      details: error.message,
    });
  }
}

export async function registrarPagamento(req, res) {
  try {
    const { obraId, localId, data, prestadorId, valor, descricao } = req.body;

    if (!obraId || !localId || !data || !prestadorId || !valor || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const pagamento = {
      obra: obraId,
      local: localId,
      data,
      prestador: prestadorId,
      valor: parseFloat(valor),
      descricao,
      tipo: 'Pagamento',
      usuarioId: req.session.userId,
    };

    const id = await googleSheetsService.registrarPagamento(pagamento);

    res.status(201).json({
      message: 'Pagamento registrado com sucesso!',
      id,
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento: ' + error.message });
  }
}



