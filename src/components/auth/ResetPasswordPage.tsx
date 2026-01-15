import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { updatePassword, user } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user arrived here via password reset link
  useEffect(() => {
    // Supabase automatically handles the token in the URL hash
    // and signs the user in with a recovery session
    // We just need to check if user is authenticated with recovery type
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error: updateError } = await updatePassword(newPassword);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(to top, #581c87 0%, #000000 40%, #000000 100%)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[400px] rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          }}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check size={32} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Password Updated!</h2>
          <p className="text-white/50 text-sm">Redirecting you to the app...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(to top, #581c87 0%, #000000 40%, #000000 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[400px] rounded-3xl p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 p-2 rounded-full hover:bg-white/10 transition-colors inline-flex"
        >
          <ArrowLeft size={20} className="text-white/50" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Lock size={24} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Set New Password</h2>
          <p className="text-white/50 text-sm">Create a new password for your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              className="w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all text-[15px]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all text-[15px]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
            style={{
              background: 'rgba(168, 85, 247, 0.3)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin mx-auto" />
            ) : (
              'Update Password'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
