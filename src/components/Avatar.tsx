import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Avatar: React.FC = () => {
  const { emotion, isSpeaking, avatarSet } = useStore();
  const imageUrl = isSpeaking
    ? avatarSet.speaking
    : avatarSet[emotion as keyof typeof avatarSet] || avatarSet.neutral;

  return (
    <motion.div
      className="flex items-center justify-center p-2"
      animate={{ y: isSpeaking ? [0, -3, 0] : 0 }}
      transition={{
        duration: 0.4,
        repeat: isSpeaking ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={`Avatar - ${emotion}`}
          className="w-32 h-32 lg:w-36 lg:h-36 object-contain transition-all duration-300"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
          loading="eager"
        />
        {/* Speaking indicator */}
        {isSpeaking && (
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--accent)' }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
        {/* Emotion label */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs capitalize whitespace-nowrap"
          style={{ color: 'var(--text-muted)' }}
        >
          {emotion}
        </div>
      </div>
    </motion.div>
  );
};
