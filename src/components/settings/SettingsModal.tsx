import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { seasonThemes } from '../../themes/seasons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = React.memo(({ isOpen, onClose }: SettingsModalProps) => {
  const { mode, season, setMode, setSeason, defaultTheme, setDefaultTheme, clearDefaultTheme } = useTheme();
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // Clear confirmation message after 3 seconds
  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => setConfirmationMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  // Toggle monochrome mode
  const handleMonochromeToggle = () => {
    if (mode === 'monochrome') {
      // Switch back to dark mode
      setMode('dark');
      setSeason('autumnDark');
    } else {
      // Switch to monochrome
      setMode('monochrome');
    }
  };

  const isMonochrome = mode === 'monochrome';

  // Memoized season buttons to prevent re-renders
  const seasonButtons = React.useMemo(
    () =>
      Object.entries(seasonThemes)
        .filter(([key]) => key !== 'monochrome')
        .map(([key, seasonTheme]) => (
          <div key={key} className="flex flex-col items-center">
            <button
              onClick={() => setSeason(key as keyof typeof seasonThemes)}
              className={`w-12 h-12 rounded-full transition-all duration-200
                ${season === key ? 'ring-2 ring-purple-400/60 ring-offset-2 ring-offset-transparent scale-110' : 'hover:scale-105'}`}
              style={{
                background: seasonTheme.background.includes('gradient')
                  ? seasonTheme.background.replace('bg-gradient-to-br', 'linear-gradient(to bottom right,').replace(/-/g, ' ').replace('from ', '').replace('to ', ', ') + ')'
                  : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: season === key ? '2px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
              aria-label={`Select ${seasonTheme.name} theme`}
            >
              {season === key && (
                <Palette className="w-4 h-4 text-white/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              )}
            </button>
            <span className="text-xs font-medium mt-1 text-center text-white/70">
              {seasonTheme.name}
            </span>
          </div>
        )),
    [season, setSeason]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
              >
                <div
                  className="relative w-full max-w-md sm:max-w-lg p-6 rounded-2xl transition-all duration-300"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(88, 28, 135, 0.3), rgba(0, 0, 0, 0.9))',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Confirmation Message */}
                  <AnimatePresence>
                    {confirmationMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        aria-live="polite"
                        className="absolute top-2 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm"
                        style={{
                          background: 'rgba(168, 85, 247, 0.3)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}
                      >
                        {confirmationMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Dialog.Title className="text-xl font-semibold mb-4 text-white">
                    Appearance
                  </Dialog.Title>

                  <div className="space-y-6">
                    {/* Monochrome Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-white/70" />
                          <label className="text-sm font-medium text-white/70">
                            Monochrome
                          </label>
                        </div>
                        {/* Glass Toggle Switch */}
                        <button
                          onClick={handleMonochromeToggle}
                          className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                          style={{
                            background: isMonochrome
                              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(139, 92, 246, 0.3))'
                              : 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: isMonochrome
                              ? '1px solid rgba(168, 85, 247, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: isMonochrome
                              ? '0 0 20px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                              : 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
                          }}
                          aria-label="Toggle monochrome mode"
                          role="switch"
                          aria-checked={isMonochrome}
                        >
                          <motion.div
                            className="absolute top-1 w-6 h-6 rounded-full"
                            animate={{
                              x: isMonochrome ? 26 : 2,
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 30
                            }}
                            style={{
                              background: isMonochrome
                                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))'
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4))',
                              boxShadow: isMonochrome
                                ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 12px rgba(168, 85, 247, 0.4)'
                                : '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Default Theme Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/70">
                        Default Theme
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-sm text-white/60 flex-1">
                          {defaultTheme
                            ? `${defaultTheme.mode.charAt(0).toUpperCase() + defaultTheme.mode.slice(1)}${
                                defaultTheme.season ? `, ${seasonThemes[defaultTheme.season]?.name || defaultTheme.season}` : ''
                              }`
                            : 'No default set (uses persona theme)'}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setDefaultTheme({ mode, season });
                              setConfirmationMessage(defaultTheme ? 'Default theme changed!' : 'Default theme set!');
                            }}
                            className="px-3 py-1.5 rounded-full text-sm transition-all duration-200"
                            style={{
                              background: 'rgba(168, 85, 247, 0.2)',
                              backdropFilter: 'blur(12px)',
                              WebkitBackdropFilter: 'blur(12px)',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: 'rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {defaultTheme ? 'Update' : 'Set as Default'}
                          </button>
                          {defaultTheme && (
                            <button
                              onClick={() => {
                                clearDefaultTheme();
                                setConfirmationMessage('Default theme cleared!');
                              }}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.6)'
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Season Themes */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/70">
                        Seasons
                      </label>
                      <div
                        className="max-h-[50vh] overflow-y-auto rounded-xl p-3"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <style>{`
                          .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                          {seasonButtons}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 p-2 rounded-full transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      aria-label="Close settings modal"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
});