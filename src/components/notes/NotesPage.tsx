import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Search,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  Type,
  Trash2,
  Copy,
  GripVertical,
  FileText,
  Clock,
  Star,
  StarOff,
  Palette,
  Check,
  X,
  Sparkles,
  Loader2,
  Send,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { sendNotesAIRequest } from '../../services/ai/notesAiService';

// ─── types ──────────────────────────────────────────────────────────

type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet-list'
  | 'numbered-list'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout';

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

type NoteTheme = 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'red' | 'cyan' | 'yellow';

interface Note {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  emoji?: string;
  noteTheme?: NoteTheme;
}

// ─── AI co-pilot types ──────────────────────────────────────────────

interface PendingAIEdit {
  blockId: string;
  originalContent: string;
  originalType: BlockType;
  newContent: string;
  newType?: BlockType;
}

interface PendingNewBlock {
  tempId: string;
  afterBlockId: string;
  type: BlockType;
  content: string;
}

// ─── constants ──────────────────────────────────────────────────────

const BLOCK_MENU_OPTIONS: { type: BlockType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text', description: 'Plain text block', icon: <Type className="w-4 h-4" /> },
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading', icon: <Heading1 className="w-4 h-4" /> },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: <Heading2 className="w-4 h-4" /> },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading', icon: <Heading3 className="w-4 h-4" /> },
  { type: 'bullet-list', label: 'Bullet List', description: 'Unordered list item', icon: <List className="w-4 h-4" /> },
  { type: 'numbered-list', label: 'Numbered List', description: 'Ordered list item', icon: <ListOrdered className="w-4 h-4" /> },
  { type: 'todo', label: 'To-do', description: 'Checkbox item', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'quote', label: 'Quote', description: 'Blockquote text', icon: <Quote className="w-4 h-4" /> },
  { type: 'code', label: 'Code', description: 'Code snippet block', icon: <Code className="w-4 h-4" /> },
  { type: 'divider', label: 'Divider', description: 'Horizontal line', icon: <Minus className="w-4 h-4" /> },
  { type: 'callout', label: 'Callout', description: 'Highlighted callout box', icon: <Palette className="w-4 h-4" /> },
];

const glassCard = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
} as const;

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyBlock = (): Block => ({ id: uid(), type: 'text', content: '' });

const STORAGE_KEY = 'tm-notes';

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['😀', '😂', '🥹', '😍', '🤩', '😎', '🥳', '🤔', '😴', '🫠', '🤗', '😇'] },
  { label: 'Objects', emojis: ['📝', '📒', '📕', '📗', '📘', '📙', '📓', '📔', '📖', '🗒️', '📋', '📎'] },
  { label: 'Symbols', emojis: ['⭐', '🔥', '💡', '❤️', '🎯', '🚀', '✨', '💎', '🏆', '🎨', '🎵', '⚡'] },
  { label: 'Nature', emojis: ['🌸', '🌻', '🍀', '🌈', '🌙', '☀️', '🌊', '🍁', '🌺', '🦋', '🐝', '🌿'] },
  { label: 'Food', emojis: ['☕', '🍕', '🍩', '🧁', '🍎', '🍓', '🫐', '🍰', '🍪', '🧋', '🥑', '🍫'] },
  { label: 'Travel', emojis: ['🏠', '🏖️', '⛰️', '🗺️', '✈️', '🚗', '🛸', '🎡', '🏕️', '🌃', '🗼', '🎢'] },
];

interface NoteThemeConfig {
  key: NoteTheme;
  label: string;
  dot: string;
  // rgba base for dynamic opacity usage
  rgb: string;
  // block accents
  checkBg: string;
  checkBorder: string;
  quoteBorder: string;
  calloutBg: string;
  calloutBorder: string;
  // editor area
  editorGradient: string;
  editorGlow: string;
  // text accent for active type in context menu
  textAccent: string;
}

