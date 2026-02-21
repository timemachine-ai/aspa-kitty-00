import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const glassCard = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
} as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

export function WalletPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/6 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-yellow-500/4 blur-3xl" />
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-6 sm:px-10 pt-8 pb-0">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm">Back</span>
          </motion.button>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center justify-center px-4 pt-16 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
              TimeMachine Wallet
            </h1>
            <p className="text-white/40 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Your digital wallet for payments, transfers, and financial management.
            </p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-10 lg:px-16 pb-16 max-w-2xl mx-auto w-full">
          {/* Balance card */}
          <motion.div
            {...fadeUp(0.1)}
            className="rounded-3xl overflow-hidden relative mb-6"
            style={glassCard}
          >
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-white/30" />
                <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">Balance</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-1">
                $0.00
              </div>
              <p className="text-white/30 text-sm">Available balance</p>
            </div>
          </motion.div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Send', icon: ArrowUpRight },
              { label: 'Receive', icon: ArrowDownLeft },
              { label: 'Cards', icon: CreditCard },
            ].map((action, i) => (
              <motion.button
                key={action.label}
                {...fadeUp(0.2 + i * 0.06)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-4 flex flex-col items-center gap-2.5 text-white/50 hover:text-white/80 transition-colors"
                style={glassCard}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.06]">
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Transactions placeholder */}
          <motion.div {...fadeUp(0.35)}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">Recent Activity</span>
            </div>
            <div
              className="rounded-2xl flex flex-col items-center justify-center py-16"
              style={glassCard}
            >
              <Wallet className="w-10 h-10 text-white/10 mb-4" />
              <p className="text-white/30 text-sm font-medium mb-1">No transactions yet</p>
              <p className="text-white/20 text-xs">Your activity will appear here.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
