import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { UniversalTextbox } from '../shared/UniversalTextbox';
import { useTheme } from '../../context/ThemeContext';

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

interface Note {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  emoji?: string;
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
  onFocus: () => void;
  onChange: (content: string) => void;
  onChangeType: (type: BlockType) => void;
  onToggleCheck: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function BlockEditor({ block, index, focused, onFocus, onChange, onChangeType, onToggleCheck, onKeyDown, onDelete, onDuplicate }: BlockEditorProps) {
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

  const handleTypeSelect = (type: BlockType) => {
    onChangeType(type);
    setShowTypeMenu(false);
    setSlashFilter('');
    onChange('');
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
    quote: 'border-l-2 border-purple-400/50 pl-4',
    code: 'bg-white/[0.03] rounded-lg p-3',
    divider: '',
    callout: 'bg-purple-500/10 border border-purple-500/20 rounded-xl p-4',
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

  return (
    <div className="group relative flex items-start gap-1 py-0.5">
      {/* Hover controls */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 pt-1 shrink-0 -ml-16 w-14 justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors cursor-grab">
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
                ? 'bg-purple-500 border-purple-400'
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
                  onClick={() => { handleTypeSelect(opt.type); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                    block.type === opt.type ? 'text-purple-400' : 'text-white/70'
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
                  onClick={() => handleTypeSelect(opt.type)}
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white/80 transition-all"
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
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

  const activeNote = useMemo(() => notes.find((n) => n.id === activeNoteId) || null, [notes, activeNoteId]);

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

  const handleQuickInput = useCallback((text: string) => {
    if (!activeNoteId) return;
    const newBlock: Block = { id: uid(), type: 'text', content: text };
    updateNote(activeNoteId, (n) => ({
      ...n,
      blocks: [...n.blocks, newBlock],
    }));
  }, [activeNoteId, updateNote]);

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
      className={`fixed inset-0 overflow-hidden select-none ${theme.background} ${theme.text}`}
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
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
            <h1 className="text-lg font-semibold text-white/80">Notes</h1>
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
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto px-6 md:px-16 py-8 pb-40">
                  {/* Emoji + Title */}
                  <div className="mb-6">
                    <div className="text-4xl mb-3 cursor-pointer">{activeNote.emoji || '📝'}</div>
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
                  <div className="pl-16 space-y-0.5">
                    {activeNote.blocks.map((block, index) => (
                      <BlockEditor
                        key={block.id}
                        block={block}
                        index={index}
                        focused={focusedBlockIndex === index}
                        onFocus={() => setFocusedBlockIndex(index)}
                        onChange={(content) => updateBlock(block.id, { content })}
                        onChangeType={(type) => updateBlock(block.id, { type, content: '' })}
                        onToggleCheck={() => updateBlock(block.id, { checked: !block.checked })}
                        onKeyDown={(e) => handleBlockKeyDown(e, index)}
                        onDelete={() => deleteBlock(index)}
                        onDuplicate={() => duplicateBlock(index)}
                      />
                    ))}
                  </div>

                  {/* Add block button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => insertBlockAfter(activeNote.blocks.length - 1)}
                    className="mt-4 ml-16 flex items-center gap-2 px-3 py-2 rounded-xl text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition-all text-sm"
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

        {/* Floating Universal Textbox */}
        <UniversalTextbox
          onSend={handleQuickInput}
          placeholder="Quick note..."
          floating
        />
      </div>
    </div>
  );
}
