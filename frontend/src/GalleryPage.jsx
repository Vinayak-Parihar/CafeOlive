import React, { useState } from 'react';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'motion/react';
import { ManagedImage, mediaUrl, usePublicMedia } from './utils/mediaUtils';
import Reveal from './components/motion/Reveal';
import { StaggerGrid, StaggerItem } from './components/motion/StaggerGrid';

const GalleryPage = () => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const media = usePublicMedia();

    const categories = ["All", "Ambience", "Food & Drinks", "Mini Theatre", "Party Halls", "Gallery"];

    const managedImages = Object.values(media).filter((item) => item.section === 'gallery' && item.isEnabled !== false).map((item) => ({
        id: item.imageKey,
        imageKey: item.imageKey,
        url: mediaUrl(media, item.imageKey),
        category: item.category || 'Gallery',
        title: item.label
    }));
    const filteredImages = managedImages.filter(img =>
        selectedCategory === "All" || img.category === selectedCategory
    );

    const handlePrev = (e) => {
        e.stopPropagation();
        setLightboxIndex(prev => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setLightboxIndex(prev => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6 font-[Montserrat]">
            <div className="max-w-container-max mx-auto">
                
                {/* Header */}
                <Reveal className="text-center mb-16">
                    <span className="text-soft-gold text-xs font-semibold uppercase tracking-[0.25em] mb-2 block">Visual Sanctuary</span>
                    <h1 className="text-4xl md:text-6xl font-[Playfair_Display] text-primary font-bold mb-4">Gallery</h1>
                    <div className="h-[2px] w-24 bg-soft-gold mx-auto opacity-70"></div>
                    <p className="mt-6 text-on-surface-variant font-light text-base md:text-lg max-w-2xl mx-auto">
                        Peer into our aesthetic spaces, freshly brewed single-origin coffees, and memorable hostings.
                    </p>
                </Reveal>

                {/* Filter Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                                selectedCategory === cat
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-white text-on-surface-variant border border-surface-border hover:bg-surface-container-low'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Masonry / Grid */}
                <StaggerGrid as="div" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {filteredImages.map((img, idx) => (
                        <StaggerItem
                            as="button"
                            key={img.id}
                            onClick={() => setLightboxIndex(idx)}
                            className="group bg-white rounded-lg border border-surface-border p-4 soft-shadow cursor-pointer overflow-hidden relative text-left"
                            aria-label={`Open ${img.title} in gallery viewer`}
                        >
                            <div className="aspect-[4/5] arch-frame overflow-hidden w-full relative">
                                <ManagedImage
                                    src={img.url}
                                    alt={img.title} 
                                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white p-3 rounded-full text-primary shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                        <Camera size={20} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-[10px] text-soft-gold font-bold uppercase tracking-wider">{img.category}</span>
                                <h3 className="text-sm font-semibold text-primary mt-1">{img.title}</h3>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGrid>
            </div>

            {/* LIGHTBOX OVERLAY */}
            <AnimatePresence>
            {lightboxIndex !== null && (
                <Motion.div
                    className="fixed inset-0 bg-primary/95 backdrop-blur-md z-[10000] flex flex-col items-center justify-center p-4 text-white"
                    onClick={() => setLightboxIndex(null)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <button
                        className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition"
                        onClick={() => setLightboxIndex(null)}
                        aria-label="Close gallery viewer"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative max-w-4xl max-h-[75vh] flex items-center justify-center">
                        <button
                            className="absolute left-2 md:left-[-80px] p-3 bg-primary/70 md:bg-white/10 rounded-full hover:bg-white/20 transition z-10"
                            onClick={handlePrev}
                            aria-label="Previous gallery image"
                        >
                            <ChevronLeft size={28} />
                        </button>

                        <AnimatePresence mode="wait">
                            <Motion.div
                                key={lightboxIndex}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ManagedImage
                                    src={filteredImages[lightboxIndex].url}
                                    alt={filteredImages[lightboxIndex].title}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                                />
                            </Motion.div>
                        </AnimatePresence>

                        <button
                            className="absolute right-2 md:right-[-80px] p-3 bg-primary/70 md:bg-white/10 rounded-full hover:bg-white/20 transition z-10"
                            onClick={handleNext}
                            aria-label="Next gallery image"
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>

                    <div className="text-center mt-6 space-y-1">
                        <span className="text-xs text-soft-gold font-bold tracking-widest uppercase">{filteredImages[lightboxIndex].category}</span>
                        <h4 className="text-lg font-[Playfair_Display] font-medium">{filteredImages[lightboxIndex].title}</h4>
                    </div>
                </Motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default GalleryPage;
