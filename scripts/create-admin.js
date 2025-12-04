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

async function criarAdmin() {
  console.log('🔐 Criar Usuário Administrador\n');

  try {
    const nome = await question('Nome completo: ');
    if (!nome || !nome.trim()) {
      console.error('❌ Nome é obrigatório!');
      process.exit(1);
    }

    const email = await question('Email: ');
    if (!email || !email.trim()) {
      console.error('❌ Email é obrigatório!');
      process.exit(1);
    }

    const senha = await question('Senha: ');
    if (!senha || senha.length < 4) {
      console.error('❌ Senha é obrigatória e deve ter pelo menos 4 caracteres!');
      process.exit(1);
    }

    if (!nome || !email || !senha) {
      console.error('❌ Todos os campos são obrigatórios!');
      process.exit(1);
    }

    // Verificar se usuário já existe
    const usuarios = await googleSheetsService.buscarUsuarios();
    if (usuarios.some(u => u.email === email)) {
      console.error('❌ Email já cadastrado!');
      process.exit(1);
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const novoUsuario = await googleSheetsService.criarUsuario({
      nome,
      email,
      senhaHash,
      isAdmin: true,
    });

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log(`   ID: ${novoUsuario.id}`);
    console.log(`   Nome: ${novoUsuario.nome}`);
    console.log(`   Email: ${novoUsuario.email}`);
    console.log(`   Admin: Sim\n`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

criarAdmin();

