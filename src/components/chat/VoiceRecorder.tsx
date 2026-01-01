import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, AlertCircle } from 'lucide-react';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import { AI_PERSONAS } from '../../config/constants';
import AiMicIcon from '../icons/AiMicIcon';

interface VoiceRecorderProps {
  onSendMessage: (message: string, imageData?: string | string[], audioData?: string) => void;
  disabled?: boolean;
  currentPersona?: keyof typeof AI_PERSONAS;
}

const personaGlowColors = {
  default: 'rgba(168,85,247,0.2)',
  girlie: 'rgba(255,0,128,0.5)',
  pro: 'rgba(34,211,238,0.2)'
} as const;

const personaBorderColors = {
  default: 'from-purple-600/20 to-blue-600/20',
  girlie: 'from-pink-500 to-rose-400',
  pro: 'from-cyan-600/20 to-blue-600/20'
} as const;

const personaVisualizerColors = {
  default: '#a855f7',
  girlie: '#ec4899',
  pro: '#06b6d4'
} as const;

function AudioVisualizer({ analyser, currentPersona = 'default' }: { analyser: AnalyserNode | null; currentPersona?: keyof typeof AI_PERSONAS }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength * 2.5;
      let barHeight;
      let x = 0;

      const color = personaVisualizerColors[currentPersona];

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, color + '80'); // Semi-transparent
        gradient.addColorStop(1, color + 'FF'); // Full opacity

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, currentPersona]);

  return (
    <canvas
      ref={canvasRef}
      width={20}
      height={20}
      className="w-5 h-5"
      style={{ filter: 'blur(0.5px)' }}
    />
  );
}

export function VoiceRecorder({ onSendMessage, disabled, currentPersona = 'default' }: VoiceRecorderProps) {
  const { isRecording, startRecording, stopRecording, error, analyser } = useAudioRecording();
  const [showError, setShowError] = useState(false);
  const personaClass = `persona-${currentPersona}`;

  const handleToggleRecording = async () => {
    try {
      setShowError(false);
      if (isRecording) {
        const audioData = await stopRecording();
        if (audioData) {
          await onSendMessage('', undefined, audioData);
        }
      } else if (!disabled) {
        await startRecording();
      }
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleToggleRecording}
        disabled={disabled && !isRecording}
        className={`glass-action-button ${personaClass} p-2.5
          disabled:opacity-40 disabled:cursor-not-allowed
          ${isRecording ? 'recording-active' : ''}`}
        style={isRecording ? {
          background: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        } : undefined}
        type="button"
      >
        <div className="relative z-10 flex items-center justify-center w-4 h-4">
          {isRecording ? (
            analyser ? (
              <AudioVisualizer analyser={analyser} currentPersona={currentPersona} />
            ) : (
              <Square className="w-4 h-4 text-white" />
            )
          ) : (
            <AiMicIcon className="w-4 h-4 text-white" />
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass-dropdown absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2
              text-white text-sm px-4 py-3 whitespace-nowrap"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.2)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-white/80">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}