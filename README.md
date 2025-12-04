# Diário de Obra Digital

Sistema obrigatório para registro diário de obras, com integração ao Google Sheets.

## Funcionalidades

- ✅ Lista nominal dos profissionais presentes (nome e função)
- ✅ Horário de entrada e saída de cada profissional
- ✅ Cálculo automático de horas trabalhadas
- ✅ Registro de serviços executados por função/setor
- ✅ Registro de pendências do dia
- ✅ Fotos georreferenciadas (opcional)
- ✅ Validação de horário (registro até 18h)
- ✅ Interface minimalista e clean

## Requisitos

- Node.js 18+ 
- Conta Google com acesso ao Google Sheets API
- Google Cloud Project com Service Account

## Instalação

1. Clone o repositório ou baixe os arquivos

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

   - Copie o arquivo `.env.example` para `.env`
   - Preencha com suas credenciais do Google Sheets

4. Configuração do Google Sheets:

   a. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Crie um novo projeto ou selecione um existente
   
   c. Ative a API do Google Sheets:
      - Vá em "APIs & Services" > "Library"
      - Procure por "Google Sheets API"
      - Clique em "Enable"
   
   d. Crie uma Service Account:
      - Vá em "APIs & Services" > "Credentials"
      - Clique em "Create Credentials" > "Service Account"
      - Preencha os dados e crie
      - Clique na service account criada
      - Vá na aba "Keys"
      - Clique em "Add Key" > "Create new key"
      - Escolha JSON e baixe o arquivo
   
   e. Crie uma planilha no Google Drive:
      - Crie uma nova planilha
      - Copie o ID da planilha da URL (entre `/d/` e `/edit`)
      - Compartilhe a planilha com o email da service account (encontrado no JSON baixado)
      - Dê permissão de "Editor"
   
   f. Configure o `.env`:
      - `GOOGLE_SHEETS_SPREADSHEET_ID`: ID da planilha
      - `GOOGLE_SHEETS_CLIENT_EMAIL`: Email da service account (do JSON)
      - `GOOGLE_SHEETS_PRIVATE_KEY`: Chave privada do JSON (mantenha as quebras de linha `\n`)

5. Crie a pasta de uploads:
```bash
mkdir uploads
```

## Execução

Para desenvolvimento (com watch):
```bash
npm run dev
```

Para produção:
```bash
npm start
```

O sistema estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
appobras/
├── server.js                 # Servidor Express
├── routes/
│   └── diario.routes.js      # Rotas da API
├── controllers/
│   └── diario.controller.js  # Lógica de negócio
├── services/
│   └── googleSheets.service.js # Integração Google Sheets
├── public/
│   ├── index.html            # Interface web
│   ├── styles.css            # Estilos
│   └── script.js             # JavaScript frontend
├── uploads/                  # Fotos enviadas
└── .env                      # Variáveis de ambiente
```

## Estrutura das Planilhas

O sistema cria automaticamente 4 abas na planilha:

1. **Profissionais**: Data, Nome, Função, Entrada, Saída, Horas Trabalhadas
2. **Servicos**: Data, Atividade, Local, Profissionais Envolvidos, Percentual Avanço, Observações
3. **Pendencias**: Data, Descrição, Prioridade, Status, Responsável
4. **Fotos**: Data, URL, Latitude, Longitude, Descrição, Local

## Uso

1. Acesse `http://localhost:3000`
2. Preencha a data do registro
3. Adicione os profissionais presentes com seus horários
4. Registre os serviços executados (opcional)
5. Adicione pendências do dia (opcional)
6. Adicione fotos georreferenciadas (opcional)
7. Clique em "Registrar Diário de Obra"

**Importante**: O registro deve ser feito até 18h do dia.

## Notas

- As fotos são salvas localmente na pasta `uploads/`
- A geolocalização requer permissão do navegador
- O sistema valida se o registro está sendo feito até 18h
- Todos os dados são salvos automaticamente no Google Sheets

## Validação da Configuração

Antes de iniciar o servidor, você pode validar sua configuração:

```bash
npm run validate
```

Este comando verifica se todas as variáveis de ambiente estão configuradas corretamente.

## Solução de Problemas

### Erro: `error:1E08010C:DECODER routines::unsupported`

Este erro ocorre quando a chave privada não está formatada corretamente no arquivo `.env`.

**Solução:**
1. Abra o arquivo JSON baixado do Google Cloud
2. Copie o valor do campo `private_key` completo
3. No arquivo `.env`, use este formato:
   ```env
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
4. Mantenha as aspas duplas e use `\n` para quebras de linha
5. Veja mais detalhes em `FIX_PRIVATE_KEY.md`

### Outros Problemas

- **Erro de permissão**: Verifique se a planilha foi compartilhada com o email da service account
- **Erro de autenticação**: Execute `npm run validate` para verificar as credenciais
- **Erro ao criar abas**: Verifique se a Google Sheets API está ativada no projeto
- Verifique os logs do servidor para mais detalhes

