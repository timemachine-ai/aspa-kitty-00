import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, X, CornerDownRight } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { ChatInputProps, ImageDimensions } from '../../types/chat';
import { LoadingSpinner } from '../loading/LoadingSpinner';
import { ImagePreview } from './ImagePreview';
import { AI_PERSONAS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MentionCall } from './MentionCall';
import { uploadImage } from '../../services/image/imageService';
import { GroupChatParticipant } from '../../types/groupChat';

type Persona = keyof typeof AI_PERSONAS;

export interface ReplyTo {
  id: number;
  content: string;
  sender_nickname?: string;
  isAI: boolean;
}

const personaStyles = {
  glowColors: {
    default: 'rgba(139,0,255,0.7)',
    girlie: 'rgba(199,21,133,0.7)',
    pro: 'rgba(34,211,238,0.7)'
  },
  borderColors: {
    default: 'from-purple-600/20 to-blue-600/20',
    girlie: 'from-pink-500/20 to-rose-400/20',
    pro: 'from-cyan-600/20 to-blue-600/20'
  },
  focusGlow: {
    default: 'focus:shadow-[0_0_30px_2px_rgba(139,0,255,0.4)]',
    girlie: 'focus:shadow-[0_0_30px_2px_rgba(199,21,133,0.4)]',
    pro: 'focus:shadow-[0_0_30px_2px_rgba(34,211,238,0.4)]'
  },
  hoverGlow: {
    default: 'hover:shadow-[0_0_25px_rgba(139,0,255,0.5)]',
    girlie: 'hover:shadow-[0_0_25px_rgba(199,21,133,0.7)]',
    pro: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]'
  }
} as const;

const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Get image dimensions from a File
const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

interface ExtendedChatInputProps extends ChatInputProps {
  currentPersona?: Persona;
  isGroupMode?: boolean;
  participants?: GroupChatParticipant[];
  replyTo?: ReplyTo | null;
  onClearReply?: () => void;
}

