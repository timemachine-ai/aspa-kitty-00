import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Zap, Shield, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function AboutPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen relative overflow-auto">
      {/* Purple to black gradient background */}
      <div className="fixed inset-0 bg-gradient-to-t from-purple-900/40 via-black to-black -z-10" />

      {/* Ambient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <h1 className="text-2xl font-bold text-white">About Us</h1>

          <div className="w-16" />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Hero Section */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">TimeMachine Chat</h2>
            <p className="text-white/70 leading-relaxed">
              Fastest intelligence build with you in mind, by TimeMachine Mafia.
            </p>
          </div>

          {/* Mission Section */}
          <div
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Our Mission</h3>
            <p className="text-white/60 leading-relaxed">
              Artificial Intelligence for the betterment of humanity. We believe AI should be accessible,
              helpful, and designed with care for every user. TimeMachine is your AI companion,
              not just an assistant.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
            >
              <Zap className="w-6 h-6 text-purple-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-2">Lightning Fast</h4>
              <p className="text-xs text-white/50">
                The fastest AI response times in the industry. While TimeMachine Air is the Super Computer Speed in your pocket. 
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
            >
              <Shield className="w-6 h-6 text-purple-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-2">Privacy First</h4>
              <p className="text-xs text-white/50">
                Your data is only yours. We prioritize safety and privacy over everything and never sell or train on your data.
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
            >
              <Heart className="w-6 h-6 text-pink-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-2">Built with Care</h4>
              <p className="text-xs text-white/50">
                Made with love🤍. A lot of care goes into making you the main character of our story.
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
            >
              <Sparkles className="w-6 h-6 text-cyan-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-2">3 Resonators</h4>
              <p className="text-xs text-white/50">
                Air, Girlie, and PRO - choose your vibe.
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">TimeMachine Mafia</h3>
            <p className="text-white/60 leading-relaxed">
              Founded by Tanzim Ibne Mahboob, TimeMachine Mafia is on a mission to revolutionize
              how people interact with tech. We're building the future of intelligent companions keeping our standards and privacy at top.
            </p>
          </div>

          {/* Version Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/20 text-xs mt-8"
          >
            TimeMachine Chat v1.0
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
