import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Eye, Heart, ArrowRight, Tag } from 'lucide-react';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const COLLECTIONS = [
    {
        id: 1,
        title: 'Urban Minimalist',
        subtitle: 'Spring/Summer 2026',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop',
        items: 12,
    },
    {
        id: 2,
        title: 'Midnight Avant-Garde',
        subtitle: 'Fall/Winter Archive',
        image: 'https://images.unsplash.com/photo-1485230895905-ef31fe018f2f?q=80&w=1920&auto=format&fit=crop',
        items: 8,
    },
    {
        id: 3,
        title: 'Y2K Revival',
        subtitle: 'Streetwear Essentials',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c028b?q=80&w=1920&auto=format&fit=crop',
        items: 24,
    }
];

const LOOKS = [
    {
        id: 101,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
        title: 'Oversized Blazer Set',
        price: '$240',
        tags: ['Outerwear', 'Minimal'],
    },
    {
        id: 102,
        image: 'https://images.unsplash.com/photo-1509631179647-0c5000642f55?q=80&w=1000&auto=format&fit=crop',
        title: 'Utility Cargo Pants',
        price: '$120',
        tags: ['Bottoms', 'Street'],
    },
    {
        id: 103,
        image: 'https://images.unsplash.com/photo-1524041255072-7da0525d6b34?q=80&w=1000&auto=format&fit=crop',
        title: 'Ribbed Knit Dress',
        price: '$180',
        tags: ['Dress', 'Evening'],
    },
    {
        id: 104,
        image: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=1000&auto=format&fit=crop',
        title: 'Chunky Leather Boots',
        price: '$310',
        tags: ['Footwear', 'Essentials'],
    },
];

export function FashionPage() {
    const [activeCollection, setActiveCollection] = useState(0);

    return (
        <div className="px-6 sm:px-10 max-w-7xl mx-auto w-full pb-20">
            <motion.div {...fadeUp(0.1)} className="text-center mb-16">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> The Lookbook
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-4 uppercase" style={{ fontFamily: 'Anton, sans-serif, system-ui' }}>
                    Curated<br />Aesthetics
                </h1>
                <p className="text-white/40 text-lg sm:text-xl max-w-2xl mx-auto font-light">
                    Discover hand-picked collections and elevate your personal style with our premium digital wardrobe.
                </p>
            </motion.div>

            {/* Hero Carousel */}
            <motion.div {...fadeUp(0.2)} className="relative h-[60vh] min-h-[500px] w-full mb-24 rounded-[40px] overflow-hidden group">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeCollection}
                        src={COLLECTIONS[activeCollection].image}
                        alt={COLLECTIONS[activeCollection].title}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute inset-y-0 left-0 p-10 md:p-16 flex flex-col justify-center max-w-2xl">
                    <motion.div
                        key={`text-${activeCollection}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <p className="text-white/70 font-medium tracking-[0.2em] uppercase text-sm mb-4">
                            {COLLECTIONS[activeCollection].subtitle}
                        </p>
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1]">
                            {COLLECTIONS[activeCollection].title}
                        </h2>
                        <div className="flex items-center gap-4">
                            <button className="px-8 py-4 rounded-full bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Shop Collection
                            </button>
                            <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Carousel indicators */}
                <div className="absolute bottom-10 left-10 md:left-16 flex gap-3">
                    {COLLECTIONS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveCollection(idx)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeCollection ? 'w-12 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Trending Looks Grid */}
            <motion.div {...fadeUp(0.3)}>
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight">Trending Looks</h3>
                        <p className="text-white/40 mt-1">This week's most curated pieces</p>
                    </div>
                    <button className="text-sm font-medium text-white/60 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-2">
                        View All <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {LOOKS.map((look, i) => (
                        <motion.div
                            key={look.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 bg-white/5">
                                <img
                                    src={look.image}
                                    alt={look.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Overlay actions */}
                                <div className="absolute bottom-[-50px] left-0 right-0 p-4 flex justify-center gap-3 group-hover:bottom-0 transition-all duration-300">
                                    <button className="p-3 rounded-full bg-white/90 backdrop-blur-md text-black hover:bg-white hover:scale-110 transition-all shadow-xl">
                                        <ShoppingBag className="w-4 h-4" />
                                    </button>
                                    <button className="p-3 rounded-full bg-white/90 backdrop-blur-md text-black hover:bg-white hover:scale-110 transition-all shadow-xl">
                                        <Heart className="w-4 h-4" />
                                    </button>
                                    <button className="p-3 rounded-full bg-black/90 backdrop-blur-md text-white hover:bg-black hover:scale-110 transition-all shadow-xl">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-white/80 transition-colors">{look.title}</h4>
                                    <div className="flex gap-2">
                                        {look.tags.map(tag => (
                                            <span key={tag} className="text-white/40 text-xs font-medium uppercase tracking-wider">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-white bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10">
                                    {look.price}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Editorial Banner */}
            <motion.div
                {...fadeUp(0.4)}
                className="mt-24 relative w-full h-[300px] rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center border border-white/10"
            >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-1000" />
                <div className="relative text-center z-10 p-8">
                    <Tag className="w-8 h-8 text-white mx-auto mb-4 opacity-50" />
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-[0.2em] mb-4">
                        Members Only Archive
                    </h2>
                    <p className="text-white/60 mb-6 max-w-md mx-auto">
                        Unlock exclusive drops, early access, and limited edition pieces.
                    </p>
                    <button className="px-8 py-3 rounded-full bg-transparent border-2 border-white text-white font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors">
                        Unlock Access
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
