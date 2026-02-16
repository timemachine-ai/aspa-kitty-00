import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Sparkles } from 'lucide-react';

// ─── Persona styling (shared with ChatInput / VoiceRecorder) ─────────

const personaStyles = {
  tintColors: {
    default: 'rgba(168, 85, 247, 0.2)',
    girlie: 'rgba(236, 72, 153, 0.15)',
    pro: 'rgba(34, 211, 238, 0.15)',
  },
  borderColors: {
    default: 'rgba(168, 85, 247, 0.4)',
    girlie: 'rgba(236, 72, 153, 0.3)',
    pro: 'rgba(34, 211, 238, 0.3)',
  },
  glowShadow: {
    default: '0 0 15px rgba(168, 85, 247, 0.35)',
    girlie: '0 0 12px rgba(236, 72, 153, 0.25)',
    pro: '0 0 12px rgba(34, 211, 238, 0.25)',
  },
  iconColors: {
    default: '#a855f7',
    girlie: '#ec4899',
    pro: '#22d3ee',
  },
} as const;

type PersonaKey = keyof typeof personaStyles.tintColors;

export interface UniversalTextboxProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Callback when user submits text (Enter or send button) */
  onSubmit?: (text: string) => void;
  /** Callback when the plus button is clicked */
  onPlusClick?: () => void;
  /** Current persona for theming */
  persona?: PersonaKey;
  /** Whether the textbox is disabled */
  disabled?: boolean;
  /** Whether to show the plus button */
  showPlus?: boolean;
  /** Whether the send is in a loading state */
  isLoading?: boolean;
  /** Whether the textbox should float (fixed position at bottom) */
  floating?: boolean;
  /** Additional className for the wrapper */
  className?: string;
  /** Whether to show AI sparkle decoration */
  showAiHint?: boolean;
}

export function UniversalTextbox({
  placeholder = 'Type something...',
  onSubmit,
  onPlusClick,
  persona = 'default',
  disabled = false,
  showPlus = false,
  isLoading = false,
  floating = true,
  className = '',
  showAiHint = false,
}: UniversalTextboxProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (value.trim() && !disabled && !isLoading) {
      onSubmit?.(value.trim());
      setValue('');
    }
  }, [value, disabled, isLoading, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const wrapperClass = floating
    ? `fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-2xl z-40 ${className}`
    : `w-full ${className}`;

  return (
    <div className={wrapperClass}>
      <motion.div
        initial={floating ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex items-center gap-2"
      >
        {/* Plus button */}
        {showPlus && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlusClick}
            disabled={disabled}
            className="p-3 rounded-full disabled:opacity-50 transition-all duration-300 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${personaStyles.tintColors[persona]}, rgba(255, 255, 255, 0.05))`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${personaStyles.borderColors[persona]}`,
              boxShadow: `${personaStyles.glowShadow[persona]}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
            }}
          >
            <Plus className="w-5 h-5" style={{ color: personaStyles.iconColors[persona] }} />
          </motion.button>
        )}

        {/* Main textbox */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <motion.textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-6 pr-16 rounded-[28px] text-white/90 placeholder-white/25 outline-none disabled:opacity-50 transition-all duration-300 text-base resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                fontSize: '1rem',
                minHeight: '52px',
                maxHeight: '120px',
                paddingTop: '14px',
                paddingBottom: '14px',
                lineHeight: '24px',
                caretColor: personaStyles.iconColors[persona],
              }}
              rows={1}
            />

            {/* AI hint sparkle */}
            <AnimatePresence>
              {showAiHint && !value && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: personaStyles.iconColors[persona], opacity: 0.5 }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={disabled || isLoading || !value.trim()}
                className="p-2.5 rounded-full disabled:opacity-30 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${personaStyles.tintColors[persona]}, rgba(255, 255, 255, 0.05))`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${personaStyles.borderColors[persona]}`,
                  boxShadow: `${personaStyles.glowShadow[persona]}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
                }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${personaStyles.iconColors[persona]}30`, borderTopColor: personaStyles.iconColors[persona] }} />
                ) : (
                  <Send className="w-4 h-4" style={{ color: personaStyles.iconColors[persona] }} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
