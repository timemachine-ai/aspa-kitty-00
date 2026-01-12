import React from 'react';
import { motion } from 'framer-motion';
import { MessageProps } from '../../types/chat';
import { slideInFromRight, slideInFromLeft } from '../../utils/animations';
import { useTheme } from '../../context/ThemeContext';
import { AudioPlayerBubble } from './AudioPlayerBubble';

export function UserMessage({ content, imageData, audioData, sender_nickname, sender_avatar, isGroupMode }: MessageProps) {
  const { theme } = useTheme();

  // Check if this is another user's message in group mode
  const isOtherUser = isGroupMode && sender_nickname;

  // Other users' messages align left (like AI), own messages align right
  const alignment = isOtherUser ? 'justify-start' : 'justify-end';
  const animation = isOtherUser ? slideInFromLeft : slideInFromRight;

  return (
    <motion.div
      {...animation}
      className={`flex items-start ${alignment}`}
    >
      <div className="max-w-[85%]">
        {/* Show sender info in group mode for other users */}
        {isOtherUser && (
          <div className="flex items-center gap-2 mb-1">
            {sender_avatar && (
              <img
                src={sender_avatar}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            <span className="text-white/50 text-xs font-medium">
              {sender_nickname}
            </span>
          </div>
        )}

        {/* Display audio message if present */}
        {audioData ? (
          <AudioPlayerBubble
            audioSrc={audioData}
            isUserMessage={!isOtherUser}
            className="w-full"
          />
        ) : (
          <div className={`px-4 py-2 rounded-2xl
            ${isOtherUser
              ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
              : 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
            }
            backdrop-blur-sm border
            ${theme.text} text-base`}
          >
          {/* Display images if present */}
          {imageData && (
            <div className="mb-3">
              {Array.isArray(imageData) ? (
                <div className="grid grid-cols-2 gap-2">
                  {imageData.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Uploaded image ${index + 1}`}
                      className="max-w-full h-auto rounded-lg object-cover max-h-48"
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={imageData}
                  alt="Uploaded image"
                  className="max-w-full h-auto rounded-lg object-cover max-h-48"
                />
              )}
            </div>
          )}

            {/* Display text content if present */}
            {content && <div>{content}</div>}
          </div>
        )}
      </div>
    </motion.div>
  );
}