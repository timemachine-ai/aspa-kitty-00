import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTheme } from '../../context/ThemeContext';
import { AudioPlayerBubble } from './AudioPlayerBubble';

interface ParticipantMessageProps {
    content: string;
    isChatMode: boolean;
    messageId: number;
    hasAnimated?: boolean;
    onAnimationComplete: (messageId: number) => void;
    senderNickname: string;
    imageData?: string | string[];
    audioData?: string;
    audioUrl?: string;
}

// Color palette for participants (cycles through these)
const participantColors = [
    'text-emerald-400',
    'text-amber-400',
    'text-rose-400',
    'text-sky-400',
    'text-violet-400',
    'text-teal-400',
    'text-orange-400',
    'text-indigo-400',
];

// Get a consistent color for a nickname
const getParticipantColor = (nickname: string): string => {
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
        hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    }
    return participantColors[Math.abs(hash) % participantColors.length];
};

export function ParticipantMessage({
    content,
    isChatMode,
    messageId,
    hasAnimated,
    onAnimationComplete,
    senderNickname,
    imageData,
    audioData,
    audioUrl,
}: ParticipantMessageProps) {
    const { theme } = useTheme();
    const participantColor = getParticipantColor(senderNickname);

    const MarkdownComponents = {
        h1: ({ children }: { children: React.ReactNode }) => (
            <h1 className={`text-2xl font-bold mt-6 mb-4 ${theme.text}`}>{children}</h1>
        ),
        h2: ({ children }: { children: React.ReactNode }) => (
            <h2 className={`text-xl font-bold mt-5 mb-3 ${theme.text}`}>{children}</h2>
        ),
        h3: ({ children }: { children: React.ReactNode }) => (
            <h3 className={`text-lg font-bold mt-4 mb-2 ${theme.text}`}>{children}</h3>
        ),
        p: ({ children }: { children: React.ReactNode }) => (
            <p className={`mb-4 leading-relaxed ${theme.text}`}>{children}</p>
        ),
        strong: ({ children }: { children: React.ReactNode }) => (
            <strong className={`font-bold ${participantColor}`}>{children}</strong>
        ),
        em: ({ children }: { children: React.ReactNode }) => (
            <em className={`italic opacity-80 ${theme.text}`}>{children}</em>
        ),
        ul: ({ children }: { children: React.ReactNode }) => (
            <ul className="list-disc ml-4 mb-4 space-y-2">{children}</ul>
        ),
        ol: ({ children }: { children: React.ReactNode }) => (
            <ol className="list-decimal ml-4 mb-4 space-y-2">{children}</ol>
        ),
        li: ({ children }: { children: React.ReactNode }) => (
            <li className={`leading-relaxed ${theme.text}`}>{children}</li>
        ),
        code: ({ children }: { children: React.ReactNode }) => (
            <code className={`bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono ${theme.text}`}>
                {children}
            </code>
        ),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            onAnimationComplete={() => !hasAnimated && onAnimationComplete(messageId)}
            className="w-full"
        >
            {/* Display audio response if present */}
            {audioUrl ? (
                <div className="w-full max-w-2xl mx-auto my-4">
                    <div className="flex flex-col gap-1">
                        <div className={`text-xs font-medium ${participantColor} opacity-60`}>
                            {senderNickname}
                        </div>
                        <AudioPlayerBubble
                            audioSrc={audioUrl}
                            isUserMessage={false}
                            className="max-w-full"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <div className={`text-xs font-medium ${participantColor} opacity-60`}>
                        {senderNickname}
                    </div>

                    {/* Display images if present */}
                    {imageData && (
                        <div className="mb-3 max-w-[85%]">
                            {Array.isArray(imageData) ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {imageData.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`Shared image ${index + 1}`}
                                            className="max-w-full h-auto rounded-lg object-cover max-h-48"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <img
                                    src={imageData}
                                    alt="Shared image"
                                    className="max-w-full h-auto rounded-lg object-cover max-h-48"
                                />
                            )}
                        </div>
                    )}

                    {/* Display audio if present */}
                    {audioData && (
                        <div className="mb-3 max-w-[85%]">
                            <AudioPlayerBubble
                                audioSrc={audioData}
                                isUserMessage={false}
                                className="max-w-full"
                            />
                        </div>
                    )}

                    {/* Display text content */}
                    {content && (
                        <div className={`${theme.text} text-base leading-relaxed max-w-[85%]`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={MarkdownComponents}
                                className="prose prose-invert prose-sm max-w-none"
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
