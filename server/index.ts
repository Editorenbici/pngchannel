import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// ── Config ─────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:3000';
const CHANNEL_SECRET = process.env.CHANNEL_SECRET || 'pngchannel-secret';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 5e6, // 5MB
});

// ── State ──────────────────────────────────────────
const clients = new Set<string>();

// ── WebSocket ──────────────────────────────────────
io.on('connection', (socket) => {
  clients.add(socket.id);
  console.log(`[PNGChannel] Client connected: ${socket.id} (${clients.size} total)`);

  socket.on('agent_message', (data) => {
    // Broadcast to all clients (including sender)
    io.emit('agent_message', data);
  });

  socket.on('disconnect', () => {
    clients.delete(socket.id);
    console.log(`[PNGChannel] Client disconnected: ${socket.id} (${clients.size} total)`);
  });
});

// ── Health check ───────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    uptime: process.uptime(),
  });
});

// ── POST /api/present ──────────────────────────────
// Main endpoint for agents to push content to canvas.
// Accepts the AgentProtocol object directly.
app.post('/api/present', (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  // Broadcast to all connected clients
  io.emit('agent_message', data);
  console.log(`[PNGChannel] Present → ${clients.size} clients`);

  res.json({ ok: true, clients: clients.size });
});

// ── POST /api/chat ─────────────────────────────────
// Forwards chat messages to the agent API and returns response.
// Fallback: echo if no agent is configured.
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await fetch(`${AGENT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_SECRET}`,
      },
      body: JSON.stringify({ message, history }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Agent API returned ${response.status}`);
    }

    const data = await response.json();

    // Broadcast agent response to all clients
    if (data && typeof data === 'object') {
      io.emit('agent_message', data);
    }

    res.json(data);
  } catch (error: any) {
    console.error(`[PNGChannel] Agent API error: ${error.message}`);

    // Fallback: echo mode
    const fallback = {
      text: `Echo: ${message}`,
      emotion: 'neutral',
    };

    io.emit('agent_message', fallback);
    res.json(fallback);
  }
});

// ── POST /api/canvas/clear ─────────────────────────
app.post('/api/canvas/clear', (_req, res) => {
  io.emit('agent_message', { clearCanvas: true });
  res.json({ ok: true });
});

// ── POST /api/emotion ──────────────────────────────
app.post('/api/emotion', (req, res) => {
  const { emotion, speaking } = req.body;
  const payload: Record<string, any> = {};
  if (emotion) payload.emotion = emotion;
  if (typeof speaking === 'boolean') payload.speaking = speaking;

  io.emit('agent_message', payload);
  res.json({ ok: true });
});

// ── Start ──────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[PNGChannel] Server running on http://localhost:${PORT}`);
  console.log(`[PNGChannel] Agent API: ${AGENT_API_URL}`);
  console.log(`[PNGChannel] Endpoints:`);
  console.log(`  POST /api/present    → Push content to canvas`);
  console.log(`  POST /api/chat       → Forward to agent API`);
  console.log(`  POST /api/canvas/clear → Clear canvas`);
  console.log(`  POST /api/emotion    → Set avatar emotion`);
  console.log(`  GET  /api/health     → Health check`);
});
