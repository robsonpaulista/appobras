import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🔍 Validando configuração do .env...\n');

const errors = [];
const warnings = [];

// Verificar variáveis obrigatórias
const requiredVars = [
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_PRIVATE_KEY',
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    errors.push(`❌ ${varName} não está definido`);
  } else {
    console.log(`✅ ${varName} está definido`);
  }
});

// Validar formato da chave privada
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
if (privateKey) {
  // Remover aspas
  const cleanKey = privateKey.replace(/^["']|["']$/g, '');
  
  if (!cleanKey.includes('BEGIN PRIVATE KEY')) {
    errors.push('❌ GOOGLE_SHEETS_PRIVATE_KEY não contém "BEGIN PRIVATE KEY"');
  } else {
    console.log('✅ GOOGLE_SHEETS_PRIVATE_KEY contém BEGIN PRIVATE KEY');
  }
  
  if (!cleanKey.includes('END PRIVATE KEY')) {
    errors.push('❌ GOOGLE_SHEETS_PRIVATE_KEY não contém "END PRIVATE KEY"');
  } else {
    console.log('✅ GOOGLE_SHEETS_PRIVATE_KEY contém END PRIVATE KEY');
  }
  
  // Verificar se tem quebras de linha
  if (!cleanKey.includes('\n') && !cleanKey.includes('\\n')) {
    warnings.push('⚠️  GOOGLE_SHEETS_PRIVATE_KEY pode não ter quebras de linha formatadas corretamente');
  } else {
    console.log('✅ GOOGLE_SHEETS_PRIVATE_KEY parece ter quebras de linha');
  }
}

// Validar formato do email
const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
if (email && !email.includes('@')) {
  errors.push('❌ GOOGLE_SHEETS_CLIENT_EMAIL não parece ser um email válido');
} else if (email) {
  console.log('✅ GOOGLE_SHEETS_CLIENT_EMAIL parece ser um email válido');
}

// Validar formato do Spreadsheet ID
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
if (spreadsheetId && spreadsheetId.length < 20) {
  warnings.push('⚠️  GOOGLE_SHEETS_SPREADSHEET_ID parece muito curto (deve ter pelo menos 20 caracteres)');
} else if (spreadsheetId) {
  console.log('✅ GOOGLE_SHEETS_SPREADSHEET_ID tem tamanho adequado');
}

console.log('\n' + '='.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERROS ENCONTRADOS:\n');
  errors.forEach(error => console.log(error));
  console.log('\nCorrija os erros acima antes de continuar.');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n⚠️  AVISOS:\n');
  warnings.forEach(warning => console.log(warning));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ Todas as configurações parecem corretas!');
  console.log('\n💡 Dica: Se ainda houver erros ao conectar, verifique:');
  console.log('   1. Se a planilha foi compartilhada com o email da service account');
  console.log('   2. Se a Google Sheets API está ativada no projeto');
  console.log('   3. Se as credenciais estão corretas');
}















