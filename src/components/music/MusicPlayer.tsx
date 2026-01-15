import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import PlayIcon from '../icons/PlayIcon';
import { AI_PERSONAS } from '../../config/constants';

// YouTube Music playlist ID
const YOUTUBE_PLAYLIST_ID = 'PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i';

interface MusicPlayerProps {
  currentPersona?: keyof typeof AI_PERSONAS;
  currentEmotion?: string;
  isCenterStage?: boolean;
}

export function MusicPlayer({ currentPersona = 'default' }: MusicPlayerProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);

  const handleClick = () => {
    setShowPlaylist(true);
  };

  return (
    <>
      <div className="fixed bottom-24 left-4 z-50 flex items-center gap-2">
        <motion.div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`p-3 rounded-full
              bg-white/5 backdrop-blur-xl
              border border-white/5
              transition-all duration-300
              relative group
              overflow-hidden`}
          >
            <PlayIcon className="w-5 h-5 relative z-10" />
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPlaylist(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-[90vw] max-w-[500px] bg-black/80 backdrop-blur-xl rounded-2xl
                  border border-white/10 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-red-500" />
                    <h3 className="text-white font-semibold">YouTube Music</h3>
                  </div>
                  <button
                    onClick={() => setShowPlaylist(false)}
                    className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Notification Banner */}
                <div className={`p-4 border-b border-white/10 ${
                  currentPersona === 'girlie'
                    ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20'
                    : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      currentPersona === 'girlie'
                        ? 'bg-pink-500/30'
                        : 'bg-purple-500/30'
                    }`}>
                      <Music className={`w-4 h-4 ${
                        currentPersona === 'girlie'
                          ? 'text-pink-300'
                          : 'text-purple-300'
                      }`} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        Ask TimeMachine to Play Any Song
                      </p>
                      <p className="text-white/60 text-xs mt-1">
                        You can now ask TimeMachine to play any song! Example: "Play Shape of You"
                      </p>
                    </div>
                  </div>
                </div>

                {/* YouTube Embed */}
                <div className="relative" style={{ paddingBottom: '80%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/videoseries?list=${YOUTUBE_PLAYLIST_ID}`}
                    title="YouTube Music Playlist"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
