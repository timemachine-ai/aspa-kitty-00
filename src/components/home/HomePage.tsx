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
  Home,
  Settings,
  User,
  History,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── helpers ─────────────────────────────────────────────────────────

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

// ─── glass style ─────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
} as const;

// ─── tile data ───────────────────────────────────────────────────────

interface AppTile {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  accent: string;
  route: string | null;
  ready: boolean;
}

const allApps: AppTile[] = [
  { id: 'chat',          label: 'Chat',          description: 'AI-powered conversations',      icon: <MessageCircle />, accent: '#a855f7', route: '/',  ready: true  },
  { id: 'canvas',        label: 'Canvas',        description: 'Draw and design',               icon: <Pen />,           accent: '#f97316', route: null, ready: false },
  { id: 'education',     label: 'Education',     description: 'Learn anything',                icon: <GraduationCap />, accent: '#3b82f6', route: null, ready: false },
  { id: 'healthcare',    label: 'Healthcare',    description: 'Health companion',              icon: <HeartPulse />,    accent: '#ef4444', route: null, ready: false },
  { id: 'shopping',      label: 'Shopping',      description: 'Smart shopping assistant',      icon: <ShoppingBag />,   accent: '#10b981', route: null, ready: false },
  { id: 'music',         label: 'Music',         description: 'Stream and discover',           icon: <Music />,         accent: '#ec4899', route: null, ready: false },
  { id: 'finance',       label: 'Finance',       description: 'Track and manage money',        icon: <Landmark />,      accent: '#14b8a6', route: null, ready: false },
  { id: 'news',          label: 'News',          description: 'Stay informed',                 icon: <Newspaper />,     accent: '#8b5cf6', route: null, ready: false },
  { id: 'games',         label: 'Games',         description: 'Play and compete',              icon: <Gamepad2 />,      accent: '#f59e0b', route: null, ready: false },
  { id: 'code',          label: 'Code',          description: 'Write and debug code',          icon: <Code />,          accent: '#22d3ee', route: null, ready: false },
  { id: 'translate',     label: 'Translate',     description: 'Break language barriers',       icon: <Languages />,     accent: '#6366f1', route: null, ready: false },
  { id: 'entertainment', label: 'Entertainment', description: 'Movies, shows & more',          icon: <Clapperboard />,  accent: '#e11d48', route: null, ready: false },
  { id: 'photos',        label: 'Photos',        description: 'AI-powered gallery',            icon: <Camera />,        accent: '#f472b6', route: null, ready: false },
  { id: 'weather',       label: 'Weather',       description: 'Forecasts and alerts',          icon: <Cloud />,         accent: '#38bdf8', route: null, ready: false },
  { id: 'notes',         label: 'Notes',         description: 'Capture your thoughts',         icon: <BookOpen />,      accent: '#fbbf24', route: null, ready: false },
  { id: 'recipes',       label: 'Recipes',       description: 'Cooking assistant',             icon: <Utensils />,      accent: '#fb923c', route: null, ready: false },
];

// sidebar icons
const sidebarItems = [
  { icon: <Home />,    label: 'Home',     route: '/home'     },
  { icon: <MessageCircle />, label: 'Chat', route: '/'       },
  { icon: <History />, label: 'History',   route: '/history'  },
  { icon: <User />,    label: 'Account',   route: '/account'  },
  { icon: <Settings />,label: 'Settings',  route: '/settings' },
];

// ─── animation ───────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

