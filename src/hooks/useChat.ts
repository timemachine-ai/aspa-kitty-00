import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, ImageDimensions } from '../types/chat';
import { generateAIResponse, generateAIResponseStreaming, YouTubeMusicData, UserMemoryContext } from '../services/ai/aiProxyService';
import { INITIAL_MESSAGE, AI_PERSONAS } from '../config/constants';
import { chatService, ChatSession } from '../services/chat/chatService';
import { processGeneratedImages } from '../services/image/imageService';

// Generate a proper UUID for session IDs
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useChat(userId?: string | null, userProfile?: { nickname?: string | null; about_me?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([{ ...INITIAL_MESSAGE, hasAnimated: false }]);
  const [isChatMode, setChatMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<keyof typeof AI_PERSONAS>('default');
  const [currentProHeatLevel, setCurrentProHeatLevel] = useState<number>(2);
  const [currentEmotion, setCurrentEmotion] = useState<string>('joy');
  const [error, setError] = useState<string | null>(null);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [youtubeMusic, setYoutubeMusic] = useState<YouTubeMusicData | null>(null);

  // Track if save is pending to debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if streaming is in progress - don't save during streaming (AI message is incomplete)
  const isStreamingRef = useRef<boolean>(false);

  // Update chatService with userId when it changes
  useEffect(() => {
    chatService.setUserId(userId || null);
  }, [userId]);

  // Set theme based on persona
  const setPersonaTheme = useCallback((persona: keyof typeof AI_PERSONAS) => {
    let themeToSet: string;

    switch (persona) {
      case 'girlie':
        themeToSet = 'springDark';
        break;
      case 'pro':
        themeToSet = 'summerDark';
        break;
      default:
        themeToSet = 'autumnDark';
    }

    window.dispatchEvent(new CustomEvent('themeChange', { detail: themeToSet }));
  }, []);

  // Save chat session function - uses chatService which handles both local and Supabase
  const saveChatSession = useCallback((sessionId: string, messagesToSave: Message[], persona: keyof typeof AI_PERSONAS, forceImmediate: boolean = false) => {
    // Don't save while streaming is in progress (AI message is incomplete/empty)
    if (isStreamingRef.current && !forceImmediate) {
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const doSave = async () => {
      try {
        const now = new Date().toISOString();
        const firstUserMessage = messagesToSave.find(msg => !msg.isAI);
        let sessionName = 'New Chat';

        if (firstUserMessage) {
          if (firstUserMessage.content && firstUserMessage.content.trim() &&
              firstUserMessage.content !== '[Image message]' && firstUserMessage.content !== '[Audio message]') {
            sessionName = firstUserMessage.content.slice(0, 50);
          } else if (firstUserMessage.imageData || (firstUserMessage.inputImageUrls && firstUserMessage.inputImageUrls.length > 0)) {
            sessionName = 'Image message';
          } else if (firstUserMessage.audioData) {
            sessionName = 'Audio message';
          }
        }

        const session: ChatSession = {
          id: sessionId,
          name: sessionName,
          messages: messagesToSave,
          persona,
          heat_level: persona === 'pro' ? currentProHeatLevel : undefined,
          createdAt: now,
          lastModified: now
        };

        await chatService.saveSession(session);
      } catch (error) {
        console.error('Failed to save chat session:', error);
      }
    };

    if (forceImmediate) {
      // Save immediately without debounce (used when switching sessions)
      doSave();
    } else {
      // Debounce saves to avoid too many requests
      saveTimeoutRef.current = setTimeout(doSave, 500);
    }
  }, [currentProHeatLevel]);

  // Handle persona change
  const handlePersonaChange = useCallback((persona: keyof typeof AI_PERSONAS) => {
    // Cancel any pending saves to avoid race conditions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save current session immediately before switching (only if not streaming)
    if (currentSessionId && messages.length > 1 && !isStreamingRef.current) {
      saveChatSession(currentSessionId, messages, currentPersona, true); // Force immediate save
    }

    // Clear streaming state if somehow still set
    isStreamingRef.current = false;
    setStreamingMessageId(null);
    setIsLoading(false);

    setCurrentPersona(persona);

    // Reset heat level to 2 when switching to pro persona
    if (persona === 'pro') {
      setCurrentProHeatLevel(2);
    }

    setError(null);

    // Start new chat with new persona
    const newSessionId = generateUUID();
    setCurrentSessionId(newSessionId);

    const initialMessage = cleanContent(AI_PERSONAS[persona].initialMessage);
    setMessages([{
      id: Date.now(),
      content: initialMessage,
      isAI: true,
      hasAnimated: false
    }]);

    // Set theme based on the new persona
    setPersonaTheme(persona);
  }, [currentSessionId, messages, currentPersona, saveChatSession, setPersonaTheme]);

  // Start new chat function
  const startNewChat = useCallback(() => {
    // Cancel any pending saves to avoid race conditions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save current session immediately before starting new one (only if not streaming)
    if (currentSessionId && messages.length > 1 && !isStreamingRef.current) {
      saveChatSession(currentSessionId, messages, currentPersona, true); // Force immediate save
    }

    // Clear streaming state if somehow still set
    isStreamingRef.current = false;
    setStreamingMessageId(null);
    setIsLoading(false);

    // Start fresh chat with same persona
    const newSessionId = generateUUID();
    setCurrentSessionId(newSessionId);

    const initialMessage = cleanContent(AI_PERSONAS[currentPersona].initialMessage);
    setMessages([{
      id: Date.now(),
      content: initialMessage,
      isAI: true,
      hasAnimated: false
    }]);

    setError(null);
  }, [currentSessionId, messages, currentPersona, saveChatSession]);

  // Handle streaming message updates
  const updateStreamingMessage = useCallback((messageId: number, content: string, append: boolean = true) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, content: append ? msg.content + content : content }
        : msg
    ));
  }, []);

  // Complete streaming message
  const completeStreamingMessage = useCallback(async (messageId: number, finalContent: string, thinking?: string, audioUrl?: string) => {
    let processedContent = finalContent;

    // If user is logged in and content has generated images, upload them to Supabase
    if (userId && finalContent.includes('![Generated Image](/api/image?')) {
      try {
        processedContent = await processGeneratedImages(finalContent, userId);
      } catch (error) {
        console.error('Failed to process generated images:', error);
      }
    }

    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, content: processedContent, thinking, audioUrl, hasAnimated: false }
        : msg
    ));
    setStreamingMessageId(null);
    setIsLoading(false);
    isStreamingRef.current = false; // Mark streaming as complete - now it's safe to save
  }, [userId]);

  const extractEmotion = (content: string): string | null => {
    const match = content.match(/<emotion>([a-z]+)<\/emotion>/i);
    if (!match) return null;

    const emotion = match[1].toLowerCase();
    const validEmotions = [
      'sadness', 'joy', 'love', 'excitement', 'anger',
      'motivation', 'jealousy', 'relaxation', 'anxiety', 'hope'
    ];

    return validEmotions.includes(emotion) ? emotion : 'joy';
  };

  const cleanContent = (content: string): string => {
    const emotion = extractEmotion(content);
    if (emotion) {
      return content.replace(/<emotion>[a-z]+<\/emotion>/i, '').replace(/<reason>[\s\S]*?<\/reason>/i, '').trim();
    }
    return content.replace(/<reason>[\s\S]*?<\/reason>/i, '').trim();
  };

  // Dismiss rate limit modal
  const dismissRateLimitModal = useCallback(() => {
    setShowRateLimitModal(false);
  }, []);

  // Clear YouTube music
  const clearYoutubeMusic = useCallback(() => {
    setYoutubeMusic(null);
  }, []);

  // Save chat session when messages change (but not on initial load, and not during streaming)
  useEffect(() => {
    // Don't auto-save if:
    // - Only 1 message (initial state)
    // - No session ID
    // - Currently streaming (AI message is incomplete)
    if (messages.length > 1 && currentSessionId && !isStreamingRef.current) {
      saveChatSession(currentSessionId, messages, currentPersona);
    }
  }, [messages, currentSessionId, currentPersona, saveChatSession]);

  // Initialize session ID on first load
  useEffect(() => {
    if (!currentSessionId) {
      setCurrentSessionId(generateUUID());
    }
  }, [currentSessionId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback(async (content: string, imageData?: string | string[], audioData?: string, inputImageUrls?: string[], imageDimensions?: ImageDimensions) => {
    let messagePersona = currentPersona;
    let messageContent = content;

    // Check for @persona mentions (case-insensitive)
    const mentionMatch = content.match(/^@(chatgpt|gemini|claude|grok|girlie|pro)\s+(.+)$/i);
    if (mentionMatch) {
      const mentionedModel = mentionMatch[1].toLowerCase();
      messagePersona = mentionedModel as keyof typeof AI_PERSONAS;
      messageContent = mentionMatch[2];
    }

    // Handle audio/image data - if we have audio/images but no text content, create a message indicating the input type
    let finalContent = messageContent;
    if (audioData && !messageContent.trim()) {
      finalContent = '[Audio message]'; // Placeholder text for UI
    } else if ((imageData || (inputImageUrls && inputImageUrls.length > 0)) && !messageContent.trim()) {
      finalContent = '[Image message]'; // Placeholder text for UI
    }

    // Create user message with content for display
    // Use finalContent if it's a placeholder for image/audio-only messages, otherwise keep original content
    const displayContent = (finalContent === '[Image message]' || finalContent === '[Audio message]') ? finalContent : content;
    const userMessage: Message = {
      id: Date.now(),
      content: displayContent, // Use placeholder for image/audio-only, otherwise original content
      isAI: false,
      hasAnimated: false,
      imageData: imageData,
      audioData: audioData,
      inputImageUrls: inputImageUrls,
      imageDimensions: imageDimensions
    };

    // Create API message with cleaned content (without @mention) for API call
    const apiUserMessage: Message = {
      id: Date.now(),
      content: finalContent,
      isAI: false,
      hasAnimated: false,
      imageData: imageData,
      audioData: audioData,
      inputImageUrls: inputImageUrls,
      imageDimensions: imageDimensions
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create placeholder AI message for streaming
    const aiMessageId = Date.now() + 1;
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      isAI: true,
      hasAnimated: false
    };

    setMessages(prev => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId);
    isStreamingRef.current = true; // Mark streaming as started

    // Filter out initial welcome message (ID: 1) - it's just for UI aesthetics
    const apiMessages = [...messages, apiUserMessage].filter(msg => msg.id !== 1);

    // Prepare user memory context from profile
    const userMemoryContext: UserMemoryContext | undefined = userProfile ? {
      nickname: userProfile.nickname || undefined,
      about_me: userProfile.about_me || undefined
    } : undefined;

    if (useStreaming) {
      // Use streaming response - send API messages (without @mention in content and without initial message)
      generateAIResponseStreaming(
        apiMessages,
        imageData,
        '', // System prompt is now handled server-side
        messagePersona,
        audioData,
        messagePersona === 'pro' ? currentProHeatLevel : undefined,
        inputImageUrls,
        imageDimensions,
        // onChunk callback
        (chunk: string) => {
          updateStreamingMessage(aiMessageId, chunk, true);
        },
        // onComplete callback
        (response) => {
          const emotion = extractEmotion(response.content);
          const cleanedContent = cleanContent(response.content);

          if (emotion) {
            setCurrentEmotion(emotion);
          }

          // Handle YouTube music if present
          if (response.youtubeMusic) {
            setYoutubeMusic(response.youtubeMusic);
          }

          completeStreamingMessage(aiMessageId, cleanedContent, response.thinking, response.audioUrl);
        },
        // onError callback
        (error) => {
          console.error('Failed to generate streaming response:', error);

          // Check if it's a rate limit error
          if (error && typeof error === 'object' && 'type' in error && error.type === 'rateLimit') {
            setShowRateLimitModal(true);
          } else {
            setError('Failed to generate response. Please try again.');
          }

          // Remove the placeholder message on error
          setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
          setStreamingMessageId(null);
          setIsLoading(false);
          isStreamingRef.current = false; // Clear streaming flag on error
        },
        userId || undefined,
        userMemoryContext
      );
    } else {
      // Use non-streaming response (fallback) - send API messages (without @mention in content and without initial message)
      try {
        const aiResponse = await generateAIResponse(
          apiMessages,
          imageData,
          '', // System prompt is now handled server-side
          messagePersona,
          audioData,
          messagePersona === 'pro' ? currentProHeatLevel : undefined,
          inputImageUrls,
          imageDimensions,
          userId || undefined,
          userMemoryContext
        );

        const emotion = extractEmotion(aiResponse.content);
        const cleanedContent = cleanContent(aiResponse.content);

        if (emotion) {
          setCurrentEmotion(emotion);
        }

        completeStreamingMessage(aiMessageId, cleanedContent, aiResponse.thinking, aiResponse.audioUrl);
      } catch (error) {
        console.error('Failed to generate response:', error);

        // Check if it's a rate limit error
        if (error && typeof error === 'object' && 'type' in error && error.type === 'rateLimit') {
          setShowRateLimitModal(true);
        } else {
          setError('Failed to generate response. Please try again.');
        }

        // Remove the placeholder message on error
        setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
        setStreamingMessageId(null);
        setIsLoading(false);
        isStreamingRef.current = false; // Clear streaming flag on error
      }
    }
  }, [messages, currentPersona, currentProHeatLevel, userId, userProfile]);

  const markMessageAsAnimated = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, hasAnimated: true } : msg
    ));
  }, []);

  const dismissAboutUs = useCallback(() => {
    setShowAboutUs(false);
  }, []);

  const loadChat = useCallback((session: ChatSession) => {
    // Cancel any pending saves to avoid race conditions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save current session immediately before loading new one (only if not streaming)
    if (currentSessionId && messages.length > 1 && !isStreamingRef.current) {
      saveChatSession(currentSessionId, messages, currentPersona, true); // Force immediate save
    }

    // Clear streaming state if somehow still set
    isStreamingRef.current = false;
    setStreamingMessageId(null);
    setIsLoading(false);

    // Filter out any empty messages from the loaded session
    const validMessages = session.messages.filter(msg => msg.content && msg.content.trim() !== '');

    // Ensure we have at least the initial message if all messages were empty
    const messagesToLoad = validMessages.length > 0
      ? validMessages
      : [{ id: Date.now(), content: cleanContent(AI_PERSONAS[session.persona].initialMessage), isAI: true, hasAnimated: false }];

    // Update all state together
    setCurrentPersona(session.persona);
    setMessages(messagesToLoad);
    setChatMode(true);
    setCurrentSessionId(session.id);
    setPersonaTheme(session.persona);
    setError(null);

    // Set heat level if it's a pro session
    if (session.heat_level) {
      setCurrentProHeatLevel(session.heat_level);
    }
  }, [currentSessionId, messages, currentPersona, saveChatSession, setPersonaTheme]);

  return {
    messages,
    isChatMode,
    isLoading,
    currentPersona,
    currentProHeatLevel,
    currentEmotion,
    error,
    showAboutUs,
    showRateLimitModal,
    streamingMessageId,
    useStreaming,
    youtubeMusic,
    currentSessionId,
    setChatMode,
    handleSendMessage,
    handlePersonaChange,
    setCurrentProHeatLevel,
    startNewChat,
    markMessageAsAnimated,
    dismissAboutUs,
    dismissRateLimitModal,
    loadChat,
    setUseStreaming,
    clearYoutubeMusic
  };
}
