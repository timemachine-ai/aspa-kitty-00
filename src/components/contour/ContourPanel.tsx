/**
 * TimeMachine Contour - Main Panel Component
 *
 * A glassmorphic spotlight overlay above the chat textbox.
 * Shows "TimeMachine Contour" branding top-left.
 * Supports: command palette, auto-detected results, and focused tool mode.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, ArrowLeftRight, DollarSign, Globe, Palette,
  Timer, Calendar, Shuffle, Type, Braces, Lock, Link, Hash,
  FileSearch, FileText, Settings, History, Image, Brain,
  HelpCircle, Code, Music, HeartPulse, Fingerprint, Clock,
  Search, Wrench, Monitor, Zap, Command, Equal,
  ChevronLeft, Play, Pause, RotateCcw, Copy, Check,
} from 'lucide-react';
import { ContourState, ModuleData, ModuleId } from './useContour';
import { ContourCommand, ContourCategory, CATEGORY_INFO } from './modules/commands';
import { getUnitCategories, convertDirect, UnitResult } from './modules/unitConverter';
import {
  getCurrencyList, POPULAR_CURRENCIES, resolveCurrency, formatCurrency,
  CurrencyResult, CurrencyOption,
} from './modules/currencyConverter';
import {
  getTimezoneList, POPULAR_TIMEZONES, convertTimezoneDirect, findTimezoneByLabel,
  TimezoneResult, TimezoneOption,
} from './modules/timezoneConverter';
import {
  colorFromRgb, hexToRgb, rgbToHex, rgbToHsl, COLOR_PRESETS,
  ColorResult,
} from './modules/colorConverter';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calculator, ArrowLeftRight, DollarSign, Globe, Palette,
  Timer, Calendar, Shuffle, Type, Braces, Lock, Link, Hash,
  FileSearch, FileText, Settings, History, Image, Brain,
  HelpCircle, Code, Music, HeartPulse, Fingerprint, Clock,
  Search, Wrench, Monitor, Zap, Command,
};

interface ContourPanelProps {
  state: ContourState;
  isVisible: boolean;
  onCommandSelect: (command: ContourCommand) => void;
  selectedIndex: number;
  persona?: string;
  // Timer controls
  onTimerStart?: () => void;
  onTimerToggle?: () => void;
  onTimerReset?: () => void;
  onCopyValue?: (value: string) => void;
}

interface AccentTheme {
  bg: string;
  border: string;
  glow: string;
  text: string;
  solid: string;
}

const personaAccent: Record<string, AccentTheme> = {
  default: {
    bg: 'rgba(139, 0, 255, 0.08)',
    border: 'rgba(139, 0, 255, 0.25)',
    glow: '0 0 40px rgba(139, 0, 255, 0.15)',
    text: 'text-purple-400',
    solid: '#8b00ff',
  },
  girlie: {
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.25)',
    glow: '0 0 40px rgba(236, 72, 153, 0.15)',
    text: 'text-pink-400',
    solid: '#ec4899',
  },
  pro: {
    bg: 'rgba(34, 211, 238, 0.08)',
    border: 'rgba(34, 211, 238, 0.25)',
    glow: '0 0 40px rgba(34, 211, 238, 0.15)',
    text: 'text-cyan-400',
    solid: '#22d3ee',
  },
};

const MODULE_META: Record<ModuleId, { icon: React.ComponentType<{ className?: string }>; label: string; placeholder: string }> = {
  calculator: { icon: Calculator, label: 'Calculator', placeholder: 'Type a math expression... (e.g., 5+3*2)' },
  units: { icon: ArrowLeftRight, label: 'Unit Converter', placeholder: 'e.g., 5km to miles, 100f to c, 2kg to lb' },
  currency: { icon: DollarSign, label: 'Currency Converter', placeholder: 'e.g., 50 usd to eur, 100 gbp to jpy' },
  timezone: { icon: Globe, label: 'Timezone Converter', placeholder: 'e.g., 3pm EST in IST, now in Tokyo' },
  color: { icon: Palette, label: 'Color Converter', placeholder: 'e.g., #ff5733, rgb(255,87,51), coral' },
  date: { icon: Calendar, label: 'Date Calculator', placeholder: 'e.g., days until Dec 25, 30 days from now' },
  timer: { icon: Timer, label: 'Timer', placeholder: 'e.g., 5m, 1h30m, 90s, 10:00' },
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || Command;
}

function groupByCategory(commands: ContourCommand[]): { category: ContourCategory; commands: ContourCommand[] }[] {
  const grouped = new Map<ContourCategory, ContourCommand[]>();
  for (const cmd of commands) {
    const list = grouped.get(cmd.category) || [];
    list.push(cmd);
    grouped.set(cmd.category, list);
  }
  return Array.from(grouped.entries()).map(([category, commands]) => ({ category, commands }));
}

// ─── Module View Components ────────────────────────────────────

function CalculatorView({ module, accent }: { module: ModuleData; accent: AccentTheme }) {
  const calc = module.calculator;
  if (!calc && module.focused) {
    return <HintView icon={Calculator} accent={accent} text={MODULE_META.calculator.placeholder} />;
  }
  if (!calc) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <IconBadge icon={Equal} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-xs font-mono mb-1 truncate">{calc.expression}</div>
          <div className={`text-xl font-semibold tracking-tight ${calc.isPartial ? 'text-white/50' : 'text-white'}`}>
            {calc.displayResult}
          </div>
        </div>
      </div>
      {!calc.isPartial && (
        <FooterHint text="Press Enter to copy result" />
      )}
    </div>
  );
}

const UNIT_CATEGORIES = getUnitCategories();

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

function UnitsView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const units = module.units;

  // Non-focused: simple display (unchanged behavior)
  if (!module.focused) {
    if (!units) return null;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={ArrowLeftRight} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className={`text-xl font-semibold tracking-tight ${units.isPartial ? 'text-white/50' : 'text-white'}`}>
              {units.display}
            </div>
          </div>
        </div>
        {!units.isPartial && <FooterHint text="Press Enter to copy result" />}
      </div>
    );
  }

  // Focused mode: interactive UI
  return <UnitsInteractive units={units} accent={accent} onCopyValue={onCopyValue} />;
}

function UnitsInteractive({ units, accent, onCopyValue }: { units?: UnitResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const [categoryId, setCategoryId] = useState(UNIT_CATEGORIES[0].id);
  const [fromUnitLabel, setFromUnitLabel] = useState(UNIT_CATEGORIES[0].units[0].label);
  const [toUnitLabel, setToUnitLabel] = useState(UNIT_CATEGORIES[0].units[1]?.label || UNIT_CATEGORIES[0].units[0].label);
  const [inputValue, setInputValue] = useState('1');
  const [result, setResult] = useState<UnitResult | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCategory = UNIT_CATEGORIES.find(c => c.id === categoryId) || UNIT_CATEGORIES[0];

  // Compute result whenever interactive inputs change
  useEffect(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || inputValue === '') {
      setResult(null);
      return;
    }
    setResult(convertDirect(num, fromUnitLabel, toUnitLabel));
  }, [inputValue, fromUnitLabel, toUnitLabel]);

  // Sync from textbox detection (only until user interacts with card)
  useEffect(() => {
    if (hasInteracted || !units || units.isPartial) return;
    for (const cat of UNIT_CATEGORIES) {
      const from = cat.units.find(u => u.label === units.fromLabel);
      const to = cat.units.find(u => u.label === units.toLabel);
      if (from && to) {
        setCategoryId(cat.id);
        setFromUnitLabel(from.label);
        setToUnitLabel(to.label);
        setInputValue(String(units.fromValue));
        break;
      }
    }
  }, [units?.fromLabel, units?.toLabel, units?.fromValue, units?.isPartial, hasInteracted]);

  const handleCategoryChange = (catId: string) => {
    setHasInteracted(true);
    setCategoryId(catId);
    const cat = UNIT_CATEGORIES.find(c => c.id === catId);
    if (cat && cat.units.length >= 2) {
      setFromUnitLabel(cat.units[0].label);
      setToUnitLabel(cat.units[1].label);
    } else if (cat) {
      setFromUnitLabel(cat.units[0].label);
      setToUnitLabel(cat.units[0].label);
    }
  };

  const handleSwap = () => {
    setHasInteracted(true);
    setFromUnitLabel(toUnitLabel);
    setToUnitLabel(fromUnitLabel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && result && onCopyValue) {
      e.preventDefault();
      onCopyValue(result.display);
    }
  };

  const selectStyle = {
    backgroundImage: SELECT_ARROW,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 8px center',
  };

  return (
    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {UNIT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              categoryId === cat.id ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
            style={categoryId === cat.id ? {
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              boxShadow: `0 0 8px ${accent.border.replace('0.25', '0.08')}`,
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Conversion row */}
      <div className="flex items-center gap-2">
        {/* Value input */}
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={e => { setHasInteracted(true); setInputValue(e.target.value); }}
          className="w-[72px] bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />

        {/* From unit */}
        <select
          value={fromUnitLabel}
          onChange={e => { setHasInteracted(true); setFromUnitLabel(e.target.value); }}
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-7"
          style={selectStyle}
        >
          {currentCategory.units.map(u => (
            <option key={u.label} value={u.label} style={{ background: '#1a1a1a', color: 'white' }}>{u.label}</option>
          ))}
        </select>

        {/* Swap button */}
        <button
          onClick={handleSwap}
          className="p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* To unit */}
        <select
          value={toUnitLabel}
          onChange={e => { setHasInteracted(true); setToUnitLabel(e.target.value); }}
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-7"
          style={selectStyle}
        >
          {currentCategory.units.map(u => (
            <option key={u.label} value={u.label} style={{ background: '#1a1a1a', color: 'white' }}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Result display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3 pt-1"
        >
          <IconBadge icon={ArrowLeftRight} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold tracking-tight text-white">
              {result.display}
            </div>
          </div>
        </motion.div>
      )}

      {result && <FooterHint text="Press Enter to copy result" />}
    </div>
  );
}