const NOTE_THEMES: NoteThemeConfig[] = [
  // Purple — from Default/Air persona: rgba(168, 85, 247)
  {
    key: 'purple', label: 'Purple', dot: 'bg-purple-500', rgb: '168, 85, 247',
    checkBg: 'bg-purple-500', checkBorder: 'border-purple-400',
    quoteBorder: 'border-purple-400/50', calloutBg: 'bg-purple-500/10', calloutBorder: 'border-purple-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(168,85,247,0.08)',
    textAccent: 'text-purple-400',
  },
  // Pink — from Girlie persona: rgba(236, 72, 153)
  {
    key: 'pink', label: 'Pink', dot: 'bg-pink-500', rgb: '236, 72, 153',
    checkBg: 'bg-pink-500', checkBorder: 'border-pink-400',
    quoteBorder: 'border-pink-400/50', calloutBg: 'bg-pink-500/10', calloutBorder: 'border-pink-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(236,72,153,0.06) 0%, rgba(236,72,153,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(236,72,153,0.08)',
    textAccent: 'text-pink-400',
  },
  // Cyan — from Pro persona: rgba(34, 211, 238)
  {
    key: 'cyan', label: 'Cyan', dot: 'bg-cyan-400', rgb: '34, 211, 238',
    checkBg: 'bg-cyan-500', checkBorder: 'border-cyan-400',
    quoteBorder: 'border-cyan-400/50', calloutBg: 'bg-cyan-500/10', calloutBorder: 'border-cyan-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(34,211,238,0.06) 0%, rgba(34,211,238,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(34,211,238,0.08)',
    textAccent: 'text-cyan-400',
  },
  // Blue
  {
    key: 'blue', label: 'Blue', dot: 'bg-blue-500', rgb: '59, 130, 246',
    checkBg: 'bg-blue-500', checkBorder: 'border-blue-400',
    quoteBorder: 'border-blue-400/50', calloutBg: 'bg-blue-500/10', calloutBorder: 'border-blue-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(59,130,246,0.08)',
    textAccent: 'text-blue-400',
  },
  // Green
  {
    key: 'green', label: 'Green', dot: 'bg-green-500', rgb: '34, 197, 94',
    checkBg: 'bg-green-500', checkBorder: 'border-green-400',
    quoteBorder: 'border-green-400/50', calloutBg: 'bg-green-500/10', calloutBorder: 'border-green-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(34,197,94,0.08)',
    textAccent: 'text-green-400',
  },
  // Orange
  {
    key: 'orange', label: 'Orange', dot: 'bg-orange-500', rgb: '249, 115, 22',
    checkBg: 'bg-orange-500', checkBorder: 'border-orange-400',
    quoteBorder: 'border-orange-400/50', calloutBg: 'bg-orange-500/10', calloutBorder: 'border-orange-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(249,115,22,0.06) 0%, rgba(249,115,22,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(249,115,22,0.08)',
    textAccent: 'text-orange-400',
  },
  // Red
  {
    key: 'red', label: 'Red', dot: 'bg-red-500', rgb: '239, 68, 68',
    checkBg: 'bg-red-500', checkBorder: 'border-red-400',
    quoteBorder: 'border-red-400/50', calloutBg: 'bg-red-500/10', calloutBorder: 'border-red-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(239,68,68,0.08)',
    textAccent: 'text-red-400',
  },
  // Yellow
  {
    key: 'yellow', label: 'Yellow', dot: 'bg-yellow-500', rgb: '234, 179, 8',
    checkBg: 'bg-yellow-500', checkBorder: 'border-yellow-400',
    quoteBorder: 'border-yellow-400/50', calloutBg: 'bg-yellow-500/10', calloutBorder: 'border-yellow-500/20',
    editorGradient: 'linear-gradient(180deg, rgba(234,179,8,0.06) 0%, rgba(234,179,8,0.02) 40%, transparent 100%)',
    editorGlow: '0 0 80px rgba(234,179,8,0.08)',
    textAccent: 'text-yellow-400',
  },
];

function getNoteTheme(key?: NoteTheme) {
  return NOTE_THEMES.find((t) => t.key === key) || NOTE_THEMES[0];
}

// ─── persistence ────────────────────────────────────────────────────

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ─── block renderer (textarea-based, no contentEditable) ────────────

interface BlockEditorProps {
  block: Block;
  index: number;
  focused: boolean;
  noteTheme: NoteTheme;
  dragControls: ReturnType<typeof useDragControls>;
  onFocus: () => void;
  onChange: (content: string) => void;
  onChangeType: (type: BlockType) => void;
  onToggleCheck: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  aiPending?: PendingAIEdit | null;
  aiNewBlock?: boolean;
  onAcceptAI?: () => void;
  onRejectAI?: () => void;
}

