import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Music } from 'lucide-react';
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
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClick = () => {
    setShowPlaylist(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setShowPlaylist(false);
    setIsMinimized(true);
  };

  // Waveform visualizer for minimized state
  const MusicVisualizer = () => (
    <div className="flex items-center justify-center gap-[3px] h-5 px-1">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-gradient-to-t from-white/40 to-white rounded-full"
          animate={{
            height: ['8px', i % 2 === 0 ? '16px' : '12px', '8px'],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: [0.4, 0, 0.6, 1],
            times: [0, 0.5, 1]
          }}
          style={{
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
            filter: 'blur(0.3px)'
          }}
        />
      ))}
    </div>
  );

  // Glass style from UniversalGlassKit
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
  };

  return (
    <>
      <div className="fixed bottom-24 left-4 z-50 flex flex-col items-start gap-2">
        {/* YouTube Music Popup - positioned above the play button */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-80 rounded-2xl overflow-hidden"
              style={glassStyle}
            >
              {/* Header */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-red-500" />
                  <h3 className="text-white font-medium text-sm">YouTube Music</h3>
                </div>
                <button
                  onClick={handleMinimize}
                  className="text-white/60 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              {/* Notification Banner - YouTube Red */}
              <div className="px-3 py-2.5 bg-[#FF0000]">
                <p className="text-white font-medium text-sm">
                  Ask TimeMachine to Play Any Song
                </p>
                <p className="text-white/90 text-xs mt-0.5">
                  You can now ask TimeMachine to play any song! Example: "Play Shape of You"
                </p>
              </div>

              {/* YouTube Embed */}
              <div className="relative" style={{ paddingBottom: '75%' }}>
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
          )}
        </AnimatePresence>

        {/* Play Button */}
        <motion.div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="p-3 rounded-full transition-all duration-300 relative group overflow-hidden"
            style={glassStyle}
          >
            {isMinimized ? (
              <MusicVisualizer />
            ) : (
              <PlayIcon className="w-5 h-5 relative z-10" />
            )}
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
