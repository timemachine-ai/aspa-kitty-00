import React, { useState, useEffect, useMemo } from 'react';
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
  Camera,
  Cloud,
  BookOpen,
  Utensils,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── helpers ────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── tile data ──────────────────────────────────────────────────────

interface AppTile {
  id: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  route: string | null;
  ready: boolean;
  featured?: boolean;   // shown in the quick-access dock
}

const apps: AppTile[] = [
  { id: 'chat',          label: 'Chat',          icon: <MessageCircle />, accent: '#a855f7', route: '/',    ready: true,  featured: true },
  { id: 'canvas',        label: 'Canvas',        icon: <Pen />,           accent: '#f97316', route: null,   ready: false, featured: true },
  { id: 'education',     label: 'Education',     icon: <GraduationCap />, accent: '#3b82f6', route: null,   ready: false, featured: true },
  { id: 'healthcare',    label: 'Healthcare',    icon: <HeartPulse />,    accent: '#ef4444', route: null,   ready: false, featured: true },
  { id: 'shopping',      label: 'Shopping',      icon: <ShoppingBag />,   accent: '#10b981', route: null,   ready: false },
  { id: 'music',         label: 'Music',         icon: <Music />,         accent: '#ec4899', route: null,   ready: false },
  { id: 'finance',       label: 'Finance',       icon: <Landmark />,      accent: '#14b8a6', route: null,   ready: false },
  { id: 'news',          label: 'News',          icon: <Newspaper />,     accent: '#8b5cf6', route: null,   ready: false },
  { id: 'games',         label: 'Games',         icon: <Gamepad2 />,      accent: '#f59e0b', route: null,   ready: false },
  { id: 'code',          label: 'Code',          icon: <Code />,          accent: '#22d3ee', route: null,   ready: false },
  { id: 'translate',     label: 'Translate',     icon: <Languages />,     accent: '#6366f1', route: null,   ready: false },
  { id: 'entertainment', label: 'Entertainment', icon: <Clapperboard />,  accent: '#e11d48', route: null,   ready: false },
  { id: 'photos',        label: 'Photos',        icon: <Camera />,        accent: '#f472b6', route: null,   ready: false },
  { id: 'weather',       label: 'Weather',       icon: <Cloud />,         accent: '#38bdf8', route: null,   ready: false },
  { id: 'notes',         label: 'Notes',         icon: <BookOpen />,      accent: '#fbbf24', route: null,   ready: false },
  { id: 'recipes',       label: 'Recipes',       icon: <Utensils />,      accent: '#fb923c', route: null,   ready: false },
];

// ─── animation variants ─────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
};

const tileUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 24, stiffness: 220 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ─── component ──────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Live clock – update every 30 s
  const [time, setTime] = useState(formatTime);
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(getGreeting, []);
  const date = useMemo(formatDate, []);
  const displayName = profile?.nickname || null;

  const featured = apps.filter((a) => a.featured);
  const allApps = apps;

  const handleTap = (app: AppTile) => {
    if (app.ready && app.route) navigate(app.route);
  };

  return (
    <div className="min-h-screen relative overflow-auto select-none">
      {/* ── purple → black gradient bg ─────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, #7c3aed 0%, #4c1d95 25%, #1e1b4b 50%, #000000 75%)',
          }}
        />
        {/* soft radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-500/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px]" />
        {/* noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px 128px' }} />
      </div>

      {/* ── content ────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 pt-6 pb-20">

        {/* Top bar */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Chat</span>
          </motion.button>

          <span className="text-white/40 text-sm font-medium tracking-wide">
            {time}
          </span>
        </motion.nav>

        {/* ── Greeting ─────────────────────────────────────────── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <p className="text-white/40 text-sm font-medium tracking-wide mb-1">{date}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {greeting}{displayName ? ',' : '.'}</h1>
          {displayName && (
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {displayName}.
            </h1>
          )}
        </motion.div>

        {/* ── Featured / Quick Access ──────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {featured.map((app) => (
              <motion.button
                key={app.id}
                whileHover={app.ready ? { y: -4, scale: 1.03 } : {}}
                whileTap={app.ready ? { scale: 0.97 } : {}}
                onClick={() => handleTap(app)}
                className={`relative flex items-center gap-3 px-4 py-4 rounded-2xl overflow-hidden transition-all duration-300 outline-none ${
                  app.ready ? 'cursor-pointer' : 'cursor-default'
                }`}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* soft accent wash behind the card */}
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${app.accent}, transparent 70%)` }}
                />
                <div
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${app.accent}18` }}
                >
                  <span className="w-5 h-5" style={{ color: app.accent }}>
                    {React.cloneElement(app.icon as React.ReactElement, { className: 'w-5 h-5' })}
                  </span>
                </div>
                <span className="relative text-white/90 text-sm font-semibold truncate">{app.label}</span>
                {!app.ready && (
                  <span className="relative ml-auto text-[9px] font-semibold text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full shrink-0">
                    Soon
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── All Apps ─────────────────────────────────────────── */}
        <motion.section>
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
            className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4"
          >
            All Apps
          </motion.p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-4 sm:grid-cols-4 gap-y-6 gap-x-3"
          >
            {allApps.map((app) => (
              <motion.button
                key={app.id}
                variants={tileUp}
                whileHover={app.ready ? { y: -5, scale: 1.06 } : { scale: 1.02 }}
                whileTap={app.ready ? { scale: 0.94 } : {}}
                onClick={() => handleTap(app)}
                className={`relative flex flex-col items-center gap-2 outline-none ${
                  app.ready ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Icon circle */}
                <div
                  className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 0.5px rgba(255,255,255,0.04)`,
                  }}
                >
                  {/* inner accent glow */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: `radial-gradient(circle at 50% 120%, ${app.accent}, transparent 70%)` }}
                  />
                  <span className="relative" style={{ color: app.accent }}>
                    {React.cloneElement(app.icon as React.ReactElement, { className: 'w-6 h-6' })}
                  </span>
                </div>

                {/* Label */}
                <span className="text-white/60 text-[11px] font-medium leading-tight text-center">
                  {app.label}
                </span>

                {/* Soon dot */}
                {!app.ready && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/10 border border-white/5" />
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
