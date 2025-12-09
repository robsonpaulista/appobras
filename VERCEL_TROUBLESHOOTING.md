# Troubleshooting - Erro 500 no Vercel

## Possíveis Causas e Soluções

### 1. Variáveis de Ambiente Não Configuradas

**Sintoma:** Erro 500 ao acessar qualquer rota

**Solução:**
1. Acesse o painel do Vercel
2. Vá em Settings > Environment Variables
3. Configure TODAS as variáveis obrigatórias:

```
SESSION_SECRET=<gerar-chave-forte>
NODE_ENV=production
GOOGLE_SHEETS_SPREADSHEET_ID=<seu-id>
GOOGLE_SHEETS_PRIVATE_KEY=<sua-chave-privada>
GOOGLE_SHEETS_CLIENT_EMAIL=<seu-email>
```

**Gerar SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Problema com GOOGLE_SHEETS_PRIVATE_KEY

**Sintoma:** Erro ao inicializar Google Sheets Service

**Solução:**
- A chave privada precisa ter quebras de linha reais
- No Vercel, ao colar a chave, certifique-se de que está no formato:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

- Se necessário, substitua `\n` por quebras de linha reais

### 3. Problema com CORS

**Sintoma:** Erro ao fazer requisições do frontend

**Solução:**
Configure `ALLOWED_ORIGINS` no Vercel:
```
ALLOWED_ORIGINS=https://seu-projeto.vercel.app
```

### 4. Verificar Logs do Vercel

1. Acesse o painel do Vercel
2. Vá em Deployments
3. Clique no deployment que está com erro
4. Vá em "Functions" > "api/index"
5. Veja os logs para identificar o erro específico

### 5. Estrutura de Arquivos

Certifique-se de que a estrutura está correta:
```
/
├── api/
│   └── index.js          ← Handler do Vercel
├── server.js             ← App Express
├── vercel.json           ← Configuração
└── package.json
```

### 6. Testar Localmente com Vercel CLI

```bash
npm i -g vercel
vercel dev
```

Isso simula o ambiente do Vercel localmente e ajuda a identificar problemas.

### 7. Verificar Build Logs

No painel do Vercel:
1. Vá em Deployments
2. Clique no deployment
3. Veja os "Build Logs" para erros de compilação

### 8. Problemas Comuns

#### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para garantir que funciona

#### Erro: "SESSION_SECRET not defined"
- Configure a variável de ambiente no Vercel
- Certifique-se de que está marcada para "Production"

#### Erro: "CORS blocked"
- Configure `ALLOWED_ORIGINS` com o domínio do Vercel
- Ou deixe vazio temporariamente para permitir todas (não recomendado)

## Checklist de Debug

- [ ] Todas as variáveis de ambiente configuradas
- [ ] SESSION_SECRET é uma string forte (32+ caracteres)
- [ ] GOOGLE_SHEETS_PRIVATE_KEY tem quebras de linha corretas
- [ ] Build passa sem erros
- [ ] Logs do Vercel mostram erro específico
- [ ] Testado localmente com `vercel dev`

## Próximos Passos

Se o erro persistir:
1. Copie o erro completo dos logs do Vercel
2. Verifique qual linha específica está falhando
3. Verifique se todas as dependências estão instaladas
4. Teste localmente com `vercel dev`

