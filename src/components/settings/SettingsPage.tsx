import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { seasonThemes } from '../../themes/seasons';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, mode, season, setMode, setSeason, defaultTheme, setDefaultTheme, clearDefaultTheme } = useTheme();
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => setConfirmationMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  const seasonButtons = React.useMemo(
    () =>
      Object.entries(seasonThemes)
        .filter(([key]) => key !== 'monochrome')
        .map(([key, seasonTheme]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <button
              onClick={() => setSeason(key as keyof typeof seasonThemes)}
              className={`w-16 h-16 rounded-full
                ${seasonTheme.background} bg-opacity-20 backdrop-blur-md
                border-2 border-white/20
                ${season === key ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''}
                hover:bg-opacity-30 relative group transition-all duration-200`}
              aria-label={`Select ${seasonTheme.name} theme`}
            >
              {season === key && (
                <Palette className="w-5 h-5 text-white/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              )}
            </button>
            <span className="text-xs font-medium mt-2 text-center text-white/80">
              {seasonTheme.name}
            </span>
          </motion.div>
        )),
    [season, setSeason]
  );

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}>
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <h1 className="text-2xl font-bold text-white">Settings</h1>

          <div className="w-16" /> {/* Spacer for centering */}
        </motion.div>

        {/* Confirmation Message */}
        <AnimatePresence>
          {confirmationMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium text-center"
            >
              {confirmationMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          }}
        >
          <div className="relative p-6 space-y-8">
            {/* Appearance Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>

              {/* Theme Mode Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/60">Theme Mode</label>
                <div className="flex gap-2">
                  {['light', 'dark', 'monochrome'].map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode(option as 'light' | 'dark' | 'monochrome')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium
                        ${mode === option
                          ? 'bg-purple-500/30 border-purple-500/50 text-purple-200'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }
                        border transition-all duration-200
                        flex items-center justify-center gap-2`}
                    >
                      {option === 'light' && <Sun className="w-4 h-4" />}
                      {option === 'dark' && <Moon className="w-4 h-4" />}
                      {option === 'monochrome' && <Palette className="w-4 h-4" />}
                      <span className="capitalize">{option}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Default Theme Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/60">Default Theme</label>
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span className="text-sm text-white/80">
                      {defaultTheme
                        ? `${defaultTheme.mode.charAt(0).toUpperCase() + defaultTheme.mode.slice(1)}${
                            defaultTheme.season ? `, ${seasonThemes[defaultTheme.season]?.name || defaultTheme.season}` : ''
                          }`
                        : 'No default theme set'}
                    </span>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setDefaultTheme({ mode, season });
                          setConfirmationMessage(defaultTheme ? 'Default theme changed!' : 'Default theme set!');
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium
                          bg-purple-500/20 hover:bg-purple-500/30
                          border border-purple-500/30
                          text-purple-200 transition-all duration-200"
                      >
                        {defaultTheme ? 'Change' : 'Set Default'}
                      </motion.button>
                      {defaultTheme && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            clearDefaultTheme();
                            setConfirmationMessage('Default theme cleared!');
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium
                            bg-red-500/20 hover:bg-red-500/30
                            border border-red-500/30
                            text-red-200 transition-all duration-200"
                        >
                          Clear
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Season Themes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Seasons</h2>
              <div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {seasonButtons}
              </div>
            </div>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/20 text-xs mt-8"
        >
          TimeMachine v1.0
        </motion.p>
      </div>
    </div>
  );
}
