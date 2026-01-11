import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Crown, LogOut, UserMinus, Edit2, Check, Loader2, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
    getGroupChat,
    kickParticipant,
    leaveGroupChat,
    updateGroupName
} from '../../services/groupChat/groupChatService';
import { GroupChat, GroupChatParticipant } from '../../types/groupChat';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId: string;
    onParticipantChange?: () => void;
}

export function GroupSettingsModal({
    isOpen,
    onClose,
    chatId,
    onParticipantChange
}: GroupSettingsModalProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [kickingUserId, setKickingUserId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const isAdmin = user?.id === groupChat?.owner_id;
    const shareUrl = `${window.location.origin}/groupchat/${chatId}`;

    useEffect(() => {
        if (isOpen && chatId) {
            loadGroupChat();
        }
    }, [isOpen, chatId]);

    const loadGroupChat = async () => {
        setIsLoading(true);
        const chat = await getGroupChat(chatId);
        if (chat) {
            setGroupChat(chat);
            setNewName(chat.name);
        }
        setIsLoading(false);
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || !user) return;

        setIsSaving(true);
        const success = await updateGroupName(chatId, user.id, newName.trim());
        if (success) {
            setGroupChat(prev => prev ? { ...prev, name: newName.trim() } : null);
            setIsEditingName(false);
        }
        setIsSaving(false);
    };

    const handleKick = async (participant: GroupChatParticipant) => {
        if (!user || !isAdmin) return;

        if (!window.confirm(`Remove ${participant.nickname} from the group?`)) return;

        setKickingUserId(participant.user_id);
        const success = await kickParticipant(chatId, user.id, participant.user_id);
        if (success) {
            setGroupChat(prev => prev ? {
                ...prev,
                participants: prev.participants.filter(p => p.user_id !== participant.user_id)
            } : null);
            onParticipantChange?.();
        }
        setKickingUserId(null);
    };

    const handleLeave = async () => {
        if (!user) return;

        const confirmMessage = isAdmin
            ? 'As admin, leaving will disable this group chat for everyone. Continue?'
            : 'Leave this group chat?';

        if (!window.confirm(confirmMessage)) return;

        setIsLeaving(true);
        const success = await leaveGroupChat(chatId, user.id);
        if (success) {
            onClose();
            navigate('/');
        }
        setIsLeaving(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatJoinDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const maskEmail = (email: string) => {
        const [name, domain] = email.split('@');
        if (!domain) return email;
        const masked = name.slice(0, 2) + '***';
        return `${masked}@${domain}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-lg bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Group Settings</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                    ) : groupChat ? (
                        <div className="flex-1 overflow-y-auto">
                            {/* Group Name */}
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        {isEditingName && isAdmin ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newName}
                                                    onChange={e => setNewName(e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleUpdateName}
                                                    disabled={isSaving}
                                                    className="p-2 bg-purple-500 rounded-lg text-white hover:bg-purple-600 disabled:opacity-50"
                                                >
                                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingName(false);
                                                        setNewName(groupChat.name);
                                                    }}
                                                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-semibold text-white">{groupChat.name}</h3>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setIsEditingName(true)}
                                                        className="p-1 rounded-lg hover:bg-white/10 transition"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-white/60" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-white/60 text-sm mt-1">
                                            {groupChat.participants.length} participant{groupChat.participants.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Share Link */}
                                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                    <p className="text-xs text-white/60 mb-2">Invite Link</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={shareUrl}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-white/60 text-sm"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className={`px-3 py-2 rounded-lg ${copied ? 'bg-green-500' : 'bg-purple-500'} text-white text-sm`}
                                        >
                                            {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="p-6">
                                <h4 className="text-sm font-medium text-white/60 mb-4">Participants</h4>
                                <div className="space-y-3">
                                    {groupChat.participants.map(participant => (
                                        <div
                                            key={participant.user_id}
                                            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                {participant.nickname.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white truncate">
                                                        {participant.nickname}
                                                    </span>
                                                    {participant.is_owner && (
                                                        <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                                    )}
                                                    {participant.user_id === user?.id && (
                                                        <span className="text-xs text-purple-400">(you)</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/40">
                                                    Joined {formatJoinDate(participant.joined_at)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            {isAdmin && participant.user_id !== user?.id && (
                                                <button
                                                    onClick={() => handleKick(participant)}
                                                    disabled={kickingUserId === participant.user_id}
                                                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                                                >
                                                    {kickingUserId === participant.user_id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <UserMinus className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <p className="text-white/60">Failed to load group settings</p>
                        </div>
                    )}

                    {/* Footer - Leave Button */}
                    <div className="p-6 border-t border-white/10">
                        <button
                            onClick={handleLeave}
                            disabled={isLeaving}
                            className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLeaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    {isAdmin ? 'Leave & Close Group' : 'Leave Group'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
