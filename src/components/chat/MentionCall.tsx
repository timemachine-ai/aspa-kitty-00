import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { AI_PERSONAS } from '../../config/constants';
import { GroupChatParticipant } from '../../types/groupChat';

interface MentionCallProps {
  isVisible: boolean;
  onSelect: (command: string) => void;
  currentPersona: keyof typeof AI_PERSONAS;
  isGroupMode?: boolean;
  participants?: GroupChatParticipant[];
  currentUserId?: string;
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

export function MentionCall({ isVisible, onSelect, currentPersona, isGroupMode, participants, currentUserId }: MentionCallProps) {
  // Only show external AI models in mention dropdown (when not in group mode)
  const externalAIs = ['chatgpt', 'gemini', 'claude', 'grok'];
  const availablePersonas = Object.entries(AI_PERSONAS)
    .filter(([key]) => externalAIs.includes(key))
    .map(([key, persona]) => ({
      key,
      command: `@${key}`,
      name: persona.name
    }));

  // In group mode, show @TimeMachine first, then other participants
  const groupMentions = isGroupMode ? [
    { key: 'timemachine', command: '@TimeMachine', name: 'Ask AI', isAI: true },
    ...(participants || [])
      .filter(p => p.user_id !== currentUserId) // Don't show self
      .map(p => ({
        key: p.user_id,
        command: `@${p.nickname}`,
        name: p.nickname,
        isAI: false
      }))
  ] : [];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full left-0 mb-2 z-50"
        >
          <div className={`p-2 rounded-xl
            bg-black/60 backdrop-blur-xl
            border border-white/10
            shadow-lg max-h-[300px] overflow-y-auto`}
          >
            <div className="flex flex-col gap-1">
              {/* Group chat mentions (TimeMachine + participants) */}
              {isGroupMode && groupMentions.length > 0 && (
                <>
                  {groupMentions.map(({ key, command, name, isAI }) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelect(command);
                      }}
                      className={`px-3 py-2 rounded-lg text-left
                        ${isAI
                          ? `bg-gradient-to-r ${personaColors[currentPersona]} hover:shadow-[0_0_15px_${personaGlowColors[currentPersona]}]`
                          : 'bg-white/5 hover:bg-white/10'
                        }
                        transition-all duration-300
                        flex items-center gap-2 min-w-[200px]`}
                    >
                      {isAI ? (
                        <Bot className="w-4 h-4 text-purple-400" />
                      ) : (
                        <User className="w-4 h-4 text-white/50" />
                      )}
                      <span className={`text-sm font-mono ${isAI ? 'text-purple-300' : 'text-white/60'}`}>
                        {command}
                      </span>
                      <span className="text-white text-sm">{name}</span>
                    </motion.button>
                  ))}
                  {/* Divider if there are also AI models to show */}
                  <div className="border-t border-white/10 my-1" />
                </>
              )}

              {/* External AI models */}
              {availablePersonas.map(({ key, command, name }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(command);
                  }}
                  className={`px-3 py-2 rounded-lg text-left
                    bg-gradient-to-r ${personaColors[key as keyof typeof AI_PERSONAS]}
                    hover:shadow-[0_0_15px_${personaGlowColors[key as keyof typeof AI_PERSONAS]}]
                    transition-all duration-300
                    flex items-center gap-2 min-w-[200px]`}
                >
                  <span className="text-white/60 text-sm font-mono">{command}</span>
                  <span className="text-white text-sm">{name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}