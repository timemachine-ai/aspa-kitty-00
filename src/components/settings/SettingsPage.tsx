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
              className={`w-12 h-12 rounded-full flex items-center justify-center relative transition-all duration-200`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: season === key ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: season === key ? '0 0 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
              aria-label={`Select ${seasonTheme.name} theme`}
            >
              <Palette
                className={`w-5 h-5`}
                style={{
                  color: seasonTheme.name === 'Winter' ? '#60a5fa' :
                         seasonTheme.name === 'Spring' ? '#f472b6' :
                         seasonTheme.name === 'Summer' ? '#fbbf24' :
                         seasonTheme.name === 'Autumn' ? '#f87171' : 'rgba(255,255,255,0.8)'
                }}
              />
            </button>
            <span className="text-xs font-medium mt-2 text-center text-white/60">
              {seasonTheme.name}
            </span>
          </motion.div>
        )),
    [season, setSeason]
  );

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-y-auto`}>
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
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200`}
                      style={{
                        background: mode === option ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: mode === option ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: mode === option ? 'white' : 'rgba(255, 255, 255, 0.6)',
                        boxShadow: mode === option ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none'
                      }}
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
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
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
                          className="px-4 py-2 rounded-lg text-sm font-medium text-red-300 transition-all duration-200"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
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