function BlockEditor({ block, index, focused, noteTheme, dragControls, onFocus, onChange, onChangeType, onToggleCheck, onKeyDown, onDelete, onDuplicate, aiPending, aiNewBlock, onAcceptAI, onRejectAI }: BlockEditorProps) {
  const themeColors = getNoteTheme(noteTheme);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-focus when this block becomes focused
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.focus();
      // Move cursor to end
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [focused]);

  // Auto-resize textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [block.content, block.type]);

  // Close menus on outside click
  useEffect(() => {
    if (!showMenu && !showTypeMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowTypeMenu(false);
        setSlashFilter('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showMenu, showTypeMenu]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;

    // Slash command detection
    if (text.startsWith('/')) {
      setSlashFilter(text.slice(1).toLowerCase());
      setShowTypeMenu(true);
    } else if (showTypeMenu) {
      setShowTypeMenu(false);
      setSlashFilter('');
    }

    onChange(text);
  };

  // Slash command: clear the slash text since user typed "/heading1" etc.
  const handleSlashTypeSelect = (type: BlockType) => {
    onChangeType(type);
    setShowTypeMenu(false);
    setSlashFilter('');
    onChange('');
    setTimeout(() => ref.current?.focus(), 0);
  };

  // Context menu (3-dot): preserve existing content
  const handleContextTypeSelect = (type: BlockType) => {
    onChangeType(type);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const filteredBlockOptions = BLOCK_MENU_OPTIONS.filter(
    (opt) => opt.label.toLowerCase().includes(slashFilter) || opt.type.includes(slashFilter)
  );

  if (block.type === 'divider') {
    return (
      <div className="group relative flex items-center py-2" onClick={onFocus}>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -left-10 flex items-center gap-1">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded hover:bg-white/10 text-white/30">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full h-px bg-white/10" />
      </div>
    );
  }

  const textSizeClass: Record<BlockType, string> = {
    text: 'text-base text-white/80',
    'heading1': 'text-3xl font-bold text-white',
    'heading2': 'text-2xl font-semibold text-white',
    'heading3': 'text-xl font-semibold text-white/90',
    'bullet-list': 'text-base text-white/80',
    'numbered-list': 'text-base text-white/80',
    'todo': 'text-base text-white/80',
    'quote': 'text-base text-white/60 italic',
    'code': 'font-mono text-sm text-green-300/90',
    'divider': '',
    'callout': 'text-base text-white/80',
  };

  const wrapperExtra: Record<BlockType, string> = {
    text: '',
    heading1: '',
    heading2: '',
    heading3: '',
    'bullet-list': '',
    'numbered-list': '',
    todo: '',
    quote: `border-l-2 ${themeColors.quoteBorder} pl-4`,
    code: 'bg-white/[0.03] rounded-lg p-3',
    divider: '',
    callout: `${themeColors.calloutBg} border ${themeColors.calloutBorder} rounded-xl p-4`,
  };

  const placeholders: Record<BlockType, string> = {
    text: "Type '/' for commands...",
    'heading1': 'Heading 1',
    'heading2': 'Heading 2',
    'heading3': 'Heading 3',
    'bullet-list': 'List item',
    'numbered-list': 'List item',
    'todo': 'To-do',
    'quote': 'Quote',
    'code': 'Code',
    'divider': '',
    'callout': 'Type something...',
  };

  const hasAIPending = !!aiPending || !!aiNewBlock;

  return (
    <div className={`group relative flex items-start py-0.5 transition-all duration-300 ${hasAIPending ? 'rounded-lg -mx-2 px-2' : ''}`}
      style={hasAIPending ? {
        background: `rgba(${themeColors.rgb}, 0.08)`,
        border: `1px solid rgba(${themeColors.rgb}, 0.25)`,
        boxShadow: `0 0 20px rgba(${themeColors.rgb}, 0.1)`,
      } : undefined}
    >
      {/* AI Accept/Reject buttons */}
      {hasAIPending && onAcceptAI && onRejectAI && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-1 z-10 ml-2">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAcceptAI}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: `rgba(${themeColors.rgb}, 0.2)`,
              border: `1px solid rgba(${themeColors.rgb}, 0.3)`,
            }}
            title="Accept"
          >
            <Check className="w-3.5 h-3.5" style={{ color: `rgba(${themeColors.rgb}, 1)` }} />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRejectAI}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
            title="Reject"
          >
            <X className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
          </motion.button>
        </div>
      )}

      {/* AI sparkle indicator */}
      {hasAIPending && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: `rgba(${themeColors.rgb}, 0.7)` }} />
        </div>
      )}

      {/* Hover controls */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -left-14 top-0 flex items-center gap-0.5 pt-1">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block prefix (bullet, number, checkbox) */}
      <div className={`flex items-start gap-2 flex-1 min-w-0 ${wrapperExtra[block.type]}`}>
        {block.type === 'bullet-list' && (
          <span className="text-white/40 mt-1.5 shrink-0 leading-none">•</span>
        )}
        {block.type === 'numbered-list' && (
          <span className="text-white/40 mt-1 text-sm font-medium shrink-0 min-w-[1.2em] text-right">{index + 1}.</span>
        )}
        {block.type === 'todo' && (
          <button
            onClick={onToggleCheck}
            className={`mt-1.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
              block.checked
                ? `${themeColors.checkBg} ${themeColors.checkBorder}`
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            {block.checked && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        {/* Textarea-based editable content */}
        <textarea
          ref={ref}
          value={block.content}
          onChange={handleChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholders[block.type]}
          rows={1}
          className={`flex-1 bg-transparent outline-none resize-none overflow-hidden placeholder-white/20 ${textSizeClass[block.type]} ${
            block.type === 'todo' && block.checked ? 'line-through text-white/40' : ''
          }`}
          style={{ minHeight: '1.5em' }}
          readOnly={hasAIPending}
        />
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[180px]"
            style={glassCard}
          >
            <div className="py-1">
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => { onDuplicate(); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <div className="border-t border-white/5 my-1" />
              {BLOCK_MENU_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => { handleContextTypeSelect(opt.type); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                    block.type === opt.type ? themeColors.textAccent : 'text-white/70'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slash command menu */}
      <AnimatePresence>
        {showTypeMenu && filteredBlockOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[240px] max-h-[300px] overflow-y-auto"
            style={glassCard}
          >
            <div className="py-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Blocks</p>
              {filteredBlockOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleSlashTypeSelect(opt.type)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                    {opt.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white/80 font-medium">{opt.label}</p>
                    <p className="text-[11px] text-white/30">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── sidebar note list ──────────────────────────────────────────────

interface NoteSidebarProps {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

// ─── draggable block wrapper ─────────────────────────────────────────

interface DraggableBlockProps {
  block: Block;
  index: number;
  focused: boolean;
  noteTheme: NoteTheme;
  onFocus: () => void;
  onChange: (content: string) => void;
  onChangeType: (type: BlockType) => void;
  onToggleCheck: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  aiPending?: PendingAIEdit | null;
  aiNewBlock?: boolean;
  onAcceptAI?: () => void;
  onRejectAI?: () => void;
}

function DraggableBlock(props: DraggableBlockProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={props.block}
      dragListener={false}
      dragControls={controls}
      className="list-none"
      whileDrag={{ scale: 1.02, opacity: 0.8 }}
    >
      <BlockEditor
        {...props}
        dragControls={controls}
        aiPending={props.aiPending}
        aiNewBlock={props.aiNewBlock}
        onAcceptAI={props.onAcceptAI}
        onRejectAI={props.onRejectAI}
      />
    </Reorder.Item>
  );
}

// ─── sidebar note list ──────────────────────────────────────────────

function NoteSidebar({ notes, activeId, onSelect, onNew, onDelete, onToggleStar, searchQuery, onSearchChange }: NoteSidebarProps) {
  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.blocks.some((b) => b.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const starred = filtered.filter((n) => n.starred);
  const unstarred = filtered.filter((n) => !n.starred);

  const renderItem = (note: Note) => (
    <motion.button
      key={note.id}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(note.id)}
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group ${
        activeId === note.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg mt-0.5 shrink-0">{note.emoji || '📝'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{note.title || 'Untitled'}</p>
          <p className="text-[11px] text-white/25 truncate mt-0.5">
            {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' · '}
            {note.blocks.filter((b) => b.content).length} blocks
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(note.id); }}
            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-yellow-400 transition-colors"
          >
            {note.starred ? <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> : <StarOff className="w-3 h-3" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white/70 placeholder-white/20 outline-none transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </div>
      </div>

      {/* New note button */}
      <div className="px-3 pb-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Plus className="w-4 h-4" /> New Note
        </motion.button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-0.5">
        {starred.length > 0 && (
          <>
            <p className="px-3 py-1 text-[10px] font-semibold text-white/20 uppercase tracking-wider">Starred</p>
            {starred.map(renderItem)}
            <div className="h-2" />
          </>
        )}
        {unstarred.length > 0 && (
          <>
            {starred.length > 0 && (
              <p className="px-3 py-1 text-[10px] font-semibold text-white/20 uppercase tracking-wider">All Notes</p>
            )}
            {unstarred.map(renderItem)}
          </>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/20">{searchQuery ? 'No matches' : 'No notes yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────────────

export function NotesPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  const activeNote = useMemo(() => notes.find((n) => n.id === activeNoteId) || null, [notes, activeNoteId]);

  // Close emoji picker / theme dropdown on outside click
  useEffect(() => {
    if (!showEmojiPicker && !showThemeDropdown) return;
    const handle = (e: MouseEvent) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (showThemeDropdown && themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setShowThemeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showEmojiPicker, showThemeDropdown]);

  // Persist notes
  useEffect(() => { saveNotes(notes); }, [notes]);

  // Auto-select first or create one
  useEffect(() => {
    if (notes.length === 0) {
      handleNewNote();
    } else if (!activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, []);

  const handleNewNote = useCallback(() => {
    const note: Note = {
      id: uid(),
      title: '',
      blocks: [emptyBlock()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      emoji: '📝',
    };
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
    setFocusedBlockIndex(0);
  }, []);

  const updateNote = useCallback((id: string, updater: (note: Note) => Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...updater(n), updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(filtered[0]?.id || null);
      }
      return filtered;
    });
  }, [activeNoteId]);

  const handleToggleStar = useCallback((id: string) => {
    updateNote(id, (n) => ({ ...n, starred: !n.starred }));
  }, [updateNote]);

  // Block operations
  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, (n) => ({
      ...n,
      blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
    }));
  }, [activeNoteId, updateNote]);

  const insertBlockAfter = useCallback((afterIndex: number, type: BlockType = 'text') => {
    if (!activeNoteId) return;
    const newBlock: Block = { id: uid(), type, content: '' };
    updateNote(activeNoteId, (n) => {
      const blocks = [...n.blocks];
      blocks.splice(afterIndex + 1, 0, newBlock);
      return { ...n, blocks };
    });
    setFocusedBlockIndex(afterIndex + 1);
  }, [activeNoteId, updateNote]);

  const deleteBlock = useCallback((index: number) => {
    if (!activeNoteId || !activeNote) return;
    if (activeNote.blocks.length <= 1) return;
    updateNote(activeNoteId, (n) => ({
      ...n,
      blocks: n.blocks.filter((_, i) => i !== index),
    }));
    setFocusedBlockIndex(Math.max(0, index - 1));
  }, [activeNoteId, activeNote, updateNote]);

  const duplicateBlock = useCallback((index: number) => {
    if (!activeNoteId || !activeNote) return;
    const block = activeNote.blocks[index];
    const copy: Block = { ...block, id: uid() };
    updateNote(activeNoteId, (n) => {
      const blocks = [...n.blocks];
      blocks.splice(index + 1, 0, copy);
      return { ...n, blocks };
    });
  }, [activeNoteId, activeNote, updateNote]);

  const reorderBlocks = useCallback((newBlocks: Block[]) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, (n) => ({ ...n, blocks: newBlocks }));
  }, [activeNoteId, updateNote]);

  const handleBlockKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertBlockAfter(index);
    } else if (e.key === 'Backspace' && activeNote?.blocks[index]?.content === '') {
      e.preventDefault();
      deleteBlock(index);
    } else if (e.key === 'ArrowUp' && index > 0) {
      const textarea = e.target as HTMLTextAreaElement;
      if (textarea.selectionStart === 0) {
        e.preventDefault();
        setFocusedBlockIndex(index - 1);
      }
    } else if (e.key === 'ArrowDown' && activeNote && index < activeNote.blocks.length - 1) {
      const textarea = e.target as HTMLTextAreaElement;
      if (textarea.selectionStart === textarea.value.length) {
        e.preventDefault();
        setFocusedBlockIndex(index + 1);
      }
    }
  }, [activeNote, insertBlockAfter, deleteBlock]);

  // ─── AI Co-pilot State ────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [pendingEdits, setPendingEdits] = useState<PendingAIEdit[]>([]);
  const [pendingNewBlocks, setPendingNewBlocks] = useState<PendingNewBlock[]>([]);

  // Clear AI message when all pending edits are resolved
  useEffect(() => {
    if (aiMessage && pendingEdits.length === 0 && pendingNewBlocks.length === 0) {
      const timer = setTimeout(() => setAiMessage(null), 800);
      return () => clearTimeout(timer);
    }
  }, [aiMessage, pendingEdits.length, pendingNewBlocks.length]);

  const handleAISend = useCallback(async (instruction: string) => {
    if (!activeNoteId || !activeNote || aiLoading) return;

    setAiLoading(true);
    setAiMessage(null);

    // Build block context for the API
    const blockContexts = activeNote.blocks.map((b, i) => ({
      index: i,
      id: b.id,
      type: b.type,
      content: b.content,
      checked: b.checked,
    }));

    try {
      const response = await sendNotesAIRequest(
        activeNote.title,
        blockContexts,
        instruction
      );

      if (response.error) {
        setAiMessage(response.error);
        setAiLoading(false);
        return;
      }

      // Apply edits as pending (show preview with highlight)
      const newPendingEdits: PendingAIEdit[] = [];

      for (const edit of response.edits) {
        const existingBlock = activeNote.blocks.find((b) => b.id === edit.blockId);
        if (!existingBlock) continue;

        newPendingEdits.push({
          blockId: edit.blockId,
          originalContent: existingBlock.content,
          originalType: existingBlock.type,
          newContent: edit.newContent,
          newType: edit.newType as BlockType | undefined,
        });

        // Apply the AI content immediately (will be reverted on reject)
        updateBlock(edit.blockId, {
          content: edit.newContent,
          ...(edit.newType ? { type: edit.newType as BlockType } : {}),
        });
      }

      // Handle new blocks
      const newPending: PendingNewBlock[] = [];
      if (response.newBlocks && response.newBlocks.length > 0) {
        for (const nb of response.newBlocks) {
          const tempId = uid();
          const newBlock: Block = {
            id: tempId,
            type: nb.type as BlockType,
            content: nb.content,
          };

          newPending.push({
            tempId,
            afterBlockId: nb.afterBlockId,
            type: nb.type as BlockType,
            content: nb.content,
          });

          // Insert the block into the note
          updateNote(activeNoteId, (n) => {
            const blocks = [...n.blocks];
            if (nb.afterBlockId === 'START') {
              blocks.unshift(newBlock);
            } else {
              const afterIdx = blocks.findIndex((b) => b.id === nb.afterBlockId);
              if (afterIdx >= 0) {
                blocks.splice(afterIdx + 1, 0, newBlock);
              } else {
                blocks.push(newBlock);
              }
            }
            return { ...n, blocks };
          });
        }
      }

      setPendingEdits(newPendingEdits);
      setPendingNewBlocks(newPending);
      setAiMessage(response.message);
    } catch (err: any) {
      setAiMessage(err.message || 'AI request failed.');
    } finally {
      setAiLoading(false);
    }
  }, [activeNoteId, activeNote, aiLoading, updateBlock, updateNote]);

  const handleAcceptEdit = useCallback((blockId: string) => {
    // Simply remove from pending — content is already applied
    setPendingEdits((prev) => prev.filter((e) => e.blockId !== blockId));
    setPendingNewBlocks((prev) => prev.filter((e) => e.tempId !== blockId));
  }, []);

  const handleRejectEdit = useCallback((blockId: string) => {
    // Revert edited blocks to original content
    const edit = pendingEdits.find((e) => e.blockId === blockId);
    if (edit) {
      updateBlock(edit.blockId, {
        content: edit.originalContent,
        type: edit.originalType,
      });
      setPendingEdits((prev) => prev.filter((e) => e.blockId !== blockId));
      return;
    }

    // Remove new blocks
    const newBlock = pendingNewBlocks.find((e) => e.tempId === blockId);
    if (newBlock && activeNoteId) {
      updateNote(activeNoteId, (n) => ({
        ...n,
        blocks: n.blocks.filter((b) => b.id !== blockId),
      }));
      setPendingNewBlocks((prev) => prev.filter((e) => e.tempId !== blockId));
    }
  }, [pendingEdits, pendingNewBlocks, updateBlock, updateNote, activeNoteId]);

  const handleAcceptAll = useCallback(() => {
    setPendingEdits([]);
    setPendingNewBlocks([]);
  }, []);

  const handleRejectAll = useCallback(() => {
    // Revert all edits
    for (const edit of pendingEdits) {
      updateBlock(edit.blockId, {
        content: edit.originalContent,
        type: edit.originalType,
      });
    }
    // Remove all new blocks
    if (activeNoteId) {
      const newBlockIds = new Set(pendingNewBlocks.map((nb) => nb.tempId));
      if (newBlockIds.size > 0) {
        updateNote(activeNoteId, (n) => ({
          ...n,
          blocks: n.blocks.filter((b) => !newBlockIds.has(b.id)),
        }));
      }
    }
    setPendingEdits([]);
    setPendingNewBlocks([]);
  }, [pendingEdits, pendingNewBlocks, updateBlock, updateNote, activeNoteId]);

  const hasPendingAI = pendingEdits.length > 0 || pendingNewBlocks.length > 0;

  // Load initial note from localStorage if coming from home page
  useEffect(() => {
    const draft = localStorage.getItem('tm-notes-draft');
    if (draft) {
      localStorage.removeItem('tm-notes-draft');
      const existingNote = notes.find((n) => n.id === activeNoteId);
      if (existingNote) {
        updateNote(existingNote.id, (n) => ({
          ...n,
          blocks: [{ id: uid(), type: 'text' as BlockType, content: draft }, ...n.blocks.filter(b => b.content)],
        }));
      } else {
        const note: Note = {
          id: uid(),
          title: '',
          blocks: [{ id: uid(), type: 'text', content: draft }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          starred: false,
          emoji: '📝',
        };
        setNotes((prev) => [note, ...prev]);
        setActiveNoteId(note.id);
      }
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 overflow-hidden select-none ${theme.text}`}
      style={{
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        background: activeNote
          ? `linear-gradient(to top, rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.35) 0%, black 55%)`
          : '#000',
        transition: 'background 0.5s ease',
      }}
    >

      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/home')}
              className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-lg font-semibold text-white/80">TimeMachine Notes</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all md:hidden"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <motion.div
            initial={false}
            animate={{ width: showSidebar ? 280 : 0, opacity: showSidebar ? 1 : 0 }}
            className={`shrink-0 overflow-hidden border-r border-white/5 ${showSidebar ? '' : 'hidden md:block'}`}
          >
            <div className="w-[280px] h-full pt-2">
              <NoteSidebar
                notes={notes}
                activeId={activeNoteId}
                onSelect={setActiveNoteId}
                onNew={handleNewNote}
                onDelete={handleDeleteNote}
                onToggleStar={handleToggleStar}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </motion.div>

          {/* Editor */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeNote ? (
              <div
                className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-500"
              >
                <div className="max-w-3xl mx-auto px-6 md:px-16 py-8 pb-40">
                  {/* Theme pill dropdown - top right */}
                  <div className="flex justify-end mb-4">
                    <div className="relative" ref={themeDropdownRef}>
                      <button
                        onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white/90 transition-all"
                        style={{
                          background: `rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.1)`,
                          border: `1px solid rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.2)`,
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${getNoteTheme(activeNote.noteTheme).dot}`} />
                        {getNoteTheme(activeNote.noteTheme).label} Theme
                        <Palette className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showThemeDropdown && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden min-w-[160px]"
                            style={glassCard}
                          >
                            <div className="py-1.5">
                              <p className="px-3 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Theme</p>
                              {NOTE_THEMES.map((t) => (
                                <button
                                  key={t.key}
                                  onClick={() => {
                                    updateNote(activeNote.id, (n) => ({ ...n, noteTheme: t.key }));
                                    setShowThemeDropdown(false);
                                  }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                                    (activeNote.noteTheme || 'purple') === t.key ? 'text-white/90' : 'text-white/50'
                                  }`}
                                >
                                  <div className={`w-3 h-3 rounded-full ${t.dot}`} />
                                  {t.label} Theme
                                  {(activeNote.noteTheme || 'purple') === t.key && (
                                    <svg className="w-3.5 h-3.5 ml-auto text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Emoji + Title */}
                  <div className="mb-6">
                    <div className="relative inline-block" ref={emojiPickerRef}>
                      <div
                        className="text-4xl mb-3 cursor-pointer hover:scale-110 transition-transform inline-block"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        {activeNote.emoji || '📝'}
                      </div>
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute left-0 top-full z-50 rounded-2xl overflow-hidden w-[320px] max-h-[340px] overflow-y-auto custom-scrollbar"
                            style={glassCard}
                          >
                            <div className="p-3 space-y-3">
                              {EMOJI_CATEGORIES.map((cat) => (
                                <div key={cat.label}>
                                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">{cat.label}</p>
                                  <div className="grid grid-cols-6 gap-1">
                                    {cat.emojis.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => {
                                          updateNote(activeNote.id, (n) => ({ ...n, emoji }));
                                          setShowEmojiPicker(false);
                                        }}
                                        className="text-2xl p-1.5 rounded-xl hover:bg-white/10 transition-colors text-center"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input
                      value={activeNote.title}
                      onChange={(e) => updateNote(activeNote.id, (n) => ({ ...n, title: e.target.value }))}
                      placeholder="Untitled"
                      className="w-full text-4xl font-bold text-white placeholder-white/15 bg-transparent outline-none"
                    />
                    <p className="text-white/20 text-sm mt-2">
                      <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      {new Date(activeNote.updatedAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Blocks */}
                  <Reorder.Group axis="y" values={activeNote.blocks} onReorder={reorderBlocks} className="space-y-0.5 list-none p-0 m-0">
                    {activeNote.blocks.map((block, index) => {
                      const pendingEdit = pendingEdits.find((e) => e.blockId === block.id) || null;
                      const isNewBlock = pendingNewBlocks.some((nb) => nb.tempId === block.id);
                      return (
                        <DraggableBlock
                          key={block.id}
                          block={block}
                          index={index}
                          focused={focusedBlockIndex === index}
                          noteTheme={activeNote.noteTheme || 'purple'}
                          onFocus={() => setFocusedBlockIndex(index)}
                          onChange={(content) => updateBlock(block.id, { content })}
                          onChangeType={(type) => updateBlock(block.id, { type })}
                          onToggleCheck={() => updateBlock(block.id, { checked: !block.checked })}
                          onKeyDown={(e) => handleBlockKeyDown(e, index)}
                          onDelete={() => deleteBlock(index)}
                          onDuplicate={() => duplicateBlock(index)}
                          aiPending={pendingEdit}
                          aiNewBlock={isNewBlock}
                          onAcceptAI={() => handleAcceptEdit(block.id)}
                          onRejectAI={() => handleRejectEdit(block.id)}
                        />
                      );
                    })}
                  </Reorder.Group>

                  {/* Accept / Reject All bar */}
                  <AnimatePresence>
                    {hasPendingAI && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          background: `rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.08)`,
                          border: `1px solid rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.2)`,
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm text-white/50">
                          <Sparkles className="w-4 h-4" style={{ color: `rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.8)` }} />
                          <span>{pendingEdits.length + pendingNewBlocks.length} AI change{pendingEdits.length + pendingNewBlocks.length !== 1 ? 's' : ''} pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleAcceptAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              background: `rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.2)`,
                              color: `rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 1)`,
                              border: `1px solid rgba(${getNoteTheme(activeNote.noteTheme).rgb}, 0.3)`,
                            }}
                          >
                            <Check className="w-3.5 h-3.5" /> Accept All
                          </button>
                          <button
                            onClick={handleRejectAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Reject All
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Add block button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => insertBlockAfter(activeNote.blocks.length - 1)}
                    className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add a block
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-lg">Select or create a note</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI status message — anchored above textbox, centered */}
        <AnimatePresence>
          {aiMessage && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="fixed bottom-[5.5rem] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
            >
              <div
                className="px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <p className="text-xs font-medium text-purple-400 opacity-60 mb-1">TimeMachine Air</p>
                <p className="text-sm text-white/70">{aiMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating AI Co-pilot Textbox */}
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-40`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).elements.namedItem('ai-input') as HTMLInputElement;
              if (input.value.trim()) {
                handleAISend(input.value.trim());
                input.value = '';
              }
            }}
          >
            <div className="relative flex items-center">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-purple-400/60" />
                )}
              </div>
              <input
                name="ai-input"
                type="text"
                placeholder={aiLoading ? 'Thinking...' : 'Ask to edit, enhance or add to notes'}
                disabled={aiLoading || !activeNoteId}
                className="w-full pl-11 pr-16 rounded-[28px] text-white placeholder-gray-400 outline-none disabled:opacity-50 transition-all duration-300 text-base"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  height: '56px',
                  fontSize: '1rem',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) form.requestSubmit();
                  }
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={aiLoading || !activeNoteId}
                  className="p-3 rounded-full text-white disabled:opacity-50 relative group transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {aiLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 relative z-10" />
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
