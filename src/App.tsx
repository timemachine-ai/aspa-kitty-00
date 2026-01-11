import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ChatInput } from './components/chat/ChatInput';
import { BrandLogo } from './components/brand/BrandLogo';
import { MusicPlayer } from './components/music/MusicPlayer';
import { YouTubePlayer } from './components/music/YouTubePlayer';
import { Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { useAnonymousRateLimit } from './hooks/useAnonymousRateLimit';
import { AboutUsToast } from './components/about/AboutUsToast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatMode } from './components/chat/ChatMode';
import { StageMode } from './components/chat/StageMode';
import { RateLimitModal } from './components/modals/RateLimitModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { AuthModal, OnboardingModal, AccountPage } from './components/auth';
import { ChatHistoryPage } from './components/chat/ChatHistoryPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AlbumPage } from './components/album/AlbumPage';
import { MemoriesPage } from './components/memories/MemoriesPage';
import { HelpPage } from './components/help/HelpPage';
import { GroupChatPage } from './components/groupchat/GroupChatPage';
import { GroupChatJoinPage } from './components/groupchat/GroupChatJoinPage';
import { GroupChatModal } from './components/groupchat/GroupChatModal';
import { GroupSettingsPage } from './components/groupchat/GroupSettingsPage';
import { ACCESS_TOKEN_REQUIRED, MAINTENANCE_MODE, PRO_HEAT_LEVELS } from './config/constants';
import { ChatSession, getSupabaseSessions, getLocalSessions } from './services/chat/chatService';

// Chat by ID page component - defined OUTSIDE to prevent re-renders
function ChatByIdPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadChat() {
      if (!id) return;
      setIsLoading(true);

      try {
        let sessions: ChatSession[];
        if (user) {
          sessions = await getSupabaseSessions(user.id);
        } else {
          sessions = getLocalSessions();
        }

        const found = sessions.find(s => s.id === id);
        setSession(found || null);
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadChat();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center`}>
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className="text-white/50 text-lg mb-4">Chat not found</p>
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

  navigate('/');
  return null;
}

// Main Chat Page component - defined OUTSIDE to prevent re-renders
function MainChatPage() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
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
    youtubeMusic,
    currentSessionId,
    // Collaborative mode
    isCollaborative,
    collaborativeId,
    participants,
    // Actions
    handleSendMessage,
    handlePersonaChange,
    setCurrentProHeatLevel,
    startNewChat,
    markMessageAsAnimated,
    dismissAboutUs,
    dismissRateLimitModal,
    loadChat,
    clearYoutubeMusic,
    enableCollaborativeMode,
    joinCollaborativeChat
  } = useChat(user?.id, profile || undefined);

  const { isRateLimited, getRemainingMessages, incrementCount, isAnonymous } = useAnonymousRateLimit();

  // Derive chat name from first user message - memoized to prevent recalculation
  const currentChatName = useMemo(() => {
    const firstUserMessage = messages.find(msg => !msg.isAI);
    if (firstUserMessage?.content && firstUserMessage.content.trim()) {
      return firstUserMessage.content.slice(0, 50);
    }
    return 'New Chat';
  }, [messages]);

  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [isHeatLevelExpanded, setIsHeatLevelExpanded] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (!ACCESS_TOKEN_REQUIRED) return false;
    const accessGranted = localStorage.getItem('timeMachine_accessGranted');
    return accessGranted !== 'true';
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [authLoading, needsOnboarding]);

  // Handle joining collaborative chat from URL param (e.g., /?collaborative=abc123)
  useEffect(() => {
    const collaborativeParam = searchParams.get('collaborative');
    if (collaborativeParam && user && !authLoading && !isCollaborative) {
      // Clear the URL param and join the session
      searchParams.delete('collaborative');
      setSearchParams(searchParams, { replace: true });

      joinCollaborativeChat(collaborativeParam).then(success => {
        if (!success) {
          console.error('Failed to join collaborative chat:', collaborativeParam);
        }
      });
    }
  }, [searchParams, setSearchParams, user, authLoading, isCollaborative, joinCollaborativeChat]);

  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    return () => window.removeEventListener('resize', updateVH);
  }, []);

  // Memoize button styles to prevent recalculation
  const personaBackgroundColors: Record<string, string> = useMemo(() => ({
    default: 'rgba(139,0,255,0.2)',
    girlie: 'rgba(199,21,133,0.2)',
    pro: 'rgba(30,144,255,0.2)'
  }), []);

  const buttonStyles = useMemo(() => ({
    bg: personaBackgroundColors[currentPersona] || personaBackgroundColors.default,
    text: theme.text,
  }), [currentPersona, theme.text, personaBackgroundColors]);

  const heatLevelButtonStyles = useMemo(() => ({
    border: isHeatLevelExpanded ? '1px solid rgb(30,144,255)' : 'none',
    bg: isHeatLevelExpanded ? 'rgba(30,144,255,0.3)' : 'rgba(30,144,255,0.2)',
    shadow: isHeatLevelExpanded ? '0 0 20px rgba(30,144,255,0.8)' : 'none',
    text: isHeatLevelExpanded ? 'rgb(135,206,250)' : theme.text,
  }), [isHeatLevelExpanded, theme.text]);

  const handleAccessGranted = useCallback(() => {
    setShowWelcomeModal(false);
  }, []);

  // Memoized send message handler
  const handleSendMessageWithRateLimit = useCallback(async (
    message: string,
    imageUrl?: string,
    audioData?: string,
    imageUrls?: string[]
  ) => {
    const mentionMatch = message.match(/^@(chatgpt|gemini|claude|grok|girlie|pro)\s/i);
    const targetModel = mentionMatch ? mentionMatch[1].toLowerCase() : currentPersona;

    if (isAnonymous && isRateLimited(targetModel)) {
      let authMessage: string;
      if (targetModel === 'pro') {
        authMessage = "PRO mode requires a TimeMachine ID. Create one to access advanced features!";
      } else if (targetModel === 'girlie') {
        authMessage = "Girlie mode requires a TimeMachine ID. Create one to unlock this persona!";
      } else if (targetModel === 'gemini') {
        authMessage = "@Gemini requires a TimeMachine ID. Create one to chat with Gemini!";
      } else if (targetModel === 'claude') {
        authMessage = "@Claude requires a TimeMachine ID. Create one to chat with Claude!";
      } else if (targetModel === 'grok') {
        authMessage = "@Grok requires a TimeMachine ID. Create one to chat with Grok!";
      } else {
        authMessage = "You've used your 3 free messages! Create a TimeMachine ID to continue chatting.";
      }
      setAuthModalMessage(authMessage);
      setShowAuthModal(true);
      return;
    }

    if (isAnonymous) {
      incrementCount(targetModel);
    }

    await handleSendMessage(message, imageUrl, audioData, imageUrls);
  }, [currentPersona, isAnonymous, isRateLimited, incrementCount, handleSendMessage]);

  const handleOpenAuth = useCallback(() => {
    setAuthModalMessage(undefined);
    setShowAuthModal(true);
  }, []);

  const handleOpenAccount = useCallback(() => {
    navigate('/account');
  }, [navigate]);

  const handleOpenHistory = useCallback(() => {
    navigate('/history');
  }, [navigate]);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const handleGroupChatCreated = useCallback(async (chatName: string): Promise<string | null> => {
    const shareId = await enableCollaborativeMode(chatName);
    if (shareId) {
      console.log('Collaborative mode enabled:', shareId);
    }
    return shareId;
  }, [enableCollaborativeMode]);

  if (MAINTENANCE_MODE) {
    window.location.href = '/maintenance.html';
    return null;
  }

  if (showWelcomeModal) {
    return (
      <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}>
        <WelcomeModal
          isOpen={showWelcomeModal}
          onAccessGranted={handleAccessGranted}
        />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className={`min-h-screen ${theme.background} ${theme.text} flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <main className="relative h-screen flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-transparent">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <BrandLogo
              currentPersona={currentPersona}
              onPersonaChange={handlePersonaChange}
              onLoadChat={loadChat}
              onStartNewChat={startNewChat}
              onOpenAuth={handleOpenAuth}
              onOpenAccount={handleOpenAccount}
              onOpenHistory={handleOpenHistory}
              onOpenSettings={handleOpenSettings}
            />
            <div className="flex items-center gap-2">
              {isAnonymous && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
                  <span>{getRemainingMessages(currentPersona)} free messages left</span>
                </div>
              )}

              {isAnonymous ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenAuth}
                  style={{
                    background: buttonStyles.bg,
                    color: buttonStyles.text,
                    borderRadius: '9999px',
                    backdropFilter: 'blur(10px)',
                    outline: 'none',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label="Sign Up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.00006 7.63576C4.6208 4.29965 8.04185 2 12 2C17.5229 2 22 6.47715 22 12C22 17.5228 17.5229 22 12 22C8.04185 22 4.6208 19.7004 3.00006 16.3642" />
                    <path d="M11 8C11 8 15 10.946 15 12C15 13.0541 11 16 11 16M14.5 12H2" />
                  </svg>
                  <span style={{ fontSize: '14px', color: buttonStyles.text }}>Sign Up</span>
                </motion.button>
              ) : currentPersona === 'pro' ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsHeatLevelExpanded(!isHeatLevelExpanded)}
                    style={{
                      background: heatLevelButtonStyles.bg,
                      color: heatLevelButtonStyles.text,
                      border: heatLevelButtonStyles.border,
                      boxShadow: heatLevelButtonStyles.shadow,
                      borderRadius: '9999px',
                      backdropFilter: 'blur(10px)',
                      outline: 'none',
                      borderWidth: '0px',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={isHeatLevelExpanded ? "Close Heat Level" : "Open Heat Level"}
                  >
                    <Star style={{ width: '16px', height: '16px', color: heatLevelButtonStyles.text }} />
                    <span style={{ fontSize: '14px', color: heatLevelButtonStyles.text }}>
                      Heat Level {currentProHeatLevel}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {isHeatLevelExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute top-full right-0 mt-3 w-72 bg-black/10 backdrop-blur-3xl rounded-3xl z-50 overflow-hidden border border-white/5"
                        style={{
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
                        }}
                      >
                        {Object.entries(PRO_HEAT_LEVELS).map(([level, config]) => (
                          <motion.button
                            key={level}
                            whileHover={{
                              scale: 1.03,
                              background: 'linear-gradient(90deg, rgba(30,144,255,0.2) 0%, transparent 100%)'
                            }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setCurrentProHeatLevel(parseInt(level));
                              setIsHeatLevelExpanded(false);
                            }}
                            className={`w-full px-4 py-3 text-left transition-all duration-300
                              ${currentProHeatLevel === parseInt(level) ? 'text-cyan-400' : theme.text}
                              ${currentProHeatLevel === parseInt(level) ? 'bg-gradient-to-r from-cyan-500/20 to-black/10' : 'bg-transparent'}
                              flex flex-col gap-1 border-b border-white/5 last:border-b-0`}
                            style={{
                              background: currentProHeatLevel === parseInt(level) ?
                                'linear-gradient(to right, rgba(30,144,255,0.2), rgba(0,0,0,0.1))' :
                                'transparent'
                            }}
                          >
                            <div className="font-bold text-sm">{config.name}</div>
                            <div className={`text-xs opacity-70 ${theme.text}`}>
                              {config.description}
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (currentPersona === 'default' || currentPersona === 'girlie') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGroupChatModal(true)}
                  style={{
                    background: buttonStyles.bg,
                    color: buttonStyles.text,
                    borderRadius: '9999px',
                    backdropFilter: 'blur(10px)',
                    outline: 'none',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label="Open Group Chat"
                >
                  <Users style={{ width: '16px', height: '16px', color: buttonStyles.text }} />
                  <span style={{ fontSize: '14px', color: buttonStyles.text }}>Group Chat</span>
                </motion.button>
              )}
            </div>
          </div>
        </header>

        <MusicPlayer
          currentPersona={currentPersona}
          currentEmotion={currentEmotion}
          isCenterStage={false}
        />

        {youtubeMusic && (
          <YouTubePlayer
            musicData={youtubeMusic}
            onClose={clearYoutubeMusic}
            currentPersona={currentPersona}
          />
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar message-container">
          {isChatMode ? (
            <ChatMode
              messages={messages}
              currentPersona={currentPersona}
              onMessageAnimated={markMessageAsAnimated}
              error={error}
              streamingMessageId={streamingMessageId}
              isCollaborative={isCollaborative}
              currentUserId={user?.id}
            />
          ) : (
            <StageMode
              messages={messages}
              currentPersona={currentPersona}
              onMessageAnimated={markMessageAsAnimated}
              streamingMessageId={streamingMessageId}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessageWithRateLimit}
              isLoading={isLoading}
              currentPersona={currentPersona}
            />
          </div>
        </div>

        <AboutUsToast
          isVisible={showAboutUs}
          onClose={dismissAboutUs}
          onClick={() => window.open('https://timemachine.notion.site', '_blank')}
          currentPersona={currentPersona}
        />

        <RateLimitModal
          isOpen={showRateLimitModal}
          onClose={dismissRateLimitModal}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message={authModalMessage}
        />

        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />

        <GroupChatModal
          isOpen={showGroupChatModal}
          onClose={() => setShowGroupChatModal(false)}
          sessionId={currentSessionId}
          chatName={currentChatName || 'Group Chat'}
          persona={currentPersona}
          onGroupChatCreated={handleGroupChatCreated}
        />
      </main>
    </div>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get loadChat function for history page
  const { loadChat } = useChat(user?.id);

  return (
    <Routes>
      <Route path="/" element={<MainChatPage />} />
      <Route path="/account" element={
        <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}>
          <AccountPage onBack={() => navigate('/')} />
        </div>
      } />
      <Route path="/history" element={
        <ChatHistoryPage onLoadChat={(session) => {
          loadChat(session);
          navigate('/');
        }} />
      } />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/album" element={<AlbumPage />} />
      <Route path="/memories" element={<MemoriesPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/chat/:id" element={<ChatByIdPage />} />
      <Route path="/groupchat/:id" element={<GroupChatJoinPage />} />
      <Route path="/groupchat/:id/old" element={<GroupChatPage />} />
      <Route path="/groupchat/:id/settings" element={<GroupSettingsPage />} />
    </Routes>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithAuth />
    </ThemeProvider>
  );
}
