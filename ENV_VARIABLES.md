# Variáveis de Ambiente

## Variáveis Obrigatórias

### SESSION_SECRET
**Obrigatório em produção**

Chave secreta para assinar cookies de sessão. Deve ser uma string aleatória forte.

**Gerar:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo:**
```
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### GOOGLE_SHEETS_SPREADSHEET_ID
ID da planilha do Google Sheets onde os dados são armazenados.

**Como obter:**
- Abra sua planilha no Google Sheets
- O ID está na URL: `https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit`

### GOOGLE_SHEETS_PRIVATE_KEY
Chave privada da conta de serviço do Google Cloud.

**Formato:**
```
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

**Importante:** Substitua `\n` por quebras de linha reais ao configurar no Vercel.

### GOOGLE_SHEETS_CLIENT_EMAIL
Email da conta de serviço do Google Cloud.

**Formato:**
```
nome-do-servico@projeto-id.iam.gserviceaccount.com
```

### NODE_ENV
Ambiente de execução.

**Valores:**
- `production` - Produção
- `development` - Desenvolvimento

## Variáveis Opcionais

### ALLOWED_ORIGINS
Lista de origens permitidas pelo CORS, separadas por vírgula.

**Exemplo:**
```
ALLOWED_ORIGINS=https://appobras.vercel.app,https://www.appobras.com
```

**Importante:** Em produção, sempre defina esta variável para segurança.

### COOKIE_DOMAIN
Domínio para os cookies de sessão.

**Exemplo:**
```
COOKIE_DOMAIN=.appobras.com
```

**Nota:** Use apenas se tiver domínio customizado.

### PORT
Porta do servidor (geralmente definida automaticamente pelo Vercel).

**Padrão:** 3000

## Configuração no Vercel

1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável:
   - **Key**: Nome da variável (ex: SESSION_SECRET)
   - **Value**: Valor da variável
   - **Environment**: Selecione Production, Preview, Development ou All

## Segurança

⚠️ **NUNCA** commite arquivos `.env` no Git!

- Use `.env.example` como template
- Adicione `.env` ao `.gitignore`
- Configure variáveis diretamente no Vercel

## Validação

Para validar se todas as variáveis estão configuradas:

```bash
npm run validate
```

Este comando verifica se todas as variáveis obrigatórias estão definidas.

