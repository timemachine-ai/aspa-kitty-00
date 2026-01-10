import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ChatInput } from './components/chat/ChatInput';
import { BrandLogo } from './components/brand/BrandLogo';
import { MusicPlayer } from './components/music/MusicPlayer';
import { YouTubePlayer } from './components/music/YouTubePlayer';
import { Star } from 'lucide-react';
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
import { ACCESS_TOKEN_REQUIRED, MAINTENANCE_MODE, PRO_HEAT_LEVELS } from './config/constants';

function AppContent() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    handleSendMessage,
    handlePersonaChange,
    setCurrentProHeatLevel,
    startNewChat,
    markMessageAsAnimated,
    dismissAboutUs,
    dismissRateLimitModal,
    loadChat,
    clearYoutubeMusic
  } = useChat(user?.id, profile);
  const { isRateLimited, getRemainingMessages, incrementCount, isAnonymous } = useAnonymousRateLimit();

  const [isCenterStage, setIsCenterStage] = useState(false);
  const [isHeatLevelExpanded, setIsHeatLevelExpanded] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (!ACCESS_TOKEN_REQUIRED) return false;
    const accessGranted = localStorage.getItem('timeMachine_accessGranted');
    return accessGranted !== 'true';
  });

  // Auth-related states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>();

  // Check if user needs onboarding after auth
  useEffect(() => {
    if (!authLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [authLoading, needsOnboarding]);

  // Check for maintenance mode
  if (MAINTENANCE_MODE) {
    window.location.href = '/maintenance.html';
    return null;
  }

  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    return () => window.removeEventListener('resize', updateVH);
  }, []);

  const personaGlowColors: Record<string, string> = {
    default: 'rgba(139,0,255,0.7)',
    girlie: 'rgba(199,21,133,0.7)',
    pro: 'rgba(30,144,255,0.7)'
  };

  const personaBackgroundColors: Record<string, string> = {
    default: 'rgba(139,0,255,0.2)',
    girlie: 'rgba(199,21,133,0.2)',
    pro: 'rgba(30,144,255,0.2)'
  };

  const getButtonStyles = (isCenterStage: boolean, persona: string, theme: any) => ({
    border: isCenterStage
      ? `1px solid ${persona === 'girlie' ? 'rgb(199,21,133)' : 'rgb(139,0,255)'}`
      : 'none',
    bg: isCenterStage
      ? (persona === 'girlie' ? 'rgba(199,21,133,0.3)' : 'rgba(139,0,255,0.3)')
      : personaBackgroundColors[persona],
    shadow: isCenterStage
      ? `0 0 20px ${persona === 'girlie' ? 'rgba(199,21,133,0.8)' : 'rgba(139,0,255,0.8)'}`
      : 'none',
    text: isCenterStage
      ? (persona === 'girlie' ? 'rgb(238,130,238)' : 'rgb(186,85,211)')
      : theme.text,
  });

  const getHeatLevelButtonStyles = (isExpanded: boolean, theme: any) => ({
    border: isExpanded ? '1px solid rgb(30,144,255)' : 'none',
    bg: isExpanded ? 'rgba(30,144,255,0.3)' : 'rgba(30,144,255,0.2)',
    shadow: isExpanded ? '0 0 20px rgba(30,144,255,0.8)' : 'none',
    text: isExpanded ? 'rgb(135,206,250)' : theme.text,
  });

  const buttonStyles = getButtonStyles(isCenterStage, currentPersona, theme);
  const heatLevelButtonStyles = getHeatLevelButtonStyles(isHeatLevelExpanded, theme);

  const handleAccessGranted = () => {
    setShowWelcomeModal(false);
  };

  // Wrapped send message handler with rate limiting
  const handleSendMessageWithRateLimit = async (
    message: string,
    imageUrl?: string,
    audioData?: string,
    imageUrls?: string[]
  ) => {
    // Detect @ mentions to determine which model/persona to check rate limit for
    const mentionMatch = message.match(/^@(chatgpt|gemini|claude|grok|girlie|pro)\s/i);
    const targetModel = mentionMatch ? mentionMatch[1].toLowerCase() : currentPersona;

    // Check rate limit for anonymous users
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

    // Increment count before sending (for anonymous users)
    if (isAnonymous) {
      incrementCount(targetModel);
    }

    // Call the original handler
    await handleSendMessage(message, imageUrl, audioData, imageUrls);
  };

  const handleOpenAuth = () => {
    setAuthModalMessage(undefined);
    setShowAuthModal(true);
  };

  const handleOpenAccount = () => {
    navigate('/account');
  };

  const handleOpenHistory = () => {
    navigate('/history');
  };

  const handleOpenSettings = () => {
    navigate('/settings');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Don't render main app content if welcome modal is showing
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

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen ${theme.background} ${theme.text} flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Main chat page component
  const ChatPage = () => (
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
              {/* Show remaining messages for anonymous users */}
              {isAnonymous && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
                  <span>{getRemainingMessages(currentPersona)} free messages left</span>
                </div>
              )}

              {/* Sign Up button for logged out users */}
              {isAnonymous ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenAuth}
                  style={{
                    background: buttonStyles.bg,
                    color: buttonStyles.text,
                    border: buttonStyles.border,
                    boxShadow: buttonStyles.shadow,
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
                  onClick={() => setIsCenterStage(!isCenterStage)}
                  style={{
                    background: buttonStyles.bg,
                    color: buttonStyles.text,
                    border: buttonStyles.border,
                    boxShadow: buttonStyles.shadow,
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
                  aria-label={isCenterStage ? "Disable Center Stage" : "Enable Center Stage"}
                >
                  <Star style={{ width: '16px', height: '16px', color: buttonStyles.text }} />
                  <span style={{ fontSize: '14px', color: buttonStyles.text }}>Center Stage</span>
                </motion.button>
              )}
            </div>
          </div>
        </header>

        <MusicPlayer
          currentPersona={currentPersona}
          currentEmotion={currentEmotion}
          isCenterStage={isCenterStage}
        />

        {/* YouTube Music Player */}
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
              key={currentSessionId}
              messages={messages}
              currentPersona={currentPersona}
              onMessageAnimated={markMessageAsAnimated}
              error={error}
              streamingMessageId={streamingMessageId}
            />
          ) : (
            <StageMode
              key={currentSessionId}
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

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message={authModalMessage}
        />

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
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
