const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONFIG (edite aqui ou use variáveis de ambiente) ───
const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_KEY || 'sua-api-key-aqui';
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'mind-sales';
const PORT = process.env.PORT || 3000;

// ─── BROADCAST para todos os clientes WS conectados ───
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// ─── WEBHOOK: Evolution API chama este endpoint quando chega mensagem ───
app.post('/webhook', (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (!body || !body.event) return;

  // Mensagem recebida
  if (body.event === 'messages.upsert') {
    const msgs = Array.isArray(body.data) ? body.data : [body.data];
    msgs.forEach(m => {
      if (!m || m.key?.fromMe) return; // ignora mensagens enviadas por você
      const phone = m.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
      const text = m.message?.conversation
        || m.message?.extendedTextMessage?.text
        || m.message?.imageMessage?.caption
        || '[mídia]';
      const pushName = m.pushName || phone;
      broadcast({ type: 'incoming', phone, name: pushName, text, timestamp: m.messageTimestamp });
    });
  }

  // Confirmação de leitura / status
  if (body.event === 'messages.update') {
    const updates = Array.isArray(body.data) ? body.data : [body.data];
    updates.forEach(u => {
      if (!u) return;
      broadcast({ type: 'status', id: u.key?.id, status: u.update?.status });
    });
  }
});

// ─── ENDPOINT: enviar mensagem via Evolution API ───
app.post('/send', async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: 'phone e text são obrigatórios' });

  try {
    const r = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
      { number: phone, text },
      { headers: { apikey: EVOLUTION_KEY } }
    );
    res.json({ ok: true, data: r.data });
  } catch (e) {
    console.error('Erro ao enviar:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── ENDPOINT: status da instância (QR code / conectado) ───
app.get('/status', async (req, res) => {
  try {
    const r = await axios.get(
      `${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`,
      { headers: { apikey: EVOLUTION_KEY } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ENDPOINT: buscar QR code ───
app.get('/qrcode', async (req, res) => {
  try {
    const r = await axios.get(
      `${EVOLUTION_URL}/instance/fetchInstances`,
      { headers: { apikey: EVOLUTION_KEY } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ENDPOINT: criar instância (primeira vez) ───
app.post('/create-instance', async (req, res) => {
  try {
    const r = await axios.post(
      `${EVOLUTION_URL}/instance/create`,
      {
        instanceName: INSTANCE_NAME,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhookUrl: `${req.protocol}://${req.get('host')}/webhook`,
        webhookByEvents: true,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE']
      },
      { headers: { apikey: EVOLUTION_KEY } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── WS: quando cliente conecta, manda status atual ───
wss.on('connection', (ws) => {
  console.log('Frontend conectado via WebSocket');
  ws.send(JSON.stringify({ type: 'connected', message: 'Mind Assistant Online' }));
});

server.listen(PORT, () => {
  console.log(`\n✅ Mind Assistant rodando em http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`⚙️  Evolution API: ${EVOLUTION_URL}`);
});
