import React, { useState, useMemo } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'motion/react';
import { ManagedImage, usePublicMediaList } from './utils/mediaUtils';
import Reveal from './components/motion/Reveal';

const DEFAULT_GALLERY_ITEMS = [
    {
        id: 'def-1',
        title: 'Bungalow Lounge',
        category: 'Ambience',
        subtitle: 'Atmospheric interior with mood lighting and plush banquettes.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'def-2',
        title: 'Garden Patio Seating',
        category: 'Ambience',
        subtitle: 'Sun-dappled open air dining amidst lush greenery.',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'def-3',
        title: 'Artisanal Espresso Brew',
        category: 'Food & Drinks',
        subtitle: 'Single-origin beans paired with silky organic milk art.',
        imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'def-4',
        title: 'Curated Pour-over Coffee',
        category: 'Food & Drinks',
        subtitle: 'Shared afternoon coffee tastings with roasts from Jaén and Ethiopia.',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'def-5',
        title: 'Private Screen Seating',
        category: 'Mini Theatre',
        subtitle: 'Exclusive cinematic chamber equipped with bespoke audio & recliners.',
        imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'def-6',
        title: 'Celebration Banquet Pavilion',
        category: 'Party Halls',
        subtitle: 'Bespoke event decor, warm brass chandeliers, and private dining.',
        imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
    }
];

const GalleryPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const { mediaList } = usePublicMediaList();

    const categories = ['All', 'Ambience', 'Food & Drinks', 'Mini Theatre', 'Party Halls', 'Curations'];

    const managedImages = useMemo(() => {
        const fromBackend = (mediaList || [])
            .filter((item) => (item.section === 'gallery' || item.section === 'reservations' || item.isGallery === true) && item.isEnabled !== false && item.imageUrl)
            .map((item) => {
                const category = item.category || (item.section === 'reservations' ? 'Party Halls' : 'Ambience');
                const cleanTitle = item.label ? item.label.replace(/^Reservation:\s*/i, '').trim() : 'Olive Sanctuary';
                return {
                    id: item.imageKey || item._id,
                    title: cleanTitle,
                    category,
                    subtitle: item.description || 'Curated sanctuary experience at Café Olive.',
                    imageUrl: item.imageUrl
                };
            });

        return fromBackend.length > 0 ? fromBackend : DEFAULT_GALLERY_ITEMS;
    }, [mediaList]);

    const filteredImages = useMemo(() => {
        return managedImages.filter(img => {
            if (selectedCategory === 'All') return true;
            return img.category?.toLowerCase() === selectedCategory.toLowerCase();
        });
    }, [managedImages, selectedCategory]);

    const activeImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

    const handlePrev = (e) => {
        e.stopPropagation();
        setLightboxIndex(prev => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setLightboxIndex(prev => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="min-h-screen bg-transparent font-sans text-olive-deep antialiased selection:bg-olive-rich selection:text-linen">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
                {/* Header Section */}
                <Reveal className="pt-6 pb-10 text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <span className="w-8 h-[1px] bg-gold-accent" />
                        <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gold-accent">
                            Moments & Atmosphere
                        </span>
                        <span className="w-8 h-[1px] bg-gold-accent" />
                    </div>
                    <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium text-olive-deep tracking-tight mb-4">
                        Visual Journal & Sanctuary Spaces
                    </h1>
                    <p className="max-w-2xl mx-auto text-olive-muted text-sm sm:text-base font-light leading-relaxed mb-8">
                        Immerse yourself in our botanical courtyards, hand-pulled espresso bars, intimate mini-theatre sanctuaries, and bespoke celebration pavilions.
                    </p>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2" role="tablist">
                        {categories.map(cat => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2 rounded-full text-xs tracking-wider uppercase transition-all duration-300 ${
                                        isSelected
                                            ? 'bg-olive-deep text-linen shadow-md font-semibold'
                                            : 'bg-white/70 hover:bg-white text-olive-deep border border-[#e8e1d5] hover:border-gold-accent font-medium'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-5 text-xs tracking-widest text-olive-muted uppercase">
                        <span className="font-semibold text-olive-deep">{filteredImages.length}</span> Archways on display
                    </div>
                </Reveal>

                {/* Arched Photo Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredImages.map((img, idx) => (
                        <article
                            key={img.id || idx}
                            onClick={() => setLightboxIndex(idx)}
                            className="group bg-white/70 hover:bg-white p-3.5 sm:p-4 rounded-3xl border border-[#e8e1d5] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                        >
                            <div className="w-full aspect-[4/5] rounded-t-full rounded-b-xl overflow-hidden relative bg-olive-light/50">
                                <ManagedImage
                                    src={img.imageUrl}
                                    alt={img.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 group-hover:brightness-100"
                                />
                                <div className="absolute inset-0 bg-olive-deep/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <span className="p-3 rounded-full bg-white/95 text-olive-deep shadow-md transform translate-y-3 group-hover:translate-y-0 transition-transform">
                                        <ZoomIn className="w-5 h-5 text-gold-accent" />
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 pb-2 text-center">
                                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-gold-accent block mb-1">
                                    {img.category}
                                </span>
                                <h2 className="font-serif text-xl font-normal text-olive-deep group-hover:text-olive-rich transition-colors">
                                    {img.title}
                                </h2>
                                {img.subtitle && (
                                    <p className="text-xs text-olive-muted font-light mt-1 line-clamp-1">
                                        {img.subtitle}
                                    </p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {activeImage && (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxIndex(null)}
                        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-4xl w-full bg-linen rounded-3xl overflow-hidden shadow-2xl border border-gold-accent/20 flex flex-col"
                        >
                            <button
                                onClick={() => setLightboxIndex(null)}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                                aria-label="Close lightbox"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black flex items-center justify-center overflow-hidden">
                                <img
                                    src={activeImage.imageUrl}
                                    alt={activeImage.title}
                                    className="w-full h-full object-contain"
                                />

                                {filteredImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="p-6 bg-cream-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-gold-accent block mb-1">
                                        {activeImage.category}
                                    </span>
                                    <h3 className="font-serif text-2xl text-olive-deep font-medium">
                                        {activeImage.title}
                                    </h3>
                                    <p className="text-xs text-olive-muted font-light mt-0.5">
                                        {activeImage.subtitle}
                                    </p>
                                </div>
                                <span className="text-xs text-olive-muted font-mono tracking-wider">
                                    {(lightboxIndex + 1).toString().padStart(2, '0')} / {filteredImages.length.toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GalleryPage;
