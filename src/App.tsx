import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from './components/Avatar';
import { Canvas } from './components/Canvas';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { useStore, AgentProtocol } from './store';
import { Settings } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { AnimatePresence } from 'framer-motion';

let socket: Socket | null = null;

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const {
    setIsConnected, setEmotion, setIsSpeaking,
    setCanvasContent, addMessage, isConnected,
  } = useStore();

  // ── Socket connection ────────────────────────────
  useEffect(() => {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[PNGChannel] Connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[PNGChannel] Disconnected');
    });

    // Agent messages
    socket.on('agent_message', (data: AgentProtocol) => {
      handleAgentMessage(data);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  const handleAgentMessage = useCallback((data: AgentProtocol) => {
    if (data.text) {
      addMessage({ role: 'agent', text: data.text });
    }
    if (data.emotion) {
      setEmotion(data.emotion);
    }
    if (typeof data.speaking === 'boolean') {
      setIsSpeaking(data.speaking);
    }
    if (data.clearCanvas) {
      setCanvasContent(null);
    }
    if (data.canvasContent) {
      setCanvasContent(data.canvasContent);
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Header ────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            P
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              PNGChannel
            </h1>
            <div className="flex items-center gap-1.5">
              <span
                className="status-dot"
                style={{ background: isConnected ? 'var(--success)' : 'var(--error)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{
            background: showDashboard ? 'var(--accent)' : 'transparent',
            color: showDashboard ? '#fff' : 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            if (!showDashboard) {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showDashboard) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }
          }}
        >
          <Settings size={18} />
        </button>
      </header>

      {/* ── Main Layout ───────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Avatar + Chat */}
        <div
          className="w-80 lg:w-96 flex flex-col border-r shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div
            className="h-48 lg:h-56 border-b flex items-center justify-center shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <Avatar />
          </div>
          <div className="flex-1 overflow-hidden">
            <Chat />
          </div>
        </div>

        {/* Right: Canvas */}
        <div className="flex-1 p-3 lg:p-4 min-w-0">
          <Canvas />
        </div>

        {/* Dashboard overlay */}
        <AnimatePresence>
          {showDashboard && <Dashboard onClose={() => setShowDashboard(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
