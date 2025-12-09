# Correção Rápida - Erro 500 no Vercel

## Passo 1: Verificar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e configure:

### Obrigatórias:
```
SESSION_SECRET=<gerar-comando-abaixo>
NODE_ENV=production
GOOGLE_SHEETS_SPREADSHEET_ID=<seu-id>
GOOGLE_SHEETS_PRIVATE_KEY=<sua-chave-completa>
GOOGLE_SHEETS_CLIENT_EMAIL=<seu-email>
```

**Gerar SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Importante para GOOGLE_SHEETS_PRIVATE_KEY:
- Cole a chave COMPLETA incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
- Se a chave tiver `\n` no texto, o sistema vai converter automaticamente
- Certifique-se de que não há espaços extras no início/fim

## Passo 2: Verificar Logs

1. No Vercel, vá em **Deployments**
2. Clique no deployment com erro
3. Vá em **Functions** > **api/index**
4. Veja os logs para identificar o erro específico

## Passo 3: Estrutura de Arquivos

Certifique-se de que existe:
```
api/
  └── index.js    ← Deve existir e importar server.js
```

## Passo 4: Fazer Novo Deploy

Após configurar as variáveis:
1. Vá em **Deployments**
2. Clique nos 3 pontos do deployment
3. Selecione **Redeploy**
4. Ou faça um novo commit e push

## Erros Comuns

### "SESSION_SECRET not defined"
→ Configure a variável no Vercel

### "Cannot find module 'helmet'"
→ As dependências devem estar no package.json (já estão)

### "Google Sheets authentication failed"
→ Verifique GOOGLE_SHEETS_PRIVATE_KEY e GOOGLE_SHEETS_CLIENT_EMAIL

### "CORS error"
→ Configure ALLOWED_ORIGINS ou deixe vazio temporariamente

## Teste Local com Vercel CLI

```bash
npm i -g vercel
vercel dev
```

Isso simula o ambiente do Vercel e ajuda a identificar problemas antes do deploy.

