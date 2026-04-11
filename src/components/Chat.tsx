import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

export const Chat: React.FC = () => {
  const { messages, addMessage, clearMessages, isLoading, setIsLoading, isConnected } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', text: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map((m) => ({
            role: m.role === 'agent' ? 'model' : 'user',
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      // Update store with agent response
      if (data.text) {
        addMessage({ role: 'agent', text: data.text });
      }
      if (data.emotion) {
        useStore.getState().setEmotion(data.emotion);
      }
      if (data.canvasContent) {
        useStore.getState().setCanvasContent(data.canvasContent);
      }
      if (typeof data.speaking === 'boolean') {
        useStore.getState().setIsSpeaking(data.speaking);
      }
    } catch (err) {
      addMessage({ role: 'agent', text: 'Error conectando al agente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'var(--accent)',
                        color: '#fff',
                        borderBottomRightRadius: '4px',
                      }
                    : {
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        borderBottomLeftRadius: '4px',
                      }
                }
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className="px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-card)' }}
            >
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="border-t p-3 shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              maxHeight: '120px',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              title="Limpiar chat"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isLoading ? 'var(--accent)' : 'var(--bg-card)',
              color: input.trim() && !isLoading ? '#fff' : 'var(--text-muted)',
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Connection hint */}
        {!isConnected && (
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--error)' }}>
            Desconectado del servidor
          </p>
        )}
      </div>
    </div>
  );
};
