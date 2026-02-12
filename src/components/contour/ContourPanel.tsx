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
  Dices, Coins, RefreshCw,
  BookOpen, Mic, AlignLeft, List, MessageSquare,
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
import {
  DATE_OPERATIONS, DATE_QUICK_PICKS, computeDateDirect, parseDate,
  DateResult, DateOperation,
} from './modules/dateCalculator';
import { TimerState } from './modules/timer';
import {
  RandomResult, regenerate as regenerateRandom, QUICK_ACTIONS,
} from './modules/randomGenerator';
import {
  WordCountResult, getStatItems,
} from './modules/wordCounter';
import {
  TranslationResult, resolveTranslation, translateDirect,
  getLanguageList, POPULAR_LANGUAGES, getLanguageName,
} from './modules/translator';
import {
  DictionaryResult, resolveDictionary, lookupWord,
} from './modules/dictionary';
import { LoremResult, generateLorem } from './modules/loremIpsum';
import { JsonFormatResult, formatJson } from './modules/jsonFormatter';
import { Base64Result, processBase64 } from './modules/base64Codec';
import { UrlEncodeResult, processUrl } from './modules/urlEncoder';
import { HashResult, resolveHash, createHashResult } from './modules/hashGenerator';
import { RegexResult, testRegex, REGEX_FLAGS, REGEX_PRESETS } from './modules/regexTester';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calculator, ArrowLeftRight, DollarSign, Globe, Palette,
  Timer, Calendar, Shuffle, Type, Braces, Lock, Link, Hash,
  FileSearch, FileText, Settings, History, Image, Brain,
  HelpCircle, Code, Music, HeartPulse, Fingerprint, Clock,
  Search, Wrench, Monitor, Zap, Command,
  Dices, Coins, RefreshCw,
  BookOpen, Mic, AlignLeft, List, MessageSquare,
  // Aliases for icons not in lucide-react 0.344.0
  Languages: Globe,
  LetterText: Type,
  RemoveFormatting: Hash,
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
  onSetTimerDuration?: (seconds: number) => void;
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
  random: { icon: Shuffle, label: 'Random Generator', placeholder: 'e.g., uuid, password 16, roll 2d6, flip coin, random 1-100' },
  wordcount: { icon: Type, label: 'Word Counter', placeholder: 'Type or paste text to count words, characters, sentences...' },
  translator: { icon: Globe, label: 'Translator', placeholder: 'e.g., food in bangla, hello in spanish, translate thanks to french' },
  dictionary: { icon: BookOpen, label: 'Dictionary', placeholder: 'e.g., perplexed meaning, define serendipity, what is ephemeral' },
  lorem: { icon: FileText, label: 'Lorem Ipsum', placeholder: 'e.g., lorem 3p, lorem 5s, lorem 50w' },
  'json-format': { icon: Braces, label: 'JSON Formatter', placeholder: 'Paste JSON to format or validate...' },
  base64: { icon: Lock, label: 'Base64', placeholder: 'Type text to encode, or paste Base64 to decode' },
  'url-encode': { icon: Link, label: 'URL Encoder', placeholder: 'Type text to encode, or paste encoded URL to decode' },
  hash: { icon: Hash, label: 'Hash Generator', placeholder: 'Type text to generate MD5, SHA-1, SHA-256 hashes' },
  regex: { icon: FileSearch, label: 'Regex Tester', placeholder: 'Type a regex pattern to test...' },
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

function DateView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const date = module.date;

  if (!module.focused) {
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
        {!date.isPartial && <FooterHint text="Press Enter to copy result" />}
      </div>
    );
  }

  return <DateInteractive date={date} accent={accent} onCopyValue={onCopyValue} />;
}

