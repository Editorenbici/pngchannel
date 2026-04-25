# PNGChannel — Visual Channel for AI Agents

A lightweight web interface that gives AI agents a visual presence: real-time chat, rich canvas presentations, and reactive avatars. Think of it as a minimal, developer-friendly alternative to chat platforms, purpose-built for agent output.

## ✨ Features

- **Rich Canvas**: Render markdown, syntax-highlighted code, images, sandboxed HTML, tables, JSON, and PDFs
- **Reactive Avatars**: DiceBear-powered avatars with 6 emotions (happy, neutral, sad, thinking, surprised, speaking)
- **Real-time by Default**: WebSocket + REST API for instant agent-to-client communication
- **Modern Stack**: React 19, Vite 6, TypeScript, Tailwind CSS v4
- **State Management**: Zustand for predictable state updates
- **Secure**: Sandboxed iframes for untrusted HTML content
- **Self-hosted**: Run locally or deploy anywhere

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| State | Zustand |
| Real-time | Socket.io (client + server) |
| Animations | Framer Motion |
| Backend | Express + Socket.io |
| Avatars | DiceBear API (lorelei style) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
git clone https://github.com/Editorenbici/pngchannel.git
cd pngchannel
npm install
```

### Running (Two Terminals)

**Terminal 1 — Server (port 3001):**
```bash
npm run server
```

**Terminal 2 — Frontend (port 5173):**
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Environment Setup
Copy the example env file:
```bash
cp .env.example .env
```

Variables:
- `AGENT_API_URL`: URL of your agent API (default: `http://localhost:3000`)
- `CHANNEL_SECRET`: Secret for webhook authentication
- `PORT`: Server port (default: `3001`)

## 📡 Agent Protocol

Agents push content to the canvas via HTTP POST:

```bash
curl -X POST http://localhost:3001/api/present \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from my agent!",
    "emotion": "happy",
    "speaking": true,
    "canvasContent": {
      "type": "markdown",
      "content": "# Agent Output\nThis is **rendered** in real-time.",
      "title": "Greeting"
    },
    "clearCanvas": false
  }'
```

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/present` | POST | Push content to all connected clients |
| `/api/chat` | POST | Forward message to agent API (fallback: echo) |
| `/api/canvas/clear` | POST | Clear canvas for all clients |
| `/api/emotion` | POST | Update avatar emotion/speaking state |
| `/api/health` | GET | Health check + connected client count |

### Canvas Content Types

1. **markdown** — Full GFM with syntax-highlighted code blocks
2. **code** — Syntax-highlighted code with line numbers
3. **image** — Responsive images with error fallback
4. **html** — Sandboxed iframe (`allow-scripts` only)
5. **table** — JSON array of objects, auto-extracts headers
6. **json** — Pretty-printed JSON
7. **pdf** — Embedded PDF viewer

## 🔌 Integrating Your Agent

PNGChannel works with any agent that can make HTTP requests:

```python
import requests

def push_to_canvas(text, canvas_content=None, emotion="neutral"):
    payload = {
        "text": text,
        "emotion": emotion,
        "canvasContent": canvas_content
    }
    requests.post("http://localhost:3001/api/present", json=payload)

# Example usage
push_to_canvas(
    "Task completed!",
    canvas_content={
        "type": "code",
        "content": "print('Hello from agent')",
        "language": "python",
        "title": "output.py"
    },
    emotion="happy"
)
```

## 📦 Building for Production

```bash
npm run build
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🔗 Links

- **GitHub**: [github.com/Editorenbici/pngchannel](https://github.com/Editorenbici/pngchannel)
- **Issues**: [Report a bug](https://github.com/Editorenbici/pngchannel/issues)

---

Built for AI agents, by AI agents.
