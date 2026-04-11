import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Palette, Shuffle, Eye, Smile } from 'lucide-react';
import { useStore } from '../store';

interface DashboardProps {
  onClose: () => void;
}

const EMOTIONS = ['neutral', 'happy', 'sad', 'thinking', 'surprised'];

export const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const { avatarSeed, emotion, setEmotion, generateAvatarSet, avatarSet } = useStore();
  const [newSeed, setNewSeed] = useState(avatarSeed);

  const handleRegenerate = () => {
    const seed = newSeed.trim() || `agent-${Date.now()}`;
    generateAvatarSet(seed);
  };

  const handleRandomSeed = () => {
    const seed = `agent-${Math.random().toString(36).slice(2, 8)}`;
    setNewSeed(seed);
    generateAvatarSet(seed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="absolute right-0 top-0 h-full w-72 lg:w-80 z-50 overflow-y-auto border-l"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
            Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar Seed */}
        <section className="mb-6">
          <h3
            className="text-sm font-semibold mb-2 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Palette size={14} /> Avatar Seed
          </h3>
          <div className="flex gap-2">
            <input
              value={newSeed}
              onChange={(e) => setNewSeed(e.target.value)}
              placeholder="Escribe un seed..."
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleRegenerate}
              className="p-2 rounded-lg cursor-pointer transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              title="Regenerar"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={handleRandomSeed}
              className="p-2 rounded-lg cursor-pointer transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              title="Aleatorio"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </section>

        {/* Emotion test */}
        <section className="mb-6">
          <h3
            className="text-sm font-semibold mb-2 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Smile size={14} /> Probar emocion
          </h3>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmotion(e)}
                className="px-3 py-1.5 rounded-lg text-xs capitalize cursor-pointer transition-colors"
                style={{
                  background: emotion === e ? 'var(--accent)' : 'var(--bg-card)',
                  color: emotion === e ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* Avatar preview */}
        <section>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Preview
          </h3>
          <div
            className="grid grid-cols-3 gap-2"
          >
            {Object.entries(avatarSet).map(([key, url]) => (
              <div key={key} className="text-center">
                <img
                  src={url}
                  alt={key}
                  className="w-full aspect-square object-contain rounded-lg"
                  style={{
                    background: 'var(--bg-card)',
                    border: emotion === key ? '2px solid var(--accent)' : '1px solid var(--border)',
                  }}
                />
                <span
                  className="text-xs capitalize mt-1 block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {key}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* API endpoint info */}
        <section className="mt-6">
          <h3
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Agent API
          </h3>
          <div
            className="rounded-lg p-3 text-xs leading-relaxed"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          >
            <p className="mb-2 font-mono" style={{ color: 'var(--accent-hover)' }}>
              POST /api/present
            </p>
            <pre className="whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
{`{
  "text": "Mensaje...",
  "emotion": "happy",
  "canvasContent": {
    "type": "markdown",
    "content": "# Hola"
  }
}`}
            </pre>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
