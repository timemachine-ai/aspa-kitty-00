import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wand2, Scissors, Camera, Image as ImageIcon, Sparkles as SparkleIcon, Download, UploadCloud } from 'lucide-react';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const WORKSHOP_MODES = ['Showcase', 'AI Designer', 'Fitting Room'];

const LOOKS = [
    {
        id: 101,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
        title: 'Oversized Blazer Set',
        tags: ['Outerwear', 'Minimal'],
    },
    {
        id: 102,
        image: 'https://images.unsplash.com/photo-1509631179647-0c5000642f55?q=80&w=1000&auto=format&fit=crop',
        title: 'Utility Cargo Pants',
        tags: ['Bottoms', 'Street'],
    },
    {
        id: 103,
        image: 'https://images.unsplash.com/photo-1524041255072-7da0525d6b34?q=80&w=1000&auto=format&fit=crop',
        title: 'Ribbed Knit Dress',
        tags: ['Dress', 'Evening'],
    },
    {
        id: 104,
        image: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=1000&auto=format&fit=crop',
        title: 'Chunky Leather Boots',
        tags: ['Footwear', 'Essentials'],
    },
];

export function FashionPage() {
    const [activeMode, setActiveMode] = useState('Showcase');
    const [designerPrompt, setDesignerPrompt] = useState('');
    const [isDesigning, setIsDesigning] = useState(false);
    const [generatedDesigns, setGeneratedDesigns] = useState<any[]>([]);

    const handleDesignSubmit = () => {
        if (!designerPrompt.trim()) return;
        setIsDesigning(true);

        // Simulate AI feeling
        setTimeout(() => {
            setIsDesigning(false);
            setGeneratedDesigns([
                {
                    id: 1,
                    image: 'https://images.unsplash.com/photo-1579493941151-50da256cb747?q=80&w=1000&auto=format&fit=crop',
                    title: 'Neon Cyber Punk Jacket',
                    prompt: designerPrompt
                },
                {
                    id: 2,
                    image: 'https://images.unsplash.com/photo-1550614000-4b95d4edae38?q=80&w=1000&auto=format&fit=crop',
                    title: 'Holographic Trench',
                    prompt: designerPrompt
                }
            ]);
        }, 3000);
    };

    return (
        <div className="px-6 sm:px-10 max-w-7xl mx-auto w-full pb-32">
            {/* Header & Workshop Navigation */}
            <motion.div {...fadeUp(0.1)} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold uppercase tracking-widest">
                    <Wand2 className="w-3.5 h-3.5" /> Fashion Workshop
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-8 uppercase" style={{ fontFamily: 'Anton, sans-serif, system-ui' }}>
                    Digital<br />Atelier
                </h1>

                {/* Mode Selector */}
                <div className="inline-flex items-center gap-2 p-1.5 rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-md">
                    {WORKSHOP_MODES.map(mode => (
                        <button
                            key={mode}
                            onClick={() => setActiveMode(mode)}
                            className={`px-6 py-3 rounded-[20px] text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeMode === mode
                                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* --- SHOWCASE MODE --- */}
                {activeMode === 'Showcase' && (
                    <motion.div
                        key="showcase"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {LOOKS.map((look, i) => (
                                <motion.div
                                    key={look.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="group cursor-pointer"
                                    onClick={() => setActiveMode('Fitting Room')}
                                >
                                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 bg-white/5">
                                        <img
                                            src={look.image}
                                            alt={look.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-60 group-hover:opacity-80 transition-opacity" />

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                            <button className="px-6 py-3 rounded-full bg-white text-black font-bold uppercase tracking-wider text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-2xl">
                                                <Camera className="w-4 h-4" /> Try It On
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{look.title}</h4>
                                        <div className="flex gap-2">
                                            {look.tags.map(tag => (
                                                <span key={tag} className="text-white/40 text-xs font-medium uppercase tracking-wider">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* --- AI DESIGNER MODE --- */}
                {activeMode === 'AI Designer' && (
                    <motion.div
                        key="designer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12 mb-12 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <h2 className="text-3xl font-black text-white mb-4">Prompt the Designer</h2>
                                <p className="text-white/50 mb-8 max-w-xl">
                                    Describe your dream garment. Our AI will weave your words into digital fabric inside the TimeMachine studio.
                                </p>

                                <div className="relative flex items-center mb-4">
                                    <input
                                        type="text"
                                        value={designerPrompt}
                                        onChange={e => setDesignerPrompt(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleDesignSubmit()}
                                        placeholder="E.g., A flowing ethereal gown made of liquid silver..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-6 pr-40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-pink-500/50 focus:ring-pink-500/50 transition-all text-lg shadow-inner"
                                    />
                                    <button
                                        onClick={handleDesignSubmit}
                                        disabled={isDesigning || !designerPrompt.trim()}
                                        className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold tracking-wider uppercase text-sm hover:from-pink-500 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isDesigning ? (
                                            <SparkleIcon className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Wand2 className="w-4 h-4" /> Create
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="flex gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
                                    <span>Try:</span>
                                    <button onClick={() => setDesignerPrompt("Cyberpunk street samurai jacket with neon accents")} className="hover:text-pink-400 transition-colors">Cyberpunk jacket</button>
                                    <span>•</span>
                                    <button onClick={() => setDesignerPrompt("Victorian goth corset dress in deep crimson velvet")} className="hover:text-pink-400 transition-colors">Goth corset</button>
                                </div>
                            </div>
                        </div>

                        {/* Generated Designs Grid */}
                        {generatedDesigns.length > 0 && !isDesigning && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            >
                                {generatedDesigns.map((design, idx) => (
                                    <motion.div
                                        key={design.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.2 }}
                                        className="group rounded-[32px] overflow-hidden bg-white/5 border border-white/10 relative p-4"
                                    >
                                        <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] mb-4">
                                            <img src={design.image} alt={design.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => setActiveMode('Fitting Room')}
                                                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                                                >
                                                    <Scissors className="w-6 h-6" />
                                                </button>
                                                <button className="w-14 h-14 rounded-full bg-black/80 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 transition-transform border border-white/20 shadow-xl">
                                                    <Download className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="px-2 pb-2">
                                            <h3 className="text-xl font-bold text-white leading-tight mb-2">{design.title}</h3>
                                            <p className="text-white/40 text-xs border-t border-white/10 pt-3">
                                                <span className="text-pink-400 font-semibold">Prompt: </span>
                                                "{design.prompt}"
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* --- FITTING ROOM MODE --- */}
                {activeMode === 'Fitting Room' && (
                    <motion.div
                        key="fitting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Tools Panel */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 backdrop-blur-xl">
                                    <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                                        <Scissors className="w-4 h-4 text-orange-400" /> Workshop Tools
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-3">Target Subject</label>
                                            <button className="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-6 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all group">
                                                <UploadCloud className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-medium">Upload Photo</span>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-3">Garment Tuning</label>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-2">
                                                        <span className="text-white/70">Warp & Fit</span>
                                                        <span className="text-white/40">75%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 w-[75%]" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-2">
                                                        <span className="text-white/70">Lighting Match</span>
                                                        <span className="text-white/40">90%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 w-[90%]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                            <Wand2 className="w-4 h-4" /> Apply Magic Fit
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="lg:col-span-9 relative">
                                <div className="aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3] bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group">
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-100 group-hover:opacity-0 transition-opacity duration-500">
                                        <div className="text-center px-4">
                                            <ImageIcon className="w-12 h-12 text-white/50 mx-auto mb-4" />
                                            <h3 className="text-2xl font-black text-white mb-2">Interactive Canvas</h3>
                                            <p className="text-white/60">Upload a photo and select a garment to begin fitting.</p>
                                        </div>
                                    </div>

                                    {/* Mock UI Overlays that appear on hover */}
                                    <div className="absolute top-6 left-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live Preview
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
