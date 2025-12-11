# Como Verificar e Corrigir Permissões de Administrador

## Problema
Se você está recebendo "Acesso negado" mesmo sendo administrador, siga estes passos:

## 1. Verificar Usuários Cadastrados

Execute no terminal:
```bash
npm run list-users
```

Isso mostrará todos os usuários e seus status de administrador.

## 2. Verificar na Planilha do Google Sheets

1. Abra a planilha do Google Sheets
2. Vá na aba **"Usuarios"**
3. Verifique a coluna **E** (IsAdmin) do seu usuário
4. O valor deve ser exatamente **`true`** (sem aspas, em minúsculas)

## 3. Corrigir Status de Administrador

### Opção A: Editar Diretamente na Planilha
1. Na aba "Usuarios"
2. Encontre seu usuário na linha correspondente
3. Na coluna **E** (IsAdmin), coloque exatamente: `true`
4. Salve a planilha

### Opção B: Usar o CRUD de Usuários (se você tiver acesso)
1. Acesse `/usuarios.html` (se conseguir)
2. Edite seu usuário
3. Marque como "Administrador"
4. Salve

### Opção C: Criar Novo Usuário Admin
```bash
npm run create-admin
```

## 4. Fazer Logout e Login Novamente

Após alterar o status na planilha:
1. Faça logout da aplicação
2. Faça login novamente
3. Tente acessar `/usuarios.html`

## 5. Verificar Logs

Se ainda não funcionar, verifique os logs do servidor. Eles mostrarão:
- O valor de `isAdmin` encontrado na planilha
- O valor calculado após normalização
- Se o usuário foi considerado admin ou não

## Valores Aceitos para isAdmin

O sistema aceita os seguintes valores como "admin":
- `true` (boolean)
- `'true'` (string)
- `1` (número)
- `'1'` (string)
- Qualquer valor que, quando convertido para string e minúsculas, seja `'true'`

Qualquer outro valor será considerado como "não admin".







