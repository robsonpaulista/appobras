import dotenv from 'dotenv';
import { googleSheetsService } from '../services/googleSheets.service.js';

dotenv.config();

async function listarUsuarios() {
  console.log('🔍 Buscando usuários cadastrados...\n');

  try {
    const usuarios = await googleSheetsService.buscarUsuarios();

    if (usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado.');
      console.log('\n💡 Para criar um usuário administrador, execute:');
      console.log('   npm run create-admin\n');
      return;
    }

    console.log(`✅ Encontrados ${usuarios.length} usuário(s):\n`);

    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nome}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Admin: ${usuario.isAdmin === 'true' || usuario.isAdmin === true ? 'Sim ✅' : 'Não'}`);
      console.log(`   ID: ${usuario.id}`);
      console.log(`   Criado em: ${usuario.dataCriacao || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error.message);
    console.log('\n💡 Verifique se:');
    console.log('   1. O arquivo .env está configurado corretamente');
    console.log('   2. A planilha do Google Sheets foi criada e compartilhada');
    console.log('   3. A Google Sheets API está ativada\n');
  }
}

listarUsuarios();









