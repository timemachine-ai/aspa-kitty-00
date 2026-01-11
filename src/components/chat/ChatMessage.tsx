import React from 'react';
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
}

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
  sender_avatar
}: ChatMessageProps) {
  // In group mode, check if this message is from another user
  const isOtherUserMessage = isGroupMode && !isAI && sender_id && sender_id !== currentUserId;
  if (isAI) {
    return (
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
    );
  }
  return (
    <UserMessage
      content={content}
      imageData={imageData}
      audioData={audioData}
      sender_nickname={isOtherUserMessage ? sender_nickname : undefined}
      sender_avatar={isOtherUserMessage ? sender_avatar : undefined}
      isGroupMode={isGroupMode}
    />
  );
}
