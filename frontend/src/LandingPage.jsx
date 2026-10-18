import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Sparkles, ArrowRight, ArrowUpRight, CheckCircle2,
    Star, X, Film, PartyPopper, Droplets, Coffee, Leaf, Flame, MessageSquare
} from 'lucide-react';
import Preloader from './Preloader';
import Reveal from './components/motion/Reveal';
import ArtisanalCupMotif from './components/ArtisanalCupMotif';

const DEFAULT_REVIEWS = [
    {
        _id: 'rev-1',
        name: 'Elena Rostova',
        rating: 5,
        comment: 'A true sanctuary in the city. The 72-hour sourdough and light Geisha roast pour-over was pure poetry.'
    },
    {
        _id: 'rev-2',
        name: 'Marcus Vance',
        rating: 5,
        comment: 'Booked the Private Mini Theatre for an anniversary screening. The private sit-in menu and hospitality were beyond exceptional.'
    },
    {
        _id: 'rev-3',
        name: 'Aria Montgomery',
        rating: 5,
        comment: 'The sun-dappled courtyard and olive groves create an ambience that slows down time. Highly recommended!'
    }
];

const TASTING_PAIRINGS = [
    {
        id: 'picual',
        tabLabel: 'Pairing 01 • Picual Andaluz',
        title: 'Picual Andaluz × Toasted Khorasan Levain',
        badge: 'Early October 2024 Press',
        profile: 'Herbaceous & Peppery',
        acidity: '0.14%',
        description: 'Green tomato vine and freshly cut meadow grasses meet the caramelized nutty crust of our slow-milled Khorasan loaf. Finished with crystallized sea salt crystals that release burst-like notes of artichoke and peppery warmth.',
        imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1000&q=80',
        notes: 'Tomato Leaf, Fig Tree',
        palate: 'Crisp, Piquant Finish',
        companion: 'Ethiopian Yirgacheffe V60'
    },
    {
        id: 'koroneiki',
        tabLabel: 'Pairing 02 • Koroneiki Peloponnese',
        title: 'Koroneiki Peloponnese × Mission Fig & Chèvre Tartine',
        badge: 'Mani Peninsula Harvest',
        profile: 'Wild Floral & Golden',
        acidity: '0.16%',
        description: 'Harvested from coastal terraced groves in Southern Greece. Imparts a sweet floral bouquet of wild sage and green almond, lifting the natural sweetness of caramelized figs and tangy cultured goat curd.',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1000&q=80',
        notes: 'Green Almond, Wild Sage',
        palate: 'Velvety & Lingering',
        companion: 'Geisha Natural Nitro Brew'
    },
    {
        id: 'nocellara',
        tabLabel: 'Pairing 03 • Nocellara del Belice',
        title: 'Nocellara del Belice × Cardamom-Spiced Flat White',
        badge: 'Valle del Belice Reserve',
        profile: 'Creamy Butter & Green Apple',
        acidity: '0.12%',
        description: 'The buttery, round softness of Sicilian Nocellara emulsifies effortlessly with textured oat milk, enhancing the cocoa and crushed green cardamom notes in our house espresso roast without masking its character.',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
        notes: 'Granny Smith, Sweet Butter',
        palate: 'Silk & Velour',
        companion: 'Guatemala Huehuetenango'
    }
];

const CRAFT_PILLARS = [
    {
        num: '01',
        title: '72hr Cold Ferment',
        desc: 'Prebiotic wild levain matured in temperature-controlled marble cellars to ensure peak digestibility and complex crumb depth.',
        icon: Flame,
        badge: "Zero Baker's Yeast"
    },
    {
        num: '02',
        title: '1st Cold-Press Harvest',
        desc: 'Estate-bottled monovarietals pressed within four hours of picking with certified <0.18% oleic acidity for unmatched polyphenol density.',
        icon: Droplets,
        badge: 'High Polyphenol Count'
    },
    {
        num: '03',
        title: 'Regenerative Heritage Grain',
        desc: 'Ancient Khorasan, Spelt, and Einkorn grains harvested from organic family farms practicing regenerative topsoil restoration.',
        icon: Leaf,
        badge: 'Biodiversity Certified'
    },
    {
        num: '04',
        title: '88+ SCA Micro-Lots',
        desc: 'Ethically traded coffee beans sourced directly from independent high-altitude estates, roasted in-house in small batches twice weekly.',
        icon: Coffee,
        badge: 'Omni-Roast Calibration'
    }
];

