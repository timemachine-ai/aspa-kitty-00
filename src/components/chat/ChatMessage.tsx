import React from 'react';
import { AIMessage } from './AIMessage';
import { UserMessage } from './UserMessage';
import { ParticipantMessage } from './ParticipantMessage';
import { Message } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';

interface ChatMessageProps extends Message {
  isChatMode: boolean;
  onAnimationComplete: (messageId: number) => void;
  currentPersona: keyof typeof AI_PERSONAS;
  previousMessage?: string | null;
  isStreaming?: boolean;
  streamingMessageId?: number | null;
  // Collaborative mode props
  isCollaborative?: boolean;
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
  // Collaborative props
  isCollaborative,
  currentUserId,
  senderId,
  senderNickname,
}: ChatMessageProps) {
  // AI messages - always render as AIMessage
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

  // In collaborative mode, check if this is another participant's message
  if (isCollaborative && senderId && currentUserId && senderId !== currentUserId) {
    return (
      <ParticipantMessage
        content={content}
        isChatMode={isChatMode}
        messageId={id}
        hasAnimated={hasAnimated}
        onAnimationComplete={onAnimationComplete}
        senderNickname={senderNickname || 'User'}
        imageData={imageData}
        audioData={audioData}
        audioUrl={audioUrl}
      />
    );
  }

  // Own messages - right-aligned bubble
  return (
    <UserMessage
      content={content}
      imageData={imageData}
      audioData={audioData}
    />
  );
}

