import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { googleSheetsService } from '../services/googleSheets.service.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function resetarSenha() {
  console.log('🔑 Redefinir Senha de Usuário\n');

  try {
    // Listar usuários existentes
    const usuarios = await googleSheetsService.buscarUsuarios();
    
    if (usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado.');
      console.log('\n💡 Para criar um usuário, execute:');
      console.log('   npm run create-admin\n');
      rl.close();
      return;
    }

    console.log('Usuários cadastrados:\n');
    usuarios.forEach((u, index) => {
      console.log(`${index + 1}. ${u.nome} (${u.email})`);
    });
    console.log('');

    const email = await question('Email do usuário para redefinir senha: ');
    
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) {
      console.error('❌ Usuário não encontrado!');
      rl.close();
      return;
    }

    const novaSenha = await question('Nova senha: ');
    
    if (!novaSenha || novaSenha.length < 4) {
      console.error('❌ Senha deve ter pelo menos 4 caracteres!');
      rl.close();
      return;
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Verificar se o serviço está inicializado
    if (!googleSheetsService.sheets || !googleSheetsService.spreadsheetId) {
      throw new Error('Google Sheets não está inicializado. Verifique o arquivo .env');
    }

    // Atualizar senha no Google Sheets
    const response = await googleSheetsService.sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetsService.spreadsheetId,
      range: 'Usuarios!A:F',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === usuario.id);

    if (rowIndex === -1) {
      throw new Error('Usuário não encontrado na planilha');
    }

    const rowNumber = rowIndex + 1;
    await googleSheetsService.sheets.spreadsheets.values.update({
      spreadsheetId: googleSheetsService.spreadsheetId,
      range: `Usuarios!D${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[senhaHash]] },
    });

    console.log('\n✅ Senha redefinida com sucesso!');
    console.log(`   Usuário: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}\n`);

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error.message);
  } finally {
    rl.close();
  }
}

resetarSenha();

