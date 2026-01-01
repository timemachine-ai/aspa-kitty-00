import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_PERSONAS } from '../../config/constants';

interface MentionCallProps {
  isVisible: boolean;
  onSelect: (command: string) => void;
  currentPersona: keyof typeof AI_PERSONAS;
}

const personaColors = {
  default: 'from-purple-600/20 to-blue-600/20',
  girlie: 'from-pink-500/20 to-rose-400/20',
  pro: 'from-cyan-600/20 to-blue-600/20',
  chatgpt: 'from-green-600/20 to-emerald-600/20',
  gemini: 'from-blue-600/20 to-indigo-600/20',
  claude: 'from-orange-600/20 to-amber-600/20',
  grok: 'from-gray-600/20 to-slate-600/20'
} as const;

const personaGlowColors = {
  default: 'rgba(139,0,255,0.7)',
  girlie: 'rgba(199,21,133,0.7)',
  pro: 'rgba(34,211,238,0.7)',
  chatgpt: 'rgba(34,197,94,0.7)',
  gemini: 'rgba(37,99,235,0.7)',
  claude: 'rgba(234,88,12,0.7)',
  grok: 'rgba(107,114,128,0.7)'
} as const;

export function MentionCall({ isVisible, onSelect, currentPersona }: MentionCallProps) {
  // Only show external AI models in mention dropdown
  const externalAIs = ['chatgpt', 'gemini', 'claude', 'grok'];
  const availablePersonas = Object.entries(AI_PERSONAS)
    .filter(([key]) => externalAIs.includes(key))
    .map(([key, persona]) => ({
      key,
      command: `@${key}`,
      name: persona.name
    }));

  const aiIconColors = {
    chatgpt: 'bg-emerald-500/15 text-emerald-400',
    gemini: 'bg-blue-500/15 text-blue-400',
    claude: 'bg-orange-500/15 text-orange-400',
    grok: 'bg-slate-500/15 text-slate-400'
  } as const;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-full left-4 mb-3 z-50"
        >
          <div className="liquid-glass-dropdown p-2">
            {/* Header */}
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/30 font-medium">
              Switch Model
            </div>
            <div className="flex flex-col gap-1">
              {availablePersonas.map(({ key, command, name }) => (
                <motion.button
                  key={key}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(command);
                  }}
                  className="liquid-glass-item px-3 py-2.5 rounded-xl text-left
                    flex items-center gap-3 min-w-[220px]"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${aiIconColors[key as keyof typeof aiIconColors]}`}>
                    <span className="text-xs font-bold">
                      {key === 'chatgpt' ? 'G' : key === 'gemini' ? 'G' : key === 'claude' ? 'C' : 'X'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/80 text-sm font-medium">{name}</span>
                    <span className="text-white/30 text-[11px] font-mono">{command}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}