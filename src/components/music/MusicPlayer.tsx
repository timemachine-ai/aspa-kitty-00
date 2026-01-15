import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Maximize2, X } from 'lucide-react';
import PlayIcon from '../icons/PlayIcon';
import { AI_PERSONAS } from '../../config/constants';
import { supabase } from '../../lib/supabase';

// Base YouTube embed URL
const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/';

// Fallback video IDs in case Supabase fetch fails
const FALLBACK_VIDEO_IDS = ['Ec08db2hP10'];

interface MusicPlayerProps {
  currentPersona?: keyof typeof AI_PERSONAS;
  currentEmotion?: string;
  isCenterStage?: boolean;
}

export function MusicPlayer({ currentPersona = 'default' }: MusicPlayerProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>(FALLBACK_VIDEO_IDS);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Fetch video IDs from Supabase
  useEffect(() => {
    const fetchVideoIds = async () => {
      try {
        const { data, error } = await supabase
          .from('youtube_music')
          .select('video_id')
          .order('order_index', { ascending: true });

        if (error) {
          console.error('Error fetching YouTube music:', error);
          return;
        }

        if (data && data.length > 0) {
          setVideoIds(data.map(item => item.video_id));
        }
      } catch (err) {
        console.error('Failed to fetch video IDs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoIds();
  }, []);

  const handleClick = () => {
    if (showPlaylist) {
      // Close the popup
      setShowPlaylist(false);
      setIsMinimized(false);
    } else {
      // Open the popup
      setShowPlaylist(true);
      setIsMinimized(false);
      setIframeLoading(true);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handlePrevious = () => {
    setIframeLoading(true);
    setCurrentVideoIndex(prev =>
      prev === 0 ? videoIds.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setIframeLoading(true);
    setCurrentVideoIndex(prev =>
      prev === videoIds.length - 1 ? 0 : prev + 1
    );
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  // Waveform visualizer for when popup is closed but was playing
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

  // Glass button with red tint for prev/next
  const redGlassButtonStyle = {
    background: 'rgba(255, 0, 0, 0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    boxShadow: '0 2px 8px rgba(255, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
  };

  const currentVideoId = videoIds[currentVideoIndex];

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
              {/* Header & Notification - hidden when minimized */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Header */}
                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-medium text-sm">YouTube Music</h3>
                      <button
                        onClick={handleMinimize}
                        className="text-white/60 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Notification Banner - Glass Style */}
                    <div className="px-3 py-2.5 border-b border-white/10">
                      <p className="text-white/90 font-medium text-sm">
                        Ask TimeMachine to Play Any Song
                      </p>
                      <p className="text-white/50 text-xs mt-0.5">
                        You can now ask TimeMachine to play any song! Example: "Play Shape of You"
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Maximize button - shown when minimized */}
              {isMinimized && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={handleMaximize}
                    className="text-white/60 hover:text-white transition-colors p-1.5 rounded-full bg-black/50 hover:bg-black/70"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* YouTube Embed */}
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {/* Loading Spinner Overlay */}
                {(isLoading || iframeLoading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-white/60 text-sm">Loading...</span>
                    </div>
                  </div>
                )}
                {!isLoading && (
                  <iframe
                    key={currentVideoId}
                    className="absolute inset-0 w-full h-full"
                    src={`${YOUTUBE_EMBED_BASE}${currentVideoId}`}
                    title="YouTube Music"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                  />
                )}
              </div>

              {/* Previous/Next Buttons - hidden when minimized */}
              <AnimatePresence>
                {!isMinimized && videoIds.length > 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 flex items-center justify-center gap-3"
                  >
                    <button
                      onClick={handlePrevious}
                      className="px-4 py-1.5 rounded-full text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
                      style={redGlassButtonStyle}
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-4 py-1.5 rounded-full text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
                      style={redGlassButtonStyle}
                    >
                      Next
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Close Button */}
        <motion.div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="p-3 rounded-full transition-all duration-300 relative group overflow-hidden"
            style={glassStyle}
          >
            {showPlaylist ? (
              <X className="w-5 h-5 text-white/80 relative z-10" />
            ) : (
              <PlayIcon className="w-5 h-5 relative z-10" />
            )}
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
