import React from 'react';
import { motion } from 'framer-motion';
import { Tv, MessageSquare } from 'lucide-react';
import { AI_PERSONAS } from '../../config/constants';

interface ShiftModeProps {
  isChatMode: boolean;
  onToggle: () => void;
  currentPersona?: keyof typeof AI_PERSONAS;
}

export function ShiftMode({ isChatMode, onToggle, currentPersona = 'default' }: ShiftModeProps) {
  const personaClass = `persona-${currentPersona}`;

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`glass-action-button ${personaClass} p-3 text-white`}
    >
      {isChatMode ? (
        <Tv className="w-4 h-4" />
      ) : (
        <MessageSquare className="w-4 h-4" />
      )}
    </motion.button>
  );
}