import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wand2, Scissors, Camera, Image as ImageIcon, Sparkles as SparkleIcon, Download, UploadCloud } from 'lucide-react';
import { generateAIResponse } from '../../services/ai/aiProxyService';

import { supabase } from '../../lib/supabase';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const WORKSHOP_MODES = ['Showcase', 'AI Designer', 'Fitting Room'];

export function FashionPage() {
    const [activeMode, setActiveMode] = useState('Showcase');
    const [designerPrompt, setDesignerPrompt] = useState('');
    const [gender, setGender] = useState('Women');
    const [colorPalette, setColorPalette] = useState('');
    const [dressType, setDressType] = useState('');
    const [isDesigning, setIsDesigning] = useState(false);
    const [generatedDesigns, setGeneratedDesigns] = useState<any[]>([]);

    // Fitting Room State
    const [selectedDress, setSelectedDress] = useState<string | null>(null);
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [isFitting, setIsFitting] = useState(false);
    const [finalFittingImage, setFinalFittingImage] = useState<string | null>(null);

    // Showcase State
    const [showcaseLooks, setShowcaseLooks] = useState<any[]>([]);
    const [isLoadingShowcase, setIsLoadingShowcase] = useState(true);

    // Fetch Showcase Looks on Mount
    React.useEffect(() => {
        const fetchLooks = async () => {
            setIsLoadingShowcase(true);
            try {
                const { data, error } = await supabase
                    .from('fashion_showcase')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw error;
                }
                setShowcaseLooks(data || []);
            } catch (error) {
                console.error('Error fetching showcase looks:', error);
            } finally {
                setIsLoadingShowcase(false);
            }
        };

        fetchLooks();
    }, []);

    const handleDesignSubmit = async () => {
        if (!designerPrompt.trim()) return;
        setIsDesigning(true);
        setGeneratedDesigns([]);

        try {
            const systemContent = `You are a professional fashion designer and the TimeMachine Digital Fashion Atelier AI. The user wants to design clothing based on the following specifications:
- Gender/Fit: ${gender}
- Garment Type: ${dressType || 'Any'}
- Color Palette: ${colorPalette || 'Any'}
- User Prompt: "${designerPrompt}"

CRITICAL: You MUST return ONLY a valid JSON array of exactly two (2) design objects. Do not include markdown code blocks, backticks, or any other text.
The JSON must perfectly match this structure:
[
  {
    "title": "Creative Fashion Design Name (e.g., Holographic Trench Coat)",
    "description": "A visually striking description of the garment and materials",
    "prompt": "Highly detailed image generation prompt for this specific design matching the user's specs (e.g., fashion editorial photography, runway model wearing [design], cinematic lighting, 8k)"
  },
  {
    "title": "A related but distinct variation",
    "description": "...",
    "prompt": "..."
  }
]`;

            // Use 'default' persona which maps to gpt-oss-120b in the proxy
            const response = await generateAIResponse([
                { id: 1, content: systemContent, isAI: false, hasAnimated: false }
            ], undefined, '', 'default');

            let finalContent = response.content;

            if (finalContent.includes('\`\`\`json')) {
                finalContent = finalContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            } else if (finalContent.includes('\`\`\`')) {
                finalContent = finalContent.replace(/\`\`\`/g, '').trim();
            }

            const jsonStart = finalContent.indexOf('[');
            const jsonEnd = finalContent.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                finalContent = finalContent.substring(jsonStart, jsonEnd + 1);
            }

            const parsedDesigns = JSON.parse(finalContent);

            const newDesigns = await Promise.all(parsedDesigns.map(async (design: any, idx: number) => {
                const imageUrl = `/api/image?prompt=${encodeURIComponent(design.prompt + ", fashion editorial photography, cinematic lighting, 8k resolution, highly detailed")}&process=create&persona=pro&orientation=portrait`;

                try {
                    // Fetch the image blob
                    const imgResponse = await fetch(imageUrl);
                    const blob = await imgResponse.blob();

                    // Upload to Supabase Storage
                    const fileExt = 'png';
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `designs/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('fashion')
                        .upload(filePath, blob, {
                            cacheControl: '3600',
                            upsert: false,
                        });

                    if (uploadError) {
                        console.error('Storage upload error:', uploadError);
                        throw uploadError;
                    }

                    // Get public URL
                    const { data: publicUrlData } = supabase.storage
                        .from('fashion')
                        .getPublicUrl(filePath);

                    const publicUrl = publicUrlData.publicUrl;

                    // Save to database
                    const { error: dbError } = await supabase
                        .from('fashion_designs')
                        .insert([{
                            title: design.title,
                            description: design.description,
                            prompt: design.prompt,
                            image_url: publicUrl
                        }] as any);

                    if (dbError) {
                        console.error('Database insert error:', dbError);
                    }

                    return {
                        id: Date.now() + idx,
                        title: design.title,
                        prompt: design.description,
                        image: publicUrl
                    };

                } catch (err) {
                    console.error("Error processing an image upload:", err);
                    // Fallback to the proxy URL if upload fails so the user still sees something
                    return {
                        id: Date.now() + idx,
                        title: design.title,
                        prompt: design.description,
                        image: imageUrl
                    };
                }
            }));

            setGeneratedDesigns(newDesigns);
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert("The TimeMachine atelier is currently overloaded. Please try again.");
        } finally {
            setIsDesigning(false);
        }
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
                            {isLoadingShowcase ? (
                                <div className="col-span-full flex justify-center py-20">
                                    <SparkleIcon className="w-8 h-8 text-white/50 animate-spin" />
                                </div>
                            ) : showcaseLooks.length === 0 ? (
                                <div className="col-span-full text-center py-20 text-white/50">
                                    No showcase items found.
                                </div>
                            ) : showcaseLooks.map((look: any, i: number) => (
                                <motion.div
                                    key={look.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="group cursor-pointer"
                                    onClick={() => {
                                        setSelectedDress(look.image_url);
                                        setActiveMode('Fitting Room');
                                    }}
                                >
                                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 bg-white/5">
                                        <img
                                            src={look.image_url}
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
                                            {look.tags && look.tags.map((tag: string) => (
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

                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-white/70 text-sm mb-2">Gender / Fit</label>
                                            <select
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                            >
                                                <option value="Women">Women's Wear</option>
                                                <option value="Men">Men's Wear</option>
                                                <option value="Unisex">Unisex / Androgynous</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-white/70 text-sm mb-2">Dress / Garment Type</label>
                                            <input
                                                type="text"
                                                value={dressType}
                                                onChange={(e) => setDressType(e.target.value)}
                                                placeholder="E.g., Trench Coat, Cargo Pants..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Color Palette</label>
                                        <input
                                            type="text"
                                            value={colorPalette}
                                            onChange={(e) => setColorPalette(e.target.value)}
                                            placeholder="E.g., Earth tones, Neon Cyberpunk, Pastel Blue..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Detailed Prompt</label>
                                        <textarea
                                            value={designerPrompt}
                                            onChange={e => setDesignerPrompt(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleDesignSubmit()}
                                            placeholder="E.g., A flowing ethereal gown made of liquid silver..."
                                            rows={3}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-blue-500/50 focus:ring-blue-500/50 transition-all text-lg shadow-inner resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
                                        <span>Try:</span>
                                        <button onClick={() => setDesignerPrompt("Cyberpunk street samurai jacket with neon accents")} className="hover:text-blue-400 transition-colors">Cyberpunk jacket</button>
                                        <span>•</span>
                                        <button onClick={() => setDesignerPrompt("Victorian goth corset dress in deep crimson velvet")} className="hover:text-blue-400 transition-colors">Goth corset</button>
                                    </div>

                                    <button
                                        onClick={handleDesignSubmit}
                                        disabled={isDesigning || !designerPrompt.trim()}
                                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold tracking-wider uppercase text-sm hover:from-blue-500 hover:to-sky-300 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                                    >
                                        {isDesigning ? (
                                            <SparkleIcon className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Wand2 className="w-4 h-4" /> Design
                                            </>
                                        )}
                                    </button>
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
                                                    onClick={() => {
                                                        setSelectedDress(design.image);
                                                        setActiveMode('Fitting Room');
                                                    }}
                                                    className="px-6 py-3 rounded-full bg-white text-black font-bold uppercase tracking-wider text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                                                >
                                                    <Camera className="w-4 h-4" /> Try On
                                                </button>
                                                <button className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 transition-transform border border-white/20 shadow-xl">
                                                    <Download className="w-5 h-5" />
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
                                        <Scissors className="w-4 h-4 text-sky-400" /> Workshop Tools
                                    </h3>

                                    <div className="space-y-6">
                                        {/* Target Subject Upload */}
                                        <div>
                                            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-3">1. Target Subject</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="model-upload"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    // Immediately show preview (optional) or just upload
                                                    // For now, let's just upload it straight to Supabase to get the public URL required by the edit API

                                                    setIsFitting(true);
                                                    try {
                                                        const fileExt = file.name.split('.').pop() || 'png';
                                                        const fileName = `${Date.now()}-model.${fileExt}`;
                                                        const filePath = `models/${fileName}`;

                                                        const { error: uploadError } = await supabase.storage
                                                            .from('fashion')
                                                            .upload(filePath, file);

                                                        if (uploadError) throw uploadError;

                                                        const { data } = supabase.storage.from('fashion').getPublicUrl(filePath);
                                                        setModelImage(data.publicUrl);
                                                    } catch (error) {
                                                        console.error("Error uploading model image:", error);
                                                        alert("Failed to upload model image.");
                                                    } finally {
                                                        setIsFitting(false);
                                                    }
                                                }}
                                            />
                                            <label htmlFor="model-upload" className="w-full flex-col flex items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-4 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer group text-center overflow-hidden relative">
                                                {modelImage ? (
                                                    <img src={modelImage} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Model" />
                                                ) : null}
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <UploadCloud className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-medium">{modelImage ? 'Change Photo' : 'Upload Photo'}</span>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Garment Upload/Selected */}
                                        <div>
                                            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-3">2. Garment Reference</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="garment-upload"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    setIsFitting(true);
                                                    try {
                                                        const fileExt = file.name.split('.').pop() || 'png';
                                                        const fileName = `${Date.now()}-garment.${fileExt}`;
                                                        const filePath = `garments/${fileName}`;

                                                        const { error: uploadError } = await supabase.storage
                                                            .from('fashion')
                                                            .upload(filePath, file);

                                                        if (uploadError) throw uploadError;

                                                        const { data } = supabase.storage.from('fashion').getPublicUrl(filePath);
                                                        setSelectedDress(data.publicUrl);
                                                    } catch (error) {
                                                        console.error("Error uploading garment image:", error);
                                                        alert("Failed to upload garment image.");
                                                    } finally {
                                                        setIsFitting(false);
                                                    }
                                                }}
                                            />
                                            <label htmlFor="garment-upload" className="w-full flex-col flex items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-4 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer group text-center overflow-hidden relative">
                                                {selectedDress ? (
                                                    <img src={selectedDress} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Garment" />
                                                ) : null}
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <UploadCloud className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-medium">{selectedDress ? 'Change Garment' : 'Upload Garment'}</span>
                                                </div>
                                            </label>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (!modelImage || !selectedDress) {
                                                    alert("Please provide both a model photo and a garment photo.");
                                                    return;
                                                }

                                                setIsFitting(true);
                                                setFinalFittingImage(null);

                                                try {
                                                    // Construct the edit URL
                                                    // The edit endpoint expects 'imageUrl' and 'maskUrl' (or similar based on how AI edit is built)
                                                    // Based on the user prompt: "/api/image?process=edit"
                                                    // Assuming The first is the image to edit (model) and the prompt describes what to do (put on the garment url)

                                                    const editPrompt = `Put this specific garment ${encodeURIComponent(selectedDress)} on the person in the image. Highly detailed, matching lighting and body shape.`;

                                                    const url = `/api/image?prompt=${editPrompt}&imageUrl=${encodeURIComponent(modelImage)}&process=edit&persona=pro`;

                                                    setFinalFittingImage(url);

                                                } catch (err) {
                                                    console.error("Fitting error:", err);
                                                    alert("Failed to perform magic fit.");
                                                } finally {
                                                    setIsFitting(false);
                                                }
                                            }}
                                            disabled={isFitting || !modelImage || !selectedDress}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold uppercase tracking-widest text-sm hover:from-blue-500 hover:to-sky-300 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50"
                                        >
                                            {isFitting ? <SparkleIcon className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                            {isFitting ? "Fitting..." : "Apply Magic Fit"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="lg:col-span-9 relative">
                                <div className="aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3] bg-white/5 bg-cover bg-center rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group flex items-center justify-center">

                                    {finalFittingImage ? (
                                        <img src={finalFittingImage} alt="Final Fitting" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center px-4">
                                            <ImageIcon className="w-12 h-12 text-white/50 mx-auto mb-4" />
                                            <h3 className="text-2xl font-black text-white mb-2">Interactive Canvas</h3>
                                            <p className="text-white/60">Upload a photo and select a garment to begin fitting.</p>
                                        </div>
                                    )}

                                    {/* Mock UI Overlays that appear on hover */}
                                    {finalFittingImage && (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
