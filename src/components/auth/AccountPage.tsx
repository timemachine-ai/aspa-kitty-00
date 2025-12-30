import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  ArrowLeft,
  LogOut,
  Sparkles,
  Crown,
  MessageSquare,
  Image as ImageIcon,
  Brain,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, uploadImage } from '../../lib/supabase';

interface AccountPageProps {
  onBack: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onBack }) => {
  const { user, profile, updateProfile, signOut, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [aboutMe, setAboutMe] = useState(profile?.about_me || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState<{
    chatCount: number;
    messageCount: number;
    imageCount: number;
    memoryCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user stats
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const [chats, messages, images, memories] = await Promise.all([
          supabase.from('chat_sessions').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('chat_messages').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('user_images').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('ai_memories').select('id', { count: 'exact' }).eq('user_id', user.id),
        ]);

        setStats({
          chatCount: chats.count || 0,
          messageCount: messages.count || 0,
          imageCount: images.count || 0,
          memoryCount: memories.count || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const { error: updateError } = await updateProfile({
      nickname: nickname.trim() || null,
      about_me: aboutMe.trim() || null,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profile updated successfully!');
      setEditingField(null);
      setTimeout(() => setSuccess(''), 3000);
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setError('');

    try {
      const result = await uploadImage(file, user.id);
      if (result) {
        await updateProfile({ avatar_url: result.url });
        setSuccess('Avatar updated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to upload avatar');
      }
    } catch (err) {
      setError('Error uploading avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
  }> = ({ icon, label, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-4"
    >
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10" />
      <div className="relative flex items-center gap-3">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-white/50 text-sm">{label}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold text-white">My Account</h1>
          <div className="w-20" />
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />

          <div className="relative p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-white/50" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-colors shadow-lg"
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera size={16} className="text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold text-white">
                  {profile?.nickname || 'TimeMachine User'}
                </h2>
                <p className="text-white/50 text-sm">{user?.email}</p>
              </div>

              {profile?.is_pro && (
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Crown size={14} className="text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">PRO Member</span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard
                  icon={<MessageSquare size={20} className="text-purple-400" />}
                  label="Chats"
                  value={stats.chatCount}
                  color="bg-purple-500/20"
                />
                <StatCard
                  icon={<Sparkles size={20} className="text-pink-400" />}
                  label="Messages"
                  value={stats.messageCount}
                  color="bg-pink-500/20"
                />
                <StatCard
                  icon={<ImageIcon size={20} className="text-cyan-400" />}
                  label="Images"
                  value={stats.imageCount}
                  color="bg-cyan-500/20"
                />
                <StatCard
                  icon={<Brain size={20} className="text-amber-400" />}
                  label="Memories"
                  value={stats.memoryCount}
                  color="bg-amber-500/20"
                />
              </div>
            )}

            {/* Editable Fields */}
            <div className="space-y-4">
              {/* Nickname */}
              <div className="relative">
                <label className="text-white/60 text-sm mb-1.5 block">Nickname</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={editingField !== 'nickname'}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 disabled:opacity-60 transition-all"
                    placeholder="Enter your nickname"
                  />
                  {editingField === 'nickname' ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        onClick={handleSaveProfile}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setNickname(profile?.nickname || '');
                          setEditingField(null);
                        }}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('nickname')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* About Me */}
              <div className="relative">
                <label className="text-white/60 text-sm mb-1.5 block">
                  Things TimeMachine knows about you
                </label>
                <div className="relative">
                  <textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    disabled={editingField !== 'aboutMe'}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 disabled:opacity-60 transition-all resize-none"
                    placeholder="Tell TimeMachine about yourself..."
                  />
                  {editingField === 'aboutMe' ? (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        onClick={handleSaveProfile}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setAboutMe(profile?.about_me || '');
                          setEditingField(null);
                        }}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('aboutMe')}
                      className="absolute right-2 top-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">Email</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <Mail size={18} className="text-white/40" />
                  <span className="text-white/70">{user?.email || 'No email'}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-200 text-sm"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sign Out Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </motion.button>

        {/* Account Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/30 text-sm mt-6"
        >
          Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
        </motion.p>
      </div>
    </div>
  );
};

export default AccountPage;
