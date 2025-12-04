import { googleSheetsService } from '../services/googleSheets.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function criarCompra(req, res) {
  try {
    const { obraId, localId, data, fornecedor, comprador, valorNota, descricao } = req.body;
    
    if (!obraId || !localId || !data || !fornecedor || !comprador || !valorNota || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const anexoPath = req.file ? req.file.path : null;
    const anexoNome = req.file ? req.file.filename : null;

    const compra = {
      obra: obraId,
      local: localId,
      data,
      fornecedor,
      comprador,
      valorNota: parseFloat(valorNota),
      descricao,
      anexo: anexoNome,
      dataCriacao: new Date().toISOString(),
      usuarioId: req.session.userId,
    };

    const id = await googleSheetsService.criarCompra(compra);

    res.status(201).json({
      message: 'Compra registrada com sucesso!',
      id,
    });
  } catch (error) {
    console.error('Erro ao criar compra:', error);
    res.status(500).json({ error: 'Erro ao registrar compra: ' + error.message });
  }
}

export async function buscarCompras(req, res) {
  try {
    const compras = await googleSheetsService.buscarCompras();
    res.json(compras);
  } catch (error) {
    console.error('Erro ao buscar compras:', error);
    res.status(500).json({ error: 'Erro ao buscar compras: ' + error.message });
  }
}

export async function deletarCompra(req, res) {
  try {
    const { id } = req.params;
    
    // Buscar compra para obter o nome do anexo
    const compras = await googleSheetsService.buscarCompras();
    const compra = compras.find(c => c.id === id);
    
    if (compra && compra.anexo) {
      // Deletar arquivo físico
      const anexoPath = path.join(__dirname, '../uploads/compras', compra.anexo);
      if (fs.existsSync(anexoPath)) {
        fs.unlinkSync(anexoPath);
      }
    }
    
    await googleSheetsService.deletarCompra(id);
    res.json({ message: 'Compra excluída com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar compra:', error);
    res.status(500).json({ error: 'Erro ao excluir compra: ' + error.message });
  }
}

export async function atualizarCompra(req, res) {
  try {
    const { id } = req.params;
    const { obraId, localId, data, fornecedor, comprador, valorNota, descricao } = req.body;
    
    if (!obraId || !localId || !data || !fornecedor || !comprador || !valorNota || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Buscar compra atual para manter anexo se não houver novo
    const compras = await googleSheetsService.buscarCompras();
    const compraAtual = compras.find(c => c.id === id);
    
    if (!compraAtual) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    let anexoNome = compraAtual.anexo; // Manter anexo atual por padrão

    // Se houver novo anexo, substituir
    if (req.file) {
      // Deletar anexo antigo se existir
      if (compraAtual.anexo) {
        const anexoPathAntigo = path.join(__dirname, '../uploads/compras', compraAtual.anexo);
        if (fs.existsSync(anexoPathAntigo)) {
          fs.unlinkSync(anexoPathAntigo);
        }
      }
      anexoNome = req.file.filename;
    }

    const compra = {
      obra: obraId,
      local: localId,
      data,
      fornecedor,
      comprador,
      valorNota: parseFloat(valorNota),
      descricao,
      anexo: anexoNome,
      usuarioId: req.session.userId,
    };

    await googleSheetsService.atualizarCompra(id, compra);

    res.json({
      message: 'Compra atualizada com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    res.status(500).json({ error: 'Erro ao atualizar compra: ' + error.message });
  }
}

export async function obterAnexo(req, res) {
  try {
    const { id } = req.params;
    
    const compras = await googleSheetsService.buscarCompras();
    const compra = compras.find(c => c.id === id);
    
    if (!compra || !compra.anexo) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }
    
    const anexoPath = path.join(__dirname, '../uploads/compras', compra.anexo);
    
    if (!fs.existsSync(anexoPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    res.sendFile(anexoPath);
  } catch (error) {
    console.error('Erro ao obter anexo:', error);
    res.status(500).json({ error: 'Erro ao obter anexo: ' + error.message });
  }
}

