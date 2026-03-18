# 🧠 Mind Sales Assistant
**WhatsApp Real + Claude IA — Guia de instalação completo**

---

## O que você vai ter
- Painel que recebe mensagens reais do WhatsApp em tempo real
- IA (Claude) ao lado de cada conversa para sugerir respostas
- Tudo de graça usando Evolution API + Railway

---

## Pré-requisitos
- Conta no [Railway](https://railway.app) (grátis)
- Conta no [GitHub](https://github.com) (para fazer deploy)
- Node.js instalado localmente (para testar)

---

## PASSO 1 — Subir a Evolution API no Railway (grátis)

1. Acesse: https://railway.app/new
2. Clique em **"Deploy from Docker Image"**
3. Use a imagem: `atendai/evolution-api:latest`
4. Em **Variables**, adicione:
   ```
   AUTHENTICATION_API_KEY=mind2024secretkey
   DATABASE_PROVIDER=postgresql
   ```
5. Adicione um serviço **PostgreSQL** (Railway oferece de graça)
6. Conecte o banco: vá em Variables da Evolution API e adicione:
   ```
   DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
   ```
7. Clique em **Deploy** e aguarde
8. Vá em **Settings → Domains** e copie a URL pública (ex: `https://evolution-api-xxx.railway.app`)

---

## PASSO 2 — Subir o Mind Assistant no Railway

1. Faça upload desta pasta para um repositório GitHub (pode ser privado)
2. No Railway, clique em **New Project → Deploy from GitHub Repo**
3. Selecione o repositório
4. Em **Variables**, adicione:
   ```
   EVOLUTION_URL=https://evolution-api-xxx.railway.app
   EVOLUTION_KEY=mind2024secretkey
   INSTANCE_NAME=mind-sales
   PORT=3000
   ```
5. Clique em **Deploy**
6. Anote a URL pública do Mind Assistant (ex: `https://mind-assistant-xxx.railway.app`)

---

## PASSO 3 — Criar instância e escanear QR Code

1. Abra o Mind Assistant no navegador
2. Abra o console do navegador (F12) e execute:
   ```javascript
   fetch('/create-instance', { method: 'POST' }).then(r => r.json()).then(console.log)
   ```
3. Acesse a URL da Evolution API + `/manager` para ver o QR code:
   ```
   https://evolution-api-xxx.railway.app/manager
   ```
4. Use a API key: `mind2024secretkey`
5. Clique na instância `mind-sales` → **QR Code**
6. Escaneie com o WhatsApp do seu celular (igual WhatsApp Web)
7. ✅ Pronto! As mensagens começam a chegar no painel em tempo real

---

## PASSO 4 — Usar localmente (opcional, para testar antes)

```bash
# Instalar dependências
npm install

# Variáveis de ambiente
export EVOLUTION_URL=https://evolution-api-xxx.railway.app
export EVOLUTION_KEY=mind2024secretkey
export INSTANCE_NAME=mind-sales

# Rodar
npm start
# Acesse http://localhost:3000
```

---

## Como funciona

```
WhatsApp → Evolution API → Webhook → server.js → WebSocket → Painel
                                                              ↓
                                                       Claude IA (ao lado)
```

1. Alguém te manda mensagem no WhatsApp
2. Evolution API captura e dispara o webhook para o server.js
3. server.js faz broadcast via WebSocket para o painel
4. A mensagem aparece instantaneamente no chat
5. Você clica em "Sugerir resposta" → Claude analisa o contexto e sugere
6. Você copia e manda no WhatsApp com 1 clique

---

## Configurações avançadas

### Mudar a API Key da IA
Abra `public/index.html`, localize a função `sendAiMessage` e substitua o fetch pelo seu proxy ou deixe como está (a chave de API é injetada pelo Claude.ai).

### Múltiplos números / instâncias
Crie mais instâncias na Evolution API com nomes diferentes e adicione mais `INSTANCE_NAME` no código.

### Webhook via ngrok (teste local)
```bash
npx ngrok http 3000
# Use a URL do ngrok no create-instance como webhookUrl
```

---

## Suporte
Problemas? Abra uma issue no GitHub ou fale com o time da Mind.
