import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Send,
  Image as ImageIcon,
  Mic,
  Loader2,
  UserPlus,
  Copy,
  Check,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  getGroupChat,
  getGroupChatInvite,
  joinGroupChat,
  sendGroupChatMessage,
  isGroupChatParticipant,
  subscribeToGroupChat
} from '../../services/groupChat/groupChatService';
import { GroupChat, GroupChatMessage, GroupChatParticipant, GroupChatInvite } from '../../types/groupChat';
import { AI_PERSONAS } from '../../config/constants';
import ReactMarkdown from 'react-markdown';

export function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, profile } = useAuth();

  const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
  const [inviteInfo, setInviteInfo] = useState<GroupChatInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [groupChat?.messages]);

  // Load group chat data
  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setIsLoading(true);

      // First check if it's a valid group chat
      const invite = await getGroupChatInvite(id);
      if (!invite) {
        setIsLoading(false);
        return;
      }
      setInviteInfo(invite);

      // Check if user is already a participant
      if (user) {
        const participant = await isGroupChatParticipant(id, user.id);
        setIsParticipant(participant);

        if (participant) {
          const chat = await getGroupChat(id);
          setGroupChat(chat);
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, [id, user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!id || !isParticipant) return;

    const unsubscribe = subscribeToGroupChat(
      id,
      (newMessage) => {
        setGroupChat(prev => {
          if (!prev) return prev;
          // Avoid duplicates
          const exists = prev.messages.some(m => m.id === newMessage.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
          };
        });
      },
      (newParticipant) => {
        setGroupChat(prev => {
          if (!prev) return prev;
          const exists = prev.participants.some(p => p.id === newParticipant.id);
          if (exists) return prev;
          return {
            ...prev,
            participants: [...prev.participants, newParticipant],
          };
        });
      }
    );

    return unsubscribe;
  }, [id, isParticipant]);

  const handleJoin = async () => {
    if (!id || !user || !profile) return;

    setIsJoining(true);
    const success = await joinGroupChat(
      id,
      user.id,
      profile.nickname || 'User',
      profile.avatar_url
    );

    if (success) {
      setIsParticipant(true);
      const chat = await getGroupChat(id);
      setGroupChat(chat);
    }
    setIsJoining(false);
  };

  const handleSend = async () => {
    if (!message.trim() || !groupChat || !user || !profile || isSending) return;

    const content = message.trim();
    setMessage('');
    setIsSending(true);

    await sendGroupChatMessage(
      groupChat.id,
      content,
      user.id,
      profile.nickname || 'User',
      profile.avatar_url
    );

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/groupchat/${id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const personaColors = {
    default: 'from-purple-500 to-violet-500',
    girlie: 'from-pink-500 to-rose-500',
    pro: 'from-cyan-500 to-blue-500',
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center`}>
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Invalid group chat
  if (!inviteInfo) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="inline-flex p-6 rounded-full bg-white/5 mb-6">
            <Users className="w-12 h-12 text-white/30" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Group Chat Not Found</h1>
          <p className="text-white/50 mb-6">This group chat doesn't exist or has been closed.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200"
          >
            Go Home
          </motion.button>
        </div>
      </div>
    );
  }

  // Not logged in - show invite preview
  if (!user) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl" />
            <div className={`absolute inset-0 bg-gradient-to-br ${personaColors[inviteInfo.persona] || personaColors.default} opacity-20`} />
            <div className="absolute inset-[1px] rounded-3xl border border-white/[0.08]" />

            <div className="relative p-8 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-white/10 mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                Join Group Chat
              </h1>

              <p className="text-white/60 mb-6">
                <span className="text-white font-medium">{inviteInfo.owner_nickname}</span> invited you to join
              </p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <p className="text-lg font-semibold text-white">{inviteInfo.chat_name}</p>
                <p className="text-white/50 text-sm mt-1">
                  {inviteInfo.participant_count} participant{inviteInfo.participant_count !== 1 ? 's' : ''} · {AI_PERSONAS[inviteInfo.persona].name}
                </p>
              </div>

              <p className="text-white/40 text-sm mb-6">
                Sign in to join this group chat
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className={`w-full py-4 rounded-xl bg-gradient-to-r ${personaColors[inviteInfo.persona] || personaColors.default} text-white font-semibold`}
              >
                Sign In to Join
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged in but not joined - show join button
  if (!isParticipant) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl" />
            <div className={`absolute inset-0 bg-gradient-to-br ${personaColors[inviteInfo.persona] || personaColors.default} opacity-20`} />
            <div className="absolute inset-[1px] rounded-3xl border border-white/[0.08]" />

            <div className="relative p-8 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-white/10 mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                {inviteInfo.chat_name}
              </h1>

              <p className="text-white/60 mb-6">
                Hosted by <span className="text-white font-medium">{inviteInfo.owner_nickname}</span>
              </p>

              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{inviteInfo.participant_count}</p>
                  <p className="text-white/50 text-sm">Participants</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-lg font-medium text-white">{AI_PERSONAS[inviteInfo.persona].name}</p>
                  <p className="text-white/50 text-sm">Persona</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoin}
                disabled={isJoining}
                className={`w-full py-4 rounded-xl bg-gradient-to-r ${personaColors[inviteInfo.persona] || personaColors.default} text-white font-semibold flex items-center justify-center gap-2`}
              >
                {isJoining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Jump in Group Chat
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Full group chat view
  return (
    <div className={`h-screen ${theme.background} flex flex-col`}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </motion.button>

            <div>
              <h1 className="text-lg font-semibold text-white">{groupChat?.name}</h1>
              <p className="text-xs text-white/50">
                {groupChat?.participants.length} participant{groupChat?.participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyShareLink}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Users className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {groupChat?.messages.map((msg, index) => (
            <GroupMessage
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender_id === user?.id}
              persona={groupChat.persona}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                style={{ maxHeight: '120px' }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className={`p-3 rounded-xl bg-gradient-to-r ${personaColors[groupChat?.persona || 'default']} text-white disabled:opacity-50`}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Participants sidebar */}
      <AnimatePresence>
        {showParticipants && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowParticipants(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#0a0a0f] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Participants</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowParticipants(false)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </motion.button>
                </div>

                <div className="space-y-3">
                  {groupChat?.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {participant.avatar_url ? (
                          <img src={participant.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-medium">
                            {participant.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {participant.nickname}
                          {participant.user_id === user?.id && (
                            <span className="text-white/40 text-sm ml-2">(you)</span>
                          )}
                        </p>
                        {participant.is_owner && (
                          <p className="text-purple-400 text-xs">Host</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Group message component
interface GroupMessageProps {
  message: GroupChatMessage;
  isOwnMessage: boolean;
  persona: keyof typeof AI_PERSONAS;
}

function GroupMessage({ message, isOwnMessage, persona }: GroupMessageProps) {
  const isAI = message.isAI;

  const personaColors = {
    default: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
    girlie: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    pro: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  };

  // AI messages
  if (isAI) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div className={`max-w-[80%] p-4 rounded-2xl bg-gradient-to-r ${personaColors[persona] || personaColors.default} border`}>
          <p className="text-purple-400 text-xs font-medium mb-2">
            {AI_PERSONAS[persona].name}
          </p>
          <div className="text-white/90 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  }

  // Own messages - right side
  if (isOwnMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] p-4 rounded-2xl bg-white/10 border border-white/10">
          <div className="text-white/90">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  // Other users' messages - right side with attribution (like TimeMachine style)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end"
    >
      <div className="max-w-[80%]">
        {/* Sender info above message */}
        <div className="flex items-center gap-2 mb-1 justify-end">
          {message.sender_avatar && (
            <img
              src={message.sender_avatar}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          )}
          <span className="text-white/50 text-xs font-medium">
            {message.sender_nickname}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <div className="text-white/90">
            {message.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
