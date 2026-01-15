import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  message?: string;
}

type AuthStep = 'credentials' | 'otp' | 'forgot-password' | 'set-new-password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  message,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUpWithOtp, verifyOtp, signInWithGoogle, resetPassword, updatePassword } = useAuth();

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
      setOtpCode('');
      setStep('credentials');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (step === 'credentials') {
          // Step 1: Send OTP to email
          const { error } = await signUpWithOtp(email);
          if (error) {
            setError(error.message);
          } else {
            setSuccess('Verification code sent to your email!');
            setStep('otp');
          }
        } else if (step === 'otp') {
          // Step 2: Verify OTP and complete signup
          const { error } = await verifyOtp(email, otpCode);
          if (error) {
            setError(error.message);
          } else {
            setSuccess('Account verified successfully!');
            setTimeout(() => onClose(), 1000);
          }
        }
      } else {
        // Sign in mode
        if (step === 'forgot-password') {
          // Send password reset email
          const { error } = await resetPassword(email);
          if (error) {
            setError(error.message);
          } else {
            setSuccess('Password reset link sent to your email! Check your inbox.');
          }
        } else if (step === 'set-new-password') {
          // Set new password after reset
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
          const { error } = await updatePassword(password);
          if (error) {
            setError(error.message);
          } else {
            setSuccess('Password updated successfully!');
            setTimeout(() => {
              setStep('credentials');
              setPassword('');
              setConfirmPassword('');
            }, 1500);
          }
        } else {
          // Regular sign in
          const { error } = await signIn(email, password);
          if (error) {
            setError(error.message);
          } else {
            onClose();
          }
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

  const handleBack = () => {
    setError('');
    setSuccess('');
    if (step === 'otp') {
      setStep('credentials');
      setOtpCode('');
    } else if (step === 'forgot-password' || step === 'set-new-password') {
      setStep('credentials');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleForgotPassword = () => {
    setError('');
    setSuccess('');
    setStep('forgot-password');
  };

  const renderTitle = () => {
    if (step === 'otp') return 'Verify Your Email';
    if (step === 'forgot-password') return 'Reset Password';
    if (step === 'set-new-password') return 'Set New Password';
    return mode === 'signup' ? 'Create a TimeMachine ID' : 'Sign in';
  };

  const renderSubtitle = () => {
    if (step === 'otp') return `Enter the 6-digit code sent to ${email}`;
    if (step === 'forgot-password') return 'Enter your email to receive a reset link';
    if (step === 'set-new-password') return 'Create a new password for your account';
    return message || (mode === 'signup'
      ? 'Unified ID for everything at TimeMachine Mafia'
      : 'Welcome back to TimeMachine');
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
                <div
                  className="relative w-full max-w-[420px] overflow-hidden rounded-3xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {/* Content */}
                  <div className="p-8">
                    {/* Close button */}
                    <Dialog.Close asChild>
                      <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} className="text-white/50" />
                      </button>
                    </Dialog.Close>

                    {/* Back button for sub-steps */}
                    {(step === 'otp' || step === 'forgot-password' || step === 'set-new-password') && (
                      <button
                        onClick={handleBack}
                        className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeft size={20} className="text-white/50" />
                      </button>
                    )}

                    {/* Header */}
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-white mb-2">
                        {renderTitle()}
                      </h2>
                      <p className="text-white/50 text-sm">
                        {renderSubtitle()}
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* OTP Input (Signup Step 2) */}
                      {step === 'otp' && (
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                            <KeyRound size={18} />
                          </div>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            required
                            maxLength={6}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all text-[15px] text-center tracking-[0.5em] font-mono"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            }}
                          />
                        </div>
                      )}

                      {/* Email Input (Signup Step 1, Sign In, Forgot Password) */}
                      {(step === 'credentials' || step === 'forgot-password') && (
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
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all text-[15px]"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            }}
                          />
                        </div>
                      )}

                      {/* Password Input (Sign In only, not for signup anymore) */}
                      {(step === 'credentials' && mode === 'signin') && (
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
                            className="w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all text-[15px]"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
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
                      )}

                      {/* New Password Fields (for password reset) */}
                      {step === 'set-new-password' && (
                        <>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                              <Lock size={18} />
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="New password"
                              required
                              className="w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all text-[15px]"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
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
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                              }}
                            />
                          </div>
                        </>
                      )}

                      {/* Forgot Password Link */}
                      {step === 'credentials' && mode === 'signin' && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-white/50 hover:text-white/70 text-sm transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

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
                        className="w-full py-3.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                        style={{
                          background: 'rgba(168, 85, 247, 0.3)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                        }}
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin mx-auto" />
                        ) : (
                          (() => {
                            if (step === 'otp') return 'Verify Code';
                            if (step === 'forgot-password') return 'Send Reset Link';
                            if (step === 'set-new-password') return 'Update Password';
                            if (mode === 'signup') return 'Continue';
                            return 'Sign In';
                          })()
                        )}
                      </motion.button>

                      {/* Resend OTP option */}
                      {step === 'otp' && (
                        <p className="text-center text-white/40 text-sm">
                          Didn't receive the code?{' '}
                          <button
                            type="button"
                            onClick={async () => {
                              setLoading(true);
                              setError('');
                              const { error } = await signUpWithOtp(email);
                              if (error) {
                                setError(error.message);
                              } else {
                                setSuccess('New code sent!');
                              }
                              setLoading(false);
                            }}
                            disabled={loading}
                            className="text-white/70 hover:text-white font-medium transition-colors"
                          >
                            Resend
                          </button>
                        </p>
                      )}
                    </form>

                    {/* Divider - Only show on credentials step */}
                    {step === 'credentials' && (
                      <>
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
                          className="w-full py-3.5 rounded-xl text-white/80 font-medium flex items-center justify-center gap-3 transition-all text-[15px]"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                          }}
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
                      </>
                    )}
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
