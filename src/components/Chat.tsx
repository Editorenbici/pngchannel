import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

export const Chat: React.FC = () => {
  const { messages, addMessage, clearMessages, isLoading, setIsLoading, isConnected } = useStore();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageStyle = (role: string) => {
    if (role === 'user') {
      return {
        background: 'var(--accent)',
        color: '#fff',
        borderBottomRightRadius: '4px',
      };
    }
    return {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      borderBottomLeftRadius: '4px',
    };
  };

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
      addMessage({ role: 'agent', text: 'Error connecting to agent.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      
      if (data.ok) {
        addMessage({ 
          role: 'agent', 
          text: `File uploaded: ${file.name}` 
        });
        
        if (data.file?.canvasContent) {
          useStore.getState().setCanvasContent(data.file.canvasContent);
          useStore.getState().setEmotion('happy');
        }
      }
    } catch (err) {
      addMessage({ role: 'agent', text: 'File upload failed.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                style={getMessageStyle(msg.role)}
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

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className="px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: 'var(--bg-card)' }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Uploading file...
              </span>
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.gif,.webp"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
            title="Upload file (PDF, Excel, Image)"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Upload size={16} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
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
              title="Clear chat"
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
            Disconnected from server
          </p>
        )}
      </div>
    </div>
  );
};
