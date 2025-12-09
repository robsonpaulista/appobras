# Segurança - Dynamics Obras

## Resumo de Segurança Implementada

### ✅ Proteções Implementadas

1. **Headers de Segurança (Helmet)**
   - Content Security Policy (CSP)
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy

2. **Autenticação e Autorização**
   - ✅ Todas as rotas da API protegidas com `requireAuth`
   - ✅ Rota de registro protegida com `requireAdmin`
   - ✅ Sessões com cookies HttpOnly e Secure (em produção)
   - ✅ Senhas hasheadas com bcrypt (10 rounds)
   - ✅ Validação de credenciais no login

3. **Rate Limiting**
   - ✅ Limite global: 100 requisições por IP a cada 15 minutos
   - ✅ Limite de login: 5 tentativas por IP a cada 15 minutos
   - ✅ Proteção contra brute force

4. **CORS**
   - ✅ Configuração restritiva em produção
   - ✅ Lista de origens permitidas via variável de ambiente
   - ✅ Credenciais habilitadas apenas para origens permitidas

5. **Validação de Entrada**
   - ✅ Validação de tamanho de payload (10MB máximo)
   - ✅ Validação de tipos de arquivo (multer)
   - ✅ Validação de dados obrigatórios nos controllers

6. **Sessões**
   - ✅ Cookies HttpOnly (proteção XSS)
   - ✅ Cookies Secure em produção (HTTPS apenas)
   - ✅ SameSite=strict em produção (proteção CSRF)
   - ✅ SESSION_SECRET obrigatório em produção

### ⚠️ Melhorias Recomendadas

1. **Store de Sessão**
   - ⚠️ Atualmente usando memória (não recomendado para múltiplas instâncias)
   - 💡 Recomendado: Usar Redis ou MongoDB para sessões compartilhadas
   - 💡 Necessário para escalabilidade no Vercel

2. **Validação de Entrada**
   - 💡 Adicionar express-validator para validação mais robusta
   - 💡 Sanitização de dados de entrada
   - 💡 Validação de tipos e formatos

3. **Logging e Monitoramento**
   - 💡 Implementar logging estruturado
   - 💡 Monitorar tentativas de login falhadas
   - 💡 Alertas para atividades suspeitas

4. **Proteção CSRF**
   - 💡 Considerar tokens CSRF para operações críticas
   - ✅ SameSite cookies já implementado

5. **Backup e Recuperação**
   - 💡 Backup regular dos dados do Google Sheets
   - 💡 Plano de recuperação de desastres

## Variáveis de Ambiente Obrigatórias

```env
SESSION_SECRET=          # OBRIGATÓRIO em produção
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_CLIENT_EMAIL=
NODE_ENV=production
ALLOWED_ORIGINS=         # Lista de origens permitidas
```

## Checklist de Deploy

- [ ] SESSION_SECRET definido e forte (mínimo 32 caracteres aleatórios)
- [ ] ALLOWED_ORIGINS configurado com domínio do Vercel
- [ ] NODE_ENV=production
- [ ] Credenciais do Google Sheets configuradas
- [ ] Testar autenticação após deploy
- [ ] Verificar cookies Secure em produção
- [ ] Testar rate limiting
- [ ] Verificar CORS funcionando corretamente

## Rotas Protegidas

Todas as rotas `/api/*` (exceto `/api/auth/login`) requerem autenticação.

- `/api/auth/login` - Público (com rate limiting)
- `/api/auth/logout` - Público (permite limpar sessão inválida)
- `/api/auth/me` - Requer autenticação
- `/api/auth/register` - Requer autenticação + admin
- Todas as outras rotas - Requerem autenticação

## Contato

Para questões de segurança, entre em contato com a equipe de desenvolvimento.