const LandingPage = () => {
    const [loading, setLoading] = useState(true);
    const [mediaList, setMediaList] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [activePairingId, setActivePairingId] = useState('picual');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
    const [myReview, setMyReview] = useState(() => {
        const saved = localStorage.getItem('myReview');
        return saved ? JSON.parse(saved) : null;
    });

    const handleAnimationDone = () => setLoading(false);

    // Fetch dynamic home media
    useEffect(() => {
        axios.get('/api/home/media')
            .then(res => {
                if (res.data?.data?.media) setMediaList(res.data.data.media);
            })
            .catch(() => {});
    }, []);

    // Fetch dynamic public reviews
    useEffect(() => {
        axios.get('/api/reviews/public')
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) setReviews(res.data);
                else setReviews(DEFAULT_REVIEWS);
            })
            .catch(() => setReviews(DEFAULT_REVIEWS));
    }, []);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.name || !newReview.comment) return;
        try {
            const res = await axios.post('/api/reviews', newReview);
            if (res.data?.review) {
                localStorage.setItem('myReview', JSON.stringify(res.data.review));
                setMyReview(res.data.review);
                setShowReviewModal(false);
                setNewReview({ name: '', rating: 5, comment: '' });
                alert('Thank you for your review!');
            }
        } catch {
            alert('Failed to submit review.');
        }
    };

    const venueHalls = useMemo(() => {
        const items = mediaList.filter(
            item => item.section === 'reservations' &&
                    item.imageKey !== 'reservation-confirmation' &&
                    item.imageKey !== 'reservation-venue-booking' &&
                    item.isEnabled !== false &&
                    item.isDeleted !== true
        );

        if (!items.length) {
            return [
                {
                    id: 'theatre',
                    title: 'Private Mini Theatre',
                    desc: 'Screen movies, stream live games, and dine in luxury with Dolby Atmos sound and cozy reclining lounges.',
                    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80',
                    url: '/reservations/booking?zone=theatre',
                    icon: Film,
                    capacity: 'Up to 8 Guests'
                }
            ];
        }

        return items.slice(0, 3).map(item => {
            const cleanTitle = item.label ? item.label.replace(/^Reservation:\s*/i, '').trim() : 'Sanctuary Space';
            const isTheatre = item.imageKey?.includes('theatre');
            return {
                id: item.imageKey,
                title: cleanTitle,
                desc: item.description || 'Private sanctuary crafted for bespoke gatherings and tranquil celebrations.',
                imageUrl: item.imageUrl,
                url: isTheatre ? '/reservations/booking?zone=theatre' : `/reservations/booking?zone=partyHall1&venue=${encodeURIComponent(cleanTitle)}`,
                icon: isTheatre ? Film : PartyPopper,
                capacity: item.capacity ? `Up to ${item.capacity} Guests` : 'Up to 50 Guests'
            };
        });
    }, [mediaList]);

    const activePairing = useMemo(() => {
        return TASTING_PAIRINGS.find(p => p.id === activePairingId) || TASTING_PAIRINGS[0];
    }, [activePairingId]);

    const displayedReviews = [...reviews];
    if (myReview && !displayedReviews.find(r => r._id === myReview._id)) {
        displayedReviews.unshift(myReview);
    }

    const { row1Reviews, row2Reviews } = useMemo(() => {
        const source = displayedReviews && displayedReviews.length > 0 ? displayedReviews : DEFAULT_REVIEWS;

        // Helper to expand and duplicate cards for seamless, endless 0% to -50% marquee looping
        const prepareRow = (items) => {
            if (!items || items.length === 0) return [];
            let expanded = [...items];
            while (expanded.length < 5) {
                expanded = [...expanded, ...items];
            }
            return [...expanded, ...expanded];
        };

        let r1 = [];
        let r2 = [];
        if (source.length >= 4) {
            source.forEach((rev, idx) => {
                if (idx % 2 === 0) r1.push(rev);
                else r2.push(rev);
            });
        } else {
            r1 = [...source];
            r2 = [...source].reverse();
        }

        return {
            row1Reviews: prepareRow(r1),
            row2Reviews: prepareRow(r2)
        };
    }, [displayedReviews]);

    return (
        <div className="min-h-screen bg-transparent text-olive-deep font-sans antialiased selection:bg-olive-rich selection:text-linen">
            {loading && <Preloader onAnimationDone={handleAnimationDone} />}

            {/* 1. Dynamic Announcement & Harvest Ticker */}
            <aside aria-label="Daily harvest bulletin" className="w-full bg-[#263316] text-[#d4eab7] py-2.5 px-4 shadow-sm relative overflow-hidden z-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left text-xs">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span className="uppercase tracking-widest font-semibold text-white">Live From The Hearth</span>
                        <span className="hidden sm:inline opacity-40">•</span>
                        <p className="font-light text-[#d8e9be]">
                            Morning Levain Drops: <strong className="font-semibold text-white">7:00 AM & 1:00 PM</strong> • Now Pouring: <em className="italic">Single-Estate Finca El Paraíso Geisha</em>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-stone-300">
                        <span className="uppercase tracking-wider hidden lg:inline">Peloponnese 1st Cold-Press Reserve</span>
                        <Link to="/reservations" className="uppercase tracking-widest text-gold-accent hover:text-white transition-colors flex items-center gap-1 font-semibold">
                            <span>Table Bookings Open</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* 2. Showstopper Hero Sanctuary */}
            <section className="relative w-full bg-cream-surface/60 backdrop-blur-[0.5px] py-12 lg:py-20 border-b border-[#e8e4d8] overflow-hidden">
                {/* Background Motif Aura */}
                <ArtisanalCupMotif opacity="opacity-[0.06] md:opacity-[0.08]" scale="scale-125" />

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                    {/* Upper Hero: Typography & Atelier Index */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 lg:mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:col-span-8 space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e8e4d8] text-gold-accent shadow-xs animate-pulse-glow">
                                <Sparkles size={14} className="text-gold-accent" />
                                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-olive-deep">
                                    Organic Sophistication • London & Athens
                                </span>
                            </div>

                            <h1 className="font-serif text-4xl sm:text-6xl text-olive-deep leading-[1.08] tracking-tight">
                                Where Slow Living Meets Botanical Mastery
                            </h1>

                            <p className="text-olive-muted text-base sm:text-lg max-w-2xl font-light leading-relaxed">
                                Step out of the metropolitan rush into OLIV. A sun-dappled sanctuary where century-old olive groves, 72-hour stoneground levain, and single-origin micro-lot coffees converge in unhurried harmony.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                <Link
                                    to="/reservations"
                                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
                                >
                                    <span>Reserve Your Sanctuary Table</span>
                                    <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                                <Link
                                    to="/menu"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-stone-50 text-olive-deep border border-[#e8e4d8] text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-sm"
                                >
                                    <span>Explore Artisanal Menu</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-olive-muted">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={16} className="text-gold-accent" />
                                    <span className="uppercase tracking-wide font-medium">Zero Chemical Additives</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={16} className="text-gold-accent" />
                                    <span className="uppercase tracking-wide font-medium">100% Regenerative Spelt</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={16} className="text-gold-accent" />
                                    <span className="uppercase tracking-wide font-medium">First Cold Press Extra Virgin</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Atelier Index Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:col-span-4 bg-white/95 backdrop-blur-sm p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] shadow-sm space-y-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#ece7dc]">
                                <span className="text-[11px] uppercase tracking-widest text-olive-muted font-bold">Today's Atelier Index</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-olive-light text-olive-deep text-[11px] font-bold">Harvest No. 24</span>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-olive-muted">Hearth Oven Temperature</span>
                                    <span className="font-serif font-bold text-olive-deep text-sm">265°C / Beechwood</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-olive-muted">Levain Hydration Level</span>
                                    <span className="font-serif font-bold text-olive-deep text-sm">82% Heritage Blend</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-olive-muted">Roast Profile</span>
                                    <span className="font-serif font-bold text-olive-deep text-sm">Light Nordic / 215°C</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-olive-muted">Extra Virgin Estate</span>
                                    <span className="font-serif font-bold text-olive-deep text-sm">Jaén First-Crop Picual</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Stitch 3-Panel Editorial Masterpiece Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 pt-4">
                        {/* Panel 1: Sunlit Morning Space */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="md:col-span-4 relative group overflow-hidden rounded-3xl bg-surface-container h-[420px] shadow-sm"
                        >
                            <img
                                alt="Morning at OLIV Atelier"
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#27331b]/85 via-[#27331b]/25 to-transparent" />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-olive-deep text-[11px] font-semibold uppercase tracking-wider shadow-xs">
                                    7:30 AM Morning Glow
                                </span>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-200 font-semibold">Space Architecture</span>
                                <h3 className="font-serif text-2xl font-bold text-white">Sunroom & Reading Solarium</h3>
                                <p className="text-xs text-white/80 font-light line-clamp-2">
                                    Acoustic linen drapes and filtered northern light designed for quiet contemplation.
                                </p>
                            </div>
                        </motion.div>

                        {/* Panel 2: Golden Hearth & Sourdough Ritual */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="md:col-span-5 relative group overflow-hidden rounded-3xl bg-surface-container h-[420px] shadow-md md:-mt-4"
                        >
                            <img
                                alt="Artisan Baker Sourdough Olive Oil Ritual"
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#27331b]/90 via-[#27331b]/30 to-transparent" />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-olive-deep text-[11px] font-semibold uppercase tracking-wider shadow-xs">
                                    300-Yr Grove Provenance
                                </span>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-200 font-semibold">The Hearth Ritual</span>
                                <h3 className="font-serif text-2xl font-bold text-white">Wild Levain & First Press Koroneiki</h3>
                                <p className="text-xs text-white/80 font-light line-clamp-2">
                                    Baked on granite stones every sunrise using 100% ancient regenerative Khorasan grain.
                                </p>
                            </div>
                        </motion.div>

                        {/* Panel 3: Signature Olive Silk Latte */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="md:col-span-3 relative group overflow-hidden rounded-3xl bg-surface-container h-[420px] shadow-sm"
                        >
                            <img
                                alt="Signature Olive Silk Latte"
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#27331b]/85 via-[#27331b]/25 to-transparent" />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-olive-deep text-[11px] font-semibold uppercase tracking-wider shadow-xs">
                                    SCA 89+ Micro-Lot
                                </span>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-200 font-semibold">Roastery Reserve</span>
                                <h3 className="font-serif text-2xl font-bold text-white">Olive Silk Latte</h3>
                                <p className="text-xs text-white/80 font-light line-clamp-2">
                                    Double ristretto, silky microfoam, finished with Picual essence and sea salt.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. The Culinary Ethos & 4-Pillar Craft Counter */}
            <section className="w-full py-16 lg:py-24 bg-[#f5f3ee] border-b border-[#e8e4d8]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-14">
                    <Reveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 max-w-4xl">
                        <div className="space-y-3">
                            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-accent block">
                                The Culinary Ethos
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl font-medium text-olive-deep">
                                Patience Is Our Primary Ingredient
                            </h2>
                        </div>
                        <p className="text-sm sm:text-base text-olive-muted max-w-lg font-light leading-relaxed">
                            We reject fast food conventions. From our 72-hour dough maturation to monovarietal olive oil extractions harvested strictly before dawn, every sensory note honors soil and sun.
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {CRAFT_PILLARS.map((pillar, idx) => {
                            const Icon = pillar.icon;
                            return (
                                <motion.div
                                    key={pillar.num}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="p-8 rounded-3xl bg-white border border-[#e8e4d8] shadow-xs hover:shadow-xl transition-all space-y-4 relative overflow-hidden group"
                                >
                                    <span className="font-serif text-5xl font-bold text-stone-200 group-hover:text-gold-accent/40 transition-colors select-none block">
                                        {pillar.num}
                                    </span>
                                    <h3 className="font-serif text-xl font-bold text-olive-deep">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-xs text-olive-muted font-light leading-relaxed">
                                        {pillar.desc}
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-olive-rich">
                                        <Icon size={16} className="text-gold-accent" />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-olive-deep">
                                            {pillar.badge}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 4. The Olive & Roast Harmonization Bar (Interactive Sommelier Flight) */}
            <section className="w-full py-16 lg:py-24 bg-white border-b border-[#e8e4d8]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2">
                        <Reveal>
                            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-accent block mb-2">
                                Interactive Sommelier Flight
                            </span>
                            <h3 className="font-serif text-3xl sm:text-4xl font-medium text-olive-deep">
                                The Olive & Roast Harmonization Bar
                            </h3>
                        </Reveal>

                        {/* Pairing Switcher Tabs */}
                        <div className="inline-flex flex-wrap p-1.5 rounded-2xl bg-[#f5f3ee] border border-[#e8e4d8]">
                            {TASTING_PAIRINGS.map(pairing => (
                                <button
                                    key={pairing.id}
                                    type="button"
                                    onClick={() => setActivePairingId(pairing.id)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${
                                        activePairingId === pairing.id
                                            ? 'bg-olive-deep text-white shadow-sm'
                                            : 'text-stone-600 hover:text-olive-deep'
                                    }`}
                                >
                                    {pairing.tabLabel}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Tasting Flight with Animated Crossfade */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePairing.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -14 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 lg:p-10 rounded-3xl bg-[#fbf9f3] border border-[#e8e4d8] shadow-xs"
                        >
                            <div className="lg:col-span-5 relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-stone-100 shadow-sm">
                                <img
                                    alt={activePairing.title}
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                    src={activePairing.imageUrl}
                                />
                                <span className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-olive-deep text-[11px] font-semibold uppercase tracking-wider shadow-xs">
                                    {activePairing.badge}
                                </span>
                            </div>

                            <div className="lg:col-span-7 space-y-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-3.5 py-1 rounded-full bg-[#d4eab7] text-[#263316] text-[11px] font-bold uppercase tracking-wider">
                                        Profile: {activePairing.profile}
                                    </span>
                                    <span className="text-stone-500 text-xs font-medium">
                                        Acidity: <strong className="text-olive-deep">{activePairing.acidity}</strong>
                                    </span>
                                </div>

                                <h4 className="font-serif text-2xl sm:text-3xl font-bold text-olive-deep leading-snug">
                                    {activePairing.title}
                                </h4>

                                <p className="text-sm text-olive-muted font-light leading-relaxed">
                                    {activePairing.description}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div className="p-4 rounded-xl bg-white border border-[#ece7dc] space-y-1">
                                        <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">Top Notes</span>
                                        <span className="font-medium text-xs text-olive-deep">{activePairing.notes}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border border-[#ece7dc] space-y-1">
                                        <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">Palate Feel</span>
                                        <span className="font-medium text-xs text-olive-deep">{activePairing.palate}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border border-[#ece7dc] space-y-1">
                                        <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">Companion Sip</span>
                                        <span className="font-medium text-xs text-olive-deep">{activePairing.companion}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* 5. Sanctuary Spaces / Private Hostings (Dynamic Database Bindings Preserved) */}
            <section className="py-20 max-w-7xl mx-auto px-6 lg:px-12">
                <Reveal className="text-center max-w-3xl mx-auto mb-14">
                    <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-accent mb-2 block">
                        Exclusive Environments
                    </span>
                    <h2 className="font-serif text-3xl sm:text-5xl font-medium text-olive-deep">
                        Bespoke Gathering Sanctuaries
                    </h2>
                    <p className="text-olive-muted text-sm sm:text-base font-light mt-3">
                        Immerse your guests in dedicated spaces crafted for celebrations, screenings, and private feasts.
                    </p>
                </Reveal>

                <div className={`grid gap-8 ${venueHalls.length === 1 ? 'max-w-xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {venueHalls.map((hall, idx) => {
                        const Icon = hall.icon;
                        return (
                            <motion.article
                                key={hall.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.15 }}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                className="bg-white rounded-3xl overflow-hidden border border-[#e8e4d8] shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group"
                            >
                                <div className="relative h-64 w-full bg-stone-100 overflow-hidden">
                                    <img
                                        src={hall.imageUrl}
                                        alt={hall.title}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    <span className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                                        {hall.capacity}
                                    </span>
                                </div>
                                <div className="p-7 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-olive-light flex items-center justify-center text-olive-deep">
                                            <Icon size={18} />
                                        </div>
                                        <h3 className="font-serif text-2xl font-bold text-olive-deep">{hall.title}</h3>
                                    </div>
                                    <p className="text-xs text-olive-muted font-light leading-relaxed">{hall.desc}</p>
                                    <Link
                                        to={hall.url}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-cream-surface hover:bg-olive-deep hover:text-white text-olive-deep border border-[#d8d3c5] text-xs font-bold uppercase tracking-wider transition-all duration-300 group"
                                    >
                                        <span>Configure Reservation</span>
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            </section>

            {/* 6. Customer Words & Community Reviews (Dynamic Database Bindings Preserved) */}
            <section className="py-20 bg-cream-surface border-t border-[#e8e4d8] overflow-hidden select-none">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <Reveal>
                            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-accent block mb-2">
                                Guest Impressions
                            </span>
                            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-olive-deep">
                                Words from Our Sanctuary
                            </h2>
                        </Reveal>
                        <button
                            type="button"
                            onClick={() => setShowReviewModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 self-start md:self-auto cursor-pointer"
                        >
                            <MessageSquare size={14} /> Leave a Review
                        </button>
                    </div>
                </div>

                {/* Dual-Direction Infinite Moving Marquees with Edge Gradient Masks */}
                <div className="relative space-y-6">
                    {/* Left & Right Soft Blur Fades so cards seamlessly disappear and emerge */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-cream-surface to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-cream-surface to-transparent z-10 pointer-events-none" />

                    {/* Row 1: First Line of Reviews Moving from Right to Left */}
                    <div className="overflow-hidden py-1">
                        <div className="flex gap-6 w-max animate-scroll-left pause-on-hover pl-4">
                            {row1Reviews.map((rev, idx) => (
                                <div
                                    key={`r1-${rev._id || idx}-${idx}`}
                                    className="w-[300px] sm:w-[380px] shrink-0 bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 select-none cursor-default"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1 text-gold-accent">
                                                {[...Array(rev.rating || 5)].map((_, i) => (
                                                    <Star key={i} size={14} fill="currentColor" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                                                Verified Guest
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-[13px] text-olive-deep font-light leading-relaxed italic line-clamp-3">
                                            "{rev.comment}"
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-[#f1eee7] flex items-center justify-between">
                                        <span className="font-serif font-bold text-sm text-olive-deep">
                                            — {rev.name}
                                        </span>
                                        <span className="text-[10px] text-gold-accent font-semibold tracking-wider uppercase">
                                            Atelier Guest
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Second Line of Reviews Moving from Left to Right */}
                    <div className="overflow-hidden py-1">
                        <div className="flex gap-6 w-max animate-scroll-right pause-on-hover pl-4">
                            {row2Reviews.map((rev, idx) => (
                                <div
                                    key={`r2-${rev._id || idx}-${idx}`}
                                    className="w-[300px] sm:w-[380px] shrink-0 bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 select-none cursor-default"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1 text-gold-accent">
                                                {[...Array(rev.rating || 5)].map((_, i) => (
                                                    <Star key={i} size={14} fill="currentColor" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                                                Verified Guest
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-[13px] text-olive-deep font-light leading-relaxed italic line-clamp-3">
                                            "{rev.comment}"
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-[#f1eee7] flex items-center justify-between">
                                        <span className="font-serif font-bold text-sm text-olive-deep">
                                            — {rev.name}
                                        </span>
                                        <span className="text-[10px] text-gold-accent font-semibold tracking-wider uppercase">
                                            Atelier Guest
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Review Submission Modal with AnimatePresence */}
            <AnimatePresence>
                {showReviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 16 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-[#e8e4d8] shadow-2xl relative"
                        >
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <h3 className="font-serif text-2xl font-bold text-olive-deep">Leave a Review</h3>
                            <p className="text-xs text-olive-muted">Share your thoughts on our coffee, sourdough, or spaces.</p>
                            <form onSubmit={handleReviewSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-olive-deep block mb-1">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newReview.name}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Maya Lin"
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-olive-deep block mb-1">
                                        Rating
                                    </label>
                                    <select
                                        value={newReview.rating}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, rating: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:outline-none focus:ring-2 focus:ring-olive-deep cursor-pointer"
                                    >
                                        <option value={5}>5 Stars - Pure Serenity</option>
                                        <option value={4}>4 Stars - Wonderful</option>
                                        <option value={3}>3 Stars - Good</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-olive-deep block mb-1">
                                        Your Experience
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        placeholder="Tell us what you enjoyed..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:outline-none focus:ring-2 focus:ring-olive-deep resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-full bg-olive-deep text-white text-xs font-bold uppercase tracking-wider shadow-sm mt-2 hover:bg-olive-rich transition-colors"
                                >
                                    Submit Review
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;