// ─── component ───────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [time, setTime] = useState(formatTime);
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(getGreeting, []);
  const date = useMemo(formatDate, []);
  const name = profile?.nickname || null;

  const handleTap = (app: AppTile) => {
    if (app.ready && app.route) navigate(app.route);
  };

  // bottom bento cards — pick 3 feature areas
  const bottomCards = [
    allApps.find((a) => a.id === 'education')!,
    allApps.find((a) => a.id === 'healthcare')!,
    allApps.find((a) => a.id === 'music')!,
  ];

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* ── BG: purple → black ──────────────────────────────── */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, #7c3aed 0%, #4c1d95 20%, #1e1b4b 45%, #0a0a0a 75%, #000 100%)' }}
        />
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-purple-500/25 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-5%] right-[10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-[50%] left-[60%] w-[300px] h-[300px] bg-fuchsia-500/8 rounded-full blur-[120px]" />
      </div>

      {/* ── LAYOUT ──────────────────────────────────────────── */}
      <div className="h-full flex">

        {/* ── Sidebar (desktop) ─────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden md:flex flex-col items-center py-6 px-3 gap-2 shrink-0 w-[72px]"
        >
          {sidebarItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.route)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-200"
              title={item.label}
            >
              {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
            </motion.button>
          ))}
        </motion.aside>

        {/* ── Main grid area ────────────────────────────────── */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 md:pl-0 md:pr-5 md:py-5">
          <div className="h-full flex flex-col gap-4 min-h-[600px]">

            {/* ── TOP ROW: hero + side panel ─────────────────── */}
            <div className="flex-[1.3] flex flex-col md:flex-row gap-4 min-h-0">

              {/* HERO CARD — Chat / Greeting */}
              <motion.div
                {...fadeUp(0)}
                onClick={() => navigate('/')}
                className="flex-[1.6] rounded-3xl overflow-hidden relative cursor-pointer group min-h-[260px] md:min-h-0"
                style={glass}
              >
                {/* hero accent glow */}
                <div
                  className="absolute inset-0 opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.18]"
                  style={{ background: 'radial-gradient(ellipse at 30% 80%, #a855f7, transparent 60%)' }}
                />
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{ background: 'radial-gradient(ellipse at 80% 20%, #7c3aed, transparent 50%)' }}
                />

                <div className="relative h-full flex flex-col justify-between p-6 sm:p-8">
                  {/* top: date + time */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/30 text-xs sm:text-sm font-medium tracking-wide">{date}</span>
                    <span className="text-white/30 text-xs sm:text-sm font-medium">{time}</span>
                  </div>

                  {/* center: greeting */}
                  <div>
                    <p className="text-white/40 text-sm font-medium mb-1">
                      {greeting}{name ? ',' : '.'}
                    </p>
                    {name && (
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                        {name}
                      </h1>
                    )}
                    {!name && (
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                        Welcome
                      </h1>
                    )}
                  </div>

                  {/* bottom: CTA */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.08] text-white/70 text-sm font-medium group-hover:bg-white/[0.12] group-hover:text-white transition-all duration-300">
                      <Sparkles className="w-4 h-4" />
                      <span>Start chatting</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* SIDE PANEL — All Apps directory */}
              <motion.div
                {...fadeUp(0.08)}
                className="flex-1 rounded-3xl overflow-hidden relative min-h-[300px] md:min-h-0"
                style={glass}
              >
                <div className="relative h-full flex flex-col p-5">
                  <p className="text-white/30 text-[11px] font-semibold uppercase tracking-widest mb-4">All Apps</p>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 -mr-2 pr-2">
                    {allApps.map((app) => (
                      <motion.button
                        key={app.id}
                        whileHover={app.ready ? { x: 4 } : {}}
                        whileTap={app.ready ? { scale: 0.98 } : {}}
                        onClick={() => handleTap(app)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 outline-none ${
                          app.ready
                            ? 'cursor-pointer hover:bg-white/[0.05]'
                            : 'cursor-default opacity-50'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${app.accent}15` }}
                        >
                          <span style={{ color: app.accent }}>
                            {React.cloneElement(app.icon as React.ReactElement, { className: 'w-4 h-4' })}
                          </span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-white/80 text-sm font-medium leading-tight">{app.label}</p>
                          <p className="text-white/25 text-[11px] leading-tight truncate">{app.description}</p>
                        </div>
                        {!app.ready && (
                          <span className="text-[9px] font-semibold text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full shrink-0">
                            Soon
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── BOTTOM ROW: 3 feature cards ────────────────── */}
            <div className="flex-[0.65] flex flex-col sm:flex-row gap-4 min-h-[160px]">
              {bottomCards.map((app, i) => (
                <motion.div
                  key={app.id}
                  {...fadeUp(0.14 + i * 0.06)}
                  whileHover={app.ready ? { y: -4, scale: 1.01 } : {}}
                  whileTap={app.ready ? { scale: 0.98 } : {}}
                  onClick={() => handleTap(app)}
                  className={`flex-1 rounded-3xl overflow-hidden relative ${
                    app.ready ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  style={glass}
                >
                  {/* accent wash */}
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{ background: `radial-gradient(ellipse at 50% 100%, ${app.accent}, transparent 60%)` }}
                  />

                  <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${app.accent}15` }}
                    >
                      <span style={{ color: app.accent }}>
                        {React.cloneElement(app.icon as React.ReactElement, { className: 'w-6 h-6' })}
                      </span>
                    </div>
                    <div>
                      <p className="text-white/90 text-base font-semibold">{app.label}</p>
                      <p className="text-white/30 text-xs mt-0.5">{app.description}</p>
                    </div>
                    {!app.ready && (
                      <span className="absolute top-4 right-4 text-[9px] font-semibold text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom bar ──────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div
          className="flex items-center justify-around px-4 py-3"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {sidebarItems.map((item) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            >
              {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
