import React, { useState, useEffect, useCallback, useRef, useMemo, KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  MoreHorizontal,
  ChevronRight,
  Search,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Terminal,
  AlertCircle,
  GripVertical,
  ChevronDown,
  BookOpen,
  Clock,
  Star,
  StarOff,
} from 'lucide-react';
import { UniversalTextbox } from '../ui/UniversalTextbox';

// ─── types ───────────────────────────────────────────────────────────

type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todo'
  | 'quote'
  | 'divider'
  | 'code'
  | 'callout'
  | 'image';

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
}

interface NotePage {
  id: string;
  title: string;
  icon: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

// ─── glass styles ────────────────────────────────────────────────────

// ─── constants ───────────────────────────────────────────────────────

const STORAGE_KEY = 'timemachine_notes';

const PAGE_ICONS = ['📝', '📋', '💡', '🎯', '📌', '🔖', '📚', '🗂️', '✨', '🚀', '💭', '📐', '🎨', '🧠', '📊', '🔬'];

const SLASH_COMMANDS: { type: BlockType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'paragraph',    label: 'Text',           description: 'Plain text block',         icon: <Type className="w-4 h-4" /> },
  { type: 'heading1',     label: 'Heading 1',      description: 'Large section heading',    icon: <Heading1 className="w-4 h-4" /> },
  { type: 'heading2',     label: 'Heading 2',      description: 'Medium section heading',   icon: <Heading2 className="w-4 h-4" /> },
  { type: 'heading3',     label: 'Heading 3',      description: 'Small section heading',    icon: <Heading3 className="w-4 h-4" /> },
  { type: 'bulletList',   label: 'Bullet List',    description: 'Unordered list item',      icon: <List className="w-4 h-4" /> },
  { type: 'numberedList', label: 'Numbered List',  description: 'Ordered list item',        icon: <ListOrdered className="w-4 h-4" /> },
  { type: 'todo',         label: 'To-do',          description: 'Checkbox item',            icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'quote',        label: 'Quote',          description: 'Blockquote',               icon: <Quote className="w-4 h-4" /> },
  { type: 'divider',      label: 'Divider',        description: 'Horizontal line',          icon: <Minus className="w-4 h-4" /> },
  { type: 'code',         label: 'Code',           description: 'Code block',               icon: <Terminal className="w-4 h-4" /> },
  { type: 'callout',      label: 'Callout',        description: 'Highlighted info block',   icon: <AlertCircle className="w-4 h-4" /> },
];

// ─── helpers ─────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function createBlock(type: BlockType = 'paragraph', content = ''): Block {
  return { id: generateId(), type, content, checked: type === 'todo' ? false : undefined };
}

function createPage(title = 'Untitled', initialContent = ''): NotePage {
  const blocks: Block[] = [];
  if (initialContent) {
    const lines = initialContent.split('\n');
    lines.forEach((line) => {
      blocks.push(createBlock('paragraph', line));
    });
  } else {
    blocks.push(createBlock('paragraph', ''));
  }
  return {
    id: generateId(),
    title,
    icon: PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)],
    blocks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    starred: false,
  };
}

