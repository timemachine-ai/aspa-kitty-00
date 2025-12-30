import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, ArrowRight, Heart, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateProfile, user } = useAuth();

  const handleNext = () => {
    if (step === 1 && !nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleComplete = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await updateProfile({
      nickname: nickname.trim(),
      about_me: aboutMe.trim() || null,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onComplete();
  };

  const suggestions = [
    "I love learning new things",
    "I'm a creative person who loves art and music",
    "I work in tech and enjoy coding",
    "I'm a student studying...",
    "I enjoy thoughtful conversations",
    "I appreciate humor and wit",
  ];

  return (
    <Dialog.Root open={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  {/* Glass background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />

                  {/* Animated gradient background */}
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
                  </div>

                  {/* Content */}
                  <div className="relative p-8">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <div className={`w-2 h-2 rounded-full transition-all ${step >= 1 ? 'bg-purple-500 w-8' : 'bg-white/30'}`} />
                      <div className={`w-2 h-2 rounded-full transition-all ${step >= 2 ? 'bg-purple-500 w-8' : 'bg-white/30'}`} />
                    </div>

                    <AnimatePresence mode="wait">
                      {step === 1 ? (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          {/* Header */}
                          <div className="text-center mb-8">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.2, type: 'spring' }}
                              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4"
                            >
                              <Wand2 size={40} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                              Welcome to TimeMachine!
                            </h2>
                            <p className="text-white/60">
                              Let's personalize your experience
                            </p>
                          </div>

                          {/* Nickname Input */}
                          <div className="space-y-4">
                            <label className="block">
                              <span className="text-white/80 text-sm font-medium mb-2 block">
                                What should we call you?
                              </span>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                  <User size={20} />
                                </div>
                                <input
                                  type="text"
                                  value={nickname}
                                  onChange={(e) => setNickname(e.target.value)}
                                  placeholder="Enter your nickname"
                                  maxLength={30}
                                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-lg placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/15 transition-all"
                                  autoFocus
                                />
                              </div>
                            </label>

                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                              >
                                {error}
                              </motion.p>
                            )}

                            <motion.button
                              onClick={handleNext}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-shadow mt-6"
                            >
                              Continue
                              <ArrowRight size={20} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          {/* Header */}
                          <div className="text-center mb-6">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1, type: 'spring' }}
                              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 mb-4"
                            >
                              <Heart size={32} className="text-white" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                              Nice to meet you, {nickname}!
                            </h2>
                            <p className="text-white/60 text-sm">
                              Tell TimeMachine a bit about yourself (optional)
                            </p>
                          </div>

                          {/* About Me Input */}
                          <div className="space-y-4">
                            <textarea
                              value={aboutMe}
                              onChange={(e) => setAboutMe(e.target.value)}
                              placeholder="Things you'd like TimeMachine to know about you..."
                              rows={4}
                              maxLength={500}
                              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/15 transition-all resize-none"
                            />
                            <p className="text-white/40 text-xs text-right">
                              {aboutMe.length}/500
                            </p>

                            {/* Suggestions */}
                            <div className="space-y-2">
                              <p className="text-white/50 text-xs uppercase tracking-wider">
                                Suggestions
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.slice(0, 4).map((suggestion, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setAboutMe(suggestion)}
                                    className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-all"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                              >
                                {error}
                              </motion.p>
                            )}

                            <div className="flex gap-3 mt-6">
                              <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-colors"
                              >
                                Back
                              </button>
                              <motion.button
                                onClick={handleComplete}
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-shadow disabled:opacity-50"
                              >
                                {loading ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles size={20} />
                                    Let's Go!
                                  </>
                                )}
                              </motion.button>
                            </div>

                            <button
                              onClick={handleComplete}
                              className="w-full text-center text-white/40 hover:text-white/60 text-sm mt-2 transition-colors"
                            >
                              Skip for now
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

export default OnboardingModal;