export function ChatInput({ onSendMessage, isLoading, currentPersona = 'default' as Persona, isGroupMode, participants, replyTo, onClearReply }: ExtendedChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [showMentionCall, setShowMentionCall] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviewUrls]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Store scroll position before resize
      const scrollTop = textarea.scrollTop;

      // Reset height to measure content
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${newHeight}px`;

      // Restore scroll position
      textarea.scrollTop = scrollTop;
    }
  }, [message]);

  // Global keydown listener for type-to-chat functionality
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Check if any input element is currently focused
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return; // Don't interfere with other inputs
      }

      // Check if the key is a printable character
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.shiftKey // Allow shift for capital letters
      ) {
        // Focus the textarea and let the browser handle the input
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImages.length > 0) && !isLoading && !isUploading) {
      // Close mention modal when sending message
      setShowMentionCall(false);

      if (selectedImages.length > 0) {
        setIsUploading(true);
        try {
          // Get dimensions of the first image (for edit operations)
          const firstImageDimensions = await getImageDimensions(selectedImages[0]);

          const base64Images = await Promise.all(selectedImages.map(convertImageToBase64));

          // Upload images using the new service (uses Supabase for logged in users, ImgBB for anonymous)
          const uploadResults = await Promise.all(
            base64Images.map(base64Image => uploadImage(base64Image, user?.id))
          );

          const successfulUploads = uploadResults.filter(result => result.success);

          if (successfulUploads.length === 0) {
            alert('Failed to upload images. Please try again.');
            setIsUploading(false);
            return;
          }

          const publicUrls = successfulUploads.map(result => result.url);
          setUploadedImageUrls(publicUrls);

          await onSendMessage(message, base64Images, undefined, publicUrls, firstImageDimensions);
          setSelectedImages([]);
          setImagePreviewUrls([]);
          setUploadedImageUrls([]);
        } catch (error) {
          alert('Failed to process images. Please try again.');
          console.error('Error processing images:', error);
        } finally {
          setIsUploading(false);
        }
      } else {
        await onSendMessage(message);
      }
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape' && showMentionCall) {
      setShowMentionCall(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (newValue.endsWith('@')) {
      setShowMentionCall(true);
    } else if (showMentionCall) {
      // Check if user has completed typing a mention (case-insensitive)
      const completedMention = newValue.match(/@(chatgpt|gemini|claude|grok)\s/i);
      if (completedMention || !newValue.includes('@')) {
        setShowMentionCall(false);
      }
    }
  };

  const handleMentionSelect = (command: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPosition) + command.slice(1) + ' ' + message.slice(cursorPosition);
    setMessage(newMessage);
    setShowMentionCall(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPosition = cursorPosition + command.length;
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) {
      alert('You can upload a maximum of 4 images.');
      return;
    }
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validImageFiles = files.filter(file => validImageTypes.includes(file.type));
    if (validImageFiles.length === 0) {
      alert('Please select valid image files (JPEG, PNG, GIF, WebP).');
      return;
    }
    setSelectedImages(validImageFiles);
    const urls = validImageFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isDesktop) {
      e.preventDefault();
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 4) {
      alert('You can upload a maximum of 4 images.');
      return;
    }
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validImageFiles = files.filter(file => validImageTypes.includes(file.type));
    if (validImageFiles.length === 0) {
      alert('Please drop valid image files (JPEG, PNG, GIF, WebP).');
      return;
    }
    setSelectedImages(validImageFiles);
    const urls = validImageFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const url = prev[index];
      URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto sticky bottom-4">
      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 mb-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl"
          >
            <CornerDownRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-purple-400 text-xs font-medium">
                Replying to {replyTo.isAI ? 'TimeMachine' : replyTo.sender_nickname || 'User'}
              </span>
              <p className="text-white/50 text-sm truncate">{replyTo.content}</p>
            </div>
            {onClearReply && (
              <button
                type="button"
                onClick={onClearReply}
                className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {imagePreviewUrls.length > 0 && currentPersona === 'default' && (
        <div className="flex gap-2 mb-4">
          {imagePreviewUrls.map((url, index) => (
            <ImagePreview
              key={index}
              url={url}
              onRemove={() => removeImage(index)}
              isUploading={isUploading}
            />
          ))}
        </div>
      )}
      {imagePreviewUrls.length > 0 && currentPersona !== 'default' && (
        <div className="flex gap-2 mb-4">
          {imagePreviewUrls.map((url, index) => (
            <ImagePreview
              key={index}
              url={url}
              onRemove={() => removeImage(index)}
              isUploading={isUploading}
            />
          ))}
        </div>
      )}
      <div className="relative" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="relative flex items-center gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleImageSelect}
            ref={fileInputRef}
            multiple
          />
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading || selectedImages.length >= 4}
            className={`p-3 rounded-full
              bg-gradient-to-r ${personaStyles.borderColors[currentPersona]}
              backdrop-blur-xl ${theme.text}
              disabled:opacity-50 relative group
              border border-white/10
              shadow-[0_0_15px_${personaStyles.glowColors[currentPersona]}]
              ${personaStyles.hoverGlow[currentPersona]}
              transition-all duration-300`}
          >
            <Plus className="w-5 h-5 relative z-10" />
          </motion.button>

          <div className="relative flex-1">
            <div className="relative flex items-center">
              <motion.textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Explore future"
                disabled={isLoading || isUploading}
                className={`w-full px-6 py-4 pr-32 rounded-[28px]
                  bg-gray-200/5 backdrop-blur-xl
                  ${theme.input.text} placeholder-gray-400
                  outline-none ${personaStyles.focusGlow[currentPersona]}
                  disabled:opacity-50
                  transition-shadow duration-300
                  text-base resize-none
                  overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
                style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.1)',
                  fontSize: '1rem',
                  minHeight: '56px',
                  maxHeight: '150px'
                }}
                rows={1}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <VoiceRecorder 
                  onSendMessage={onSendMessage}
                  disabled={isLoading || isUploading || message.trim().length > 0}
                  currentPersona={currentPersona}
                />

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading || isUploading || (!message.trim() && selectedImages.length === 0)}
                  className={`p-3 rounded-full
                    bg-gradient-to-r ${personaStyles.borderColors[currentPersona]}
                    backdrop-blur-xl
                    ${theme.text}
                    disabled:opacity-50 relative group
                    border border-white/10
                    shadow-[0_0_15px_${personaStyles.glowColors[currentPersona]}]
                    ${personaStyles.hoverGlow[currentPersona]}
                    transition-all duration-300`}
                >
                  {isLoading || isUploading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="w-5 h-5 relative z-10" />
                  )}
                </motion.button>
              </div>
            </div>

            <MentionCall
              isVisible={showMentionCall}
              onSelect={handleMentionSelect}
              currentPersona={currentPersona}
              isGroupMode={isGroupMode}
              participants={participants}
              currentUserId={user?.id}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
