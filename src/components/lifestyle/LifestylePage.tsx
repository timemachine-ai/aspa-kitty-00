import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  ShoppingCart,
  DollarSign,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
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

type Tab = 'calendar' | 'shopping' | 'expenses';

interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
}

interface Expense {
  id: string;
  label: string;
  amount: number;
  category: string;
  date: string;
}

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getStorageKey(key: string) {
  return `tm_lifestyle_${key}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch { /* ignore */ }
}

// ─── Calendar Widget ───────────────────────────────────────────────
function CalendarWidget() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <motion.div {...fadeUp(0.15)} className="rounded-3xl p-5 sm:p-6" style={glassCard}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-white font-semibold text-sm tracking-wide">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button onClick={next} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-white/30 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(i => <div key={`b-${i}`} />)}
        {days.map(d => (
          <button
            key={d}
            className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-all duration-200
              ${isToday(d)
                ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
          >
            {d}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Shopping List Widget ──────────────────────────────────────────
function ShoppingListWidget() {
  const [items, setItems] = useState<ShoppingItem[]>(() => loadFromStorage('shopping_items', []));
  const [newItem, setNewItem] = useState('');

  const persist = (next: ShoppingItem[]) => { setItems(next); saveToStorage('shopping_items', next); };

  const add = () => {
    const name = newItem.trim();
    if (!name) return;
    persist([...items, { id: Date.now().toString(), name, done: false }]);
    setNewItem('');
  };

  const toggle = (id: string) => persist(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remove = (id: string) => persist(items.filter(i => i.id !== id));

  const remaining = items.filter(i => !i.done).length;

  return (
    <motion.div {...fadeUp(0.2)} className="rounded-3xl p-5 sm:p-6" style={glassCard}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-sm tracking-wide">Shopping List</h3>
        {items.length > 0 && (
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
            {remaining} remaining
          </span>
        )}
      </div>

      {/* Add input */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add item..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={add}
          className="p-2.5 rounded-xl text-purple-300 hover:text-purple-200 transition-colors"
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
          }}
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Items */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover:bg-white/[0.03] transition-colors"
            >
              <button
                onClick={() => toggle(item.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200
                  ${item.done
                    ? 'bg-purple-500/30 border-purple-500/40 text-purple-300'
                    : 'border-white/15 text-transparent hover:border-white/30'
                  }`}
              >
                {item.done && <Check className="w-3 h-3" />}
              </button>
              <span className={`flex-1 text-sm transition-all duration-200 ${item.done ? 'text-white/25 line-through' : 'text-white/70'}`}>
                {item.name}
              </span>
              <button
                onClick={() => remove(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-white/20">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">Your list is empty</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Expense Tracker Widget ────────────────────────────────────────
function ExpenseTrackerWidget() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('expenses', []));
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const persist = (next: Expense[]) => { setExpenses(next); saveToStorage('expenses', next); };

  const add = () => {
    const l = label.trim();
    const a = parseFloat(amount);
    if (!l || isNaN(a) || a <= 0) return;
    persist([
      { id: Date.now().toString(), label: l, amount: a, category, date: new Date().toISOString() },
      ...expenses,
    ]);
    setLabel(''); setAmount(''); setCategory('Food'); setShowAdd(false);
  };

  const remove = (id: string) => persist(expenses.filter(e => e.id !== id));

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const categoryColors: Record<string, string> = {
    Food: 'bg-orange-500/30 text-orange-300 border-orange-500/30',
    Transport: 'bg-blue-500/30 text-blue-300 border-blue-500/30',
    Shopping: 'bg-pink-500/30 text-pink-300 border-pink-500/30',
    Bills: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/30',
    Entertainment: 'bg-purple-500/30 text-purple-300 border-purple-500/30',
    Health: 'bg-green-500/30 text-green-300 border-green-500/30',
    Other: 'bg-white/10 text-white/50 border-white/15',
  };

  return (
    <motion.div {...fadeUp(0.25)} className="rounded-3xl p-5 sm:p-6" style={glassCard}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-sm tracking-wide">Expense Tracker</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 rounded-xl text-purple-300 hover:text-purple-200 transition-colors"
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
          }}
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Total */}
      <div className="mb-5 px-4 py-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Total Spent</p>
        <p className="text-2xl font-bold text-white">${total.toFixed(2)}</p>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {byCategory.map(([cat, amt]) => (
            <div key={cat} className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${categoryColors[cat] || categoryColors.Other}`}>
              {cat} ${amt.toFixed(0)}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="space-y-3 pb-4 border-b border-white/5">
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="What did you spend on?"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
                />
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <DollarSign className="w-3.5 h-3.5 text-white/30" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all duration-200 border
                      ${category === cat
                        ? categoryColors[cat] || categoryColors.Other
                        : 'text-white/30 border-white/8 hover:border-white/15 hover:text-white/50'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={add}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2))',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                Add Expense
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {expenses.map(exp => (
            <motion.div
              key={exp.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover:bg-white/[0.03] transition-colors"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${(categoryColors[exp.category] || categoryColors.Other).split(' ')[0]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate">{exp.label}</p>
                <p className="text-[10px] text-white/25">{exp.category} · {new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-semibold text-white/60 shrink-0">${exp.amount.toFixed(2)}</span>
              <button
                onClick={() => remove(exp.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-white/20">
            <DollarSign className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No expenses yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Lifestyle Page ───────────────────────────────────────────
export function LifestylePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('calendar');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'shopping', label: 'Shopping List', icon: ShoppingCart },
    { key: 'expenses', label: 'Expenses', icon: DollarSign },
  ];

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-x-hidden`}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/6 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-fuchsia-500/4 blur-3xl" />
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-6 sm:px-10 pt-8 pb-0">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm">Home</span>
          </motion.button>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center justify-center px-4 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400/60" />
              <span className="text-[10px] font-semibold text-purple-400/60 uppercase tracking-widest">Everyday Essentials</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
              Lifestyle
            </h1>
            <p className="text-white/40 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Calendar, shopping lists, and expense tracking — everything you need, all in one place.
            </p>
          </motion.div>
        </div>

        {/* Tab bar */}
        <motion.div
          {...fadeUp(0.1)}
          className="flex items-center justify-center gap-2 px-6 pb-8"
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/40 hover:text-white/70 border border-white/8 hover:border-white/15'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-10 lg:px-16 pb-16 max-w-xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <CalendarWidget />
              </motion.div>
            )}
            {activeTab === 'shopping' && (
              <motion.div key="shopping" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <ShoppingListWidget />
              </motion.div>
            )}
            {activeTab === 'expenses' && (
              <motion.div key="expenses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <ExpenseTrackerWidget />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
