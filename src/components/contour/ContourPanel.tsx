/**
 * TimeMachine Contour - Main Panel Component
 *
 * A glassmorphic spotlight overlay that appears above the chat textbox.
 * Shows "TimeMachine Contour" branding in top-left.
 * Supports two modes: calculator results and command palette.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, ArrowLeftRight, DollarSign, Globe, Palette,
  Timer, Calendar, Shuffle, Type, Braces, Lock, Link, Hash,
  FileSearch, FileText, Settings, History, Image, Brain,
  HelpCircle, Code, Music, HeartPulse, Fingerprint, Clock,
  Search, Wrench, Monitor, Zap, Command, Equal,
} from 'lucide-react';
import { ContourState, ContourMode } from './useContour';
import { ContourCommand, ContourCategory, CATEGORY_INFO } from './modules/commands';

// Map icon name strings to actual Lucide components
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
}

const personaAccent: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  default: {
    bg: 'rgba(139, 0, 255, 0.08)',
    border: 'rgba(139, 0, 255, 0.25)',
    glow: '0 0 40px rgba(139, 0, 255, 0.15)',
    text: 'text-purple-400',
  },
  girlie: {
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.25)',
    glow: '0 0 40px rgba(236, 72, 153, 0.15)',
    text: 'text-pink-400',
  },
  pro: {
    bg: 'rgba(34, 211, 238, 0.08)',
    border: 'rgba(34, 211, 238, 0.25)',
    glow: '0 0 40px rgba(34, 211, 238, 0.15)',
    text: 'text-cyan-400',
  },
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || Command;
}

/** Group commands by category */
function groupByCategory(commands: ContourCommand[]): { category: ContourCategory; commands: ContourCommand[] }[] {
  const grouped = new Map<ContourCategory, ContourCommand[]>();

  for (const cmd of commands) {
    const list = grouped.get(cmd.category) || [];
    list.push(cmd);
    grouped.set(cmd.category, list);
  }

  return Array.from(grouped.entries()).map(([category, commands]) => ({ category, commands }));
}

export function ContourPanel({ state, isVisible, onCommandSelect, selectedIndex, persona = 'default' }: ContourPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const accent = personaAccent[persona] || personaAccent.default;

  // Auto-scroll to keep selected item visible
  useEffect(() => {
    if (selectedItemRef.current && scrollContainerRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Compute flat index mapping for keyboard navigation
  let flatIndex = 0;
  const getFlatIndex = () => flatIndex++;

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
              boxShadow: `
                ${accent.glow},
                0 25px 50px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.08)
              `,
            }}
          >
            {/* Header - TimeMachine Contour branding */}
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: accent.border.replace('0.25', '0.8'),
                    boxShadow: `0 0 6px ${accent.border}`,
                  }}
                />
                <span className="text-[11px] font-medium tracking-wider uppercase text-white/40">
                  TimeMachine Contour
                </span>
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
              {/* Calculator Mode */}
              {state.mode === 'calculator' && state.calculatorResult && (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{
                        background: accent.bg,
                        border: `1px solid ${accent.border}`,
                      }}
                    >
                      <Equal className={`w-5 h-5 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/40 text-xs font-mono mb-1 truncate">
                        {state.calculatorResult.expression}
                      </div>
                      <div className={`text-xl font-semibold tracking-tight ${state.calculatorResult.isPartial ? 'text-white/50' : 'text-white'}`}>
                        {state.calculatorResult.displayResult}
                      </div>
                    </div>
                  </div>
                  {!state.calculatorResult.isPartial && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span className="text-[10px] text-white/20">
                        Press Enter to copy result · Keep typing to continue
                      </span>
                    </div>
                  )}
                </div>
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
                        {/* Category label */}
                        <div className="px-4 py-1.5">
                          <span className="text-[10px] font-medium tracking-wider uppercase text-white/25">
                            {CATEGORY_INFO[category]?.label || category}
                          </span>
                        </div>

                        {/* Commands in this category */}
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
                                  border: isSelected
                                    ? `1px solid ${accent.border}`
                                    : '1px solid transparent',
                                }}
                              >
                                <div
                                  className="p-1.5 rounded-lg flex-shrink-0"
                                  style={{
                                    background: isSelected
                                      ? accent.border.replace('0.25', '0.15')
                                      : 'rgba(255, 255, 255, 0.04)',
                                  }}
                                >
                                  <IconComponent
                                    className={`w-4 h-4 ${isSelected ? accent.text : 'text-white/40'}`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                    {cmd.name}
                                  </div>
                                  <div className={`text-xs truncate ${isSelected ? 'text-white/40' : 'text-white/20'}`}>
                                    {cmd.description}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0 text-[10px] text-white/20 font-mono">
                                    ↵
                                  </div>
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

            {/* Footer hint */}
            {state.mode === 'commands' && state.commands.length > 0 && (
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">↑↓</kbd>
                    navigate
                  </span>
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">↵</kbd>
                    select
                  </span>
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">esc</kbd>
                    dismiss
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
