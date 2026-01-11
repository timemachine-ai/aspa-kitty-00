import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Share2, Copy, Check, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../hooks/useChat';
import { ChatInput } from '../chat/ChatInput';
import { ChatMode } from '../chat/ChatMode';
import { GroupChatJoinPage } from './GroupChatJoinPage';
import { GroupSettingsModal } from './GroupSettingsModal';

// Collaborative Chat Page - renders at /groupchat/:id
// Shows join page for non-participants, main chat for participants
export function CollaborativeChatPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { theme } = useTheme();

    const [hasJoined, setHasJoined] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        messages,
        isLoading,
        currentPersona,
        error,
        streamingMessageId,
        isCollaborative,
        participants,
        handleSendMessage,
        markMessageAsAnimated,
        joinCollaborativeChat,
    } = useChat(user?.id, profile || undefined);

    // Handle join complete - load collaborative chat
    const handleJoinComplete = useCallback(async (shareId: string) => {
        const success = await joinCollaborativeChat(shareId);
        if (success) {
            setHasJoined(true);
        }
    }, [joinCollaborativeChat]);

    // Share URL
    const shareUrl = id ? `${window.location.origin}/groupchat/${id}` : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // If not joined yet, show join page
    if (!hasJoined && !isCollaborative) {
        return <GroupChatJoinPage onJoinComplete={handleJoinComplete} />;
    }

    return (
        <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white">Group Chat</h1>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                            <Users className="w-4 h-4" />
                            <span>{participants.length} participants</span>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                    {/* Settings button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                        <Settings className="w-5 h-5 text-white/60" />
                    </button>

                    {/* Share button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                        >
                            <Share2 className="w-5 h-5 text-white/60" />
                        </button>

                        <AnimatePresence>
                            {showShareMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-12 w-72 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 p-4 z-50"
                                >
                                    <p className="text-sm text-white/60 mb-2">Share this link to invite others:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={shareUrl}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-white text-sm"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className={`px-3 py-2 rounded-lg ${copied ? 'bg-green-500' : 'bg-purple-500'} text-white`}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-hidden">
                <ChatMode
                    messages={messages}
                    currentPersona={currentPersona}
                    onMessageAnimated={markMessageAsAnimated}
                    error={error}
                    streamingMessageId={streamingMessageId}
                    isCollaborative={isCollaborative}
                    currentUserId={user?.id}
                />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    currentPersona={currentPersona}
                    placeholder="Type a message... Use @TimeMachine to ask AI"
                />
                <p className="text-xs text-white/40 text-center mt-2">
                    Tip: Type @TimeMachine to get an AI response
                </p>
            </div>

            {/* Group Settings Modal */}
            {id && (
                <GroupSettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    chatId={id}
                />
            )}
        </div>
    );
}
