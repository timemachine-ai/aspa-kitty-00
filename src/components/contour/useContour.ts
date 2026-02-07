/**
 * TimeMachine Contour - Detection Hook
 *
 * Monitors textbox input and determines when/what to show in the Contour panel.
 * Two triggers:
 *   1. Math expression detected (e.g. "5+", "100/3")  → show calculator result
 *   2. "/" typed                                         → show command palette
 */

import { useState, useCallback, useMemo } from 'react';
import { evaluateMath, isMathExpression, CalculatorResult } from './modules/calculator';
import { searchCommands, ContourCommand } from './modules/commands';

export type ContourMode = 'hidden' | 'calculator' | 'commands';

export interface ContourState {
  mode: ContourMode;
  calculatorResult: CalculatorResult | null;
  commands: ContourCommand[];
  commandQuery: string;
  selectedIndex: number;
}

const INITIAL_STATE: ContourState = {
  mode: 'hidden',
  calculatorResult: null,
  commands: [],
  commandQuery: '',
  selectedIndex: 0,
};

export function useContour() {
  const [state, setState] = useState<ContourState>(INITIAL_STATE);

  /**
   * Analyze input text and update contour state.
   * Called on every keystroke in the textbox.
   */
  const analyze = useCallback((input: string) => {
    const trimmed = input.trim();

    // Empty input → hide
    if (!trimmed) {
      setState(INITIAL_STATE);
      return;
    }

    // Slash command mode: input starts with "/"
    if (trimmed.startsWith('/')) {
      const query = trimmed.slice(1); // everything after "/"
      const commands = searchCommands(query);
      setState({
        mode: 'commands',
        calculatorResult: null,
        commands,
        commandQuery: query,
        selectedIndex: 0,
      });
      return;
    }

    // Math expression detection
    if (isMathExpression(trimmed)) {
      const result = evaluateMath(trimmed);
      if (result) {
        setState({
          mode: 'calculator',
          calculatorResult: result,
          commands: [],
          commandQuery: '',
          selectedIndex: 0,
        });
        return;
      }
    }

    // Nothing to show
    setState(INITIAL_STATE);
  }, []);

  /**
   * Navigate selection up in command palette
   */
  const selectUp = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'commands' || prev.commands.length === 0) return prev;
      return {
        ...prev,
        selectedIndex: prev.selectedIndex <= 0
          ? prev.commands.length - 1
          : prev.selectedIndex - 1,
      };
    });
  }, []);

  /**
   * Navigate selection down in command palette
   */
  const selectDown = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'commands' || prev.commands.length === 0) return prev;
      return {
        ...prev,
        selectedIndex: prev.selectedIndex >= prev.commands.length - 1
          ? 0
          : prev.selectedIndex + 1,
      };
    });
  }, []);

  /**
   * Get the currently selected command (if in commands mode)
   */
  const selectedCommand = useMemo(() => {
    if (state.mode !== 'commands' || state.commands.length === 0) return null;
    return state.commands[state.selectedIndex] || null;
  }, [state.mode, state.commands, state.selectedIndex]);

  /**
   * Dismiss/hide the contour panel
   */
  const dismiss = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const isVisible = state.mode !== 'hidden';

  return {
    state,
    isVisible,
    analyze,
    selectUp,
    selectDown,
    selectedCommand,
    dismiss,
  };
}
