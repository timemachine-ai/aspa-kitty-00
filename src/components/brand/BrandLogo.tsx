import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings, Wand2, History, Plus, User, LogIn } from 'lucide-react';
import { AI_PERSONAS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsModal } from '../settings/SettingsModal';
import { AgentsModal } from '../agents/AgentsModal';
import { ChatHistoryModal } from '../chat/ChatHistoryModal';
import { Message } from '../../types/chat';

interface BrandLogoProps {
  onPersonaChange: (persona: keyof typeof AI_PERSONAS) => void;
  currentPersona: keyof typeof AI_PERSONAS;
  onLoadChat: (messages: Message[]) => void;
  onStartNewChat: () => void;
  onOpenAuth?: () => void;
  onOpenAccount?: () => void;
}

const personaColors = {
  default: 'text-purple-400',
  girlie: 'text-pink-400',
  pro: 'text-cyan-400'
} as const;

const personaDescriptions = {
  default: 'Fastest intelligence in the world for everyday use',
  girlie: 'The intelligence that gets the vibe check',
  pro: 'Our most technologically advanced intelligence with human-like emotions and thinking capabilities'
} as const;

const personaGlowColors = {
  default: 'rgba(168,85,247,0.6)',
  girlie: 'rgba(255,20,147,0.8)',
  pro: 'rgba(34,211,238,0.6)'
} as const;

export function BrandLogo({ onPersonaChange, currentPersona, onLoadChat, onStartNewChat, onOpenAuth, onOpenAccount }: BrandLogoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { theme } = useTheme();
  const { user, profile } = useAuth();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handlePersonaSelect = (persona: keyof typeof AI_PERSONAS) => {
    onPersonaChange(persona);
    setIsOpen(false);
  };

  const handleStartNewChat = () => {
    onStartNewChat();
    setIsOpen(false);
  };

  const handleAuthClick = () => {
    setIsOpen(false);
    if (user) {
      onOpenAccount?.();
    } else {
      onOpenAuth?.();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-50 flex items-center gap-2 cursor-pointer group"
          onClick={toggleDropdown}
        >
          <h1
            className={`text-xl sm:text-2xl font-bold ${personaColors[currentPersona]} transition-colors duration-300`}
            style={{
              fontFamily: 'Montserrat, sans-serif',
              textShadow: `
                0 0 20px ${personaGlowColors[currentPersona]},
                0 0 40px ${personaGlowColors[currentPersona].replace(/[\d.]+\)$/, '0.3)')},
                0 0 60px ${personaGlowColors[currentPersona].replace(/[\d.]+\)$/, '0.1)')}
              `
            }}
          >
            {AI_PERSONAS[currentPersona].name}
          </h1>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={personaColors[currentPersona]}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass-dropdown liquid-shimmer absolute top-full left-0 mt-4 w-80 z-50"
          >
            {/* Sign In / My Account Button */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAuthClick}
              className={`liquid-glass-item w-full px-5 py-4 text-left ${theme.text} flex items-center gap-4`}
            >
              {user ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/20">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white/90">{profile?.nickname || 'My Account'}</div>
                    <div className="text-xs text-white/40 mt-0.5">View your profile</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <LogIn className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white/90">Sign In / Sign Up</div>
                    <div className="text-xs text-white/40 mt-0.5">Unlock unlimited chats</div>
                  </div>
                </>
              )}
            </motion.button>

            {/* Glass Divider */}
            <div className="glass-divider mx-4" />

            {/* Persona Section Label */}
            <div className="px-5 py-2 text-[10px] uppercase tracking-widest text-white/30 font-medium">
              Intelligence Models
            </div>

            {Object.entries(AI_PERSONAS)
              .filter(([key]) => ['default', 'girlie', 'pro'].includes(key))
              .map(([key, persona]) => (
              <motion.button
                key={key}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePersonaSelect(key as keyof typeof AI_PERSONAS)}
                className={`liquid-glass-item w-full px-5 py-3 text-left flex flex-col gap-0.5
                  ${currentPersona === key ? personaColors[key as keyof typeof personaColors] : 'text-white/80'}`}
                style={{
                  background: currentPersona === key
                    ? `linear-gradient(90deg, ${personaGlowColors[key as keyof typeof personaGlowColors].replace(/[\d.]+\)$/, '0.15)')}, transparent)`
                    : 'transparent'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{persona.name}</span>
                  {currentPersona === key && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  )}
                </div>
                <div className="text-[11px] text-white/40 leading-relaxed">
                  {personaDescriptions[key as keyof typeof personaDescriptions]}
                </div>
              </motion.button>
            ))}

            {/* Glass Divider */}
            <div className="glass-divider mx-4" />

            {/* Actions Section Label */}
            <div className="px-5 py-2 text-[10px] uppercase tracking-widest text-white/30 font-medium">
              Actions
            </div>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartNewChat}
              className={`liquid-glass-item w-full px-5 py-3 text-left ${theme.text} flex items-center gap-3`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-medium text-sm text-white/80">Start New Chat</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowHistory(true);
                setIsOpen(false);
              }}
              className={`liquid-glass-item w-full px-5 py-3 text-left ${theme.text} flex items-center gap-3`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <History className="w-4 h-4 text-purple-400" />
              </div>
              <span className="font-medium text-sm text-white/80">Chat History</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowAgents(true);
                setIsOpen(false);
              }}
              className={`liquid-glass-item w-full px-5 py-3 text-left ${theme.text} flex items-center gap-3`}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-medium text-sm text-white/80">Flight Controls</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowSettings(true);
                setIsOpen(false);
              }}
              className={`liquid-glass-item w-full px-5 py-3.5 text-left ${theme.text} flex items-center gap-3 rounded-b-3xl`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-medium text-sm text-white/80">Themes</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AgentsModal isOpen={showAgents} onClose={() => setShowAgents(false)} />
      <ChatHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadChat={onLoadChat}
      />
    </div>
  );
}
