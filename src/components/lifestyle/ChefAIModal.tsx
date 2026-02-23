import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, ChefHat, Clock, Flame, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface ChefAIModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const steps = [
    "Analyzing your prompt...",
    "Consulting culinary archives...",
    "Balancing flavors...",
    "Plating the digital dish...",
    "Finalizing recipe..."
];

export function ChefAIModal({ isOpen, onClose }: ChefAIModalProps) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setResult(null);
        setLoadingStep(0);

        // Simulate multi-step AI generation
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (currentStep < steps.length) {
                setLoadingStep(currentStep);
            } else {
                clearInterval(interval);
                setIsGenerating(false);
                setResult({
                    title: "Quantum Truffle Pasta",
                    description: "A futuristic take on a classic Italian dish, infused with synthetic truffle essence and zero-gravity shaped pasta.",
                    time: "30 min",
                    difficulty: "Medium",
                    calories: "450 kcal",
                    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=2000&auto=format&fit=crop",
                    ingredients: [
                        { name: "Zero-G Pasta", amount: "200g", checked: false },
                        { name: "Synthetic Truffle Oil", amount: "2 tbsp", checked: false },
                        { name: "Neo-Parmesan", amount: "50g", checked: false },
                        { name: "Himalayan Pink Salt", amount: "1 tsp", checked: false },
                        { name: "Micro-greens", amount: "Handful", checked: false },
                    ],
                    instructions: [
                        "Boil the Zero-G pasta in heavily salted water until exactly al dente (approx 8 minutes).",
                        "In a separate pan, warm the Synthetic Truffle Oil over low heat.",
                        "Drain the pasta, reserving 1/4 cup of the starchy water.",
                        "Toss the pasta in the truffle oil, adding the reserved water and Neo-Parmesan simultaneously.",
                        "Stir vigorously off the heat until a sleek emulsion forms.",
                        "Garnish with Micro-greens and a final dusting of Neo-Parmesan."
                    ]
                });
            }
        }, 800);
    };

    const toggleIngredient = (idx: number) => {
        if (!result) return;
        const newIngredients = [...result.ingredients];
        newIngredients[idx].checked = !newIngredients[idx].checked;
        setResult({ ...result, ingredients: newIngredients });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[900px] md:h-[80vh] md:max-h-[800px] z-50 bg-black/40 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-md relative z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center">
                                    <ChefHat className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">TimeMachine Chef</h2>
                                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider">AI Culinary Engine</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                            {/* Empty State */}
                            {!isGenerating && !result && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-24 h-24 mb-8 relative">
                                        <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                                        <div className="absolute inset-2 bg-gradient-to-tr from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                            <Sparkles className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-4">What are you craving?</h3>
                                    <p className="text-white/40 max-w-sm mx-auto text-lg leading-relaxed mb-12">
                                        Describe a mood, an ingredient you want to use, or a completely crazy culinary concept.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                                        {['High protein vegan lunch', 'Cyberpunk street food', 'Dessert using only matcha & yuzu', 'Comfort food but make it fancy'].map(suggestion => (
                                            <button
                                                key={suggestion}
                                                onClick={() => {
                                                    setPrompt(suggestion);
                                                    setTimeout(() => inputRef.current?.focus(), 50);
                                                }}
                                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {isGenerating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-sm z-20">
                                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-orange-500 opacity-50"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-2 rounded-full border-b-2 border-l-2 border-pink-500 opacity-50"
                                        />
                                        <ChefHat className="w-10 h-10 text-white/80 animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Cooking up brilliance</h3>
                                    <div className="h-6">
                                        <AnimatePresence mode="wait">
                                            <motion.p
                                                key={loadingStep}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="text-orange-400 font-medium tracking-wide"
                                            >
                                                {steps[loadingStep]}
                                            </motion.p>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* Result State */}
                            {result && !isGenerating && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 md:p-10"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Left Col: Image & Info */}
                                        <div className="space-y-6">
                                            <div className="relative aspect-square rounded-[32px] overflow-hidden group shadow-2xl shadow-orange-500/10">
                                                <img src={result.image} alt={result.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3 text-orange-400" /> AI Generated
                                                </div>
                                                <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all border border-white/10">
                                                    <ImageIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div>
                                                <h1 className="text-4xl font-black text-white mb-3 leading-tight">{result.title}</h1>
                                                <p className="text-white/60 mb-6 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{result.description}</p>

                                                <div className="flex gap-4 mb-8">
                                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                                        <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                                                        <div>
                                                            <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Time</div>
                                                            <div className="text-white font-semibold text-sm">{result.time}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                                        <Flame className="w-5 h-5 text-pink-500 shrink-0" />
                                                        <div>
                                                            <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Energy</div>
                                                            <div className="text-white font-semibold text-sm">{result.calories}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Col: Ingredients & Steps */}
                                        <div className="space-y-10">
                                            {/* Ingredients */}
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                                    Ingredients
                                                    <span className="text-white/30 text-sm font-normal">({result.ingredients.length})</span>
                                                </h3>
                                                <div className="space-y-2">
                                                    {result.ingredients.map((ing: any, idx: number) => (
                                                        <motion.button
                                                            key={idx}
                                                            whileHover={{ x: 4 }}
                                                            onClick={() => toggleIngredient(idx)}
                                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${ing.checked ? 'bg-white/5 border-white/20' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${ing.checked ? 'bg-orange-500' : 'bg-white/10'}`}>
                                                                    {ing.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                </div>
                                                                <span className={`text-sm ${ing.checked ? 'text-white/50 line-through' : 'text-white'}`}>{ing.name}</span>
                                                            </div>
                                                            <span className="text-white/40 text-sm font-medium">{ing.amount}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Instructions */}
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-6">Instructions</h3>
                                                <div className="space-y-6">
                                                    {result.instructions.map((step: string, idx: number) => (
                                                        <div key={idx} className="flex gap-4">
                                                            <div className="w-8 h-8 shrink-0 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                                                                {idx + 1}
                                                            </div>
                                                            <p className="text-white/70 leading-relaxed text-sm pt-1">
                                                                {step}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="p-4 md:p-6 border-t border-white/5 bg-white/5 backdrop-blur-md shrink-0">
                            <div className="relative max-w-3xl mx-auto">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Ask for a recipe, ingredient ideas, or a dietary plan..."
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleGenerate();
                                    }}
                                    disabled={isGenerating}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all shadow-inner"
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || isGenerating}
                                    className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
