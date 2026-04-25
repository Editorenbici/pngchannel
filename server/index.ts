import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

// ── Config ─────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:3000';
const CHANNEL_SECRET = process.env.CHANNEL_SECRET || 'pngchannel-secret';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

// ── File Upload ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, CSV, and images are allowed.'));
    }
  }
});

// ── HTTP Server & Socket.io ────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 10e6, // 10MB
});

// ── State ──────────────────────────────────────────
const clients = new Set<string>();

// ── WebSocket ──────────────────────────────────────
io.on('connection', (socket) => {
  clients.add(socket.id);
  console.log(`[PNGChannel] Client connected: ${socket.id} (${clients.size} total)`);

  socket.on('agent_message', (data) => {
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
app.post('/api/present', (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  io.emit('agent_message', data);
  console.log(`[PNGChannel] Present → ${clients.size} clients`);

  res.json({ ok: true, clients: clients.size });
});

// ── POST /api/upload ──────────────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const originalName = req.file.originalname;

  let canvasContent = null;

  try {
    // Handle Excel/CSV files
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      canvasContent = {
        type: 'table',
        content: jsonData,
        title: originalName
      };
    }
    // Handle PDF files
    else if (ext === '.pdf') {
      canvasContent = {
        type: 'pdf',
        content: fileUrl,
        title: originalName
      };
    }
    // Handle images
    else if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      canvasContent = {
        type: 'image',
        content: fileUrl,
        title: originalName
      };
    }

    // Broadcast to clients
    const message = {
      text: `File uploaded: ${originalName}`,
      emotion: 'happy',
      canvasContent
    };
    
    io.emit('agent_message', message);
    
    res.json({
      ok: true,
      file: {
        url: fileUrl,
        name: originalName,
        type: ext,
        canvasContent
      }
    });
  } catch (error: any) {
    console.error(`[PNGChannel] File processing error: ${error.message}`);
    res.status(500).json({ error: 'File processing failed', details: error.message });
  }
});

// ── POST /api/chat ─────────────────────────────────
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

    if (data && typeof data === 'object') {
      io.emit('agent_message', data);
    }

    res.json(data);
  } catch (error: any) {
    console.error(`[PNGChannel] Agent API error: ${error.message}`);

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
  console.log(`  POST /api/upload     → Upload files (PDF, Excel, images)`);
  console.log(`  POST /api/chat       → Forward to agent API`);
  console.log(`  POST /api/canvas/clear → Clear canvas`);
  console.log(`  POST /api/emotion    → Set avatar emotion`);
  console.log(`  GET  /api/health     → Health check`);
});
