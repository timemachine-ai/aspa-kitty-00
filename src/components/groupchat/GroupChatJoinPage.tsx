import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getGroupChat, joinGroupChat, isGroupChatParticipant } from '../../services/groupChat/groupChatService';
import { GroupChat } from '../../types/groupChat';
import { AI_PERSONAS } from '../../config/constants';

interface GroupChatJoinPageProps {
    onJoinComplete?: (shareId: string) => void;
}

export function GroupChatJoinPage({ onJoinComplete }: GroupChatJoinPageProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();
    const { theme } = useTheme();

    const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isParticipant, setIsParticipant] = useState(false);

    useEffect(() => {
        async function loadGroupChat() {
            if (!id) {
                setError('Invalid group chat link');
                setIsLoading(false);
                return;
            }

            const chat = await getGroupChat(id);
            if (chat) {
                setGroupChat(chat);

                // If user is already a participant, trigger join callback
                if (user && chat.participants.some(p => p.user_id === user.id)) {
                    setIsParticipant(true);
                    onJoinComplete?.(id);
                }
            } else {
                setError('Group chat not found or expired');
            }
            setIsLoading(false);
        }

        if (!authLoading) {
            loadGroupChat();
        }
    }, [id, authLoading, user, onJoinComplete]);

    const handleJoin = async () => {
        if (!id || !user || !profile) {
            setError('You need to be logged in to join');
            return;
        }

        setIsJoining(true);

        const success = await joinGroupChat(id, user.id, profile.nickname || 'User');

        if (success) {
            // Trigger callback to load collaborative chat
            onJoinComplete?.(id);
        } else {
            setError('Failed to join. Please try again.');
            setIsJoining(false);
        }
    };

    const personaColors: Record<string, string> = {
        default: 'from-purple-500 to-violet-500',
        girlie: 'from-pink-500 to-rose-500',
        pro: 'from-cyan-500 to-blue-500',
        chatgpt: 'from-green-500 to-emerald-500',
        gemini: 'from-blue-500 to-indigo-500',
        claude: 'from-orange-500 to-amber-500',
        grok: 'from-red-500 to-pink-500',
    };

    // If already a participant, show loading while parent handles join
    if (isParticipant) {
        return (
            <div className={`min-h-screen ${theme.background} flex items-center justify-center`}>
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (isLoading || authLoading) {
        return (
            <div className={`min-h-screen ${theme.background} flex items-center justify-center`}>
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    const persona = groupChat?.persona || 'default';
    const personaInfo = AI_PERSONAS[persona as keyof typeof AI_PERSONAS] || AI_PERSONAS.default;

    return (
        <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${personaColors[persona] || personaColors.default} flex items-center justify-center`}>
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Join Group Chat
                    </h1>
                    <p className="text-white/60">
                        You've been invited to join a conversation
                    </p>
                </div>

                {/* Chat Info */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        <div>
                            <p className="text-white/60 text-sm">Chat Name</p>
                            <p className="text-white font-medium">{groupChat?.name || 'Group Chat'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-400" />
                        <div>
                            <p className="text-white/60 text-sm">Participants</p>
                            <p className="text-white font-medium">
                                {groupChat?.participants.length || 0} {groupChat?.participants.length === 1 ? 'person' : 'people'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${personaColors[persona] || personaColors.default}`} />
                        <div>
                            <p className="text-white/60 text-sm">AI Mode</p>
                            <p className="text-white font-medium">{personaInfo.name}</p>
                        </div>
                    </div>
                </div>

                {/* Join Button */}
                {user ? (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleJoin}
                        disabled={isJoining}
                        className={`w-full py-4 rounded-xl bg-gradient-to-r ${personaColors[persona] || personaColors.default} text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                        {isJoining ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            'Jump into Group Chat'
                        )}
                    </motion.button>
                ) : (
                    <div className="text-center">
                        <p className="text-white/60 mb-4">Sign in to join this chat</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition"
                        >
                            Sign In
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
