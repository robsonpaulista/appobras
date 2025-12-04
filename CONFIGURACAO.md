# Guia de Configuração - Diário de Obra Digital

## Passo a Passo para Configurar o Google Sheets

### 1. Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o nome do projeto

### 2. Ativar Google Sheets API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por **"Google Sheets API"**
3. Clique em **Enable**

### 3. Criar Service Account

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **Service Account**
3. Preencha:
   - **Service account name**: `diario-obra-service`
   - **Service account ID**: será gerado automaticamente
   - Clique em **Create and Continue**
4. Pule a etapa de permissões (opcional)
5. Clique em **Done**

### 4. Gerar Chave JSON

1. Na lista de Service Accounts, clique na que você criou
2. Vá na aba **Keys**
3. Clique em **Add Key** > **Create new key**
4. Selecione **JSON**
5. Clique em **Create**
6. O arquivo JSON será baixado automaticamente

### 5. Extrair Credenciais do JSON

Abra o arquivo JSON baixado. Você verá algo como:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "diario-obra-service@seu-projeto.iam.gserviceaccount.com",
  ...
}
```

Você precisará de:
- `client_email`
- `private_key` (mantenha as quebras de linha `\n`)

### 6. Criar Planilha no Google Drive

1. Acesse [Google Drive](https://drive.google.com)
2. Crie uma nova planilha (Google Sheets)
3. Dê um nome (ex: "Diário de Obra")
4. Na URL da planilha, copie o ID:
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```
   O ID é a parte entre `/d/` e `/edit`

### 7. Compartilhar Planilha com Service Account

1. Na planilha, clique em **Compartilhar** (Share)
2. Cole o email da service account (o `client_email` do JSON)
3. Dê permissão de **Editor**
4. Clique em **Enviar** (Send)

### 8. Configurar Arquivo .env

Crie um arquivo `.env` na raiz do projeto com:

```env
PORT=3000
GOOGLE_SHEETS_SPREADSHEET_ID=seu_id_da_planilha_aqui
GOOGLE_SHEETS_CLIENT_EMAIL=diario-obra-service@seu-projeto.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Importante**: 
- A `GOOGLE_SHEETS_PRIVATE_KEY` deve estar entre aspas duplas
- Mantenha as quebras de linha `\n` como estão no JSON original
- **OPÇÃO ALTERNATIVA**: Você pode colar a chave privada diretamente do JSON sem aspas, mas substitua as quebras de linha reais por `\n` (texto literal)
- Não compartilhe o arquivo `.env` publicamente

**Formato Alternativo (sem aspas, com quebras de linha literais):**
```env
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

### 9. Testar a Configuração

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

3. Acesse `http://localhost:3000`

4. Tente registrar um diário de teste

5. Verifique se os dados aparecem na planilha do Google Sheets

## Solução de Problemas

### Erro: "GOOGLE_SHEETS_SPREADSHEET_ID não configurado"
- Verifique se o arquivo `.env` existe e está na raiz do projeto
- Verifique se as variáveis estão escritas corretamente

### Erro: "Permission denied"
- Verifique se a planilha foi compartilhada com o email da service account
- Verifique se a permissão é "Editor" (não apenas "Visualizador")

### Erro: "Invalid credentials"
- Verifique se o `private_key` está entre aspas duplas no `.env`
- Verifique se as quebras de linha `\n` estão preservadas
- Verifique se o `client_email` está correto

### As abas não são criadas automaticamente
- O sistema tenta criar as abas na primeira execução
- Se não funcionar, crie manualmente as abas: "Profissionais", "Servicos", "Pendencias", "Fotos"
- Adicione os cabeçalhos conforme descrito no README

