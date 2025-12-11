# Como Corrigir o Erro de Chave Privada

Se você está recebendo o erro `error:1E08010C:DECODER routines::unsupported`, o problema está na formatação da chave privada no arquivo `.env`.

## Solução Rápida

### Opção 1: Usar o formato com aspas e \n (Recomendado)

No arquivo `.env`, use este formato:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Importante**: 
- Mantenha as aspas duplas
- Use `\n` (barra invertida + n) para representar quebras de linha
- Cole a chave privada completa do arquivo JSON

### Opção 2: Usar formato multi-linha (Alternativa)

Se a opção 1 não funcionar, tente sem aspas e com quebras de linha reais:

```env
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

**Nota**: Alguns sistemas podem não suportar quebras de linha em variáveis de ambiente. Nesse caso, use a Opção 1.

## Como Obter a Chave Privada Correta

1. Abra o arquivo JSON baixado do Google Cloud Console
2. Localize o campo `"private_key"`
3. Copie o valor completo, incluindo:
   - `-----BEGIN PRIVATE KEY-----`
   - Todo o conteúdo da chave
   - `-----END PRIVATE KEY-----`

4. No arquivo `.env`, substitua todas as quebras de linha reais por `\n`

**Exemplo de conversão:**

Do JSON:
```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

Para o `.env`:
```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Verificação

Após corrigir o `.env`:

1. Reinicie o servidor (pare com Ctrl+C e inicie novamente)
2. Verifique se não há mais erros no console
3. Tente registrar um diário de teste

Se ainda houver problemas, verifique:
- Se todas as variáveis estão no arquivo `.env` na raiz do projeto
- Se não há espaços extras antes ou depois dos valores
- Se as aspas estão corretas (aspas duplas `"`)















