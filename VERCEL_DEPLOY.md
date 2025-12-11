# Guia de Deploy no Vercel

## Pré-requisitos

1. Conta no Vercel
2. Repositório Git (GitHub, GitLab, Bitbucket)
3. Variáveis de ambiente configuradas

## Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que todos os arquivos estão commitados:
```bash
git add .
git commit -m "Preparação para deploy no Vercel"
git push
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe seu repositório Git
4. Configure o projeto:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (deixe vazio)
   - **Output Directory**: (deixe vazio)
   - **Install Command**: npm install

### 3. Configurar Variáveis de Ambiente

No painel do Vercel, vá em Settings > Environment Variables e adicione:

#### Obrigatórias:
```
SESSION_SECRET=<gerar-chave-secreta-forte>
NODE_ENV=production
GOOGLE_SHEETS_SPREADSHEET_ID=<seu-spreadsheet-id>
GOOGLE_SHEETS_PRIVATE_KEY=<sua-chave-privada>
GOOGLE_SHEETS_CLIENT_EMAIL=<seu-client-email>
```

#### Recomendadas:
```
ALLOWED_ORIGINS=https://seu-projeto.vercel.app
```

**Gerar SESSION_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique os logs para erros

### 5. Verificações Pós-Deploy

- [ ] Testar login
- [ ] Verificar cookies Secure (devem estar habilitados)
- [ ] Testar rotas protegidas
- [ ] Verificar rate limiting
- [ ] Testar upload de arquivos
- [ ] Verificar CORS

## Configuração de Domínio Customizado

1. Vá em Settings > Domains
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize `ALLOWED_ORIGINS` com o novo domínio

## Troubleshooting

### Erro: SESSION_SECRET não definido
- Verifique se a variável está configurada no Vercel
- Certifique-se de que está marcada para "Production"

### Erro: CORS bloqueando requisições
- Verifique `ALLOWED_ORIGINS` no Vercel
- Adicione o domínio do Vercel (ex: https://seu-projeto.vercel.app)

### Sessões não persistem
- O Vercel usa múltiplas instâncias
- Considere usar Redis ou MongoDB para sessões compartilhadas
- Por enquanto, sessões funcionam por instância

### Uploads não funcionam
- O Vercel tem sistema de arquivos somente leitura após deploy
- Considere usar serviços externos (AWS S3, Cloudinary, etc)
- Ou usar Vercel Blob Storage

## Melhorias Futuras

1. **Sessões Compartilhadas**
   - Implementar Redis ou MongoDB para sessões
   - Necessário para múltiplas instâncias

2. **Armazenamento de Arquivos**
   - Migrar uploads para S3 ou Cloudinary
   - Vercel Blob Storage também é uma opção

3. **Monitoramento**
   - Integrar com Vercel Analytics
   - Configurar alertas de erro

4. **CI/CD**
   - Configurar testes automáticos
   - Deploy automático apenas após testes passarem







