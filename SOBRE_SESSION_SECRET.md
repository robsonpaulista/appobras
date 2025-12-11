# Sobre a SESSION_SECRET

## O que é?

A `SESSION_SECRET` é uma chave secreta usada pelo sistema de sessões do Express para:
- **Assinar** os cookies de sessão (garantir que não foram alterados)
- **Criptografar** os dados da sessão (proteger informações sensíveis)

## Por que é importante?

Sem uma chave secreta segura, um atacante poderia:
- Forjar cookies de sessão
- Acessar contas de outros usuários
- Modificar dados da sessão

## Como gerar uma chave segura?

### Opção 1: Usando Node.js (Recomendado)

Execute no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Isso gerará uma string aleatória de 128 caracteres, por exemplo:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

### Opção 2: Usando OpenSSL

No terminal (Linux/Mac):

```bash
openssl rand -hex 64
```

No PowerShell (Windows):

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Opção 3: Gerador Online

Você pode usar geradores online como:
- https://randomkeygen.com/
- https://www.lastpass.com/pt/features/password-generator

Use a opção "CodeIgniter Encryption Keys" ou similar.

## Como configurar?

No arquivo `.env`, adicione:

```env
SESSION_SECRET=sua-chave-gerada-aqui
```

**Exemplo:**
```env
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

## Importante

- ✅ Use uma chave diferente para cada ambiente (desenvolvimento, produção)
- ✅ Nunca compartilhe a chave publicamente
- ✅ Não commite o arquivo `.env` no Git (já está no .gitignore)
- ✅ Use pelo menos 32 caracteres (recomendado: 64+)
- ✅ Use caracteres aleatórios (não use palavras ou frases simples)

## O que acontece se não configurar?

Se você não definir a `SESSION_SECRET`, o sistema usará um valor padrão:
```
diario-obra-secret-key-change-in-production
```

**⚠️ ATENÇÃO:** Este valor padrão é **INSEGURO** para produção! Sempre defina uma chave secreta única e aleatória.















