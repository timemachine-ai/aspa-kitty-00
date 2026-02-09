/**
 * TimeMachine Contour - Detection Hook
 *
 * Monitors textbox input and determines when/what to show in the Contour panel.
 *
 * Modes:
 *   - hidden:   nothing shown
 *   - commands: "/" command palette
 *   - module:   a specific tool is active (auto-detected OR focused via "/" selection)
 *
 * Focused mode: when a user selects a tool from "/", the tool opens INSIDE the
 * contour panel and the textbox becomes input for that tool. Esc exits.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { evaluateMath, isMathExpression, CalculatorResult } from './modules/calculator';
import { detectUnits, UnitResult } from './modules/unitConverter';
import { detectCurrency, resolveCurrency, CurrencyResult } from './modules/currencyConverter';
import { detectTimezone, TimezoneResult } from './modules/timezoneConverter';
import { detectColor, ColorResult } from './modules/colorConverter';
import { detectDate, DateResult } from './modules/dateCalculator';
import { createTimerState, tickTimer, formatDuration, TimerState, parseDuration, formatDurationLabel } from './modules/timer';
import { detectRandom, RandomResult } from './modules/randomGenerator';
import { detectWordCount, analyzeText, WordCountResult } from './modules/wordCounter';
import { detectTranslation, resolveTranslation, TranslationResult } from './modules/translator';
import { detectDictionary, resolveDictionary, DictionaryResult } from './modules/dictionary';
import { searchCommands, ContourCommand } from './modules/commands';

export type ModuleId = 'calculator' | 'units' | 'currency' | 'timezone' | 'color' | 'date' | 'timer' | 'random' | 'wordcount' | 'translator' | 'dictionary';

export type ContourMode = 'hidden' | 'commands' | 'module';

export interface ModuleData {
  id: ModuleId;
  focused: boolean;
  calculator?: CalculatorResult;
  units?: UnitResult;
  currency?: CurrencyResult;
  timezone?: TimezoneResult;
  color?: ColorResult;
  date?: DateResult;
  timer?: TimerState;
  random?: RandomResult;
  wordcount?: WordCountResult;
  translator?: TranslationResult;
  dictionary?: DictionaryResult;
}

export interface ContourState {
  mode: ContourMode;
  module: ModuleData | null;
  commands: ContourCommand[];
  commandQuery: string;
  selectedIndex: number;
}

const INITIAL_STATE: ContourState = {
  mode: 'hidden',
  module: null,
  commands: [],
  commandQuery: '',
  selectedIndex: 0,
};

const HANDLER_TO_MODULE: Record<string, ModuleId> = {
  'calculator': 'calculator',
  'unit-converter': 'units',
  'currency-converter': 'currency',
  'timezone': 'timezone',
  'color-converter': 'color',
  'date-calculator': 'date',
  'timer': 'timer',
  'random': 'random',
  'word-count': 'wordcount',
  'translator': 'translator',
  'dictionary': 'dictionary',
};

export function useContour() {
  const [state, setState] = useState<ContourState>(INITIAL_STATE);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currencyGenRef = useRef<number>(0);
  const translatorGenRef = useRef<number>(0);
  const dictionaryGenRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const autoDetect = useCallback((input: string): ModuleData | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // 1. Color (#hex, rgb(), hsl(), named)
    const color = detectColor(trimmed);
    if (color) return { id: 'color', focused: false, color };

    // 2. Unit conversion
    const units = detectUnits(trimmed);
    if (units) return { id: 'units', focused: false, units };

    // 3. Currency
    const currency = detectCurrency(trimmed);
    if (currency) return { id: 'currency', focused: false, currency };

    // 4. Timezone
    const timezone = detectTimezone(trimmed);
    if (timezone) return { id: 'timezone', focused: false, timezone };

    // 5. Date calculator
    const date = detectDate(trimmed);
    if (date) return { id: 'date', focused: false, date };

    // 6. Random generator
    const random = detectRandom(trimmed);
    if (random) return { id: 'random', focused: false, random };

    // 7. Translator
    const translation = detectTranslation(trimmed);
    if (translation) return { id: 'translator', focused: false, translator: translation };

    // 8. Dictionary
    const dictionary = detectDictionary(trimmed);
    if (dictionary) return { id: 'dictionary', focused: false, dictionary };

    // 9. Word counter
    const wordcount = detectWordCount(trimmed);
    if (wordcount) return { id: 'wordcount', focused: false, wordcount };

    // 10. Math (broadest match, lowest priority)
    if (isMathExpression(trimmed)) {
      const calc = evaluateMath(trimmed);
      if (calc) return { id: 'calculator', focused: false, calculator: calc };
    }

    return null;
  }, []);

  const focusedDetect = useCallback((moduleId: ModuleId, input: string): ModuleData | null => {
    const trimmed = input.trim();

    switch (moduleId) {
      case 'calculator': {
        if (!trimmed) return { id: 'calculator', focused: true };
        const calc = evaluateMath(trimmed);
        return { id: 'calculator', focused: true, calculator: calc || undefined };
      }
      case 'units': {
        if (!trimmed) return { id: 'units', focused: true };
        const units = detectUnits(trimmed);
        return { id: 'units', focused: true, units: units || undefined };
      }
      case 'currency': {
        if (!trimmed) return { id: 'currency', focused: true };
        const currency = detectCurrency(trimmed);
        return { id: 'currency', focused: true, currency: currency || undefined };
      }
      case 'timezone': {
        if (!trimmed) return { id: 'timezone', focused: true };
        const timezone = detectTimezone(trimmed);
        return { id: 'timezone', focused: true, timezone: timezone || undefined };
      }
      case 'color': {
        if (!trimmed) return { id: 'color', focused: true };
        const color = detectColor(trimmed);
        return { id: 'color', focused: true, color: color || undefined };
      }
      case 'date': {
        if (!trimmed) return { id: 'date', focused: true };
        const date = detectDate(trimmed);
        return { id: 'date', focused: true, date: date || undefined };
      }
      case 'timer': {
        if (!trimmed) return { id: 'timer', focused: true };
        const timer = createTimerState(trimmed);
        return { id: 'timer', focused: true, timer: timer || undefined };
      }
      case 'random': {
        if (!trimmed) return { id: 'random', focused: true };
        const random = detectRandom(trimmed);
        return { id: 'random', focused: true, random: random || undefined };
      }
      case 'wordcount': {
        if (!trimmed) return { id: 'wordcount', focused: true };
        const wordcount = analyzeText(trimmed);
        return { id: 'wordcount', focused: true, wordcount };
      }
      case 'translator': {
        if (!trimmed) return { id: 'translator', focused: true };
        const translation = detectTranslation(trimmed);
        return { id: 'translator', focused: true, translator: translation || undefined };
      }
      case 'dictionary': {
        if (!trimmed) return { id: 'dictionary', focused: true };
        const dictionary = detectDictionary(trimmed);
        return { id: 'dictionary', focused: true, dictionary: dictionary || undefined };
      }
    }
  }, []);

  const analyze = useCallback((input: string) => {
    setState(prev => {
      // Focused mode: only detect for the focused module
      if (prev.mode === 'module' && prev.module?.focused) {
        const moduleId = prev.module.id;
        // Don't re-detect if timer is running
        if (moduleId === 'timer' && prev.module.timer?.isRunning) return prev;
        const result = focusedDetect(moduleId, input);
        return result ? { ...prev, module: result } : { ...prev, module: { id: moduleId, focused: true } };
      }

      const trimmed = input.trim();
      if (!trimmed) return INITIAL_STATE;

      // "/" command palette
      if (trimmed.startsWith('/')) {
        const query = trimmed.slice(1);
        const commands = searchCommands(query);
        return { mode: 'commands' as const, module: null, commands, commandQuery: query, selectedIndex: 0 };
      }

      // Auto-detect
      const detected = autoDetect(trimmed);
      if (detected) {
        return { mode: 'module' as const, module: detected, commands: [], commandQuery: '', selectedIndex: 0 };
      }

      return INITIAL_STATE;
    });

    // Async currency resolution (for auto-detect and focused mode)
    const trimmed = input.trim();
    if (trimmed && !trimmed.startsWith('/')) {
      const currency = detectCurrency(trimmed);
      if (currency && !currency.isPartial) {
        const gen = ++currencyGenRef.current;
        resolveCurrency(currency).then(resolved => {
          if (currencyGenRef.current !== gen) return;
          setState(prev => {
            if (prev.module?.id !== 'currency') return prev;
            return { ...prev, module: { ...prev.module, currency: resolved } };
          });
        });
      }

      // Async translation resolution
      const translation = detectTranslation(trimmed);
      if (translation && !translation.isPartial) {
        const gen = ++translatorGenRef.current;
        resolveTranslation(translation).then(resolved => {
          if (translatorGenRef.current !== gen) return;
          setState(prev => {
            if (prev.module?.id !== 'translator') return prev;
            return { ...prev, module: { ...prev.module, translator: resolved } };
          });
        });
      }

      // Async dictionary resolution
      const dictionary = detectDictionary(trimmed);
      if (dictionary) {
        const gen = ++dictionaryGenRef.current;
        resolveDictionary(dictionary).then(resolved => {
          if (dictionaryGenRef.current !== gen) return;
          setState(prev => {
            if (prev.module?.id !== 'dictionary') return prev;
            return { ...prev, module: { ...prev.module, dictionary: resolved } };
          });
        });
      }
    }
  }, [autoDetect, focusedDetect]);

  const focusOnModule = useCallback((handler: string) => {
    const moduleId = HANDLER_TO_MODULE[handler];
    if (!moduleId) return false;
    setState({
      mode: 'module',
      module: { id: moduleId, focused: true },
      commands: [],
      commandQuery: '',
      selectedIndex: 0,
    });
    return true;
  }, []);

  // Timer controls
  const startTimer = useCallback(() => {
    setState(prev => {
      if (prev.module?.id !== 'timer' || !prev.module.timer) return prev;
      return { ...prev, module: { ...prev.module, timer: { ...prev.module.timer, isRunning: true } } };
    });

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.module?.timer?.isRunning) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return prev;
        }
        const newTimer = tickTimer(prev.module.timer);
        if (newTimer.isComplete) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('TimeMachine Timer', { body: `${prev.module.timer.label} timer complete!` });
          }
        }
        return { ...prev, module: { ...prev.module, timer: newTimer } };
      });
    }, 1000);
  }, []);

  const toggleTimer = useCallback(() => {
    setState(prev => {
      if (!prev.module?.timer) return prev;
      if (prev.module.timer.isRunning) {
        if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
        return { ...prev, module: { ...prev.module, timer: { ...prev.module.timer, isRunning: false } } };
      }
      // Resume
      timerIntervalRef.current = setInterval(() => {
        setState(p => {
          if (!p.module?.timer?.isRunning) { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); return p; }
          const nt = tickTimer(p.module.timer);
          if (nt.isComplete && timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return { ...p, module: { ...p.module, timer: nt } };
        });
      }, 1000);
      return { ...prev, module: { ...prev.module, timer: { ...prev.module.timer, isRunning: true } } };
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    setState(prev => {
      if (!prev.module?.timer) return prev;
      return {
        ...prev,
        module: {
          ...prev.module,
          timer: { ...prev.module.timer, remainingSeconds: prev.module.timer.totalSeconds, isRunning: false, isComplete: false, display: formatDuration(prev.module.timer.totalSeconds), progress: 1 },
        },
      };
    });
  }, []);

  const setTimerDuration = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    setState(prev => {
      if (prev.mode !== 'module' || prev.module?.id !== 'timer') return prev;
      return {
        ...prev,
        module: {
          ...prev.module,
          timer: {
            totalSeconds: seconds,
            remainingSeconds: seconds,
            isRunning: false,
            isComplete: false,
            label: formatDurationLabel(seconds),
            display: formatDuration(seconds),
            progress: 1,
          },
        },
      };
    });
  }, []);

  const selectUp = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'commands' || prev.commands.length === 0) return prev;
      return { ...prev, selectedIndex: prev.selectedIndex <= 0 ? prev.commands.length - 1 : prev.selectedIndex - 1 };
    });
  }, []);

  const selectDown = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'commands' || prev.commands.length === 0) return prev;
      return { ...prev, selectedIndex: prev.selectedIndex >= prev.commands.length - 1 ? 0 : prev.selectedIndex + 1 };
    });
  }, []);

  const selectedCommand = useMemo(() => {
    if (state.mode !== 'commands' || state.commands.length === 0) return null;
    return state.commands[state.selectedIndex] || null;
  }, [state.mode, state.commands, state.selectedIndex]);

  const dismiss = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    setState(INITIAL_STATE);
  }, []);

  const isVisible = state.mode !== 'hidden';
  const isFocused = state.mode === 'module' && state.module?.focused === true;

  return {
    state,
    isVisible,
    isFocused,
    analyze,
    focusOnModule,
    selectUp,
    selectDown,
    selectedCommand,
    dismiss,
    startTimer,
    toggleTimer,
    resetTimer,
    setTimerDuration,
  };
}
