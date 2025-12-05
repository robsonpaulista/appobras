import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.init();
  }

  async init() {
    try {
      // Processar chave privada corretamente
      let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
      if (privateKey) {
        // Remover aspas se existirem
        privateKey = privateKey.replace(/^["']|["']$/g, '');
        // Substituir \n literal por quebra de linha real
        privateKey = privateKey.replace(/\\n/g, '\n');
        // Se ainda tiver \\n, substituir também
        privateKey = privateKey.replace(/\\\\n/g, '\n');
      }

      if (!privateKey || !process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
        console.warn('Credenciais do Google Sheets não configuradas. Configure o arquivo .env');
        return;
      }

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });

      // Criar abas se não existirem
      await this.ensureSheetsExist();
      
      // Garantir que a aba Financeiro existe
      await this.ensureFinanceiroSheetExists();
    } catch (error) {
      console.error('Erro ao inicializar Google Sheets:', error.message);
      // Não lança erro para permitir que o servidor inicie mesmo sem Google Sheets configurado
      console.warn('Servidor iniciará sem integração com Google Sheets. Configure as credenciais no .env');
    }
  }

  async ensureFinanceiroSheetExists() {
    if (!this.sheets || !this.spreadsheetId) {
      return;
    }

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetExists = spreadsheet.data.sheets.some(
        sheet => sheet.properties.title === 'Financeiro'
      );

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Financeiro',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 11,
                  },
                },
              },
            }],
          },
        });

        // Adicionar cabeçalhos
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Financeiro!A1:J1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              'ID',
              'Data',
              'Obra',
              'Local',
              'Tipo',
              'Descricao',
              'Valor',
              'Comprador/Prestador',
              'UsuarioId',
              'Ativo',
            ]],
          },
        });

        console.log('Aba Financeiro criada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar aba Financeiro:', error);
    }
  }

  async ensureSheetsExist() {
    try {
      if (!this.spreadsheetId) {
        console.warn('GOOGLE_SHEETS_SPREADSHEET_ID não configurado. As abas serão criadas quando a planilha for configurada.');
        return;
      }

      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
      const requiredSheets = ['Usuarios', 'Obras', 'Locais', 'Compras', 'Profissionais', 'Servicos', 'Pendencias', 'Fotos'];

      for (const sheetName of requiredSheets) {
        if (!existingSheets.includes(sheetName)) {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              requests: [{
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              }],
            },
          });

          // Adicionar cabeçalhos
          await this.addHeaders(sheetName);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar abas:', error.message);
      // Não lança erro para não quebrar a inicialização
    }
  }

  async verificarOuCriarAba(sheetName, headersArray) {
    try {
      if (!this.spreadsheetId || !this.sheets) {
        return;
      }

      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
      
      if (!existingSheets.includes(sheetName)) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            }],
          },
        });

        // Adicionar cabeçalhos
        if (headersArray && headersArray.length > 0) {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [headersArray],
            },
          });
        }
      }
    } catch (error) {
      console.error(`Erro ao verificar/criar aba ${sheetName}:`, error);
      // Não lança erro para não quebrar o registro principal
    }
  }

  async addHeaders(sheetName) {
    let headers = [];
    
    switch (sheetName) {
      case 'Usuarios':
        headers = [['ID', 'Nome', 'Email', 'SenhaHash', 'IsAdmin', 'DataCriacao']];
        break;
      case 'Obras':
        headers = [['ID', 'Nome', 'Endereco', 'Descricao', 'DataCriacao', 'Ativo']];
        break;
      case 'Locais':
        headers = [['ID', 'Nome', 'Descricao', 'DataCriacao', 'Ativo']];
        break;
      case 'Compras':
        headers = [['ID', 'Data', 'Obra', 'Local', 'Fornecedor', 'ValorNota', 'Descricao', 'Anexo', 'UsuarioId']];
        break;
      case 'Profissionais':
        headers = [['Nome', 'Função', 'Valor da Diária']];
        break;
      case 'Servicos':
        headers = [['Data', 'Obra', 'Atividade', 'Local', 'Profissionais Envolvidos', 'Percentual Avanço', 'Observações']];
        break;
      case 'Pendencias':
        headers = [['Data', 'Obra', 'Local', 'Descrição', 'Prioridade', 'Status', 'Responsável']];
        break;
      case 'Fotos':
        headers = [['ID', 'ObraID', 'Data', 'URL', 'Latitude', 'Longitude', 'Descrição', 'Local']];
        break;
    }

    if (headers.length > 0) {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: headers,
        },
      });
    }
  }

  async registrarProfissionais(data, profissionais, obraId) {
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    }
    if (!this.sheets) {
      throw new Error('Google Sheets não inicializado. Verifique as credenciais no arquivo .env');
    }

    // Buscar profissionais existentes para evitar duplicatas
    const profissionaisExistentes = await this.buscarProfissionais();
    const nomesExistentes = new Set(profissionaisExistentes.map(p => p.nome.toLowerCase()));

    const values = profissionais
      .filter(prof => {
        // Filtrar apenas profissionais com nome e função
        if (!prof.nome || !prof.funcao) return false;
        // Evitar duplicatas baseado no nome
        return !nomesExistentes.has(prof.nome.toLowerCase());
      })
      .map(prof => {
        // Usar valor da diária se disponível, senão usar valorMaoObra ou 0
        const valorDiaria = prof.valorDiaria || prof.valorMaoObra || 0;
        return [
          prof.nome,
          prof.funcao,
          valorDiaria,
        ];
      });

    if (values.length > 0) {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Profissionais!A2',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });
    }
  }

  async buscarProfissionais() {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Profissionais!A2:C',
      });

      if (!response.data.values) return [];

      return response.data.values.map((row) => ({
        nome: row[0] || '',
        funcao: row[1] || '',
        valorDiaria: parseFloat(row[2] || 0),
      }));
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      return [];
    }
  }

  async buscarHorariosProfissionais({ obraId, dataInicio, dataFim }) {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      let response;
      try {
        response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'ProfissionaisHorarios!A2:H',
          valueRenderOption: 'FORMATTED_VALUE',
        });
      } catch (error) {
        // Se a aba não existir, retornar array vazio
        if (error.message && error.message.includes('Unable to parse range')) {
          return [];
        }
        throw error;
      }

      if (!response.data || !response.data.values) {
        return [];
      }

      const rows = response.data.values.filter(row => row && row.length > 0 && row[0]);

      if (rows.length === 0) {
        return [];
      }

      // Função para converter data
      const converterData = (valor) => {
        if (!valor) return '';
        if (typeof valor === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const dataObj = new Date(excelEpoch.getTime() + (valor - 1) * 24 * 60 * 60 * 1000);
          if (!isNaN(dataObj.getTime())) {
            const ano = dataObj.getFullYear();
            const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            const dia = String(dataObj.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
          }
        }
        const dataStr = valor.toString().trim();
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
          return dataStr;
        }
        return dataStr;
      };

      let horarios = rows.map((row) => ({
        data: converterData(row[0]),
        obra: row[1] || '',
        local: row[2] || '',
        profissional: row[3] || '',
        funcao: row[4] || '',
        entrada: row[5] || '',
        saida: row[6] || '',
        horasTrabalhadas: row[7] || '',
      }));

      // Aplicar filtros
      if (obraId) {
        horarios = horarios.filter(h => {
          const obraHorario = (h.obra || '').toString().trim();
          const obraFiltro = obraId.toString().trim();
          return obraHorario === obraFiltro || 
                 obraHorario.toLowerCase() === obraFiltro.toLowerCase();
        });
      }

      // Função auxiliar para converter data
      const parsearData = (dataStr) => {
        if (!dataStr) return null;
        try {
          const partes = dataStr.toString().split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const ano = parseInt(partes[2], 10);
            return new Date(ano, mes, dia);
          }
          return new Date(dataStr);
        } catch {
          return null;
        }
      };

      if (dataInicio) {
        const dataInicioFiltro = new Date(dataInicio);
        horarios = horarios.filter(h => {
          if (!h.data) return false;
          const dataHorario = parsearData(h.data);
          if (!dataHorario || isNaN(dataHorario.getTime())) return false;
          return dataHorario >= dataInicioFiltro;
        });
      }

      if (dataFim) {
        const dataFimFiltro = new Date(dataFim);
        horarios = horarios.filter(h => {
          if (!h.data) return false;
          const dataHorario = parsearData(h.data);
          if (!dataHorario || isNaN(dataHorario.getTime())) return false;
          return dataHorario <= dataFimFiltro;
        });
      }

      return horarios;
    } catch (error) {
      console.error('Erro ao buscar horários dos profissionais:', error);
      return [];
    }
  }

  async registrarServicos(data, servicos, obraId) {
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    }
    if (!this.sheets) {
      throw new Error('Google Sheets não inicializado. Verifique as credenciais no arquivo .env');
    }

    const values = servicos.map(serv => {
      return [
        data,  // A: Data
        obraId || serv.obra || '',  // B: Obra
        serv.atividade || '',  // C: Atividade
        serv.local || '',  // D: Local
        Array.isArray(serv.profissionaisEnvolvidos) 
          ? serv.profissionaisEnvolvidos.join(' / ') 
          : serv.profissionaisEnvolvidos || '',  // E: Profissionais Envolvidos
        serv.percentualAvancado || '',  // F: Percentual Avanço
        serv.observacoes || '',  // G: Observações
      ];
    });

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Servicos!A2',
      valueInputOption: 'USER_ENTERED', // Mantém formato de data como string
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    // Registrar horários dos profissionais em uma aba separada
    if (servicos.some(serv => serv.profissionaisDetalhados && serv.profissionaisDetalhados.length > 0)) {
      await this.registrarHorariosProfissionais(data, servicos, obraId);
    }
  }

  async registrarHorariosProfissionais(data, servicos, obraId) {
    try {
      // Verificar se a aba existe, se não, criar
      await this.verificarOuCriarAba('ProfissionaisHorarios', [
        'Data', 'Obra', 'Local', 'Profissional', 'Função', 'Entrada', 'Saída', 'Horas Trabalhadas'
      ]);

      const values = [];
      
      servicos.forEach(serv => {
        if (serv.profissionaisDetalhados && Array.isArray(serv.profissionaisDetalhados)) {
          serv.profissionaisDetalhados.forEach(prof => {
            if (prof.nome && prof.entrada) {
              values.push([
                data,  // A: Data
                obraId || serv.obra || '',  // B: Obra
                serv.local || '',  // C: Local
                prof.nome || '',  // D: Profissional
                prof.funcao || '',  // E: Função
                prof.entrada || '',  // F: Entrada
                prof.saida || '',  // G: Saída
                prof.horasTrabalhadas || '',  // H: Horas Trabalhadas
              ]);
            }
          });
        }
      });

      if (values.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'ProfissionaisHorarios!A2',
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao registrar horários dos profissionais:', error);
      // Não lança erro para não quebrar o registro principal
    }
  }

  async registrarPendencias(data, pendencias, obraId, localId) {
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    }
    if (!this.sheets) {
      throw new Error('Google Sheets não inicializado. Verifique as credenciais no arquivo .env');
    }

    const values = pendencias.map(pend => {
      return [
        data,  // A: Data
        obraId || pend.obra || '',  // B: Obra
        pend.local || localId || '',  // C: Local (prioriza o local da pendência, senão usa o global)
        pend.descricao || '',  // D: Descrição
        pend.prioridade || 'Média',  // E: Prioridade
        pend.status || 'Pendente',  // F: Status
        pend.responsavel || '',  // G: Responsável
      ];
    });

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Pendencias!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });
  }

  async registrarFotos(data, fotos, obraId) {
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
    }
    if (!this.sheets) {
      throw new Error('Google Sheets não inicializado. Verifique as credenciais no arquivo .env');
    }

    const values = fotos.map(foto => {
      const id = `foto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return [
        id,
        obraId || '',
        data,
        foto.url,
        foto.latitude || '',
        foto.longitude || '',
        foto.descricao || '',
        foto.local || '',
      ];
    });

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Fotos!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });
  }

  // Métodos para Usuários
  async buscarUsuarios() {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Usuarios!A2:F',
      });

      if (!response.data.values) return [];

      return response.data.values.map((row, index) => ({
        id: row[0] || `user_${index + 2}`,
        nome: row[1] || '',
        email: row[2] || '',
        senhaHash: row[3] || '',
        isAdmin: row[4] || 'false',
        dataCriacao: row[5] || '',
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  async criarUsuario(usuario) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const id = `user_${Date.now()}`;
    const values = [[
      id,
      usuario.nome,
      usuario.email,
      usuario.senhaHash,
      usuario.isAdmin ? 'true' : 'false',
      new Date().toISOString(),
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Usuarios!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { id, ...usuario };
  }

  // Métodos para Obras
  async buscarObras() {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Obras!A2:H',
      });

      if (!response.data.values) return [];

      return response.data.values
        .filter(row => row[7] !== 'false' && row[7] !== false) // Filtrar inativas (coluna H)
        .map((row, index) => ({
          id: row[0] || `obra_${index + 2}`,
          descricao: row[1] || '',
          dataCriacao: row[2] || '',
          local: row[3] || '',
          previsaoInicio: row[4] || '',
          previsaoFim: row[5] || '',
          valorPrevisto: row[6] || '0',
          ativo: row[7] !== 'false' && row[7] !== false,
        }));
    } catch (error) {
      console.error('Erro ao buscar obras:', error);
      return [];
    }
  }

  async criarObra(obra) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const id = `obra_${Date.now()}`;
    const dataCriacao = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const values = [[
      id,
      obra.descricao || '',
      dataCriacao,
      obra.local || '',
      obra.previsaoInicio || '',
      obra.previsaoFim || '',
      obra.valorPrevisto || '0',
      'true',
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Obras!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { 
      id, 
      descricao: obra.descricao || '',
      dataCriacao,
      local: obra.local || '',
      previsaoInicio: obra.previsaoInicio || '',
      previsaoFim: obra.previsaoFim || '',
      valorPrevisto: obra.valorPrevisto || '0',
      ativo: true 
    };
  }

  async atualizarObra(id, obra) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const obras = await this.buscarObras();
    const obraIndex = obras.findIndex(o => o.id === id);
    if (obraIndex === -1) {
      throw new Error('Obra não encontrada');
    }

    // Buscar linha na planilha (linha = índice + 2 devido ao cabeçalho)
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Obras!A:H',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Obra não encontrada na planilha');
    }

    const rowNumber = rowIndex + 1;
    const row = rows[rowIndex];
    const values = [[
      id,
      obra.descricao !== undefined ? obra.descricao : (row[1] || ''),
      obra.dataCriacao !== undefined ? obra.dataCriacao : (row[2] || new Date().toISOString().split('T')[0]),
      obra.local !== undefined ? obra.local : (row[3] || ''),
      obra.previsaoInicio !== undefined ? obra.previsaoInicio : (row[4] || ''),
      obra.previsaoFim !== undefined ? obra.previsaoFim : (row[5] || ''),
      obra.valorPrevisto !== undefined ? obra.valorPrevisto : (row[6] || '0'),
      obra.ativo !== undefined ? (obra.ativo ? 'true' : 'false') : (row[7] || 'true'),
    ]];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Obras!A${rowNumber}:H${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return { 
      id, 
      descricao: values[0][1],
      dataCriacao: values[0][2],
      local: values[0][3],
      previsaoInicio: values[0][4],
      previsaoFim: values[0][5],
      valorPrevisto: values[0][6],
      ativo: values[0][7] === 'true'
    };
  }

  async deletarObra(id) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Obras!A:H',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Obra não encontrada');
    }

    const rowNumber = rowIndex + 1;
    // Marcar como inativa em vez de deletar (coluna H)
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Obras!H${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['false']] },
    });
  }

  // Métodos para Locais
  async buscarLocais() {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Locais!A2:E',
      });

      if (!response.data.values) return [];

      return response.data.values
        .filter(row => row[4] !== 'false') // Filtrar inativos
        .map((row, index) => ({
          id: row[0] || `local_${index + 2}`,
          nome: row[1] || '',
          descricao: row[2] || '',
          dataCriacao: row[3] || '',
          ativo: row[4] !== 'false',
        }));
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      return [];
    }
  }

  async criarLocal(local) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const id = `local_${Date.now()}`;
    const values = [[
      id,
      local.nome,
      local.descricao || '',
      new Date().toISOString(),
      'true',
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Locais!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { id, ...local, dataCriacao: new Date().toISOString(), ativo: true };
  }

  async atualizarLocal(id, local) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Locais!A:E',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Local não encontrado');
    }

    const rowNumber = rowIndex + 1;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Locais!B${rowNumber}:C${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          local.nome || '',
          local.descricao || '',
        ]],
      },
    });

    return {
      id,
      nome: local.nome || '',
      descricao: local.descricao || '',
    };
  }

  async deletarLocal(id) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Locais!A:E',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Local não encontrado');
    }

    const rowNumber = rowIndex + 1;
    // Marcar como inativo
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Locais!E${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['false']] },
    });
  }

  // Métodos para Relatórios
  async gerarRelatorioDiario({ obraId, dataInicio, dataFim }) {
    if (!this.sheets || !this.spreadsheetId) {
      return { obras: [], message: 'Google Sheets não inicializado' };
    }

    try {
      // Buscar serviços executados
      const servicos = await this.buscarServicosExecutados({
        obraId,
        localId: null,
        dataInicio,
        dataFim,
      });

      // Buscar pendências
      const pendencias = await this.buscarPendencias({
        obraId,
        localId: null,
        status: null,
        dataInicio,
        dataFim,
      });

      // Buscar todas as obras para ter a lista completa
      const todasObras = await this.buscarObras();

      // Agrupar dados por obra e data
      const obrasMap = {};

      // Inicializar obras
      todasObras.forEach(obra => {
        const obraKey = obra.descricao || obra.nome || obra.id;
        if (!obrasMap[obraKey]) {
          obrasMap[obraKey] = {
            obra: obraKey,
            obraId: obra.id,
            local: obra.local || '',
            registros: [],
          };
        }
      });

      // Adicionar serviços ao relatório
      servicos.forEach(servico => {
        const obraKey = servico.obra || 'Sem obra';
        if (!obrasMap[obraKey]) {
          obrasMap[obraKey] = {
            obra: obraKey,
            obraId: '',
            local: servico.local || '',
            registros: [],
          };
        }

        const dataKey = servico.data || 'Sem data';
        if (!obrasMap[obraKey].registros.find(r => r.data === dataKey)) {
          obrasMap[obraKey].registros.push({
            data: dataKey,
            servicos: [],
            pendencias: [],
          });
        }

        const registro = obrasMap[obraKey].registros.find(r => r.data === dataKey);
        registro.servicos.push({
          atividade: servico.atividade || '',
          local: servico.local || '',
          profissionaisEnvolvidos: servico.profissionaisEnvolvidos || '',
          percentualAvancado: servico.percentualAvancado || '',
          observacoes: servico.observacoes || '',
        });
      });

      // Adicionar pendências ao relatório
      pendencias.forEach(pendencia => {
        const obraKey = pendencia.obra || 'Sem obra';
        if (!obrasMap[obraKey]) {
          obrasMap[obraKey] = {
            obra: obraKey,
            obraId: '',
            local: pendencia.local || '',
            registros: [],
          };
        }

        const dataKey = pendencia.data || 'Sem data';
        if (!obrasMap[obraKey].registros.find(r => r.data === dataKey)) {
          obrasMap[obraKey].registros.push({
            data: dataKey,
            servicos: [],
            pendencias: [],
          });
        }

        const registro = obrasMap[obraKey].registros.find(r => r.data === dataKey);
        registro.pendencias.push({
          descricao: pendencia.descricao || '',
          local: pendencia.local || '',
          prioridade: pendencia.prioridade || '',
          status: pendencia.status || 'Pendente',
          responsavel: pendencia.responsavel || '',
        });
      });

      // Converter para array e ordenar
      const obras = Object.values(obrasMap)
        .filter(obra => obra.registros.length > 0) // Apenas obras com registros
        .map(obra => {
          // Ordenar registros por data (mais recente primeiro)
          obra.registros.sort((a, b) => {
            try {
              const dataA = new Date(a.data);
              const dataB = new Date(b.data);
              if (isNaN(dataA.getTime()) || isNaN(dataB.getTime())) return 0;
              return dataB - dataA;
            } catch {
              return 0;
            }
          });
          return obra;
        })
        .sort((a, b) => {
          // Ordenar obras por nome
          return (a.obra || '').localeCompare(b.obra || '');
        });

      return {
        obras,
        totalObras: obras.length,
        totalRegistros: obras.reduce((sum, obra) => sum + obra.registros.length, 0),
        periodo: {
          dataInicio: dataInicio || null,
          dataFim: dataFim || null,
        },
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de diário:', error);
      throw error;
    }
  }

  async gerarRelatorioProfissionais({ obraId, dataInicio, dataFim, profissionalNome }) {
    if (!this.sheets || !this.spreadsheetId) {
      return { profissionais: [] };
    }

    try {
      // Buscar todas as obras para mapear IDs para descrições
      const todasObras = await this.buscarObras();
      const obrasMap = new Map();
      todasObras.forEach(obra => {
        obrasMap.set(obra.id, obra.descricao || obra.nome || '');
        obrasMap.set(obra.descricao || obra.nome || '', obra.descricao || obra.nome || '');
      });

      // Buscar todos os serviços executados
      const servicos = await this.buscarServicosExecutados({
        obraId,
        localId: null,
        dataInicio,
        dataFim,
      });

      // Buscar horários dos profissionais (sem filtro de obra para pegar todos)
      const horariosProfissionais = await this.buscarHorariosProfissionais({
        obraId: null, // Buscar todos para depois filtrar
        dataInicio,
        dataFim,
      });

      // Buscar lista de profissionais cadastrados
      const profissionaisCadastrados = await this.buscarProfissionais();
      const profissionaisMap = new Map();
      profissionaisCadastrados.forEach(prof => {
        profissionaisMap.set(prof.nome.toLowerCase(), prof);
      });

      // Agrupar por profissional
      const profissionaisRelatorio = {};

      // Função para normalizar data para comparação
      const normalizarData = (dataStr) => {
        if (!dataStr) return '';
        // Se já está no formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
          return dataStr;
        }
        // Tentar converter de DD/MM/YYYY para YYYY-MM-DD
        const partes = dataStr.toString().split('/');
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        return dataStr;
      };

      // Função para normalizar nome da obra
      const normalizarObra = (obra) => {
        return (obra || '').toString().trim().toLowerCase();
      };

      // Criar um mapa de profissionais com horários por data/obra
      const profissionaisHorariosMap = {};

      // Popular mapa de horários - agrupar por nome, data e obra
      horariosProfissionais.forEach(horario => {
        const nomeKey = (horario.profissional || '').toLowerCase().trim();
        const dataKey = normalizarData(horario.data);
        let obraKey = normalizarObra(horario.obra);
        
        // Tentar converter obra ID para descrição se necessário
        if (obrasMap.has(obraKey)) {
          obraKey = normalizarObra(obrasMap.get(obraKey));
        }
        
        // Criar chave principal
        const chavePrincipal = `${nomeKey}_${dataKey}_${obraKey}`;
        
        // Criar múltiplas chaves possíveis para garantir que encontre
        const chavesPossiveis = [
          chavePrincipal,
          `${nomeKey}_${horario.data || ''}_${horario.obra || ''}`.toLowerCase().trim(),
          `${nomeKey}_${dataKey}_${horario.obra || ''}`.toLowerCase().trim(),
          `${nomeKey}_${horario.data || ''}_${obraKey}`,
        ];
        
        chavesPossiveis.forEach(chave => {
          if (!chave || chave.includes('undefined')) return;
          
          if (!profissionaisHorariosMap[chave]) {
            profissionaisHorariosMap[chave] = {
              entrada: horario.entrada || null,
              saida: horario.saida || null,
              horasTrabalhadas: horario.horasTrabalhadas || null,
            };
          } else {
            // Usar o primeiro horário de entrada e último de saída
            if (horario.entrada && (!profissionaisHorariosMap[chave].entrada || 
                horario.entrada < profissionaisHorariosMap[chave].entrada)) {
              profissionaisHorariosMap[chave].entrada = horario.entrada;
            }
            if (horario.saida && (!profissionaisHorariosMap[chave].saida || 
                horario.saida > profissionaisHorariosMap[chave].saida)) {
              profissionaisHorariosMap[chave].saida = horario.saida;
            }
            if (horario.horasTrabalhadas && !profissionaisHorariosMap[chave].horasTrabalhadas) {
              profissionaisHorariosMap[chave].horasTrabalhadas = horario.horasTrabalhadas;
            }
          }
        });
      });
      
      // Debug: log do mapa de horários (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Mapa de horários criado:', Object.keys(profissionaisHorariosMap).length, 'entradas');
      }
      
      // Processar serviços para criar os registros

      // Agora processar os serviços para criar os registros
      servicos.forEach(servico => {
        if (!servico.profissionaisEnvolvidos) return;

        // Parse dos profissionais envolvidos (formato: "Nome - Função / Nome2 - Função2")
        const profissionaisStr = servico.profissionaisEnvolvidos;
        const profissionaisList = profissionaisStr.split(' / ').map(p => p.trim()).filter(p => p);

        profissionaisList.forEach(profStr => {
          // Extrair nome e função (formato: "Nome - Função")
          const partes = profStr.split(' - ');
          const nome = partes[0]?.trim() || profStr.trim();
          const funcao = partes[1]?.trim() || '';

          if (!nome) return;

          const nomeKey = nome.toLowerCase();
          
          // Inicializar profissional se não existir
          if (!profissionaisRelatorio[nomeKey]) {
            const profCadastrado = profissionaisMap.get(nomeKey);
            profissionaisRelatorio[nomeKey] = {
              nome: nome,
              funcao: funcao || profCadastrado?.funcao || 'Não informada',
              valorDiaria: profCadastrado?.valorDiaria || 0,
              registros: [],
            };
          }

          // Adicionar registro do dia
          const dataKey = servico.data || 'Sem data';
          let obraKey = servico.obra || 'Sem obra';
          
          // Converter obra ID para descrição se necessário
          if (obrasMap.has(obraKey)) {
            obraKey = obrasMap.get(obraKey) || obraKey;
          }
          
          // Buscar registro existente para esta data e obra
          let registro = profissionaisRelatorio[nomeKey].registros.find(r => 
            r.data === dataKey && r.obra === obraKey
          );

          if (!registro) {
            // Buscar horários do mapa - tentar múltiplas chaves possíveis
            const dataNormalizada = normalizarData(dataKey);
            const obraNormalizada = normalizarObra(obraKey);
            
            const chavesPossiveis = [
              `${nomeKey}_${dataNormalizada}_${obraNormalizada}`,
              `${nomeKey}_${dataKey}_${obraKey}`.toLowerCase().trim(),
              `${nomeKey}_${dataNormalizada}_${obraKey}`.toLowerCase().trim(),
              `${nomeKey}_${dataKey}_${obraNormalizada}`,
            ];
            
            let horarios = {};
            for (const chave of chavesPossiveis) {
              if (profissionaisHorariosMap[chave]) {
                horarios = profissionaisHorariosMap[chave];
                break;
              }
            }
            
            // Se não encontrou por chave exata, buscar por nome e data (sem obra)
            if (!horarios.entrada && !horarios.saida) {
              const chaveSemObra = `${nomeKey}_${dataNormalizada}_`;
              for (const chave in profissionaisHorariosMap) {
                if (chave.startsWith(chaveSemObra)) {
                  horarios = profissionaisHorariosMap[chave];
                  break;
                }
              }
            }
            
            // Se ainda não encontrou, buscar apenas por nome e data (qualquer obra)
            if (!horarios.entrada && !horarios.saida) {
              for (const chave in profissionaisHorariosMap) {
                if (chave.startsWith(`${nomeKey}_${dataNormalizada}_`)) {
                  horarios = profissionaisHorariosMap[chave];
                  break;
                }
              }
            }
            
            // Se ainda não encontrou, buscar apenas por nome (qualquer data/obra do mesmo profissional)
            if (!horarios.entrada && !horarios.saida) {
              for (const chave in profissionaisHorariosMap) {
                if (chave.startsWith(`${nomeKey}_`)) {
                  // Verificar se a data está próxima (mesmo dia)
                  const partesChave = chave.split('_');
                  if (partesChave.length >= 2) {
                    const dataChave = partesChave[1];
                    // Se a data normalizada corresponde, usar esses horários
                    if (dataChave === dataNormalizada || dataChave === dataKey) {
                      horarios = profissionaisHorariosMap[chave];
                      break;
                    }
                  }
                }
              }
            }
            
            registro = {
              data: dataKey,
              obra: obraKey,
              local: servico.local || 'Sem local',
              servicos: [],
              entrada: horarios.entrada || null,
              saida: horarios.saida || null,
              horasTrabalhadas: horarios.horasTrabalhadas || null,
            };
            profissionaisRelatorio[nomeKey].registros.push(registro);
          }

          // Adicionar serviço ao registro (evitar duplicatas)
          const servicoJaExiste = registro.servicos.some(s => 
            s.atividade === servico.atividade && 
            s.percentualAvancado === servico.percentualAvancado
          );
          
          if (!servicoJaExiste) {
            registro.servicos.push({
              atividade: servico.atividade || '',
              percentualAvancado: servico.percentualAvancado || '',
              observacoes: servico.observacoes || '',
            });
          }
        });
      });

      // Converter para array e ordenar
      let profissionais = Object.values(profissionaisRelatorio)
        .map(prof => {
          // Ordenar registros por data (mais recente primeiro)
          prof.registros.sort((a, b) => {
            try {
              const dataA = new Date(a.data);
              const dataB = new Date(b.data);
              if (isNaN(dataA.getTime()) || isNaN(dataB.getTime())) return 0;
              return dataB - dataA;
            } catch {
              return 0;
            }
          });

          // Calcular totais
          prof.totalDias = prof.registros.length;
          prof.totalHoras = prof.registros.reduce((sum, reg) => {
            if (reg.horasTrabalhadas) {
              // Parse horas trabalhadas (formato: "8h30min")
              const match = reg.horasTrabalhadas.match(/(\d+)h(\d+)min/);
              if (match) {
                return sum + parseInt(match[1]) + parseInt(match[2]) / 60;
              }
            } else if (reg.entrada && reg.saida) {
              // Calcular horas trabalhadas a partir de entrada e saída
              try {
                const [hEntrada, mEntrada] = reg.entrada.split(':').map(Number);
                const [hSaida, mSaida] = reg.saida.split(':').map(Number);
                const minutosEntrada = hEntrada * 60 + mEntrada;
                const minutosSaida = hSaida * 60 + mSaida;
                const minutosTrabalhados = minutosSaida - minutosEntrada;
                if (minutosTrabalhados > 0) {
                  return sum + minutosTrabalhados / 60;
                }
              } catch (e) {
                // Ignorar erros de parse
              }
            }
            return sum;
          }, 0);

          return prof;
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));

      // Aplicar filtro de profissional se fornecido
      if (profissionalNome && profissionalNome.trim()) {
        const nomeFiltro = profissionalNome.trim().toLowerCase();
        profissionais = profissionais.filter(prof => 
          prof.nome.toLowerCase() === nomeFiltro
        );
      }

      return {
        profissionais,
        totalProfissionais: profissionais.length,
        periodo: {
          dataInicio: dataInicio || null,
          dataFim: dataFim || null,
        },
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de profissionais:', error);
      throw error;
    }
  }

  async gerarRelatorioServicos({ obraId, dataInicio, dataFim }) {
    // Implementação básica - pode ser expandida
    return { message: 'Relatório de serviços em desenvolvimento' };
  }

  async buscarServicosExecutados({ obraId, localId, dataInicio, dataFim }) {
    if (!this.sheets || !this.spreadsheetId) {
      console.warn('Google Sheets não inicializado. Retornando array vazio.');
      return [];
    }

    try {
      // Tentar primeiro com valores formatados (string)
      let response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Servicos!A2:G',
        valueRenderOption: 'FORMATTED_VALUE', // Retorna valores formatados como string
      });
      
      // Se não retornar dados ou retornar números, tentar não formatado
      if (!response.data.values || (response.data.values.length > 0 && typeof response.data.values[0][0] === 'number')) {
        response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Servicos!A2:G',
          valueRenderOption: 'UNFORMATTED_VALUE',
        });
      }

      if (!response.data || !response.data.values) {
        console.log('Nenhum dado encontrado na planilha de Serviços');
        return [];
      }

      // Filtrar linhas vazias
      const rows = response.data.values.filter(row => row && row.length > 0 && row[0]);

      if (rows.length === 0) {
        console.log('Nenhum serviço encontrado na planilha');
        return [];
      }

      // Função para converter data do Google Sheets
      const converterData = (valor) => {
        if (!valor) return '';
        
        // Se for número, é serial date do Google Sheets
        if (typeof valor === 'number') {
          // Google Sheets serial date: 1 = 30/12/1899
          // Mas na prática, datas são armazenadas como dias desde 30/12/1899
          // O número 45994 parece ser um timestamp ou formato diferente
          // Vamos tentar diferentes interpretações
          
          // Se o número for muito grande, pode ser timestamp em milissegundos
          if (valor > 1000000000000) {
            const dataObj = new Date(valor);
            if (!isNaN(dataObj.getTime())) {
              const ano = dataObj.getFullYear();
              const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
              const dia = String(dataObj.getDate()).padStart(2, '0');
              return `${ano}-${mes}-${dia}`;
            }
          }
          
          // Tentar como serial date do Google Sheets
          const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899
          const dataObj = new Date(excelEpoch.getTime() + (valor - 1) * 24 * 60 * 60 * 1000);
          
          if (!isNaN(dataObj.getTime())) {
            const ano = dataObj.getFullYear();
            // Validar se o ano está em um range razoável
            if (ano >= 1900 && ano <= 2100) {
              const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
              const dia = String(dataObj.getDate()).padStart(2, '0');
              return `${ano}-${mes}-${dia}`;
            }
          }
          
          // Se não funcionou, tentar como dias desde 1/1/1970 (epoch Unix)
          const unixEpoch = new Date(1970, 0, 1);
          const dataObjUnix = new Date(unixEpoch.getTime() + valor * 24 * 60 * 60 * 1000);
          if (!isNaN(dataObjUnix.getTime())) {
            const ano = dataObjUnix.getFullYear();
            if (ano >= 1900 && ano <= 2100) {
              const mes = String(dataObjUnix.getMonth() + 1).padStart(2, '0');
              const dia = String(dataObjUnix.getDate()).padStart(2, '0');
              return `${ano}-${mes}-${dia}`;
            }
          }
        }
        
        // Se for string, tentar formatar
        const dataStr = valor.toString().trim();
        
        // Formato DD/MM/YYYY
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0');
          const mes = partes[1].padStart(2, '0');
          const ano = partes[2];
          return `${ano}-${mes}-${dia}`;
        }
        
        // Formato YYYY-MM-DD (já formatado)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
          return dataStr;
        }
        
        // Tentar parse direto
        const dataObj = new Date(dataStr);
        if (!isNaN(dataObj.getTime())) {
          const ano = dataObj.getFullYear();
          const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
          const dia = String(dataObj.getDate()).padStart(2, '0');
          return `${ano}-${mes}-${dia}`;
        }
        
        return dataStr;
      };

      let servicos = rows.map((row, index) => ({
        id: `servico_${index + 2}`,
        data: converterData(row[0]),
        obra: row[1] || '',
        atividade: row[2] || '',
        local: row[3] || '',
        profissionaisEnvolvidos: row[4] || '',
        percentualAvancado: row[5] || '',
        observacoes: row[6] || '',
      }));

      // Aplicar filtros
      if (obraId) {
        // Comparar tanto por ID quanto por descrição/nome (porque pode estar salvo de diferentes formas)
        servicos = servicos.filter(s => {
          const obraServico = (s.obra || '').toString().trim();
          const obraFiltro = obraId.toString().trim();
          return obraServico === obraFiltro || 
                 obraServico.toLowerCase() === obraFiltro.toLowerCase();
        });
      }

      if (localId) {
        servicos = servicos.filter(s => s.local === localId);
      }

      // Função auxiliar para converter data
      const parsearData = (dataStr) => {
        if (!dataStr) return null;
        try {
          // Tentar formato brasileiro DD/MM/YYYY
          const partes = dataStr.toString().split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const ano = parseInt(partes[2], 10);
            return new Date(ano, mes, dia);
          }
          // Tentar parse padrão
          return new Date(dataStr);
        } catch {
          return null;
        }
      };

      if (dataInicio) {
        const dataInicioFiltro = new Date(dataInicio);
        servicos = servicos.filter(s => {
          if (!s.data) return false;
          const dataServico = parsearData(s.data);
          if (!dataServico || isNaN(dataServico.getTime())) return false;
          return dataServico >= dataInicioFiltro;
        });
      }

      if (dataFim) {
        const dataFimFiltro = new Date(dataFim);
        servicos = servicos.filter(s => {
          if (!s.data) return false;
          const dataServico = parsearData(s.data);
          if (!dataServico || isNaN(dataServico.getTime())) return false;
          return dataServico <= dataFimFiltro;
        });
      }

      // Ordenar por data (mais recente primeiro)
      servicos.sort((a, b) => {
        try {
          const dataA = new Date(a.data);
          const dataB = new Date(b.data);
          if (isNaN(dataA.getTime()) || isNaN(dataB.getTime())) return 0;
          return dataB - dataA;
        } catch {
          return 0;
        }
      });

      return servicos;
    } catch (error) {
      console.error('Erro ao buscar serviços executados:', error);
      throw error; // Re-lançar o erro para que o controller possa tratá-lo
    }
  }

  async atualizarServico(id, servico) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    try {
      // Extrair número da linha do ID (formato: servico_2, servico_3, etc)
      const rowNumber = parseInt(id.replace('servico_', ''), 10);
      
      if (isNaN(rowNumber) || rowNumber < 2) {
        throw new Error('ID de serviço inválido');
      }

      // Converter data para formato DD/MM/YYYY se necessário
      let dataFormatada = servico.data;
      if (dataFormatada && dataFormatada.includes('-')) {
        const partes = dataFormatada.split('-');
        if (partes.length === 3) {
          dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      }

      const values = [[
        dataFormatada || '',  // A: Data
        servico.obra || '',  // B: Obra
        servico.atividade || '',  // C: Atividade
        servico.local || '',  // D: Local
        Array.isArray(servico.profissionaisEnvolvidos) 
          ? servico.profissionaisEnvolvidos.join(' / ') 
          : servico.profissionaisEnvolvidos || '',  // E: Profissionais Envolvidos
        servico.percentualAvancado || '',  // F: Percentual Avanço
        servico.observacoes || '',  // G: Observações
      ]];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Servicos!A${rowNumber}:G${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      return {
        id,
        ...servico,
      };
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
  }

  async deletarServico(id) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    try {
      // Extrair número da linha do ID (formato: servico_2, servico_3, etc)
      const rowNumber = parseInt(id.replace('servico_', ''), 10);
      
      if (isNaN(rowNumber) || rowNumber < 2) {
        throw new Error('ID de serviço inválido');
      }

      // Marcar como deletado limpando todas as células da linha
      const values = [['', '', '', '', '', '', '']];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Servicos!A${rowNumber}:G${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
  }

  async gerarRelatorioPendencias({ obraId, status }) {
    // Implementação básica - pode ser expandida
    return { message: 'Relatório de pendências em desenvolvimento' };
  }

  async buscarPendenciasRegistradas({ obraId, localId, data }) {
    if (!this.sheets || !this.spreadsheetId) {
      console.warn('Google Sheets não inicializado. Retornando array vazio.');
      return [];
    }

    try {
      console.log('Buscando pendências com filtros:', { obraId, localId, data });
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Pendencias!A2:G',
        valueRenderOption: 'FORMATTED_VALUE',
      });

      if (!response.data || !response.data.values) {
        console.log('Nenhum dado encontrado na planilha de Pendencias');
        return [];
      }

      const rows = response.data.values.filter(row => row && row.length > 0 && row[0]);
      console.log(`Encontradas ${rows.length} linhas na planilha Pendencias`);

      if (rows.length === 0) {
        console.log('Nenhuma pendência encontrada na planilha');
        return [];
      }

      // Função para converter data
      const converterData = (valor) => {
        if (!valor && valor !== 0) return '';
        if (typeof valor === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const dataObj = new Date(excelEpoch.getTime() + (valor - 1) * 24 * 60 * 60 * 1000);
          if (!isNaN(dataObj.getTime())) {
            const ano = dataObj.getFullYear();
            const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            const dia = String(dataObj.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
          }
        }
        const dataStr = valor.toString().trim();
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
          return dataStr;
        }
        return dataStr;
      };

      let pendencias = rows.map((row, index) => ({
        id: `pendencia_${index + 2}`,
        data: converterData(row[0]),
        obra: row[1] || '',
        local: row[2] || '',
        descricao: row[3] || '',
        prioridade: row[4] || 'Média',
        status: row[5] || 'Pendente',
        responsavel: row[6] || '',
      }));

      console.log(`Total de pendências antes dos filtros: ${pendencias.length}`);

      // Aplicar filtros
      if (obraId) {
        const antes = pendencias.length;
        pendencias = pendencias.filter(p => {
          const obraPendencia = (p.obra || '').toString().trim();
          const obraFiltro = obraId.toString().trim();
          const match = obraPendencia === obraFiltro || obraPendencia.toLowerCase() === obraFiltro.toLowerCase();
          if (!match) {
            console.log(`Pendência não corresponde à obra. Pendência: "${obraPendencia}", Filtro: "${obraFiltro}"`);
          }
          return match;
        });
        console.log(`Após filtro de obra (${obraId}): ${antes} -> ${pendencias.length}`);
      }

      if (localId) {
        const antes = pendencias.length;
        pendencias = pendencias.filter(p => {
          const localPendencia = (p.local || '').toString().trim();
          const localFiltro = localId.toString().trim();
          const match = localPendencia === localFiltro || localPendencia.toLowerCase() === localFiltro.toLowerCase();
          if (!match) {
            console.log(`Pendência não corresponde ao local. Pendência: "${localPendencia}", Filtro: "${localFiltro}"`);
          }
          return match;
        });
        console.log(`Após filtro de local (${localId}): ${antes} -> ${pendencias.length}`);
      }

      // Filtro de data é opcional - se não fornecido, mostra todas as pendências
      if (data) {
        const antes = pendencias.length;
        const dataFiltro = converterData(data);
        pendencias = pendencias.filter(p => {
          const match = p.data === dataFiltro;
          if (!match && antes > 0) {
            console.log(`Pendência não corresponde à data. Pendência: "${p.data}", Filtro: "${dataFiltro}"`);
          }
          return match;
        });
        console.log(`Após filtro de data (${data}): ${antes} -> ${pendencias.length}`);
      }

      console.log(`Total de pendências após filtros: ${pendencias.length}`);

      // Ordenar por data (mais recente primeiro)
      pendencias.sort((a, b) => {
        try {
          const dataA = new Date(a.data);
          const dataB = new Date(b.data);
          if (isNaN(dataA.getTime()) || isNaN(dataB.getTime())) return 0;
          return dataB - dataA;
        } catch {
          return 0;
        }
      });

      return pendencias;
    } catch (error) {
      console.error('Erro ao buscar pendências registradas:', error);
      return [];
    }
  }

  async buscarPendencias({ obraId, localId, status, dataInicio, dataFim }) {
    if (!this.sheets || !this.spreadsheetId) {
      console.warn('Google Sheets não inicializado. Retornando array vazio.');
      return [];
    }

    try {
      console.log('Buscando pendências com filtros:', { obraId, localId, status, dataInicio, dataFim });
      
      // Tentar primeiro com valores formatados (string)
      let response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Pendencias!A2:G',
        valueRenderOption: 'FORMATTED_VALUE',
      });
      
      // Se não retornar dados ou retornar números, tentar não formatado
      if (!response.data.values || (response.data.values.length > 0 && typeof response.data.values[0][0] === 'number')) {
        response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Pendencias!A2:G',
          valueRenderOption: 'UNFORMATTED_VALUE',
        });
      }

      if (!response.data || !response.data.values) {
        console.log('Nenhum dado encontrado na planilha de Pendencias');
        return [];
      }

      const rows = response.data.values.filter(row => row && row.length > 0 && row[0]);
      console.log(`Encontradas ${rows.length} linhas na planilha Pendencias`);

      if (rows.length === 0) {
        console.log('Nenhuma pendência encontrada na planilha');
        return [];
      }

      // Função para converter data
      const converterData = (valor) => {
        if (!valor && valor !== 0) return '';
        if (typeof valor === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const dataObj = new Date(excelEpoch.getTime() + (valor - 1) * 24 * 60 * 60 * 1000);
          if (!isNaN(dataObj.getTime())) {
            const ano = dataObj.getFullYear();
            const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            const dia = String(dataObj.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
          }
        }
        const dataStr = valor.toString().trim();
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
          return dataStr;
        }
        return dataStr;
      };

      let pendencias = rows.map((row, index) => ({
        id: `pendencia_${index + 2}`,
        data: converterData(row[0]),
        obra: row[1] || '',
        local: row[2] || '',
        descricao: row[3] || '',
        prioridade: row[4] || 'Média',
        status: row[5] || 'Pendente',
        responsavel: row[6] || '',
      }));

      console.log(`Total de pendências antes dos filtros: ${pendencias.length}`);

      // Aplicar filtros
      if (obraId) {
        const antes = pendencias.length;
        pendencias = pendencias.filter(p => {
          const obraPendencia = (p.obra || '').toString().trim();
          const obraFiltro = obraId.toString().trim();
          return obraPendencia === obraFiltro || obraPendencia.toLowerCase() === obraFiltro.toLowerCase();
        });
        console.log(`Após filtro de obra (${obraId}): ${antes} -> ${pendencias.length}`);
      }

      if (localId) {
        const antes = pendencias.length;
        pendencias = pendencias.filter(p => {
          const localPendencia = (p.local || '').toString().trim();
          const localFiltro = localId.toString().trim();
          return localPendencia === localFiltro || localPendencia.toLowerCase() === localFiltro.toLowerCase();
        });
        console.log(`Após filtro de local (${localId}): ${antes} -> ${pendencias.length}`);
      }

      if (status) {
        const antes = pendencias.length;
        pendencias = pendencias.filter(p => {
          const statusPendencia = (p.status || '').toString().trim();
          const statusFiltro = status.toString().trim();
          return statusPendencia === statusFiltro || statusPendencia.toLowerCase() === statusFiltro.toLowerCase();
        });
        console.log(`Após filtro de status (${status}): ${antes} -> ${pendencias.length}`);
      }

      // Função auxiliar para converter data
      const parsearData = (dataStr) => {
        if (!dataStr) return null;
        try {
          const partes = dataStr.toString().split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const ano = parseInt(partes[2], 10);
            return new Date(ano, mes, dia);
          }
          return new Date(dataStr);
        } catch {
          return null;
        }
      };

      if (dataInicio) {
        const antes = pendencias.length;
        const dataInicioFiltro = new Date(dataInicio);
        pendencias = pendencias.filter(p => {
          if (!p.data) return false;
          const dataPendencia = parsearData(p.data);
          if (!dataPendencia || isNaN(dataPendencia.getTime())) return false;
          return dataPendencia >= dataInicioFiltro;
        });
        console.log(`Após filtro de data início (${dataInicio}): ${antes} -> ${pendencias.length}`);
      }

      if (dataFim) {
        const antes = pendencias.length;
        const dataFimFiltro = new Date(dataFim);
        pendencias = pendencias.filter(p => {
          if (!p.data) return false;
          const dataPendencia = parsearData(p.data);
          if (!dataPendencia || isNaN(dataPendencia.getTime())) return false;
          return dataPendencia <= dataFimFiltro;
        });
        console.log(`Após filtro de data fim (${dataFim}): ${antes} -> ${pendencias.length}`);
      }

      console.log(`Total de pendências após filtros: ${pendencias.length}`);

      // Ordenar por data (mais recente primeiro)
      pendencias.sort((a, b) => {
        try {
          const dataA = new Date(a.data);
          const dataB = new Date(b.data);
          if (isNaN(dataA.getTime()) || isNaN(dataB.getTime())) return 0;
          return dataB - dataA;
        } catch {
          return 0;
        }
      });

      return pendencias;
    } catch (error) {
      console.error('Erro ao buscar pendências:', error);
      throw error;
    }
  }

  async atualizarPendencia(id, pendencia) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    try {
      // Extrair número da linha do ID (formato: pendencia_2, pendencia_3, etc)
      const rowNumber = parseInt(id.replace('pendencia_', ''), 10);
      
      if (isNaN(rowNumber) || rowNumber < 2) {
        throw new Error('ID de pendência inválido');
      }

      // Converter data para formato DD/MM/YYYY se necessário
      let dataFormatada = pendencia.data;
      if (dataFormatada && dataFormatada.includes('-')) {
        const partes = dataFormatada.split('-');
        if (partes.length === 3) {
          dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      }

      const values = [[
        dataFormatada || '',  // A: Data
        pendencia.obra || '',  // B: Obra
        pendencia.local || '',  // C: Local
        pendencia.descricao || '',  // D: Descrição
        pendencia.prioridade || 'Média',  // E: Prioridade
        pendencia.status || 'Pendente',  // F: Status
        pendencia.responsavel || '',  // G: Responsável
      ]];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Pendencias!A${rowNumber}:G${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      return {
        id,
        ...pendencia,
      };
    } catch (error) {
      console.error('Erro ao atualizar pendência:', error);
      throw error;
    }
  }

  async deletarPendencia(id) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    try {
      // Extrair número da linha do ID (formato: pendencia_2, pendencia_3, etc)
      const rowNumber = parseInt(id.replace('pendencia_', ''), 10);
      
      if (isNaN(rowNumber) || rowNumber < 2) {
        throw new Error('ID de pendência inválido');
      }

      // Marcar como deletado limpando todas as células da linha
      const values = [['', '', '', '', '', '', '']];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Pendencias!A${rowNumber}:G${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar pendência:', error);
      throw error;
    }
  }

  // Métodos para Compras
  async buscarCompras() {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Compras!A2:K',
      });

      if (!response.data.values) return [];

      return response.data.values
        .filter(row => row[10] !== 'Não') // Filtrar inativas (coluna K)
        .map((row, index) => ({
          id: row[0] || `compra_${index + 2}`,
          data: row[1] || '',
          obra: row[2] || '',
          local: row[3] || '',
          fornecedor: row[4] || '',
          valorNota: parseFloat(row[5] || 0),
          descricao: row[6] || '',
          anexo: row[7] || '',
          usuarioId: row[8] || '',
          comprador: row[9] || '', // Comprador é o último campo antes de Ativo
          ativo: row[10] !== 'Não',
        }));
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      return [];
    }
  }

  async criarCompra(compra) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const id = `compra_${Date.now()}`;
    const values = [[
      id,  // A: ID
      compra.data,  // B: Data
      compra.obra || '',  // C: Obra
      compra.local,  // D: Local
      compra.fornecedor,  // E: Fornecedor
      compra.valorNota,  // F: ValorNota
      compra.descricao,  // G: Descricao
      compra.anexo || '',  // H: Anexo
      compra.usuarioId,  // I: UsuarioId
      compra.comprador || '',  // J: Comprador (último campo antes de Ativo)
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Compras!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return id;
  }

  async atualizarCompra(id, compra) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Compras!A:K',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Compra não encontrada');
    }

    // rowIndex é o índice no array retornado pelo get
    // Quando fazemos get com range 'Compras!A:K', o array retornado tem:
    // - rows[0] = linha 1 (cabeçalho)
    // - rows[1] = linha 2 (primeira linha de dados)
    // - rows[2] = linha 3 (segunda linha de dados)
    // Como findIndex usa idx > 0, rowIndex nunca será 0
    // Se rowIndex = 1, significa que é a primeira linha de dados (linha 2 na planilha)
    // Portanto, rowNumber = rowIndex + 1
    const rowNumber = rowIndex + 1;

    // Atualizar todas as colunas (B até J) - IMPORTANTE: values deve ser um array de arrays
    // Cada array interno representa uma linha, e cada elemento representa uma coluna
    const values = [
      [
        compra.data,  // B: Data
        compra.obra || '',  // C: Obra
        compra.local,  // D: Local
        compra.fornecedor,  // E: Fornecedor
        compra.valorNota,  // F: ValorNota
        compra.descricao,  // G: Descricao
        compra.anexo || '',  // H: Anexo
        compra.usuarioId,  // I: UsuarioId
        compra.comprador || '',  // J: Comprador
      ]
    ];

    console.log(`Atualizando compra ${id} na linha ${rowNumber} com valores:`, values);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Compras!B${rowNumber}:J${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    console.log(`Compra ${id} atualizada com sucesso na linha ${rowNumber}`);
  }

  async deletarCompra(id) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Compras!A:K',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Compra não encontrada');
    }

    const rowNumber = rowIndex + 1;
    // Marcar como inativa (coluna K)
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Compras!K${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['Não']] },
    });
  }

  // Métodos para Prestadores (aba Profissionais)
  async buscarPrestadores() {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Profissionais!A2:C',
      });

      if (!response.data.values) return [];

      return response.data.values.map((row, index) => ({
        id: `prestador_${index + 2}`,
        nome: row[0] || '',
        funcao: row[1] || '',
        valorDiaria: row[2] || '0',
      }));
    } catch (error) {
      console.error('Erro ao buscar prestadores:', error);
      return [];
    }
  }

  async criarPrestador(prestador) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    const id = `prestador_${Date.now()}`;
    const values = [[
      prestador.nome || '',
      prestador.funcao || '',
      prestador.valorDiaria || '0',
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Profissionais!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { 
      id, 
      nome: prestador.nome || '',
      funcao: prestador.funcao || '',
      valorDiaria: prestador.valorDiaria || '0',
    };
  }

  async atualizarPrestador(id, prestador) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    try {
      const prestadores = await this.buscarPrestadores();
      const prestadorIndex = prestadores.findIndex(p => p.id === id);

      if (prestadorIndex === -1) {
        throw new Error('Prestador não encontrado');
      }

      // A linha na planilha é prestadorIndex + 2 (linha 1 é cabeçalho, linha 2 é primeiro prestador)
      const rowNumber = prestadorIndex + 2;

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Profissionais!A${rowNumber}:C${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            prestador.nome || '',
            prestador.funcao || '',
            prestador.valorDiaria || '0',
          ]],
        },
      });

      return {
        id,
        nome: prestador.nome || '',
        funcao: prestador.funcao || '',
        valorDiaria: prestador.valorDiaria || '0',
      };
    } catch (error) {
      console.error('Erro ao atualizar prestador:', error);
      throw error;
    }
  }

  async deletarPrestador(id) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    try {
      const prestadores = await this.buscarPrestadores();
      const prestadorIndex = prestadores.findIndex(p => p.id === id);

      if (prestadorIndex === -1) {
        throw new Error('Prestador não encontrado');
      }

      // A linha na planilha é prestadorIndex + 2 (linha 1 é cabeçalho, linha 2 é primeiro prestador)
      const rowNumber = prestadorIndex + 2;

      // Buscar o sheetId da aba Profissionais
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = spreadsheet.data.sheets.find(s => s.properties.title === 'Profissionais');
      const sheetId = sheet ? sheet.properties.sheetId : null;

      if (!sheetId) {
        throw new Error('Aba Profissionais não encontrada');
      }

      // Deletar a linha
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          }],
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar prestador:', error);
      throw error;
    }
  }

  // Métodos para Financeiro
  async buscarDadosFinanceiros({ obraId, localId, dataInicio, dataFim }) {
    if (!this.sheets || !this.spreadsheetId) {
      return [];
    }

    try {
      // Buscar compras
      const compras = await this.buscarCompras();
      const comprasFormatadas = compras.map(compra => ({
        id: compra.id,
        data: compra.data,
        obra: compra.obra,
        local: compra.local,
        tipo: 'Compra',
        descricao: compra.descricao,
        valor: compra.valorNota,
        comprador: compra.comprador,
        ativo: compra.ativo,
      }));

      // Buscar pagamentos da aba Financeiro
      let pagamentos = [];
      try {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Financeiro!A2:J',
        });

        if (response.data.values) {
          pagamentos = response.data.values
            .filter(row => row && row.length > 0 && row[0] && row[9] !== 'Não')
            .map((row, index) => ({
              id: row[0] || `pagamento_${index + 2}`,
              data: row[1] || '',
              obra: row[2] || '',
              local: row[3] || '',
              tipo: row[4] || 'Pagamento',
              descricao: row[5] || '',
              valor: parseFloat(row[6] || 0),
              prestador: row[7] || '',
              usuarioId: row[8] || '',
              ativo: row[9] !== 'Não',
            }));
        }
      } catch (error) {
        console.warn('Erro ao buscar pagamentos (aba pode não existir ainda):', error.message);
      }

      // Combinar compras e pagamentos
      let dados = [...comprasFormatadas, ...pagamentos];

      // Aplicar filtros
      if (obraId) {
        dados = dados.filter(d => {
          const obraDado = (d.obra || '').toString().trim();
          const obraFiltro = obraId.toString().trim();
          return obraDado === obraFiltro || obraDado.toLowerCase() === obraFiltro.toLowerCase();
        });
      }

      if (localId) {
        dados = dados.filter(d => {
          const localDado = (d.local || '').toString().trim();
          const localFiltro = localId.toString().trim();
          return localDado === localFiltro || localDado.toLowerCase() === localFiltro.toLowerCase();
        });
      }

      if (dataInicio) {
        const dataInicioFiltro = new Date(dataInicio);
        dados = dados.filter(d => {
          if (!d.data) return false;
          const dataDado = new Date(d.data);
          return !isNaN(dataDado.getTime()) && dataDado >= dataInicioFiltro;
        });
      }

      if (dataFim) {
        const dataFimFiltro = new Date(dataFim);
        dados = dados.filter(d => {
          if (!d.data) return false;
          const dataDado = new Date(d.data);
          return !isNaN(dataDado.getTime()) && dataDado <= dataFimFiltro;
        });
      }

      return dados;
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      return [];
    }
  }

  async registrarPagamento(pagamento) {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets não inicializado');
    }

    // Garantir que a aba existe
    await this.ensureFinanceiroSheetExists();

    const id = `pagamento_${Date.now()}`;
    const values = [[
      id,  // A: ID
      pagamento.data,  // B: Data
      pagamento.obra || '',  // C: Obra
      pagamento.local,  // D: Local
      'Pagamento',  // E: Tipo
      pagamento.descricao,  // F: Descricao
      pagamento.valor,  // G: Valor
      pagamento.prestador || '',  // H: Prestador
      pagamento.usuarioId,  // I: UsuarioId
      'Sim',  // J: Ativo
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Financeiro!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return id;
  }
}

export const googleSheetsService = new GoogleSheetsService();

