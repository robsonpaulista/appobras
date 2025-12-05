import { googleSheetsService } from '../services/googleSheets.service.js';

export async function buscarDadosDashboard(req, res) {
  try {
    const { obraId, localId, dataInicio, dataFim } = req.query;
    
    // Buscar todas as obras
    const obras = await googleSheetsService.buscarObras();
    
    // Aplicar filtro de obra se fornecido
    let obrasFiltradas = obras;
    if (obraId) {
      obrasFiltradas = obras.filter(o => 
        (o.descricao === obraId || o.nome === obraId)
      );
    }
    
    // Buscar dados financeiros com filtros
    const dadosFinanceiros = await googleSheetsService.buscarDadosFinanceiros({
      obraId,
      localId,
      dataInicio,
      dataFim,
    });
    
    // Buscar pendências com filtros
    const pendencias = await googleSheetsService.buscarPendencias({
      obraId,
      localId,
      dataInicio,
      dataFim,
    });
    
    // Buscar serviços com filtros
    const servicos = await googleSheetsService.buscarServicosExecutados({
      obraId,
      localId,
      dataInicio,
      dataFim,
    });
    
    // Agrupar dados por obra
    const obrasComDados = obrasFiltradas.map(obra => {
      // Aplicar filtro de local se fornecido
      let comprasObra = dadosFinanceiros.filter(d => 
        d.tipo === 'Compra' && 
        (d.obra === obra.descricao || d.obra === obra.nome)
      );
      let pagamentosObra = dadosFinanceiros.filter(d => 
        d.tipo === 'Pagamento' && 
        (d.obra === obra.descricao || d.obra === obra.nome)
      );
      
      if (localId) {
        comprasObra = comprasObra.filter(c => c.local === localId);
        pagamentosObra = pagamentosObra.filter(p => p.local === localId);
      }
      
      const pendenciasObra = pendencias.filter(p => 
        (p.obra === obra.descricao || p.obra === obra.nome) &&
        p.status !== 'Resolvida' && p.status !== 'resolvida'
      );
      
      const servicosObra = servicos.filter(s => 
        s.obra === obra.descricao || s.obra === obra.nome
      );
      
      return {
        id: obra.id,
        nome: obra.nome,
        descricao: obra.descricao,
        local: obra.local,
        valorPrevisto: parseFloat(obra.valorPrevisto || 0),
        ativo: obra.ativo,
        totalCompras: comprasObra.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0),
        totalPagamentos: pagamentosObra.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0),
        pendenciasAbertas: pendenciasObra.length,
        totalServicos: servicosObra.length,
        compras: comprasObra.map(c => ({
          valor: parseFloat(c.valor || 0),
          descricao: c.descricao || 'Sem descrição',
          data: c.data || '',
          local: c.local || '',
        })),
        pagamentos: pagamentosObra.map(p => ({
          valor: parseFloat(p.valor || 0),
          descricao: p.descricao || 'Sem descrição',
          data: p.data || '',
          local: p.local || '',
          prestador: p.prestador || '',
        })),
      };
    });
    
    res.json({
      obras: obrasComDados,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({
      error: 'Erro ao buscar dados do dashboard',
      details: error.message,
    });
  }
}