const CURRENCY_LIST = getCurrencyList();

function CurrencyView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const curr = module.currency;

  // Non-focused: simple display (unchanged behavior)
  if (!module.focused) {
    if (!curr) return null;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={DollarSign} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className={`text-xl font-semibold tracking-tight ${curr.isPartial || curr.isLoading ? 'text-white/50' : 'text-white'}`}>
              {curr.display}
            </div>
            {curr.rate && !curr.isPartial && (
              <div className="text-white/30 text-xs mt-1">
                1 {curr.fromCurrency} = {curr.rate.toFixed(4)} {curr.toCurrency}
              </div>
            )}
            {curr.error && (
              <div className="text-red-400/60 text-xs mt-1">{curr.error}</div>
            )}
          </div>
          {curr.isLoading && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          )}
        </div>
        {!curr.isPartial && !curr.isLoading && curr.toValue !== null && (
          <FooterHint text="Press Enter to copy result" />
        )}
      </div>
    );
  }

  // Focused mode: interactive UI
  return <CurrencyInteractive curr={curr} accent={accent} onCopyValue={onCopyValue} />;
}

function CurrencyInteractive({ curr, accent, onCopyValue }: { curr?: CurrencyResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const [fromCode, setFromCode] = useState('USD');
  const [toCode, setToCode] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState<CurrencyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const genRef = useRef(0);

  // Resolve conversion whenever inputs change
  useEffect(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || amount === '') {
      setResult(null);
      setIsLoading(false);
      return;
    }

    if (fromCode === toCode) {
      setResult({
        fromValue: num, fromCurrency: fromCode, toCurrency: toCode,
        toValue: num, rate: 1,
        display: `${formatCurrency(num, fromCode)} = ${formatCurrency(num, toCode)}`,
        isPartial: false, isLoading: false,
      });
      setIsLoading(false);
      return;
    }

    const gen = ++genRef.current;
    setIsLoading(true);

    resolveCurrency({
      fromValue: num, fromCurrency: fromCode, toCurrency: toCode,
      toValue: null, rate: null, display: '', isPartial: false, isLoading: true,
    }).then(resolved => {
      if (genRef.current !== gen) return;
      setResult(resolved);
      setIsLoading(false);
    });
  }, [amount, fromCode, toCode]);

  // Sync from textbox detection (until user interacts with card)
  useEffect(() => {
    if (hasInteracted || !curr || curr.isPartial) return;
    setFromCode(curr.fromCurrency);
    if (curr.toCurrency) setToCode(curr.toCurrency);
    setAmount(String(curr.fromValue));
  }, [curr?.fromCurrency, curr?.toCurrency, curr?.fromValue, curr?.isPartial, hasInteracted]);

  const handleSwap = () => {
    setHasInteracted(true);
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && result && !isLoading && result.toValue !== null && onCopyValue) {
      e.preventDefault();
      onCopyValue(result.display);
    }
  };

  const popularFrom = POPULAR_CURRENCIES.filter(c => c !== toCode).slice(0, 6);
  const popularTo = POPULAR_CURRENCIES.filter(c => c !== fromCode).slice(0, 6);

  const selectStyle = {
    backgroundImage: SELECT_ARROW,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 8px center',
  };

  const optionStyle = { background: '#1a1a1a', color: 'white' };

  return (
    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
      {/* Quick pick pills for "From" */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider mr-1">From</span>
        <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {popularFrom.map(code => (
            <button
              key={code}
              onClick={() => { setHasInteracted(true); setFromCode(code); }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium whitespace-nowrap transition-all ${
                fromCode === code ? 'text-white' : 'text-white/35 hover:text-white/55'
              }`}
              style={fromCode === code ? {
                background: accent.bg,
                border: `1px solid ${accent.border}`,
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion row */}
      <div className="flex items-center gap-2">
        {/* Amount input */}
        <input
          type="number"
          value={amount}
          onChange={e => { setHasInteracted(true); setAmount(e.target.value); }}
          className="w-[80px] bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />

        {/* From currency */}
        <select
          value={fromCode}
          onChange={e => { setHasInteracted(true); setFromCode(e.target.value); }}
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-7"
          style={selectStyle}
        >
          <optgroup label="Popular" style={optionStyle}>
            {POPULAR_CURRENCIES.map(code => {
              const c = CURRENCY_LIST.find(x => x.code === code);
              return <option key={code} value={code} style={optionStyle}>{c?.symbol} {code}</option>;
            })}
          </optgroup>
          <optgroup label="All" style={optionStyle}>
            {CURRENCY_LIST.filter(c => !POPULAR_CURRENCIES.includes(c.code)).map(c => (
              <option key={c.code} value={c.code} style={optionStyle}>{c.code} - {c.name}</option>
            ))}
          </optgroup>
        </select>

        {/* Swap */}
        <button
          onClick={handleSwap}
          className="p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* To currency */}
        <select
          value={toCode}
          onChange={e => { setHasInteracted(true); setToCode(e.target.value); }}
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-7"
          style={selectStyle}
        >
          <optgroup label="Popular" style={optionStyle}>
            {POPULAR_CURRENCIES.map(code => {
              const c = CURRENCY_LIST.find(x => x.code === code);
              return <option key={code} value={code} style={optionStyle}>{c?.symbol} {code}</option>;
            })}
          </optgroup>
          <optgroup label="All" style={optionStyle}>
            {CURRENCY_LIST.filter(c => !POPULAR_CURRENCIES.includes(c.code)).map(c => (
              <option key={c.code} value={c.code} style={optionStyle}>{c.code} - {c.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Quick pick pills for "To" */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider mr-1.5">To</span>
        <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {popularTo.map(code => (
            <button
              key={code}
              onClick={() => { setHasInteracted(true); setToCode(code); }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium whitespace-nowrap transition-all ${
                toCode === code ? 'text-white' : 'text-white/35 hover:text-white/55'
              }`}
              style={toCode === code ? {
                background: accent.bg,
                border: `1px solid ${accent.border}`,
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {(result || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3 pt-1"
        >
          <IconBadge icon={DollarSign} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className={`text-xl font-semibold tracking-tight ${isLoading ? 'text-white/50' : 'text-white'}`}>
              {isLoading ? `${formatCurrency(parseFloat(amount) || 0, fromCode)} = ...` : result?.display}
            </div>
            {result?.rate && !isLoading && (
              <div className="text-white/30 text-xs mt-1">
                1 {result.fromCurrency} = {result.rate.toFixed(4)} {result.toCurrency}
              </div>
            )}
            {result?.error && (
              <div className="text-red-400/60 text-xs mt-1">{result.error}</div>
            )}
          </div>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
          )}
        </motion.div>
      )}

      {result && !isLoading && result.toValue !== null && (
        <FooterHint text="Press Enter to copy result" />
      )}
    </div>
  );
}

const TZ_LIST = getTimezoneList();
const TZ_REGIONS = (() => {
  const grouped = new Map<string, TimezoneOption[]>();
  for (const tz of TZ_LIST) {
    const list = grouped.get(tz.region) || [];
    list.push(tz);
    grouped.set(tz.region, list);
  }
  return Array.from(grouped.entries());
})();

function TimezoneView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const tz = module.timezone;

  if (!module.focused) {
    if (!tz) return null;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={Globe} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className={`text-xl font-semibold tracking-tight ${tz.isPartial ? 'text-white/50' : 'text-white'}`}>
              {tz.display}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TimezoneInteractive tz={tz} accent={accent} onCopyValue={onCopyValue} />;
}

function TimezoneInteractive({ tz, accent, onCopyValue }: { tz?: TimezoneResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const now = new Date();
  const initH = now.getHours();
  const [hours, setHours] = useState(initH > 12 ? initH - 12 : initH === 0 ? 12 : initH);
  const [minutes, setMinutes] = useState(now.getMinutes());
  const [isPm, setIsPm] = useState(initH >= 12);
  const [fromIana, setFromIana] = useState('America/New_York');
  const [toIana, setToIana] = useState('Asia/Kolkata');
  const [result, setResult] = useState<TimezoneResult | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Compute result
  useEffect(() => {
    let h24 = hours;
    if (isPm && hours !== 12) h24 += 12;
    if (!isPm && hours === 12) h24 = 0;
    setResult(convertTimezoneDirect(h24, minutes, fromIana, toIana));
  }, [hours, minutes, isPm, fromIana, toIana]);

  // Sync from textbox
  useEffect(() => {
    if (hasInteracted || !tz || tz.isPartial) return;
    const fromEntry = TZ_LIST.find(t => t.label === tz.fromLabel);
    const toEntry = TZ_LIST.find(t => t.label === tz.toLabel);
    if (fromEntry) setFromIana(fromEntry.iana);
    if (toEntry) setToIana(toEntry.iana);
  }, [tz?.fromLabel, tz?.toLabel, hasInteracted]);

  const handleNow = () => {
    setHasInteracted(true);
    const n = new Date();
    const h = n.getHours();
    setIsPm(h >= 12);
    setHours(h > 12 ? h - 12 : h === 0 ? 12 : h);
    setMinutes(n.getMinutes());
  };

  const handleSwap = () => {
    setHasInteracted(true);
    setFromIana(toIana);
    setToIana(fromIana);
  };

  const handleHourChange = (val: string) => {
    setHasInteracted(true);
    const n = parseInt(val);
    if (!isNaN(n) && n >= 1 && n <= 12) setHours(n);
  };

  const handleMinuteChange = (val: string) => {
    setHasInteracted(true);
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= 59) setMinutes(n);
    else if (val === '') setMinutes(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && result && onCopyValue) {
      e.preventDefault();
      onCopyValue(result.display);
    }
  };

  const selectStyle = {
    backgroundImage: SELECT_ARROW,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 8px center',
  };
  const optionStyle = { background: '#1a1a1a', color: 'white' };

  return (
    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
      {/* Popular timezone pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {POPULAR_TIMEZONES.map(label => {
          const entry = TZ_LIST.find(t => t.label === label);
          if (!entry) return null;
          const isActive = toIana === entry.iana;
          return (
            <button
              key={label}
              onClick={() => { setHasInteracted(true); setToIana(entry.iana); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
              style={isActive ? {
                background: accent.bg,
                border: `1px solid ${accent.border}`,
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Time input row */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={hours}
          min={1} max={12}
          onChange={e => handleHourChange(e.target.value)}
          className="w-[44px] bg-white/[0.06] border border-white/10 rounded-lg px-1.5 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-white/30 font-mono text-sm">:</span>
        <input
          type="text"
          value={String(minutes).padStart(2, '0')}
          onChange={e => handleMinuteChange(e.target.value)}
          maxLength={2}
          className="w-[44px] bg-white/[0.06] border border-white/10 rounded-lg px-1.5 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-white/25 transition-colors"
        />
        {/* AM/PM toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
          <button
            onClick={() => { setHasInteracted(true); setIsPm(false); }}
            className={`px-2 py-2 text-[11px] font-medium transition-colors ${!isPm ? 'text-white' : 'text-white/30'}`}
            style={!isPm ? { background: accent.bg } : { background: 'rgba(255,255,255,0.03)' }}
          >AM</button>
          <button
            onClick={() => { setHasInteracted(true); setIsPm(true); }}
            className={`px-2 py-2 text-[11px] font-medium transition-colors ${isPm ? 'text-white' : 'text-white/30'}`}
            style={isPm ? { background: accent.bg } : { background: 'rgba(255,255,255,0.03)' }}
          >PM</button>
        </div>
        {/* Now button */}
        <button
          onClick={handleNow}
          className="px-2.5 py-2 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* From / To timezone row */}
      <div className="flex items-center gap-2">
        <select
          value={fromIana}
          onChange={e => { setHasInteracted(true); setFromIana(e.target.value); }}
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-7"
          style={selectStyle}
        >
          {TZ_REGIONS.map(([region, zones]) => (
            <optgroup key={region} label={region} style={optionStyle}>
              {zones.map(z => (
                <option key={z.label} value={z.iana} style={optionStyle}>{z.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          onClick={handleSwap}
          className="p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        <select
          value={toIana}
          onChange={e => { setHasInteracted(true); setToIana(e.target.value); }}
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-7"
          style={selectStyle}
        >
          {TZ_REGIONS.map(([region, zones]) => (
            <optgroup key={region} label={region} style={optionStyle}>
              {zones.map(z => (
                <option key={z.label} value={z.iana} style={optionStyle}>{z.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3 pt-1"
        >
          <IconBadge icon={Globe} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold tracking-tight text-white">
              {result.display}
            </div>
          </div>
        </motion.div>
      )}

      {result && <FooterHint text="Press Enter to copy result" />}
    </div>
  );
}

function ColorView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const color = module.color;

  if (!module.focused) {
    if (!color) return null;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-white/20 flex-shrink-0" style={{ background: color.cssColor }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold text-lg font-mono">{color.hex}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-white/40 text-xs font-mono">rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})</span>
              <span className="text-white/40 text-xs font-mono">hsl({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)</span>
            </div>
          </div>
        </div>
        <FooterHint text="Press Enter to copy HEX value" />
      </div>
    );
  }

  return <ColorInteractive color={color} accent={accent} onCopyValue={onCopyValue} />;
}

function ColorInteractive({ color, accent, onCopyValue }: { color?: ColorResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const [r, setR] = useState(255);
  const [g, setG] = useState(87);
  const [b, setB] = useState(51);
  const [hexInput, setHexInput] = useState('#FF5733');
  const [hasInteracted, setHasInteracted] = useState(false);
  const hexSourceRef = useRef<'hex' | 'rgb'>('rgb');

  // Derived values
  const hex = rgbToHex(r, g, b).toUpperCase();
  const hsl = rgbToHsl(r, g, b);
  const cssColor = rgbToHex(r, g, b);

  // Sync hexInput from RGB (when changed from non-hex source)
  useEffect(() => {
    if (hexSourceRef.current === 'rgb') {
      setHexInput(hex);
    }
  }, [hex]);

  // Sync from textbox detection
  useEffect(() => {
    if (hasInteracted || !color) return;
    hexSourceRef.current = 'rgb';
    setR(color.rgb.r);
    setG(color.rgb.g);
    setB(color.rgb.b);
  }, [color?.hex, hasInteracted]);

  const handleRgb = (which: 'r' | 'g' | 'b', val: string) => {
    setHasInteracted(true);
    hexSourceRef.current = 'rgb';
    const n = parseInt(val);
    if (isNaN(n)) return;
    const clamped = Math.max(0, Math.min(255, n));
    if (which === 'r') setR(clamped);
    else if (which === 'g') setG(clamped);
    else setB(clamped);
  };

  const handleHexChange = (val: string) => {
    setHasInteracted(true);
    hexSourceRef.current = 'hex';
    setHexInput(val);
    const parsed = hexToRgb(val);
    if (parsed) {
      setR(parsed.r);
      setG(parsed.g);
      setB(parsed.b);
    }
  };

  const handlePickerChange = (val: string) => {
    setHasInteracted(true);
    hexSourceRef.current = 'rgb';
    const parsed = hexToRgb(val);
    if (parsed) {
      setR(parsed.r);
      setG(parsed.g);
      setB(parsed.b);
    }
  };

  const handlePreset = (presetHex: string) => {
    setHasInteracted(true);
    hexSourceRef.current = 'rgb';
    const parsed = hexToRgb(presetHex);
    if (parsed) {
      setR(parsed.r);
      setG(parsed.g);
      setB(parsed.b);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onCopyValue) {
      e.preventDefault();
      onCopyValue(hex);
    }
  };

  return (
    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
      {/* Preset color swatches */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {COLOR_PRESETS.map(p => (
          <button
            key={p.name}
            onClick={() => handlePreset(p.hex)}
            className="w-6 h-6 rounded-lg flex-shrink-0 border transition-all hover:scale-110"
            style={{
              background: p.hex,
              borderColor: hex === p.hex.toUpperCase() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
              boxShadow: hex === p.hex.toUpperCase() ? `0 0 8px ${p.hex}40` : 'none',
            }}
            title={p.name}
          />
        ))}
      </div>

      {/* Picker + HEX input row */}
      <div className="flex items-center gap-2.5">
        {/* Native color picker */}
        <div className="relative flex-shrink-0">
          <input
            type="color"
            value={cssColor}
            onChange={e => handlePickerChange(e.target.value)}
            className="w-10 h-10 rounded-xl border border-white/20 cursor-pointer p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
        </div>

        {/* HEX input */}
        <input
          type="text"
          value={hexInput}
          onChange={e => handleHexChange(e.target.value)}
          maxLength={9}
          className="w-[100px] bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm font-mono focus:outline-none focus:border-white/25 transition-colors"
          placeholder="#000000"
        />

        {/* Large swatch preview */}
        <div
          className="flex-1 h-10 rounded-xl border border-white/15"
          style={{ background: cssColor, boxShadow: `0 0 20px ${cssColor}30` }}
        />
      </div>

      {/* RGB inputs */}
      <div className="flex items-center gap-2">
        {(['r', 'g', 'b'] as const).map(ch => (
          <div key={ch} className="flex items-center gap-1.5 flex-1">
            <span className="text-[11px] font-mono font-medium text-white/30 uppercase w-3">{ch}</span>
            <input
              type="number"
              min={0} max={255}
              value={ch === 'r' ? r : ch === 'g' ? g : b}
              onChange={e => handleRgb(ch, e.target.value)}
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
        {/* HSL display */}
        <div className="flex-shrink-0 text-[10px] text-white/25 font-mono">
          hsl({hsl.h},{hsl.s}%,{hsl.l}%)
        </div>
      </div>

      {/* All formats display */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3 pt-1"
      >
        <div
          className="w-10 h-10 rounded-xl border border-white/20 flex-shrink-0"
          style={{ background: cssColor }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold text-lg font-mono">{hex}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            <span className="text-white/40 text-xs font-mono">rgb({r}, {g}, {b})</span>
            <span className="text-white/40 text-xs font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
          </div>
        </div>
      </motion.div>

      <FooterHint text="Press Enter to copy HEX value" />
    </div>
  );
}

function DateView({ module, accent }: { module: ModuleData; accent: AccentTheme }) {
  const date = module.date;
  if (!date && module.focused) {
    return <HintView icon={Calendar} accent={accent} text={MODULE_META.date.placeholder} />;
  }
  if (!date) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <IconBadge icon={Calendar} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className={`text-xl font-semibold tracking-tight ${date.isPartial ? 'text-white/50' : 'text-white'}`}>
            {date.display}
          </div>
          {date.subtitle && (
            <div className="text-white/30 text-xs mt-1">{date.subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimerView({ module, accent, onStart, onToggle, onReset }: {
  module: ModuleData; accent: AccentTheme;
  onStart?: () => void; onToggle?: () => void; onReset?: () => void;
}) {
  const timer = module.timer;
  if (!timer && module.focused) {
    return <HintView icon={Timer} accent={accent} text={MODULE_META.timer.placeholder} />;
  }
  if (!timer) return null;

  const progressPercent = timer.progress * 100;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={Timer} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/30 text-xs mb-1">{timer.label} timer</div>
          <div className={`text-3xl font-mono font-bold tracking-tight ${timer.isComplete ? accent.text : 'text-white'}`}>
            {timer.display}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/10 mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent.solid }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!timer.isRunning && !timer.isComplete && timer.remainingSeconds === timer.totalSeconds && (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 transition-colors"
            style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
          >
            <Play className="w-3 h-3" /> Start
          </button>
        )}
        {(timer.isRunning || (timer.remainingSeconds < timer.totalSeconds && !timer.isComplete)) && (
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 transition-colors"
            style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
          >
            {timer.isRunning ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Resume</>}
          </button>
        )}
        {(timer.remainingSeconds < timer.totalSeconds || timer.isComplete) && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white/80 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
        {timer.isComplete && (
          <span className={`ml-auto text-sm font-medium ${accent.text}`}>Complete!</span>
        )}
      </div>

      {!timer.isRunning && !timer.isComplete && timer.remainingSeconds === timer.totalSeconds && (
        <div className="mt-2">
          <span className="text-[10px] text-white/20">Press Start or Enter to begin</span>
        </div>
      )}
    </div>
  );
}

// ─── Shared UI Helpers ─────────────────────────────────────────

function IconBadge({ icon: Icon, accent }: { icon: React.ComponentType<{ className?: string }>; accent: AccentTheme }) {
  return (
    <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
      <Icon className={`w-5 h-5 ${accent.text}`} />
    </div>
  );
}

function HintView({ icon: Icon, accent, text }: { icon: React.ComponentType<{ className?: string }>; accent: AccentTheme; text: string }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <IconBadge icon={Icon} accent={accent} />
        <div className="text-white/30 text-sm">{text}</div>
      </div>
    </div>
  );
}

function FooterHint({ text }: { text: string }) {
  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <span className="text-[10px] text-white/20">{text}</span>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────

export function ContourPanel({
  state, isVisible, onCommandSelect, selectedIndex, persona = 'default',
  onTimerStart, onTimerToggle, onTimerReset, onCopyValue,
}: ContourPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const accent = personaAccent[persona] || personaAccent.default;

  useEffect(() => {
    if (selectedItemRef.current && scrollContainerRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  let flatIndex = 0;
  const getFlatIndex = () => flatIndex++;

  const isFocused = state.mode === 'module' && state.module?.focused;
  const moduleMeta = state.module ? MODULE_META[state.module.id] : null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-full left-0 right-0 mb-3 z-50"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 10, 0.85)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: `1px solid ${accent.border}`,
              boxShadow: `${accent.glow}, 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
            }}
          >
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div className="flex items-center gap-2">
                {isFocused && moduleMeta && (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ background: accent.solid, boxShadow: `0 0 6px ${accent.border}` }} />
                    <span className="text-[11px] font-medium tracking-wider uppercase text-white/40">
                      Contour
                    </span>
                    <span className="text-white/15 text-[11px]">/</span>
                    <span className={`text-[11px] font-medium ${accent.text}`}>
                      {moduleMeta.label}
                    </span>
                  </>
                )}
                {!isFocused && (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ background: accent.border.replace('0.25', '0.8'), boxShadow: `0 0 6px ${accent.border}` }} />
                    <span className="text-[11px] font-medium tracking-wider uppercase text-white/40">
                      TimeMachine Contour
                    </span>
                  </>
                )}
              </div>
              {state.mode === 'commands' && (
                <span className="text-[10px] text-white/20 font-mono">
                  {state.commands.length} command{state.commands.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Content */}
            <div
              ref={scrollContainerRef}
              className="max-h-[320px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {/* Module views */}
              {state.mode === 'module' && state.module && (
                <>
                  {state.module.id === 'calculator' && <CalculatorView module={state.module} accent={accent} />}
                  {state.module.id === 'units' && <UnitsView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'currency' && <CurrencyView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'timezone' && <TimezoneView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'color' && <ColorView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'date' && <DateView module={state.module} accent={accent} />}
                  {state.module.id === 'timer' && (
                    <TimerView module={state.module} accent={accent}
                      onStart={onTimerStart} onToggle={onTimerToggle} onReset={onTimerReset}
                    />
                  )}
                </>
              )}

              {/* Commands Mode */}
              {state.mode === 'commands' && (
                <div className="py-1.5">
                  {state.commands.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/30 text-sm">No commands found</p>
                      <p className="text-white/15 text-xs mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    groupByCategory(state.commands).map(({ category, commands }) => (
                      <div key={category}>
                        <div className="px-4 py-1.5">
                          <span className="text-[10px] font-medium tracking-wider uppercase text-white/25">
                            {CATEGORY_INFO[category]?.label || category}
                          </span>
                        </div>
                        {commands.map((cmd) => {
                          const idx = getFlatIndex();
                          const isSelected = idx === selectedIndex;
                          const IconComponent = getIcon(cmd.icon);

                          return (
                            <button
                              key={cmd.id}
                              ref={isSelected ? selectedItemRef : null}
                              onClick={() => onCommandSelect(cmd)}
                              className="w-full px-3 py-0.5 flex items-center text-left transition-colors duration-100"
                            >
                              <div
                                className="flex items-center gap-3 w-full px-2 py-2 rounded-xl transition-colors duration-100"
                                style={{
                                  background: isSelected ? accent.bg : 'transparent',
                                  border: isSelected ? `1px solid ${accent.border}` : '1px solid transparent',
                                }}
                              >
                                <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: isSelected ? accent.border.replace('0.25', '0.15') : 'rgba(255, 255, 255, 0.04)' }}>
                                  <IconComponent className={`w-4 h-4 ${isSelected ? accent.text : 'text-white/40'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>{cmd.name}</div>
                                  <div className={`text-xs truncate ${isSelected ? 'text-white/40' : 'text-white/20'}`}>{cmd.description}</div>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0 text-[10px] text-white/20 font-mono">↵</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.mode === 'commands' && state.commands.length > 0 && (
              <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">↑↓</kbd> navigate
                  </span>
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">↵</kbd> open
                  </span>
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">esc</kbd> dismiss
                  </span>
                </div>
              </div>
            )}
            {isFocused && (
              <div className="px-4 py-2 flex items-center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span className="text-[10px] text-white/20 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">esc</kbd> back
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