function DateInteractive({ date, accent, onCopyValue }: { date?: DateResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const [operation, setOperation] = useState<DateOperation>('until');
  const [dateInput1, setDateInput1] = useState('');
  const [dateInput2, setDateInput2] = useState('');
  const [numDays, setNumDays] = useState('30');
  const [result, setResult] = useState<DateResult | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Compute result whenever inputs change
  useEffect(() => {
    if (operation === 'until' || operation === 'since') {
      const parsed = dateInput1 ? parseDate(dateInput1) : null;
      if (!parsed) { setResult(null); return; }
      setResult(computeDateDirect(operation, parsed));
    } else if (operation === 'from_now' || operation === 'ago') {
      const n = parseInt(numDays);
      if (isNaN(n) || numDays === '') { setResult(null); return; }
      setResult(computeDateDirect(operation, null, null, n));
    } else if (operation === 'between') {
      const d1 = dateInput1 ? parseDate(dateInput1) : null;
      const d2 = dateInput2 ? parseDate(dateInput2) : null;
      if (!d1 || !d2) { setResult(null); return; }
      setResult(computeDateDirect(operation, d1, d2));
    }
  }, [operation, dateInput1, dateInput2, numDays]);

  // Sync from textbox detection
  useEffect(() => {
    if (hasInteracted || !date || date.isPartial) return;
    setOperation(date.type);
  }, [date?.type, date?.isPartial, hasInteracted]);

  const handleQuickPick = (value: string) => {
    setHasInteracted(true);
    setDateInput1(value);
    if (operation !== 'until' && operation !== 'since') {
      setOperation('until');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && result && onCopyValue) {
      e.preventDefault();
      onCopyValue(result.display);
    }
  };

  const needsDateInput = operation === 'until' || operation === 'since';
  const needsNumInput = operation === 'from_now' || operation === 'ago';
  const needsTwoDates = operation === 'between';

  return (
    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
      {/* Operation pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {DATE_OPERATIONS.map(op => (
          <button
            key={op.id}
            onClick={() => { setHasInteracted(true); setOperation(op.id); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              operation === op.id ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
            style={operation === op.id ? {
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              boxShadow: `0 0 8px ${accent.border.replace('0.25', '0.08')}`,
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Quick picks (for until/since) */}
      {needsDateInput && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider mr-1">Quick</span>
          <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {DATE_QUICK_PICKS.map(qp => (
              <button
                key={qp.value}
                onClick={() => handleQuickPick(qp.value)}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all text-white/35 hover:text-white/55"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {qp.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2">
        {needsDateInput && (
          <input
            type="text"
            value={dateInput1}
            onChange={e => { setHasInteracted(true); setDateInput1(e.target.value); }}
            className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors"
            placeholder="e.g. Dec 25, March 15 2026"
          />
        )}
        {needsNumInput && (
          <>
            <input
              type="number"
              value={numDays}
              onChange={e => { setHasInteracted(true); setNumDays(e.target.value); }}
              className="w-[80px] bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="30"
            />
            <span className="text-white/30 text-sm">days {operation === 'from_now' ? 'from now' : 'ago'}</span>
          </>
        )}
        {needsTwoDates && (
          <>
            <input
              type="text"
              value={dateInput1}
              onChange={e => { setHasInteracted(true); setDateInput1(e.target.value); }}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors"
              placeholder="Start date"
            />
            <span className="text-white/25 text-xs">to</span>
            <input
              type="text"
              value={dateInput2}
              onChange={e => { setHasInteracted(true); setDateInput2(e.target.value); }}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-white/25 transition-colors"
              placeholder="End date"
            />
          </>
        )}
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3 pt-1"
        >
          <IconBadge icon={Calendar} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold tracking-tight text-white">
              {result.display}
            </div>
            {result.subtitle && (
              <div className="text-white/30 text-xs mt-1">{result.subtitle}</div>
            )}
          </div>
        </motion.div>
      )}

      {result && <FooterHint text="Press Enter to copy result" />}
    </div>
  );
}

const TIMER_PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
];

function TimerView({ module, accent, onStart, onToggle, onReset, onSetDuration }: {
  module: ModuleData; accent: AccentTheme;
  onStart?: () => void; onToggle?: () => void; onReset?: () => void;
  onSetDuration?: (seconds: number) => void;
}) {
  const timer = module.timer;

  if (!module.focused) {
    // Non-focused: unchanged simple display
    if (!timer) return null;
    return <TimerDisplay timer={timer} accent={accent} onStart={onStart} onToggle={onToggle} onReset={onReset} />;
  }

  // Focused mode: interactive UI
  return (
    <TimerInteractive
      timer={timer}
      accent={accent}
      onStart={onStart}
      onToggle={onToggle}
      onReset={onReset}
      onSetDuration={onSetDuration}
    />
  );
}

function TimerDisplay({ timer, accent, onStart, onToggle, onReset }: {
  timer: TimerState; accent: AccentTheme;
  onStart?: () => void; onToggle?: () => void; onReset?: () => void;
}) {
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

      <div className="h-1 rounded-full bg-white/10 mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent.solid }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

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

function TimerInteractive({ timer, accent, onStart, onToggle, onReset, onSetDuration }: {
  timer?: TimerState; accent: AccentTheme;
  onStart?: () => void; onToggle?: () => void; onReset?: () => void;
  onSetDuration?: (seconds: number) => void;
}) {
  const [customH, setCustomH] = useState('0');
  const [customM, setCustomM] = useState('5');
  const [customS, setCustomS] = useState('0');

  const handlePreset = (seconds: number) => {
    onSetDuration?.(seconds);
  };

  const handleCustomSet = () => {
    const h = parseInt(customH) || 0;
    const m = parseInt(customM) || 0;
    const s = parseInt(customS) || 0;
    const total = h * 3600 + m * 60 + s;
    if (total > 0) onSetDuration?.(total);
  };

  // If a timer is set, show the timer display with controls
  if (timer) {
    const progressPercent = timer.progress * 100;
    return (
      <div className="p-4 space-y-3">
        {/* Timer display */}
        <div className="flex items-center gap-3">
          <IconBadge icon={Timer} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className="text-white/30 text-xs mb-1">{timer.label} timer</div>
            <div className={`text-3xl font-mono font-bold tracking-tight ${timer.isComplete ? accent.text : 'text-white'}`}>
              {timer.display}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
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

        {/* Preset pills to quickly change duration (only when not running) */}
        {!timer.isRunning && !timer.isComplete && timer.remainingSeconds === timer.totalSeconds && (
          <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pt-1">
            {TIMER_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.seconds)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  timer.totalSeconds === p.seconds ? 'text-white' : 'text-white/40 hover:text-white/60'
                }`}
                style={timer.totalSeconds === p.seconds ? {
                  background: accent.bg,
                  border: `1px solid ${accent.border}`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {!timer.isRunning && !timer.isComplete && timer.remainingSeconds === timer.totalSeconds && (
          <FooterHint text="Press Enter to start timer" />
        )}
      </div>
    );
  }

  // No timer set yet: show preset picker + custom input
  return (
    <div className="p-4 space-y-3">
      {/* Preset pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
        {TIMER_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.seconds)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all text-white/40 hover:text-white/60"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom H:M:S input */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider mr-1">Custom</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0} max={23}
            value={customH}
            onChange={e => setCustomH(e.target.value)}
            className="w-[40px] bg-white/[0.06] border border-white/10 rounded-lg px-1.5 py-1.5 text-white text-xs font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/20 text-[10px]">h</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0} max={59}
            value={customM}
            onChange={e => setCustomM(e.target.value)}
            className="w-[40px] bg-white/[0.06] border border-white/10 rounded-lg px-1.5 py-1.5 text-white text-xs font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/20 text-[10px]">m</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0} max={59}
            value={customS}
            onChange={e => setCustomS(e.target.value)}
            className="w-[40px] bg-white/[0.06] border border-white/10 rounded-lg px-1.5 py-1.5 text-white text-xs font-mono text-center focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/20 text-[10px]">s</span>
        </div>
        <button
          onClick={handleCustomSet}
          className="ml-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/70 hover:text-white transition-colors"
          style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
        >
          Set
        </button>
      </div>

      <FooterHint text="Pick a preset or set custom duration" />
    </div>
  );
}

// ─── Random Generator View ─────────────────────────────────────

function RandomView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const random = module.random;
  const [current, setCurrent] = useState<RandomResult | null>(random || null);
  const [copied, setCopied] = useState(false);

  // Sync from textbox detection
  useEffect(() => {
    if (random) setCurrent(random);
  }, [random]);

  const handleRegenerate = () => {
    if (current) {
      setCurrent(regenerateRandom(current));
      setCopied(false);
    }
  };

  const handleCopy = () => {
    if (current) {
      onCopyValue?.(current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Focused mode with no input: show quick actions
  if (!current && module.focused) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <IconBadge icon={Shuffle} accent={accent} />
          <div className="text-white/30 text-sm">{MODULE_META.random.placeholder}</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map(action => {
            const ActionIcon = ICON_MAP[action.icon] || Shuffle;
            return (
              <button
                key={action.id}
                onClick={() => { setCurrent(action.generate()); setCopied(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/10"
              >
                <ActionIcon className={`w-4 h-4 ${accent.text}`} />
                <span className="text-xs text-white/50">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!current) return null;

  // Color swatch for hex type
  const isHex = current.type === 'hex';

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <IconBadge icon={Shuffle} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-xs font-mono mb-1">{current.label}</div>
          <div className="flex items-center gap-2">
            {isHex && (
              <div className="w-6 h-6 rounded-md flex-shrink-0 border border-white/10" style={{ background: current.value }} />
            )}
            <div className={`text-xl font-semibold tracking-tight text-white ${current.type === 'password' ? 'font-mono text-base break-all' : ''}`}>
              {current.value}
            </div>
          </div>
          {current.detail && (
            <div className="text-white/25 text-xs mt-1 font-mono">{current.detail}</div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <span className="text-[10px] text-white/20">Press Enter to copy</span>
      </div>
    </div>
  );
}

// ─── Word Counter View ─────────────────────────────────────────

function WordCountView({ module, accent }: { module: ModuleData; accent: AccentTheme }) {
  const wc = module.wordcount;

  if (!wc && module.focused) {
    return <HintView icon={Type} accent={accent} text={MODULE_META.wordcount.placeholder} />;
  }
  if (!wc) return null;

  const stats = getStatItems(wc);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={Type} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium">
            {wc.words.toLocaleString()} {wc.words === 1 ? 'word' : 'words'}
          </div>
          <div className="text-white/30 text-xs">
            {wc.characters.toLocaleString()} characters
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map(stat => {
          const StatIcon = ICON_MAP[stat.icon] || Type;
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 p-2 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            >
              <StatIcon className={`w-3.5 h-3.5 ${accent.text}`} />
              <span className="text-white text-xs font-semibold">{stat.value}</span>
              <span className="text-white/25 text-[9px]">{stat.label}</span>
            </div>
          );
        })}
      </div>

      <FooterHint text={module.focused ? 'Type or paste text above' : 'Use /word-count to analyze text'} />
    </div>
  );
}

// ─── Translator View ───────────────────────────────────────────

const ALL_LANGUAGES = getLanguageList();

function TranslatorView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const trans = module.translator;

  if (!module.focused) {
    // Auto-detect mode: simple display
    if (!trans) return null;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={Globe} accent={accent} />
          <div className="flex-1 min-w-0">
            <div className="text-white/40 text-xs mb-1">
              {trans.sourceLang !== 'Auto' ? trans.sourceLang : 'English'} → {trans.targetLang}
            </div>
            {trans.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="text-white/50 text-lg">Translating...</div>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : trans.error ? (
              <div className="text-red-400/60 text-sm">{trans.error}</div>
            ) : (
              <div className="text-xl font-semibold tracking-tight text-white">
                {trans.translatedText}
              </div>
            )}
            <div className="text-white/25 text-xs mt-1">&ldquo;{trans.sourceText}&rdquo;</div>
          </div>
        </div>
        {!trans.isLoading && trans.translatedText && (
          <FooterHint text="Press Enter to copy translation" />
        )}
      </div>
    );
  }

  // Focused mode: interactive UI
  return <TranslatorInteractive trans={trans} accent={accent} onCopyValue={onCopyValue} />;
}

function TranslatorInteractive({ trans, accent, onCopyValue }: { trans?: TranslationResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const [fromCode, setFromCode] = useState('en');
  const [toCode, setToCode] = useState('bn');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const genRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from auto-detect (only until user interacts)
  useEffect(() => {
    if (hasInteracted || !trans || trans.isPartial) return;
    if (trans.translatedText) {
      setResult(trans);
      setInputText(trans.sourceText);
      if (trans.sourceLangCode !== 'auto') setFromCode(trans.sourceLangCode);
      setToCode(trans.targetLangCode);
    }
  }, [trans, hasInteracted]);

  // Debounced translation when inputs change
  useEffect(() => {
    if (!hasInteracted) return;
    if (!inputText.trim()) { setResult(null); setIsLoading(false); return; }

    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const gen = ++genRef.current;
      const req = translateDirect(inputText.trim(), fromCode, toCode);
      resolveTranslation(req).then(resolved => {
        if (genRef.current !== gen) return;
        setResult(resolved);
        setIsLoading(false);
      });
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputText, fromCode, toCode, hasInteracted]);

  const handleSwap = () => {
    setHasInteracted(true);
    const tmp = fromCode;
    setFromCode(toCode);
    setToCode(tmp);
    if (result?.translatedText) {
      setInputText(result.translatedText);
    }
  };

  const handleCopy = () => {
    if (result?.translatedText) {
      onCopyValue?.(result.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const selectStyle = {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundImage: SELECT_ARROW,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '10px',
  };

  return (
    <div className="p-4">
      {/* Language selectors */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={fromCode}
          onChange={e => { setHasInteracted(true); setFromCode(e.target.value); }}
          className="flex-1 rounded-lg px-3 py-2 text-white text-xs appearance-none focus:outline-none focus:border-white/25 transition-colors pr-6"
          style={selectStyle}
        >
          {POPULAR_LANGUAGES.map(code => (
            <option key={code} value={code}>{getLanguageName(code)}</option>
          ))}
          <option disabled>───</option>
          {ALL_LANGUAGES.filter(l => !POPULAR_LANGUAGES.includes(l.code)).map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>

        <button
          onClick={handleSwap}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors flex-shrink-0"
          title="Swap languages"
        >
          <ArrowLeftRight className={`w-4 h-4 ${accent.text}`} />
        </button>

        <select
          value={toCode}
          onChange={e => { setHasInteracted(true); setToCode(e.target.value); }}
          className="flex-1 rounded-lg px-3 py-2 text-white text-xs appearance-none focus:outline-none focus:border-white/25 transition-colors pr-6"
          style={selectStyle}
        >
          {POPULAR_LANGUAGES.map(code => (
            <option key={code} value={code}>{getLanguageName(code)}</option>
          ))}
          <option disabled>───</option>
          {ALL_LANGUAGES.filter(l => !POPULAR_LANGUAGES.includes(l.code)).map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
        placeholder="Type text to translate..."
        className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors mb-3"
      />

      {/* Result */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-white/40 text-sm">Translating...</span>
        </div>
      ) : result?.translatedText ? (
        <div className="py-2">
          <div className="text-lg font-semibold text-white">{result.translatedText}</div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      ) : result?.error ? (
        <div className="text-red-400/60 text-sm py-2">{result.error}</div>
      ) : !inputText.trim() ? (
        <div className="text-white/20 text-xs py-2">Type text above to translate</div>
      ) : null}

      <FooterHint text="Type or paste text, pick languages, get instant translation" />
    </div>
  );
}

// ─── Dictionary View ───────────────────────────────────────────

function DictionaryView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const dict = module.dictionary;

  if (!module.focused) {
    // Auto-detect mode: simple display
    if (!dict) return null;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={BookOpen} accent={accent} />
          <div className="flex-1 min-w-0">
            {dict.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="text-white/50 text-lg">Looking up &ldquo;{dict.word}&rdquo;...</div>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : dict.error ? (
              <div className="text-red-400/60 text-sm">{dict.error}</div>
            ) : (
              <>
                <DictHeader dict={dict} accent={accent} />
                <DictMeanings dict={dict} accent={accent} compact />
              </>
            )}
          </div>
        </div>
        {!dict.isLoading && dict.meanings.length > 0 && (
          <FooterHint text="Press Enter to copy definition" />
        )}
      </div>
    );
  }

  // Focused mode: interactive lookup
  return <DictionaryInteractive dict={dict} accent={accent} onCopyValue={onCopyValue} />;
}

function DictHeader({ dict, accent }: { dict: DictionaryResult; accent: AccentTheme }) {
  const handlePlayAudio = () => {
    if (dict.phoneticAudio) {
      const audio = new Audio(dict.phoneticAudio);
      audio.play().catch(() => {});
    }
  };

  return (
    <div className="flex items-baseline gap-2 mb-1">
      <span className="text-white text-lg font-semibold capitalize">{dict.word}</span>
      {dict.phonetic && (
        <span className="text-white/30 text-xs font-mono">{dict.phonetic}</span>
      )}
      {dict.phoneticAudio && (
        <button
          onClick={handlePlayAudio}
          className="p-0.5 hover:bg-white/10 rounded transition-colors"
          title="Play pronunciation"
        >
          <Play className={`w-3.5 h-3.5 ${accent.text}`} />
        </button>
      )}
    </div>
  );
}

function DictMeanings({ dict, accent, compact }: { dict: DictionaryResult; accent: AccentTheme; compact?: boolean }) {
  const maxMeanings = compact ? 2 : dict.meanings.length;
  const maxDefs = compact ? 1 : 3;

  return (
    <div className="space-y-2">
      {dict.meanings.slice(0, maxMeanings).map((meaning, i) => (
        <div key={i}>
          <span
            className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{ background: accent.bg, color: accent.solid }}
          >
            {meaning.partOfSpeech}
          </span>
          <div className="mt-1 space-y-1">
            {meaning.definitions.slice(0, maxDefs).map((def, j) => (
              <div key={j}>
                <div className="text-white/80 text-sm">{def.definition}</div>
                {def.example && !compact && (
                  <div className="text-white/30 text-xs italic ml-3 mt-0.5">&ldquo;{def.example}&rdquo;</div>
                )}
              </div>
            ))}
          </div>
          {!compact && meaning.synonyms.length > 0 && (
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              <span className="text-white/25 text-[10px]">Synonyms:</span>
              {meaning.synonyms.map((s, k) => (
                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">{s}</span>
              ))}
            </div>
          )}
          {!compact && meaning.antonyms.length > 0 && (
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              <span className="text-white/25 text-[10px]">Antonyms:</span>
              {meaning.antonyms.map((s, k) => (
                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">{s}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DictionaryInteractive({ dict, accent, onCopyValue }: { dict?: DictionaryResult; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const [inputWord, setInputWord] = useState('');
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const genRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from auto-detect
  useEffect(() => {
    if (hasInteracted || !dict) return;
    if (!dict.isLoading && dict.meanings.length > 0) {
      setResult(dict);
      setInputWord(dict.word);
    }
  }, [dict, hasInteracted]);

  // Debounced lookup
  useEffect(() => {
    if (!hasInteracted) return;
    const word = inputWord.trim();
    if (!word || word.length < 2) { setResult(null); setIsLoading(false); return; }

    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const gen = ++genRef.current;
      const req = lookupWord(word);
      resolveDictionary(req).then(resolved => {
        if (genRef.current !== gen) return;
        setResult(resolved);
        setIsLoading(false);
      });
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputWord, hasInteracted]);

  const handleCopy = () => {
    if (result && result.meanings.length > 0) {
      const text = result.meanings.map(m =>
        `${m.partOfSpeech}: ${m.definitions.map(d => d.definition).join('; ')}`
      ).join('\n');
      onCopyValue?.(`${result.word} — ${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="p-4">
      {/* Word input */}
      <div className="flex items-center gap-2 mb-3">
        <IconBadge icon={BookOpen} accent={accent} />
        <input
          ref={inputRef}
          type="text"
          value={inputWord}
          onChange={e => { setHasInteracted(true); setInputWord(e.target.value); }}
          placeholder="Type a word to look up..."
          className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {/* Result */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-white/40 text-sm">Looking up...</span>
        </div>
      ) : result ? (
        result.error ? (
          <div className="text-red-400/60 text-sm py-2">{result.error}</div>
        ) : result.meanings.length > 0 ? (
          <div>
            <DictHeader dict={result} accent={accent} />
            <DictMeanings dict={result} accent={accent} />
            <div className="mt-3 pt-2 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy definition'}
              </button>
            </div>
          </div>
        ) : null
      ) : !inputWord.trim() ? (
        <div className="text-white/20 text-xs py-2">Type a word above to see its definition</div>
      ) : null}

      <FooterHint text="Type a word to see definitions, pronunciation, synonyms & antonyms" />
    </div>
  );
}

// ─── Lorem Ipsum View ──────────────────────────────────────────

const LOREM_PRESETS = [
  { label: '1 paragraph', type: 'paragraphs' as const, count: 1 },
  { label: '3 paragraphs', type: 'paragraphs' as const, count: 3 },
  { label: '5 paragraphs', type: 'paragraphs' as const, count: 5 },
  { label: '5 sentences', type: 'sentences' as const, count: 5 },
  { label: '10 sentences', type: 'sentences' as const, count: 10 },
  { label: '50 words', type: 'words' as const, count: 50 },
  { label: '100 words', type: 'words' as const, count: 100 },
];

function LoremView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const lorem = module.lorem;
  const [current, setCurrent] = useState<LoremResult | null>(lorem && !lorem.isPartial ? lorem : null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lorem && !lorem.isPartial) setCurrent(lorem);
  }, [lorem]);

  const handlePreset = (type: 'paragraphs' | 'sentences' | 'words', count: number) => {
    setCurrent(generateLorem(type, count));
    setCopied(false);
  };

  const handleCopy = () => {
    if (current) {
      onCopyValue?.(current.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!current && module.focused) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <IconBadge icon={FileText} accent={accent} />
          <div className="text-white/30 text-sm">{MODULE_META.lorem.placeholder}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LOREM_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.type, p.count)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={FileText} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-xs mb-1">{current.wordCount} words, {current.paragraphCount} paragraph{current.paragraphCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div className="max-h-[140px] overflow-y-auto rounded-lg p-3 text-white/70 text-xs leading-relaxed font-mono [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {current.text.split('\n\n').map((p, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>{p}</p>
        ))}
      </div>
      {module.focused && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {LOREM_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.type, p.count)}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium text-white/35 hover:text-white/55 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <span className="text-[10px] text-white/20">Press Enter to copy</span>
      </div>
    </div>
  );
}

// ─── JSON Formatter View ───────────────────────────────────────

function JsonFormatView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const json = module.jsonFormat;
  const [showMinified, setShowMinified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<JsonFormatResult | null>(json && !json.isPartial ? json : null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted && json && !json.isPartial) setResult(json);
  }, [json, hasInteracted]);

  useEffect(() => {
    if (!hasInteracted || !inputText.trim()) { if (hasInteracted) setResult(null); return; }
    setResult(formatJson(inputText));
  }, [inputText, hasInteracted]);

  const handleCopy = () => {
    if (result && result.isValid) {
      onCopyValue?.(showMinified ? result.minified : result.formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!result && module.focused) {
    return <HintView icon={Braces} accent={accent} text={MODULE_META['json-format'].placeholder} />;
  }

  const displayResult = result || json;
  if (!displayResult || displayResult.isPartial) return null;

  const output = showMinified ? displayResult.minified : displayResult.formatted;

  return (
    <div className="p-4">
      {module.focused && (
        <textarea
          value={inputText}
          onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
          placeholder="Paste JSON here..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors mb-3 resize-none"
          rows={3}
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        <IconBadge icon={Braces} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${displayResult.isValid ? 'text-green-400/80' : 'text-red-400/80'}`}>
            {displayResult.isValid ? 'Valid JSON' : 'Invalid JSON'}
          </div>
          {displayResult.isValid && (
            <div className="text-white/30 text-xs">{displayResult.keyCount} keys, depth {displayResult.depth}</div>
          )}
          {displayResult.error && (
            <div className="text-red-400/60 text-xs">{displayResult.error}</div>
          )}
        </div>
      </div>
      {displayResult.isValid && (
        <>
          <div className="flex gap-1.5 mb-2">
            <button
              onClick={() => setShowMinified(false)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${!showMinified ? 'text-white' : 'text-white/35'}`}
              style={!showMinified ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              Formatted
            </button>
            <button
              onClick={() => setShowMinified(true)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${showMinified ? 'text-white' : 'text-white/35'}`}
              style={showMinified ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              Minified
            </button>
          </div>
          <div className="max-h-[140px] overflow-y-auto rounded-lg p-3 text-white/70 text-xs font-mono leading-relaxed [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 whitespace-pre-wrap break-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {output}
          </div>
        </>
      )}
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <span className="text-[10px] text-white/20">Press Enter to copy</span>
      </div>
    </div>
  );
}

// ─── Base64 View ───────────────────────────────────────────────

function Base64View({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const b64 = module.base64;
  const [mode, setMode] = useState<'encode' | 'decode'>(b64?.mode || 'encode');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<Base64Result | null>(b64 && !b64.isPartial ? b64 : null);
  const [copied, setCopied] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted && b64 && !b64.isPartial) {
      setResult(b64);
      setMode(b64.mode);
    }
  }, [b64, hasInteracted]);

  useEffect(() => {
    if (!hasInteracted || !inputText.trim()) { if (hasInteracted) setResult(null); return; }
    setResult(processBase64(inputText, mode));
  }, [inputText, mode, hasInteracted]);

  const output = result ? (mode === 'encode' ? result.encoded : result.decoded) : '';

  const handleCopy = () => {
    if (output) {
      onCopyValue?.(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!result && module.focused) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <IconBadge icon={Lock} accent={accent} />
          <div className="text-white/30 text-sm">{MODULE_META.base64.placeholder}</div>
        </div>
        <div className="flex gap-1.5 mb-3">
          <button onClick={() => { setHasInteracted(true); setMode('encode'); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'encode' ? 'text-white' : 'text-white/40'}`}
            style={mode === 'encode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >Encode</button>
          <button onClick={() => { setHasInteracted(true); setMode('decode'); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'decode' ? 'text-white' : 'text-white/40'}`}
            style={mode === 'decode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >Decode</button>
        </div>
        <input
          type="text"
          value={inputText}
          onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
          placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste Base64 to decode...'}
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      {module.focused && (
        <>
          <div className="flex gap-1.5 mb-3">
            <button onClick={() => { setHasInteracted(true); setMode('encode'); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'encode' ? 'text-white' : 'text-white/40'}`}
              style={mode === 'encode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >Encode</button>
            <button onClick={() => { setHasInteracted(true); setMode('decode'); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'decode' ? 'text-white' : 'text-white/40'}`}
              style={mode === 'decode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >Decode</button>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
            placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste Base64 to decode...'}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors mb-3"
          />
        </>
      )}
      <div className="flex items-center gap-3">
        <IconBadge icon={Lock} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-xs mb-1">{mode === 'encode' ? 'Encoded' : 'Decoded'}</div>
          <div className="text-sm font-mono text-white break-all">{output}</div>
          {result?.error && <div className="text-red-400/60 text-xs mt-1">{result.error}</div>}
        </div>
      </div>
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <span className="text-[10px] text-white/20">Press Enter to copy</span>
      </div>
    </div>
  );
}

// ─── URL Encoder View ──────────────────────────────────────────

function UrlEncodeView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const url = module.urlEncode;
  const [mode, setMode] = useState<'encode' | 'decode'>(url?.mode || 'encode');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<UrlEncodeResult | null>(url && !url.isPartial ? url : null);
  const [copied, setCopied] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted && url && !url.isPartial) {
      setResult(url);
      setMode(url.mode);
    }
  }, [url, hasInteracted]);

  useEffect(() => {
    if (!hasInteracted || !inputText.trim()) { if (hasInteracted) setResult(null); return; }
    setResult(processUrl(inputText, mode));
  }, [inputText, mode, hasInteracted]);

  const output = result ? (mode === 'encode' ? result.encoded : result.decoded) : '';

  const handleCopy = () => {
    if (output) {
      onCopyValue?.(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!result && module.focused) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <IconBadge icon={Link} accent={accent} />
          <div className="text-white/30 text-sm">{MODULE_META['url-encode'].placeholder}</div>
        </div>
        <div className="flex gap-1.5 mb-3">
          <button onClick={() => { setHasInteracted(true); setMode('encode'); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'encode' ? 'text-white' : 'text-white/40'}`}
            style={mode === 'encode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >Encode</button>
          <button onClick={() => { setHasInteracted(true); setMode('decode'); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'decode' ? 'text-white' : 'text-white/40'}`}
            style={mode === 'decode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >Decode</button>
        </div>
        <input
          type="text"
          value={inputText}
          onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
          placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste URL-encoded text to decode...'}
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      {module.focused && (
        <>
          <div className="flex gap-1.5 mb-3">
            <button onClick={() => { setHasInteracted(true); setMode('encode'); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'encode' ? 'text-white' : 'text-white/40'}`}
              style={mode === 'encode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >Encode</button>
            <button onClick={() => { setHasInteracted(true); setMode('decode'); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${mode === 'decode' ? 'text-white' : 'text-white/40'}`}
              style={mode === 'decode' ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >Decode</button>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
            placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste URL-encoded text to decode...'}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors mb-3"
          />
        </>
      )}
      <div className="flex items-center gap-3">
        <IconBadge icon={Link} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-xs mb-1">{mode === 'encode' ? 'Encoded' : 'Decoded'}</div>
          <div className="text-sm font-mono text-white break-all">{output}</div>
          {result?.error && <div className="text-red-400/60 text-xs mt-1">{result.error}</div>}
        </div>
      </div>
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <span className="text-[10px] text-white/20">Press Enter to copy</span>
      </div>
    </div>
  );
}

// ─── Hash Generator View ───────────────────────────────────────

function HashView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const h = module.hash;
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<HashResult | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const genRef = useRef(0);

  useEffect(() => {
    if (!hasInteracted && h && !h.isPartial) setResult(h);
  }, [h, hasInteracted]);

  useEffect(() => {
    if (!hasInteracted || !inputText.trim()) { if (hasInteracted) setResult(null); return; }
    const gen = ++genRef.current;
    const initial = createHashResult(inputText);
    setResult(initial);
    resolveHash(initial).then(resolved => {
      if (genRef.current !== gen) return;
      setResult(resolved);
    });
  }, [inputText, hasInteracted]);

  const handleCopy = (value: string, field: string) => {
    onCopyValue?.(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (!result && module.focused) {
    return <HintView icon={Hash} accent={accent} text={MODULE_META.hash.placeholder} />;
  }

  if (!result) return null;

  const hashes = [
    { label: 'MD5', value: result.md5 },
    { label: 'SHA-1', value: result.sha1 },
    { label: 'SHA-256', value: result.sha256 },
    { label: 'SHA-512', value: result.sha512 },
  ].filter(h => h.value);

  return (
    <div className="p-4">
      {module.focused && (
        <input
          type="text"
          value={inputText}
          onChange={e => { setHasInteracted(true); setInputText(e.target.value); }}
          placeholder="Type text to hash..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors mb-3"
        />
      )}
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={Hash} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-xs">Hash of &ldquo;{result.input.length > 30 ? result.input.slice(0, 30) + '...' : result.input}&rdquo;</div>
        </div>
        {result.isLoading && (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
        )}
      </div>
      <div className="space-y-2">
        {hashes.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-2 group">
            <span className="text-[10px] font-mono text-white/25 w-12 flex-shrink-0 pt-0.5">{label}</span>
            <div className="flex-1 min-w-0 text-xs font-mono text-white/60 break-all leading-relaxed">{value}</div>
            <button
              onClick={() => handleCopy(value!, label)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] transition-all flex-shrink-0"
            >
              {copiedField === label ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/30" />}
            </button>
          </div>
        ))}
      </div>
      {result.error && <div className="text-red-400/60 text-xs mt-2">{result.error}</div>}
      <FooterHint text="Hover over a hash to copy it" />
    </div>
  );
}

// ─── Regex Tester View ─────────────────────────────────────────

function RegexView({ module, accent, onCopyValue }: { module: ModuleData; accent: AccentTheme; onCopyValue?: (value: string) => void }) {
  const rx = module.regex;
  const [pattern, setPattern] = useState('');
  const [testStr, setTestStr] = useState('');
  const [flags, setFlags] = useState('gi');
  const [result, setResult] = useState<RegexResult | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hasInteracted && rx && !rx.isPartial) {
      setResult(rx);
      setPattern(rx.pattern);
      setTestStr(rx.testString);
      setFlags(rx.flags);
    }
  }, [rx, hasInteracted]);

  useEffect(() => {
    if (!hasInteracted) return;
    if (!pattern.trim()) { setResult(null); return; }
    setResult(testRegex(pattern, testStr, flags));
  }, [pattern, testStr, flags, hasInteracted]);

  const toggleFlag = (flag: string) => {
    setHasInteracted(true);
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const handlePreset = (preset: typeof REGEX_PRESETS[number]) => {
    setHasInteracted(true);
    setPattern(preset.pattern);
    setTestStr(preset.test);
  };

  const handleCopy = () => {
    if (result) {
      onCopyValue?.(`/${result.pattern}/${result.flags}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!result && module.focused) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <IconBadge icon={FileSearch} accent={accent} />
          <div className="text-white/30 text-sm">{MODULE_META.regex.placeholder}</div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {REGEX_PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => handlePreset(p)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={pattern}
          onChange={e => { setHasInteracted(true); setPattern(e.target.value); }}
          placeholder="Enter regex pattern..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      {module.focused && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {REGEX_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => handlePreset(p)}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium text-white/35 hover:text-white/55 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/20 text-xs font-mono">/</span>
            <input
              type="text"
              value={pattern}
              onChange={e => { setHasInteracted(true); setPattern(e.target.value); }}
              placeholder="pattern"
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
            />
            <span className="text-white/20 text-xs font-mono">/</span>
            <div className="flex gap-0.5">
              {REGEX_FLAGS.map(f => (
                <button
                  key={f.flag}
                  onClick={() => toggleFlag(f.flag)}
                  className={`w-6 h-6 rounded text-[11px] font-mono font-medium transition-all ${flags.includes(f.flag) ? 'text-white' : 'text-white/25'}`}
                  style={flags.includes(f.flag) ? { background: accent.bg, border: `1px solid ${accent.border}` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  title={f.description}
                >
                  {f.flag}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={testStr}
            onChange={e => { setHasInteracted(true); setTestStr(e.target.value); }}
            placeholder="Test string..."
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors mb-3"
          />
        </>
      )}

      <div className="flex items-center gap-3 mb-2">
        <IconBadge icon={FileSearch} accent={accent} />
        <div className="flex-1 min-w-0">
          {result?.isValid === false ? (
            <div className="text-red-400/80 text-sm">{result.error}</div>
          ) : (
            <div className="text-white text-sm font-medium">
              {result?.matchCount ?? 0} match{(result?.matchCount ?? 0) !== 1 ? 'es' : ''}
            </div>
          )}
          {result?.isValid && result.pattern && (
            <div className="text-white/30 text-xs font-mono">/{result.pattern}/{result.flags}</div>
          )}
        </div>
      </div>

      {result?.isValid && result.matches.length > 0 && (
        <div className="space-y-1 max-h-[80px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
          {result.matches.slice(0, 10).map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-white/20 font-mono w-4 text-right">{i + 1}</span>
              <span className={`font-mono px-1.5 py-0.5 rounded ${accent.text}`}
                style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
              >
                {m.match}
              </span>
              <span className="text-white/20 font-mono">@{m.index}</span>
            </div>
          ))}
          {result.matches.length > 10 && (
            <div className="text-white/20 text-[10px] pl-6">...and {result.matches.length - 10} more</div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy regex'}
        </button>
        <span className="text-[10px] text-white/20">Press Enter to copy</span>
      </div>
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
  onTimerStart, onTimerToggle, onTimerReset, onSetTimerDuration, onCopyValue,
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
                  {state.module.id === 'date' && <DateView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'timer' && (
                    <TimerView module={state.module} accent={accent}
                      onStart={onTimerStart} onToggle={onTimerToggle} onReset={onTimerReset}
                      onSetDuration={onSetTimerDuration}
                    />
                  )}
                  {state.module.id === 'random' && <RandomView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'wordcount' && <WordCountView module={state.module} accent={accent} />}
                  {state.module.id === 'translator' && <TranslatorView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'dictionary' && <DictionaryView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'lorem' && <LoremView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'json-format' && <JsonFormatView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'base64' && <Base64View module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'url-encode' && <UrlEncodeView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'hash' && <HashView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
                  {state.module.id === 'regex' && <RegexView module={state.module} accent={accent} onCopyValue={onCopyValue} />}
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
