import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { Message } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { FlipWords } from '../ui/FlipWords';

interface ReplyTo {
  id: number;
  content: string;
  sender_nickname?: string;
  isAI: boolean;
}

interface ChatModeProps {
  messages: Message[];
  currentPersona: keyof typeof AI_PERSONAS;
  onMessageAnimated: (messageId: number) => void;
  error?: string | null;
  streamingMessageId?: number | null;
  isGroupMode?: boolean;
  currentUserId?: string;
  onReply?: (message: ReplyTo) => void;
  onReact?: (messageId: number, emoji: string) => void;
}

export function ChatMode({
  messages,
  currentPersona,
  onMessageAnimated,
  error,
  streamingMessageId,
  isGroupMode,
  currentUserId,
  onReply,
  onReact
}: ChatModeProps) {
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);

  // Smart scroll: positions user message at the top of viewport
  // No auto-scroll for AI messages - they naturally fill below
  const scrollUserMessageToTop = () => {
    const container = document.querySelector('.message-container');
    if (container && lastUserMessageRef.current) {
      // Small delay to ensure DOM has updated
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const messageRect = lastUserMessageRef.current!.getBoundingClientRect();

        // Calculate scroll position to put the message at the top
        // Add a small offset (20px) for visual breathing room
        const scrollOffset = messageRect.top - containerRect.top + container.scrollTop - 20;

        container.scrollTo({
          top: Math.max(0, scrollOffset),
          behavior: 'smooth'
        });
      });
    }
  };

  // Scroll to top when component mounts (new session loaded)
  useEffect(() => {
    const container = document.querySelector('.message-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  // Smart scroll effect: only scrolls for user messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only auto-scroll when user sends a message
      // AI messages don't trigger scroll - they fill naturally below
      if (!lastMessage.isAI) {
        scrollUserMessageToTop();
      }
    }
  }, [messages]);

  // Check if we should show welcome text (only initial message present)
  const showWelcomeText = messages.length === 1 && messages[0].id === 1;

  // Filter out the initial welcome message (id: 1) from rendering
  const displayMessages = messages.filter(m => m.id !== 1);

  return (
    <div className={`min-h-full pt-20 pb-48 ${theme.text}`}>
      <div className="w-full max-w-4xl mx-auto px-4">
        {error && (
          <div className="bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.25)] rounded-lg p-4 mb-4 text-[rgb(252,165,165)]">
            {error}
          </div>
        )}

        {/* Welcome Text - shown when no messages sent yet */}
        <AnimatePresence>
          {showWelcomeText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="h-[calc(100vh-16rem)] flex items-center justify-center"
            >
              <div className="text-lg sm:text-xl font-normal text-neutral-400 text-left px-4">
                <div className="flex items-center">
                  <span>Start a</span>
                  <FlipWords
                    words={["better", "brighter", "dream", '"my"']}
                    duration={2500}
                    className="text-purple-400"
                  />
                </div>
                <div>future with TimeMachine.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        {!showWelcomeText && (
          <div className="space-y-6">
            {displayMessages.map((message, index) => {
              // For AI messages, get the previous user message to detect @mentions
              const prevIndex = messages.findIndex(m => m.id === message.id) - 1;
              const previousMessage = message.isAI && prevIndex >= 0 ? messages[prevIndex].content : null;
              return (
                <div
                  key={message.id}
                  ref={index === displayMessages.length - 1 && !message.isAI ? lastUserMessageRef : null}
                >
                  <ChatMessage
                    {...message}
                    isChatMode={true}
                    onAnimationComplete={onMessageAnimated}
                    currentPersona={currentPersona}
                    previousMessage={previousMessage}
                    streamingMessageId={streamingMessageId}
                    isGroupMode={isGroupMode}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onReact={onReact}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} className="h-20" />
      </div>
    </div>
  );
}

