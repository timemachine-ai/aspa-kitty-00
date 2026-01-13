import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, ChevronRight, Download, Upload, Cloud, CloudOff, RefreshCw, Users, MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AI_PERSONAS } from '../../config/constants';
import {
  ChatSession,
  getLocalSessions,
  getSupabaseSessions,
  deleteSupabaseSession,
  deleteLocalSession,
  renameSupabaseSession,
  migrateLocalSessionsToSupabase,
  saveSupabaseSession,
} from '../../services/chat/chatService';
import { getUserGroupChats } from '../../services/groupChat/groupChatService';
import { GroupChat } from '../../types/groupChat';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadChat: (session: ChatSession) => void;
}

export function ChatHistoryModal({ isOpen, onClose, onLoadChat }: ChatHistoryModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Filter out the AI Personas we don't want to show
  const allowedPersonas = Object.keys(AI_PERSONAS).filter(key =>
    !['chatgpt', 'gemini', 'claude', 'grok'].includes(key)
  ) as (keyof typeof AI_PERSONAS)[];

  const [selectedTab, setSelectedTab] = useState<string>('default');

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadChatSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      let sessions: ChatSession[];

      if (user) {
        // Load from Supabase for logged in users
        sessions = await getSupabaseSessions(user.id);
      } else {
        // Load from localStorage for anonymous users
        sessions = getLocalSessions();
      }

      setChatSessions(sessions.sort((a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      ));

      if (user) {
        const groups = await getUserGroupChats(user.id);
        setGroupChats(groups);
      } else {
        setGroupChats([]);
      }

    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setChatSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadChatSessions();
    }
  }, [isOpen, loadChatSessions]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Migrate local sessions when user logs in
  const handleMigrateToCloud = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const count = await migrateLocalSessionsToSupabase(user.id);
      if (count > 0) {
        setFeedbackMessage({ type: 'success', text: `Migrated ${count} chat(s) to cloud!` });
        await loadChatSessions();
      } else {
        setFeedbackMessage({ type: 'success', text: 'No local chats to migrate.' });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Failed to migrate chats.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRename = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setEditingId(sessionId);
      setEditingName(session.name);
    }
  };

  const handleSaveRename = async () => {
    if (!editingId || !editingName.trim()) return;

    try {
      if (user) {
        await renameSupabaseSession(editingId, editingName.trim());
      } else {
        const sessions = getLocalSessions();
        const updated = sessions.map(s =>
          s.id === editingId ? { ...s, name: editingName.trim(), lastModified: new Date().toISOString() } : s
        );
        localStorage.setItem('chatSessions', JSON.stringify(updated));
      }

      setChatSessions(prev =>
        prev.map(session =>
          session.id === editingId
            ? { ...session, name: editingName.trim(), lastModified: new Date().toISOString() }
            : session
        )
      );
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename chat session:', error);
      setFeedbackMessage({ type: 'error', text: 'Failed to rename chat.' });
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      if (user) {
        await deleteSupabaseSession(sessionId);
      } else {
        deleteLocalSession(sessionId);
      }

      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      setFeedbackMessage({ type: 'success', text: 'Chat deleted.' });
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      setFeedbackMessage({ type: 'error', text: 'Failed to delete chat.' });
    }
  };

  const handleExportChats = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        sessions: chatSessions
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `timemachine_chat_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(link.href);
      setFeedbackMessage({ type: 'success', text: 'Chat history exported successfully!' });
    } catch (error) {
      console.error('Failed to export chat history:', error);
      setFeedbackMessage({ type: 'error', text: 'Failed to export chat history.' });
    }
  };

  const handleImportChats = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (!importData.sessions || !Array.isArray(importData.sessions)) {
          throw new Error('Invalid file format');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validSessions = importData.sessions.filter((session: any) => {
          return session.id && session.name && session.messages &&
                 session.persona && session.createdAt && session.lastModified &&
                 Array.isArray(session.messages);
        });

        if (validSessions.length === 0) {
          throw new Error('No valid chat sessions found in file');
        }

        // For logged in users, save to Supabase
        if (user) {
          for (const session of validSessions) {
            await saveSupabaseSession(session, user.id);
          }
        } else {
          // For anonymous users, merge with local storage
          const existingSessions = getLocalSessions();
          const sessionMap = new Map();

          existingSessions.forEach((session) => {
            sessionMap.set(session.id, session);
          });

          validSessions.forEach((session: ChatSession) => {
            const existing = sessionMap.get(session.id);
            if (!existing || new Date(session.lastModified) > new Date(existing.lastModified)) {
              sessionMap.set(session.id, session);
            }
          });

          const mergedSessions = Array.from(sessionMap.values());
          localStorage.setItem('chatSessions', JSON.stringify(mergedSessions));
        }

        await loadChatSessions();

        setFeedbackMessage({
          type: 'success',
          text: `Successfully imported ${validSessions.length} chat session(s)!`
        });
      } catch (error) {
        console.error('Failed to import chat history:', error);
        setFeedbackMessage({
          type: 'error',
          text: 'Failed to import chat history. Please check the file format.'
        });
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLoadChat = (session: ChatSession) => {
    onLoadChat(session);
    onClose();
  };

  const handleOpenGroupChat = (groupId: string) => {
    onClose();
    // Use window.location for full reload to ensure context is fresh, or use navigate if available
    // Since we are in a modal inside ChatLayout usually, we might need useNavigate hook if we were inside Router context
    // But here we are. Let's assume window.location is safe fallback or use a prop if provided.
    // Actually, useNavigate is available in react-router-dom
    window.location.href = `/groupchat/${groupId}`;
  };

  // Check if there are local sessions to migrate
  const hasLocalSessions = user && getLocalSessions().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 ${theme.modal.overlay} backdrop-blur-xl z-50`}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
              >
                <div
                  className={`relative w-[95vw] max-w-[700px] h-[90vh] max-h-[85vh] p-6 sm:p-10 rounded-2xl flex flex-col`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className={`text-2xl font-bold text-white tracking-tight`}>
                      Chat History
                    </Dialog.Title>

                    {/* Cloud sync indicator */}
                    <div className="flex items-center gap-2">
                      {user ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                          <Cloud className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">Synced</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                          <CloudOff className="w-4 h-4 text-white/50" />
                          <span className="text-xs text-white/50">Local only</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <AnimatePresence>
                    {feedbackMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                          feedbackMessage.type === 'success'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {feedbackMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Migration prompt */}
                  {hasLocalSessions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-lg bg-purple-500/20 border border-purple-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-purple-200">
                          You have local chats. Migrate them to the cloud?
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleMigrateToCloud}
                          disabled={isSyncing}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm font-medium disabled:opacity-50"
                        >
                          {isSyncing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Cloud className="w-4 h-4" />
                          )}
                          Migrate
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Export/Import Buttons */}
                  <div className="flex gap-2 mb-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleExportChats}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Export All Chats</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleImportChats}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Import Chats</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadChatSessions}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </motion.button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <Tabs.Root
                    value={selectedTab}
                    onValueChange={setSelectedTab}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    <Tabs.List className="mb-6 flex space-x-2 overflow-x-auto pb-2">
                      {allowedPersonas.map((key) => (
                        <Tabs.Trigger
                          key={key}
                          value={key}
                          className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium whitespace-nowrap flex items-center gap-2
                            ${selectedTab === key
                              ? 'text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          style={selectedTab === key ? {
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)'
                          } : {}}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {AI_PERSONAS[key].name}
                        </Tabs.Trigger>
                      ))}

                      <Tabs.Trigger
                        value="group"
                        className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium whitespace-nowrap flex items-center gap-2
                          ${selectedTab === 'group'
                            ? 'text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        style={selectedTab === 'group' ? {
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)'
                        } : {}}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Group Chats
                      </Tabs.Trigger>
                    </Tabs.List>

                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        </div>
                      ) : selectedTab === 'group' ? (
                         groupChats.length === 0 ? (
                          <div className={`text-center py-12 text-white opacity-70 text-lg font-light`}>
                            <div className="flex flex-col items-center gap-4">
                              <div className="text-6xl opacity-30">👥</div>
                              <div>
                                <p className="text-lg mb-2">No group chats found</p>
                                <p className="text-sm opacity-50">Create a group chat to see it here</p>
                              </div>
                            </div>
                          </div>
                         ) : (
                           groupChats.map(group => (
                            <motion.div
                              key={group.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="p-4 rounded-xl cursor-pointer"
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleOpenGroupChat(group.id)}
                              whileHover={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 255, 255, 0.15)'
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-white truncate text-lg tracking-tight">
                                    {group.name || 'Untitled Group'}
                                  </h3>
                                  <p className="text-sm text-gray-300 opacity-70 font-light mt-1">
                                    {group.participants?.length || 0} participants • {AI_PERSONAS[group.persona]?.name || 'Unknown Persona'}
                                  </p>
                                </div>
                                <div className="p-2 rounded-full bg-white/5">
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                              </div>
                            </motion.div>
                           ))
                         )
                      ) : (
                        chatSessions.filter(s => s.persona === selectedTab).length === 0 ? (
                          <div className={`text-center py-12 text-white opacity-70 text-lg font-light`}>
                            <div className="flex flex-col items-center gap-4">
                              <div className="text-6xl opacity-30">💭</div>
                              <div>
                                <p className="text-lg mb-2">No chats found for {AI_PERSONAS[selectedTab as keyof typeof AI_PERSONAS].name}</p>
                                <p className="text-sm opacity-50">Start a conversation to see your chat history here</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          chatSessions.filter(s => s.persona === selectedTab).map(session => (
                            <motion.div
                              key={session.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="p-4 rounded-xl cursor-pointer"
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleLoadChat(session)}
                              whileHover={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 255, 255, 0.15)'
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {editingId === session.id ? (
                                    <div className="flex flex-col gap-2">
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                        className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveRename();
                                        }}
                                        className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium shadow-md self-start"
                                      >
                                        Save
                                      </motion.button>
                                    </div>
                                  ) : (
                                    <>
                                      <h3 className="font-semibold text-white truncate text-lg tracking-tight">
                                        {session.name || 'Untitled Chat'}
                                      </h3>
                                      <p className="text-sm text-gray-300 opacity-70 font-light mt-1">
                                        {session.messages?.length || 0} messages • {formatDate(session.lastModified)}
                                      </p>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRename(session.id);
                                    }}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200"
                                    title="Rename"
                                  >
                                    <Pencil className="w-5 h-5 text-gray-200" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(session.id);
                                    }}
                                    className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 transition-all duration-200"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-5 h-5 text-gray-200" />
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )
                      )}
                    </div>
                  </Tabs.Root>

                  <Dialog.Close asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200"
                    >
                      <X className="w-5 h-5 text-gray-200" />
                    </motion.button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}
