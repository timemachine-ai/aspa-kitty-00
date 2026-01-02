import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  message,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email to confirm your account!');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl">
                  {/* Content */}
                  <div className="p-8">
                    {/* Close button */}
                    <Dialog.Close asChild>
                      <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} className="text-white/50" />
                      </button>
                    </Dialog.Close>

                    {/* Header */}
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-white mb-2">
                        {mode === 'signup' ? 'Create a TimeMachine ID' : 'Sign in'}
                      </h2>
                      <p className="text-white/50 text-sm">
                        {message || (mode === 'signup'
                          ? 'Unified ID for everything at TimeMachine Mafia'
                          : 'Welcome back to TimeMachine')}
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Email Input */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all text-[15px]"
                        />
                      </div>

                      {/* Password Input */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          required
                          className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all text-[15px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Confirm Password (Sign Up only) */}
                      <AnimatePresence mode="wait">
                        {mode === 'signup' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                                <Lock size={18} />
                              </div>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                required={mode === 'signup'}
                                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all text-[15px]"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Error/Success Messages */}
                      <AnimatePresence mode="wait">
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                          >
                            {error}
                          </motion.div>
                        )}
                        {success && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                          >
                            {success}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3.5 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/15 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin mx-auto" />
                        ) : (
                          mode === 'signup' ? 'Create Account' : 'Sign In'
                        )}
                      </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google Sign In */}
                    <motion.button
                      onClick={handleGoogleSignIn}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/80 font-medium flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/15 transition-all text-[15px]"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </motion.button>

                    {/* Toggle Mode */}
                    <p className="text-center text-white/40 text-sm mt-6">
                      {mode === 'signup' ? (
                        <>
                          Already have a TimeMachine ID?{' '}
                          <button
                            type="button"
                            onClick={() => setMode('signin')}
                            className="text-white/70 hover:text-white font-medium transition-colors"
                          >
                            Sign in
                          </button>
                        </>
                      ) : (
                        <>
                          Don't have a TimeMachine ID?{' '}
                          <button
                            type="button"
                            onClick={() => setMode('signup')}
                            className="text-white/70 hover:text-white font-medium transition-colors"
                          >
                            Create one
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default AuthModal;