function loadPages(): NotePage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePages(pages: NotePage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Inline Formatting Toolbar ───────────────────────────────────────

interface FormatToolbarProps {
  position: { top: number; left: number } | null;
  onFormat: (format: string) => void;
}

function FormatToolbar({ position, onFormat }: FormatToolbarProps) {
  if (!position) return null;

  const buttons = [
    { format: 'bold', icon: <Bold className="w-3.5 h-3.5" />, label: 'Bold' },
    { format: 'italic', icon: <Italic className="w-3.5 h-3.5" />, label: 'Italic' },
    { format: 'underline', icon: <Underline className="w-3.5 h-3.5" />, label: 'Underline' },
    { format: 'strikethrough', icon: <Strikethrough className="w-3.5 h-3.5" />, label: 'Strikethrough' },
    { format: 'code', icon: <Code className="w-3.5 h-3.5" />, label: 'Code' },
    { format: 'link', icon: <Link className="w-3.5 h-3.5" />, label: 'Link' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="fixed z-[9999] flex items-center gap-0.5 p-1 rounded-xl"
      style={{
        top: position.top - 48,
        left: position.left,
        transform: 'translateX(-50%)',
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {buttons.map((btn) => (
        <motion.button
          key={btn.format}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseDown={(e) => { e.preventDefault(); onFormat(btn.format); }}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title={btn.label}
        >
          {btn.icon}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Slash Command Menu ──────────────────────────────────────────────

interface SlashMenuProps {
  position: { top: number; left: number } | null;
  filter: string;
  selectedIndex: number;
  onSelect: (type: BlockType) => void;
}

function SlashMenu({ position, filter, selectedIndex, onSelect }: SlashMenuProps) {
  if (!position) return null;

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.type.toLowerCase().includes(filter.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed z-[9999] w-72 max-h-[320px] overflow-y-auto rounded-xl p-1.5 custom-scrollbar"
      style={{
        top: position.top + 8,
        left: position.left,
        background: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5">Blocks</p>
      {filtered.map((cmd, i) => (
        <motion.button
          key={cmd.type}
          whileHover={{ x: 2 }}
          onClick={() => onSelect(cmd.type)}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
            i === selectedIndex % filtered.length ? 'bg-purple-500/15 text-white' : 'text-white/70 hover:bg-white/5'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] shrink-0">
            {cmd.icon}
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{cmd.label}</p>
            <p className="text-white/30 text-[11px] leading-tight">{cmd.description}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Block Editor Component ──────────────────────────────────────────

interface BlockEditorProps {
  block: Block;
  index: number;
  focused: boolean;
  onContentChange: (id: string, content: string) => void;
  onTypeChange: (id: string, type: BlockType) => void;
  onToggleTodo: (id: string) => void;
  onFocus: (id: string) => void;
  onKeyDown: (id: string, e: KeyboardEvent<HTMLElement>) => void;
  onDelete: (id: string) => void;
  blockRef: (el: HTMLElement | null) => void;
}

function BlockEditor({
  block,
  index,
  onContentChange,
  onToggleTodo,
  onFocus,
  onKeyDown,
  onDelete,
  blockRef,
}: BlockEditorProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (block.type === 'divider') {
    return (
      <div className="group relative py-2 flex items-center gap-2">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <button onClick={() => onDelete(block.id)} className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/5"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex-1 h-px bg-white/10 my-4" />
      </div>
    );
  }

  const textStyle = (() => {
    switch (block.type) {
      case 'heading1': return 'text-3xl font-bold text-white';
      case 'heading2': return 'text-2xl font-semibold text-white';
      case 'heading3': return 'text-xl font-semibold text-white/90';
      case 'code':     return 'font-mono text-sm text-green-300/80';
      case 'quote':    return 'text-base italic text-white/60';
      case 'callout':  return 'text-sm text-white/80';
      default:         return 'text-base text-white/80';
    }
  })();

  const placeholder = (() => {
    switch (block.type) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'bulletList': return 'List item';
      case 'numberedList': return 'List item';
      case 'todo': return 'To-do';
      case 'quote': return 'Quote';
      case 'code': return 'Code';
      case 'callout': return 'Callout';
      default: return index === 0 ? 'Start writing, or press / for commands...' : "Type '/' for commands...";
    }
  })();

  return (
    <div className="group relative flex items-start gap-1 py-0.5">
      {/* Hover actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 mt-0.5 -ml-1">
        <button onClick={() => onDelete(block.id)} className="p-0.5 rounded text-white/15 hover:text-white/50 hover:bg-white/5 transition-colors">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-0.5 rounded text-white/15 hover:text-white/50 hover:bg-white/5 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Block prefix decorators */}
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {block.type === 'bulletList' && (
          <span className="text-purple-400 mt-1 shrink-0 select-none">•</span>
        )}
        {block.type === 'numberedList' && (
          <span className="text-purple-400/70 mt-0.5 text-sm font-medium shrink-0 select-none min-w-[1.5em] text-right">{index + 1}.</span>
        )}
        {block.type === 'todo' && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onToggleTodo(block.id)}
            className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              block.checked ? 'bg-purple-500 border-purple-500' : 'border-white/30 hover:border-purple-400'
            }`}
          >
            {block.checked && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            )}
          </motion.button>
        )}
        {block.type === 'quote' && (
          <div className="w-1 self-stretch bg-purple-500/40 rounded-full shrink-0 mr-1" />
        )}
        {block.type === 'callout' && (
          <div className="mt-0.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-purple-400" />
          </div>
        )}

        {/* Content editable area */}
        <div
          ref={blockRef}
          contentEditable
          suppressContentEditableWarning
          className={`flex-1 min-w-0 outline-none leading-relaxed break-words ${textStyle} ${
            block.checked ? 'line-through opacity-50' : ''
          } empty:before:content-[attr(data-placeholder)] empty:before:text-white/20 empty:before:pointer-events-none`}
          data-placeholder={placeholder}
          data-block-id={block.id}
          onInput={(e) => onContentChange(block.id, (e.target as HTMLElement).textContent || '')}
          onFocus={() => onFocus(block.id)}
          onKeyDown={(e) => onKeyDown(block.id, e as unknown as KeyboardEvent<HTMLElement>)}
          style={{
            ...(block.type === 'code'
              ? {
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  whiteSpace: 'pre-wrap',
                }
              : {}),
            ...(block.type === 'callout'
              ? {
                  background: 'rgba(168, 85, 247, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                }
              : {}),
          }}
        />
      </div>
    </div>
  );
}

// ─── Page Sidebar Item ───────────────────────────────────────────────

interface PageItemProps {
  page: NotePage;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStar: () => void;
}

function PageItem({ page, isActive, onSelect, onDelete, onDuplicate, onToggleStar }: PageItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group">
      <motion.button
        whileHover={{ x: 2 }}
        onClick={onSelect}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
          isActive
            ? 'bg-purple-500/15 text-white'
            : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
        }`}
      >
        <span className="text-base shrink-0">{page.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{page.title || 'Untitled'}</p>
          <p className="text-white/20 text-[10px] leading-tight">{formatRelativeTime(page.updatedAt)}</p>
        </div>
        {page.starred && <Star className="w-3 h-3 text-yellow-400/70 fill-yellow-400/70 shrink-0" />}
      </motion.button>

      {/* Context menu trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl p-1 overflow-hidden"
              style={{
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            >
              <button onClick={() => { onToggleStar(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                {page.starred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                {page.starred ? 'Unstar' : 'Star'}
              </button>
              <button onClick={() => { onDuplicate(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/80 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main NotesPage ──────────────────────────────────────────────────

export function NotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialContent = (location.state as { initialContent?: string })?.initialContent || '';

  // ── State ────────────────────────────────────────────────────────
  const [pages, setPages] = useState<NotePage[]>(() => {
    const loaded = loadPages();
    if (loaded.length === 0) {
      const first = createPage('Untitled', initialContent);
      return [first];
    }
    // If we got initial content from home, create a new page for it
    if (initialContent) {
      const newPage = createPage('Untitled', initialContent);
      return [newPage, ...loaded];
    }
    return loaded;
  });
  const [activePageId, setActivePageId] = useState<string>(pages[0]?.id || '');
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [slashMenu, setSlashMenu] = useState<{ position: { top: number; left: number }; blockId: string; filter: string } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [formatToolbar, setFormatToolbar] = useState<{ top: number; left: number } | null>(null);
  const [iconPickerPageId, setIconPickerPageId] = useState<string | null>(null);

  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // ── Persistence ────────────────────────────────────────────────
  const scheduleSave = useCallback((updatedPages: NotePage[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => savePages(updatedPages), 300);
  }, []);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      savePages(pages);
    };
  }, [pages]);

  // ── Page operations ────────────────────────────────────────────
  const updatePages = useCallback((updater: (prev: NotePage[]) => NotePage[]) => {
    setPages((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const addPage = useCallback(() => {
    const page = createPage();
    updatePages((prev) => [page, ...prev]);
    setActivePageId(page.id);
    // Focus the first block after render
    setTimeout(() => {
      const el = blockRefs.current.get(page.blocks[0].id);
      el?.focus();
    }, 50);
  }, [updatePages]);

  const deletePage = useCallback((pageId: string) => {
    updatePages((prev) => {
      const next = prev.filter((p) => p.id !== pageId);
      if (next.length === 0) {
        const fresh = createPage();
        setActivePageId(fresh.id);
        return [fresh];
      }
      if (activePageId === pageId) {
        setActivePageId(next[0].id);
      }
      return next;
    });
  }, [activePageId, updatePages]);

  const duplicatePage = useCallback((pageId: string) => {
    updatePages((prev) => {
      const source = prev.find((p) => p.id === pageId);
      if (!source) return prev;
      const copy: NotePage = {
        ...source,
        id: generateId(),
        title: `${source.title} (copy)`,
        blocks: source.blocks.map((b) => ({ ...b, id: generateId() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
      };
      const idx = prev.findIndex((p) => p.id === pageId);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, [updatePages]);

  const toggleStar = useCallback((pageId: string) => {
    updatePages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, starred: !p.starred, updatedAt: new Date().toISOString() } : p)),
    );
  }, [updatePages]);

  const changePageIcon = useCallback((pageId: string, icon: string) => {
    updatePages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, icon, updatedAt: new Date().toISOString() } : p)),
    );
    setIconPickerPageId(null);
  }, [updatePages]);

  // ── Block operations ───────────────────────────────────────────
  const updateBlock = useCallback((blockId: string, content: string) => {
    updatePages((prev) =>
      prev.map((p) =>
        p.id === activePageId
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
            }
          : p,
      ),
    );
  }, [activePageId, updatePages]);

  const updateTitle = useCallback((title: string) => {
    updatePages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, title, updatedAt: new Date().toISOString() } : p)),
    );
  }, [activePageId, updatePages]);

  const changeBlockType = useCallback((blockId: string, type: BlockType) => {
    updatePages((prev) =>
      prev.map((p) =>
        p.id === activePageId
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              blocks: p.blocks.map((b) =>
                b.id === blockId ? { ...b, type, checked: type === 'todo' ? false : undefined } : b,
              ),
            }
          : p,
      ),
    );
  }, [activePageId, updatePages]);

  const addBlockAfter = useCallback((blockId: string, type: BlockType = 'paragraph', content = '') => {
    const newBlock = createBlock(type, content);
    updatePages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const idx = p.blocks.findIndex((b) => b.id === blockId);
        const blocks = [...p.blocks];
        blocks.splice(idx + 1, 0, newBlock);
        return { ...p, blocks, updatedAt: new Date().toISOString() };
      }),
    );
    // Focus the new block
    setTimeout(() => {
      const el = blockRefs.current.get(newBlock.id);
      el?.focus();
    }, 20);
    return newBlock.id;
  }, [activePageId, updatePages]);

  const deleteBlock = useCallback((blockId: string) => {
    if (!activePage || activePage.blocks.length <= 1) return;
    const idx = activePage.blocks.findIndex((b) => b.id === blockId);
    const prevBlock = activePage.blocks[idx - 1];
    updatePages((prev) =>
      prev.map((p) =>
        p.id === activePageId
          ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId), updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    if (prevBlock) {
      setTimeout(() => {
        const el = blockRefs.current.get(prevBlock.id);
        if (el) {
          el.focus();
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 20);
    }
  }, [activePage, activePageId, updatePages]);

  const toggleTodo = useCallback((blockId: string) => {
    updatePages((prev) =>
      prev.map((p) =>
        p.id === activePageId
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b)),
            }
          : p,
      ),
    );
  }, [activePageId, updatePages]);

  // ── Inline formatting ──────────────────────────────────────────
  const handleFormat = useCallback((format: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const text = sel.toString();
    if (!text) return;

    let wrapped: string;
    switch (format) {
      case 'bold': wrapped = `**${text}**`; break;
      case 'italic': wrapped = `*${text}*`; break;
      case 'underline': wrapped = `__${text}__`; break;
      case 'strikethrough': wrapped = `~~${text}~~`; break;
      case 'code': wrapped = `\`${text}\``; break;
      case 'link': wrapped = `[${text}](url)`; break;
      default: return;
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(wrapped));
    sel.collapseToEnd();
    setFormatToolbar(null);
  }, []);

  // ── Text selection handler ─────────────────────────────────────
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setFormatToolbar(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFormatToolbar({ top: rect.top, left: rect.left + rect.width / 2 });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // ── Key handler for blocks ─────────────────────────────────────
  const handleBlockKeyDown = useCallback(
    (blockId: string, e: KeyboardEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      const content = target.textContent || '';

      // Enter: create new block
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // Close slash menu if open and an item is selected
        if (slashMenu && slashMenu.blockId === blockId) {
          const filtered = SLASH_COMMANDS.filter(
            (cmd) =>
              cmd.label.toLowerCase().includes(slashMenu.filter.toLowerCase()) ||
              cmd.type.toLowerCase().includes(slashMenu.filter.toLowerCase()),
          );
          if (filtered.length > 0) {
            const selected = filtered[slashIndex % filtered.length];
            target.textContent = '';
            changeBlockType(blockId, selected.type);
            setSlashMenu(null);
            setSlashIndex(0);
            return;
          }
        }
        // Determine type for new block (continue list types)
        const currentBlock = activePage?.blocks.find((b) => b.id === blockId);
        const continueType = currentBlock?.type === 'bulletList' || currentBlock?.type === 'numberedList' || currentBlock?.type === 'todo'
          ? currentBlock.type : 'paragraph';
        addBlockAfter(blockId, continueType);
        return;
      }

      // Backspace on empty block: delete it
      if (e.key === 'Backspace' && content === '') {
        e.preventDefault();
        if (activePage && activePage.blocks.length > 1) {
          deleteBlock(blockId);
        }
        return;
      }

      // Slash command detection
      if (content === '/' || (slashMenu && slashMenu.blockId === blockId)) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlashIndex((i) => i + 1);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlashIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (e.key === 'Escape') {
          setSlashMenu(null);
          setSlashIndex(0);
          return;
        }
      }

      // Tab: indent (switch to sub-type, or just prevent default)
      if (e.key === 'Tab') {
        e.preventDefault();
        return;
      }

      // Arrow navigation between blocks
      if (e.key === 'ArrowUp' && !slashMenu) {
        const sel = window.getSelection();
        if (sel && sel.anchorOffset === 0) {
          e.preventDefault();
          const blocks = activePage?.blocks || [];
          const idx = blocks.findIndex((b) => b.id === blockId);
          if (idx > 0) {
            const el = blockRefs.current.get(blocks[idx - 1].id);
            el?.focus();
          }
        }
      }
      if (e.key === 'ArrowDown' && !slashMenu) {
        const sel = window.getSelection();
        const textLen = content.length;
        if (sel && sel.anchorOffset >= textLen) {
          e.preventDefault();
          const blocks = activePage?.blocks || [];
          const idx = blocks.findIndex((b) => b.id === blockId);
          if (idx < blocks.length - 1) {
            const el = blockRefs.current.get(blocks[idx + 1].id);
            el?.focus();
          }
        }
      }
    },
    [activePage, addBlockAfter, deleteBlock, changeBlockType, slashMenu, slashIndex],
  );

  // ── Slash command input tracking ───────────────────────────────
  const handleBlockInput = useCallback(
    (blockId: string, content: string) => {
      updateBlock(blockId, content);

      // Detect / at start of block
      if (content.startsWith('/')) {
        const el = blockRefs.current.get(blockId);
        if (el) {
          const rect = el.getBoundingClientRect();
          setSlashMenu({
            position: { top: rect.bottom, left: rect.left },
            blockId,
            filter: content.slice(1),
          });
          setSlashIndex(0);
        }
      } else if (slashMenu?.blockId === blockId) {
        setSlashMenu(null);
        setSlashIndex(0);
      }
    },
    [updateBlock, slashMenu],
  );

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      if (!slashMenu) return;
      const el = blockRefs.current.get(slashMenu.blockId);
      if (el) el.textContent = '';
      if (type === 'divider') {
        changeBlockType(slashMenu.blockId, 'divider');
        updateBlock(slashMenu.blockId, '');
        addBlockAfter(slashMenu.blockId);
      } else {
        changeBlockType(slashMenu.blockId, type);
        updateBlock(slashMenu.blockId, '');
      }
      setSlashMenu(null);
      setSlashIndex(0);
    },
    [slashMenu, changeBlockType, updateBlock, addBlockAfter],
  );

  // ── Floating textbox handler ───────────────────────────────────
  const handleFloatingSubmit = useCallback(
    (text: string) => {
      if (!activePage) return;
      const lastBlock = activePage.blocks[activePage.blocks.length - 1];
      addBlockAfter(lastBlock.id, 'paragraph', text);
    },
    [activePage, addBlockAfter],
  );

  // ── Filtered pages ─────────────────────────────────────────────
  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.blocks.some((b) => b.content.toLowerCase().includes(q)),
    );
  }, [pages, searchQuery]);

  const starredPages = filteredPages.filter((p) => p.starred);
  const otherPages = filteredPages.filter((p) => !p.starred);

  // ── Word/char count ────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!activePage) return { words: 0, chars: 0 };
    const text = activePage.blocks.map((b) => b.content).join(' ');
    return {
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
    };
  }, [activePage]);

  return (
    <div className="fixed inset-0 overflow-hidden select-none flex">
      {/* ── BG ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #0f0a1e 30%, #0a0a0a 65%, #000 100%)' }} />
        <div className="absolute top-[-5%] left-[30%] w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-5%] right-[20%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[140px]" />
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="h-full flex flex-col overflow-hidden shrink-0 border-r border-white/[0.06]"
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          >
            {/* Sidebar header */}
            <div className="p-4 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/home')}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </motion.button>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span className="text-white/70 text-sm font-semibold">Notes</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addPage}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  title="New page"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm text-white/80 placeholder-white/20 outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                />
              </div>
            </div>

            {/* Pages list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-0.5">
              {starredPages.length > 0 && (
                <>
                  <p className="text-white/20 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5">Starred</p>
                  {starredPages.map((page) => (
                    <PageItem
                      key={page.id}
                      page={page}
                      isActive={page.id === activePageId}
                      onSelect={() => setActivePageId(page.id)}
                      onDelete={() => deletePage(page.id)}
                      onDuplicate={() => duplicatePage(page.id)}
                      onToggleStar={() => toggleStar(page.id)}
                    />
                  ))}
                </>
              )}
              <p className="text-white/20 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5">
                {starredPages.length > 0 ? 'All Pages' : 'Pages'}
              </p>
              {otherPages.map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  isActive={page.id === activePageId}
                  onSelect={() => setActivePageId(page.id)}
                  onDelete={() => deletePage(page.id)}
                  onDuplicate={() => duplicatePage(page.id)}
                  onToggleStar={() => toggleStar(page.id)}
                />
              ))}
              {filteredPages.length === 0 && (
                <p className="text-white/20 text-sm text-center py-6">No notes found</p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Editor ────────────────────────────────────────── */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Editor top bar */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
            {sidebarOpen && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </motion.button>
            )}
            {activePage && (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <button onClick={() => setIconPickerPageId(activePage.id)} className="text-base hover:bg-white/5 p-0.5 rounded transition-colors">{activePage.icon}</button>
                <span className="truncate max-w-[200px]">{activePage.title || 'Untitled'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-white/25 text-xs">
            <span>{stats.words} words</span>
            <span>{stats.chars} chars</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{activePage ? formatRelativeTime(activePage.updatedAt) : ''}</span>
            </div>
          </div>
        </div>

        {/* Icon picker */}
        <AnimatePresence>
          {iconPickerPageId && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setIconPickerPageId(null)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-14 left-[300px] z-50 p-3 rounded-xl grid grid-cols-8 gap-1"
                style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                {PAGE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => changePageIcon(iconPickerPageId, icon)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
                  >
                    {icon}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Editor content */}
        {activePage && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
            <div className="max-w-3xl mx-auto px-6 sm:px-12 py-8">
              {/* Page title */}
              <div className="mb-6">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-4xl sm:text-5xl font-bold text-white outline-none leading-tight empty:before:content-[attr(data-placeholder)] empty:before:text-white/15 empty:before:pointer-events-none"
                  data-placeholder="Untitled"
                  onInput={(e) => updateTitle((e.target as HTMLElement).textContent || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const firstBlock = activePage.blocks[0];
                      if (firstBlock) {
                        const el = blockRefs.current.get(firstBlock.id);
                        el?.focus();
                      }
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: activePage.title }}
                />
              </div>

              {/* Blocks */}
              <div className="space-y-0.5">
                {activePage.blocks.map((block, i) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={i}
                    focused={focusedBlockId === block.id}
                    onContentChange={handleBlockInput}
                    onTypeChange={changeBlockType}
                    onToggleTodo={toggleTodo}
                    onFocus={setFocusedBlockId}
                    onKeyDown={handleBlockKeyDown}
                    onDelete={deleteBlock}
                    blockRef={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                  />
                ))}
              </div>

              {/* Click to add block at end */}
              <div
                className="min-h-[200px] cursor-text"
                onClick={() => {
                  const last = activePage.blocks[activePage.blocks.length - 1];
                  if (last && last.content === '') {
                    const el = blockRefs.current.get(last.id);
                    el?.focus();
                  } else if (last) {
                    addBlockAfter(last.id);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Floating universal textbox */}
        <UniversalTextbox
          placeholder="Quick add a block..."
          onSubmit={handleFloatingSubmit}
          persona="default"
          floating={true}
          showAiHint={true}
          className="sm:left-6 sm:right-6 sm:max-w-3xl sm:mx-auto"
        />
      </div>

      {/* ── Slash Command Menu ────────────────────────────────── */}
      <AnimatePresence>
        {slashMenu && (
          <SlashMenu
            position={slashMenu.position}
            filter={slashMenu.filter}
            selectedIndex={slashIndex}
            onSelect={handleSlashSelect}
          />
        )}
      </AnimatePresence>

      {/* ── Format Toolbar ────────────────────────────────────── */}
      <AnimatePresence>
        {formatToolbar && <FormatToolbar position={formatToolbar} onFormat={handleFormat} />}
      </AnimatePresence>
    </div>
  );
}
