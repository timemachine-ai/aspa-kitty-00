import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Pen,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Music,
  Landmark,
  Newspaper,
  Gamepad2,
  Code,
  Languages,
  Clapperboard,
  ArrowLeft,
} from 'lucide-react';

interface AppTile {
  id: string;
  label: string;
  icon: React.ReactNode;
  accent: string;        // gradient start color
  accentEnd: string;     // gradient end color
  route: string | null;  // null = coming soon
  ready: boolean;
}

const apps: AppTile[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageCircle className="w-7 h-7" />,
    accent: '#a855f7',
    accentEnd: '#7c3aed',
    route: '/',
    ready: true,
  },
  {
    id: 'canvas',
    label: 'Canvas',
    icon: <Pen className="w-7 h-7" />,
    accent: '#f97316',
    accentEnd: '#ea580c',
    route: null,
    ready: false,
  },
  {
    id: 'education',
    label: 'Education',
    icon: <GraduationCap className="w-7 h-7" />,
    accent: '#3b82f6',
    accentEnd: '#2563eb',
    route: null,
    ready: false,
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: <HeartPulse className="w-7 h-7" />,
    accent: '#ef4444',
    accentEnd: '#dc2626',
    route: null,
    ready: false,
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: <ShoppingBag className="w-7 h-7" />,
    accent: '#10b981',
    accentEnd: '#059669',
    route: null,
    ready: false,
  },
  {
    id: 'music',
    label: 'Music',
    icon: <Music className="w-7 h-7" />,
    accent: '#ec4899',
    accentEnd: '#db2777',
    route: null,
    ready: false,
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <Landmark className="w-7 h-7" />,
    accent: '#14b8a6',
    accentEnd: '#0d9488',
    route: null,
    ready: false,
  },
  {
    id: 'news',
    label: 'News',
    icon: <Newspaper className="w-7 h-7" />,
    accent: '#8b5cf6',
    accentEnd: '#7c3aed',
    route: null,
    ready: false,
  },
  {
    id: 'games',
    label: 'Games',
    icon: <Gamepad2 className="w-7 h-7" />,
    accent: '#f59e0b',
    accentEnd: '#d97706',
    route: null,
    ready: false,
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code className="w-7 h-7" />,
    accent: '#22d3ee',
    accentEnd: '#06b6d4',
    route: null,
    ready: false,
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: <Languages className="w-7 h-7" />,
    accent: '#6366f1',
    accentEnd: '#4f46e5',
    route: null,
    ready: false,
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: <Clapperboard className="w-7 h-7" />,
    accent: '#e11d48',
    accentEnd: '#be123c',
    route: null,
    ready: false,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

const tileVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 260 } },
};

export function HomePage() {
  const navigate = useNavigate();

  const handleTileClick = (app: AppTile) => {
    if (app.ready && app.route) {
      navigate(app.route);
    }
  };

  return (
    <div className="min-h-screen relative overflow-auto bg-black">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-violet-950/20" />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/[0.04] rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to chat</span>
          </motion.button>
        </motion.nav>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            TimeMachine
          </h1>
          <p className="text-white/40 text-base sm:text-lg max-w-md mx-auto">
            Everything you need. One place.
          </p>
        </motion.div>

        {/* App Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-5"
        >
          {apps.map((app) => (
            <motion.button
              key={app.id}
              variants={tileVariants}
              whileHover={app.ready ? { y: -6, scale: 1.04 } : { scale: 1.02 }}
              whileTap={app.ready ? { scale: 0.96 } : { scale: 0.98 }}
              onClick={() => handleTileClick(app)}
              className={`relative flex flex-col items-center justify-center gap-3 py-6 px-3 rounded-3xl transition-all duration-300 outline-none ${
                !app.ready ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Icon container with accent glow */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${app.accent}20, ${app.accentEnd}10)`,
                  boxShadow: `0 0 20px ${app.accent}15`,
                }}
              >
                <span style={{ color: app.accent }}>{app.icon}</span>
              </div>

              {/* Label */}
              <span className="text-white/80 text-xs sm:text-sm font-medium">
                {app.label}
              </span>

              {/* Coming soon badge */}
              {!app.ready && (
                <span className="absolute top-2 right-2 text-[9px] font-medium text-white/25 bg-white/5 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
