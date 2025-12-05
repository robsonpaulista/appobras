# Criar Primeiro Usuário Administrador

Após configurar o sistema, você precisa criar o primeiro usuário administrador.

## Método 1: Usando o script (Recomendado)

Execute o comando:

```bash
npm run create-admin
```

O script irá solicitar:
- Nome completo
- Email
- Senha

O usuário será criado como administrador automaticamente.

## Método 2: Criar manualmente no Google Sheets

1. Abra a planilha do Google Sheets
2. Vá na aba "Usuarios"
3. Adicione uma nova linha com:
   - **ID**: `user_` + timestamp (ex: `user_1234567890`)
   - **Nome**: Nome completo do usuário
   - **Email**: Email do usuário
   - **SenhaHash**: Gere o hash usando Node.js:
     ```javascript
     const bcrypt = require('bcryptjs');
     const hash = bcrypt.hashSync('sua-senha-aqui', 10);
     console.log(hash);
     ```
   - **IsAdmin**: `true`
   - **DataCriacao**: Data atual no formato ISO (ex: `2024-01-01T00:00:00.000Z`)

## Notas

- O primeiro usuário deve ser administrador para poder gerenciar o sistema
- Use senhas fortes
- Guarde as credenciais em local seguro
- Você pode criar mais usuários através da API ou diretamente no Google Sheets







