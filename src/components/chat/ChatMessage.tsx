import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Smile, CornerDownRight } from 'lucide-react';
import { AIMessage } from './AIMessage';
import { UserMessage } from './UserMessage';
import { Message } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';

interface ChatMessageProps extends Message {
  isChatMode: boolean;
  onAnimationComplete: (messageId: number) => void;
  currentPersona: keyof typeof AI_PERSONAS;
  previousMessage?: string | null;
  isStreaming?: boolean;
  streamingMessageId?: number | null;
  isGroupMode?: boolean;
  currentUserId?: string;
  onReply?: (message: { id: number; content: string; sender_nickname?: string; isAI: boolean }) => void;
  onReact?: (messageId: number, emoji: string) => void;
}

// Quick react emoji options
const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export function ChatMessage({
  content,
  thinking,
  isAI,
  isChatMode,
  id,
  hasAnimated,
  onAnimationComplete,
  currentPersona,
  previousMessage,
  imageData,
  audioData,
  audioUrl,
  isStreaming,
  streamingMessageId,
  isGroupMode,
  currentUserId,
  sender_id,
  sender_nickname,
  sender_avatar,
  replyTo,
  reactions,
  onReply,
  onReact
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // In group mode, check if this message is from another user
  const isOtherUserMessage = isGroupMode && !isAI && sender_id && sender_id !== currentUserId;
  const isOwnMessage = !isAI && (!sender_id || sender_id === currentUserId);

  const handleReply = () => {
    if (onReply) {
      onReply({
        id,
        content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        sender_nickname: isAI ? 'TimeMachine' : sender_nickname,
        isAI
      });
    }
    setShowActions(false);
  };

  const handleReact = (emoji: string) => {
    if (onReact) {
      onReact(id, emoji);
    }
    setShowEmojiPicker(false);
    setShowActions(false);
  };

  // Render reply preview if this message is replying to another
  const renderReplyPreview = () => {
    if (!replyTo) return null;

    return (
      <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-lg bg-white/5 border-l-2 border-purple-500/50 text-sm">
        <CornerDownRight className="w-3 h-3 text-white/40 mt-1 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-purple-400 text-xs font-medium">
            {replyTo.isAI ? 'TimeMachine' : replyTo.sender_nickname || 'User'}
          </span>
          <p className="text-white/50 text-xs truncate">{replyTo.content}</p>
        </div>
      </div>
    );
  };

  // Render reactions if any
  const renderReactions = () => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactions).map(([emoji, userIds]) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 transition-colors"
          >
            <span>{emoji}</span>
            <span className="text-white/60">{userIds.length}</span>
          </button>
        ))}
      </div>
    );
  };

  // Render action buttons
  const renderActions = () => {
    if (!isGroupMode || !onReply) return null;

    return (
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1 bg-black/60 backdrop-blur-xl rounded-lg p-1 border border-white/10 z-10`}
          >
            <button
              onClick={handleReply}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="React"
              >
                <Smile className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl rounded-lg p-2 border border-white/10 flex gap-1"
                  >
                    {QUICK_REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="p-1.5 rounded hover:bg-white/10 text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (isAI) {
    return (
      <div
        className="relative group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowEmojiPicker(false);
        }}
      >
        {renderReplyPreview()}
        <AIMessage
          content={content}
          thinking={thinking}
          isChatMode={isChatMode}
          messageId={id}
          hasAnimated={hasAnimated}
          onAnimationComplete={onAnimationComplete}
          currentPersona={currentPersona}
          previousMessage={previousMessage}
          isStreaming={isStreaming}
          audioUrl={audioUrl}
          isStreamingActive={streamingMessageId === id}
        />
        {renderReactions()}
        {renderActions()}
      </div>
    );
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {renderReplyPreview()}
      <UserMessage
        content={content}
        imageData={imageData}
        audioData={audioData}
        sender_nickname={isOtherUserMessage ? sender_nickname : undefined}
        sender_avatar={isOtherUserMessage ? sender_avatar : undefined}
        isGroupMode={isGroupMode}
      />
      {renderReactions()}
      {renderActions()}
    </div>
  );
}
