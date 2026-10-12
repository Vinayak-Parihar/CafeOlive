import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Coffee, PartyPopper, ArrowRight, MapPin, Camera, Film, Clock, Tag, Users, Gift, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'motion/react';
import Preloader from './Preloader';
import Reveal from './components/motion/Reveal';
import { StaggerGrid, StaggerItem } from './components/motion/StaggerGrid';
import { useScrollTween } from './hooks/useScrollTween';

const HomeMediaImage = ({ src, alt, className }) => (
    src ? (
        <img src={src} alt={alt} className={className} />
    ) : (
        <div className={`${className} bg-primary/10`} role="img" aria-label={`${alt} image not configured`} />
    )
);

const LandingPage = () => {
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [homeMedia, setHomeMedia] = useState({});
    const [mediaList, setMediaList] = useState([]);

    const handleAnimationDone = () => {
        setLoading(false);
    };

    useEffect(() => {
        setShowContent(true);
    }, []);

    const heroRef = useRef(null);
    const heroParallaxRef = useRef(null);

    useScrollTween(heroRef, ({ gsap, ScrollTrigger }) => {
        ScrollTrigger.matchMedia({
            '(min-width: 768px)': () => {
                gsap.to(heroParallaxRef.current, {
                    yPercent: 15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true,
                    },
                });
            },
        });
    }, []);

    useEffect(() => {
        const fetchHomeMedia = async () => {
            try {
                const response = await fetch('/api/home/media');
                if (!response.ok) return;
                const data = await response.json();
                const rawList = data.data?.media || [];
                setMediaList(rawList);
                const mediaMap = rawList.reduce((map, media) => {
                    map[media.imageKey] = media;
                    return map;
                }, {});
                setHomeMedia(mediaMap);
            } catch (error) {
                console.error('Failed to fetch home media:', error);
            }
        };

        fetchHomeMedia();
    }, []);

    const homeImage = (imageKey) => homeMedia[imageKey]?.isEnabled === false
        ? ''
        : homeMedia[imageKey]?.imageUrl || '';

    const venueHalls = useMemo(() => {
        const items = mediaList.filter(
            (item) => item.section === 'reservations' &&
                      item.imageKey !== 'reservation-confirmation' &&
                      item.imageKey !== 'reservation-venue-booking' &&
                      item.isEnabled !== false
        );

        if (!items.length) {
            return [
                {
                    id: 'theatre',
                    title: 'Private Mini Theatre',
                    desc: 'Experience your private cinema. Screen movies, stream live games, and dine in luxury. Complete premium sound setup and cozy reclining lounges.',
                    imageUrl: homeImage('mini-theatre'),
                    url: '/reservations/booking?zone=theatre',
                    icon: Film,
                    buttonText: 'Book Mini Theatre',
                    features: ['3-Hour Booking', 'Screen/Stream ready', 'Complimentary Popcorn', 'Seat service menu']
                },
                {
                    id: 'partyHalls',
                    title: 'Bespoke Party Halls',
                    desc: 'Host elegant gatherings. Perfect for birthday parties, anniversaries, corporate seminars, and private dining events.',
                    imageUrl: homeImage('party-halls'),
                    url: '/reservations/booking?zone=partyHall1',
                    icon: PartyPopper,
                    buttonText: 'Book Party Halls',
                    features: ['Customizable decor', 'Dedicated hosts', 'Custom banquet menu', 'Ambient illumination']
                }
            ];
        }

        return items.map((item) => {
            const cleanTitle = item.label ? item.label.replace(/^Reservation:\s*/i, '').trim() : 'Bespoke Venue Hall';
            const isTheatre = item.imageKey.includes('theatre') || cleanTitle.toLowerCase().includes('theatre');
            const isHall2 = item.imageKey.includes('party-hall-2') || cleanTitle.toLowerCase().includes('hall 2') || cleanTitle.toLowerCase().includes('hall-2');

            let bookingUrl = '/reservations/inquiry';
            if (isTheatre) {
                bookingUrl = '/reservations/booking?zone=theatre';
            } else if (isHall2) {
                bookingUrl = `/reservations/booking?zone=partyHall2&venue=${encodeURIComponent(cleanTitle)}`;
            } else {
                bookingUrl = `/reservations/booking?zone=partyHall1&venue=${encodeURIComponent(cleanTitle)}`;
            }

            const desc = item.description || (isTheatre
                ? 'Experience your private cinema. Screen movies, stream live games, and dine in luxury. Complete premium sound setup and cozy reclining lounges.'
                : 'Host elegant gatherings. Perfect for birthday parties, anniversaries, corporate seminars, and private dining events.');

            let features = isTheatre
                ? ['3-Hour Booking', 'Screen/Stream ready', 'Complimentary Popcorn', 'Seat service menu']
                : ['Customizable decor', 'Dedicated hosts', 'Custom banquet menu', 'Ambient illumination'];

            if (item.capacity) {
                const capStr = String(item.capacity).trim();
                const capText = /guests?|people/i.test(capStr) ? capStr : `Up to ${capStr} guests`;
                features = [capText, ...features.slice(1)];
            }

            return {
                id: item.imageKey,
                title: cleanTitle,
                desc,
                imageUrl: item.imageUrl,
                url: bookingUrl,
                icon: isTheatre ? Film : PartyPopper,
                capacity: item.capacity,
                buttonText: `Book ${cleanTitle}`,
                features
            };
        });
    }, [mediaList, homeMedia]);

    // Review State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(() => {
        const saved = localStorage.getItem('myReview');
        return saved ? JSON.parse(saved) : null;
    });
    const [newReview, setNewReview] = useState({ name: '', rating: 0, comment: '' });

    // Fetch public reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/reviews/public');
                if (response.ok) {
                    const data = await response.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            }
        };
        fetchReviews();
    }, []);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (newReview.name && newReview.rating > 0) {
            try {
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReview)
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('myReview', JSON.stringify(data.review));
                    setMyReview(data.review);
                    setShowReviewModal(false);
                    setNewReview({ name: '', rating: 0, comment: '' });
                    alert("Thank you for your review!");
                }
            } catch (error) {
                console.error("Error submitting review:", error);
                alert("Failed to submit review. Please try again.");
            }
        }
    };

    const displayedReviews = [...reviews];
    if (myReview && !displayedReviews.find(r => r._id === myReview._id)) {
        displayedReviews.unshift(myReview);
    }
    // Second row scrolls opposite to the row above — same DB-backed reviews, reversed for variety.
    const secondRowReviews = [...displayedReviews].reverse();

    return (
        <div className="relative overflow-x-hidden bg-background">
            {loading && <Preloader onAnimationDone={handleAnimationDone} />}
            <div className={`min-h-screen transition-opacity duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

                {/* 1. HERO SECTION */}
                <div id="home" ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <div ref={heroParallaxRef} className="absolute inset-0">
                            <HomeMediaImage
                                src={homeImage('hero')}
                                alt="Olive Cafe Ambience"
                                className="w-full h-full object-cover brightness-[0.4] scale-105 animate-pulse-slow"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-transparent to-background"></div>
                    </div>

                    <div className="relative z-10 max-w-container-max mx-auto text-center flex flex-col items-center">
                        <div className="glass-panel p-8 md:p-16 rounded-lg max-w-4xl mx-auto soft-shadow animate-fade-in-up border border-white/20">
                            <span className="text-soft-gold text-xs font-semibold uppercase tracking-[0.3em] mb-4 block">
                                ORGANIC SOPHISTICATION
                            </span>
                            <h1 className="text-4xl md:text-[64px] font-[Playfair_Display] font-bold text-primary mb-6 leading-tight">
                                Taste The Calm
                            </h1>
                            <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto mb-10 font-[Montserrat] leading-relaxed">
                                Welcome to <span className="text-primary font-semibold">OLIV</span>. Discover a curated sanctuary where peaceful moments and organic, artisanal culinary craftsmanship unite.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link to="/menu">
                                    <button className="btn-stitch-primary text-sm flex items-center gap-2">
                                        Explore Menu <ArrowRight size={16} />
                                    </button>
                                </Link>
                                <Link to="/reservations">
                                    <button className="btn-stitch-outline text-sm bg-white/40">
                                        Reserve Now
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. OUR VIBE SECTION */}
                <div className="py-24 px-6 max-w-container-max mx-auto relative">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Image side with Stitch signature Arch layout */}
                        <Reveal direction="left" className="relative flex justify-center">
                            <div className="relative w-full max-w-md aspect-[4/5] arch-frame soft-shadow border border-surface-border">
                                <HomeMediaImage
                                    src={homeImage('our-vibe')}
                                    alt="Artisanal Cafe Vibe"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            {/* Decorative badge */}
                            <div className="absolute -bottom-6 -right-6 bg-surface-container p-6 rounded-full shadow-md border border-surface-border hidden md:block">
                                <Coffee className="text-primary" size={32} />
                            </div>
                        </Reveal>

                        {/* Content Side */}
                        <Reveal direction="right" delay={0.1} className="space-y-6 text-left">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-12 bg-soft-gold"></div>
                                <span className="text-soft-gold tracking-[0.2em] uppercase font-bold text-xs">Our Sanctuary</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-[Playfair_Display] font-medium text-primary leading-tight">
                                Slow Crafted <br />
                                <span className="italic font-light text-soft-gold">For Gentle Minds</span>
                            </h2>
                            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-light">
                                At Olive Café, we orchestrate an experience of organic calm. We source every ingredient sustainably, roasting our beans in small batches, and crafting dishes that delight your senses.
                            </p>
                            <div className="pt-4">
                                <Link to="/menu" className="btn-stitch-primary inline-block text-sm">
                                    Discover Our Menu
                                </Link>
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* 3. VENUE & AMBIENCE (5 Ambience Selections) */}
                <div className="bg-surface-container-low py-24 px-6">
                    <Reveal className="max-w-container-max mx-auto text-center mb-16">
                        <span className="text-soft-gold tracking-widest uppercase mb-2 font-semibold text-xs block">Vibe Directory</span>
                        <h2 className="text-3xl md:text-5xl font-[Playfair_Display] text-primary font-bold mb-4">Five Unique Atmospheres</h2>
                        <div className="h-[2px] w-24 bg-soft-gold mx-auto opacity-70"></div>
                        <p className="mt-6 text-on-surface-variant max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
                            A restored Bungalow featuring 5 distinct ambience settings. From sunlit indoor lounges to open-air gardens, find your perfect corner.
                        </p>
                    </Reveal>

                    <StaggerGrid className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StaggerItem className="group relative overflow-hidden rounded-lg shadow-sm h-96 soft-shadow border border-surface-border bg-white">
                            <HomeMediaImage src={homeImage('ambience-lounge')} alt="Cozy Indoor" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/10 to-transparent flex items-end p-8">
                                <h3 className="text-white text-2xl font-[Playfair_Display] font-medium">Bungalow Lounge</h3>
                            </div>
                        </StaggerItem>
                        <StaggerItem className="group relative overflow-hidden rounded-lg shadow-sm h-96 soft-shadow border border-surface-border bg-white">
                            <HomeMediaImage src={homeImage('ambience-garden')} alt="Garden Patio" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/10 to-transparent flex items-end p-8">
                                <h3 className="text-white text-2xl font-[Playfair_Display] font-medium">Garden Patio</h3>
                            </div>
                        </StaggerItem>
                        <StaggerItem className="group relative overflow-hidden rounded-lg shadow-sm h-96 soft-shadow border border-surface-border bg-white">
                            <HomeMediaImage src={homeImage('ambience-veranda')} alt="Neon Vibes" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/10 to-transparent flex items-end p-8">
                                <h3 className="text-white text-2xl font-[Playfair_Display] font-medium">Neon Veranda</h3>
                            </div>
                        </StaggerItem>
                    </StaggerGrid>
                </div>

                {/* 4. ENTERTAINMENT & EVENTS (Theatre & Party Halls) */}
                <div className="py-24 px-6 max-w-container-max mx-auto">
                    <Reveal className="text-center mb-16">
                        <span className="text-soft-gold tracking-widest uppercase mb-2 font-semibold text-xs block">Experiences</span>
                        <h2 className="text-3xl md:text-5xl font-[Playfair_Display] text-primary font-bold mb-4">Curated Venue Hosting</h2>
                        <div className="h-[2px] w-24 bg-soft-gold mx-auto opacity-70"></div>
                    </Reveal>

                    <StaggerGrid className={`grid grid-cols-1 ${venueHalls.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-8 md:gap-12`}>
                        {venueHalls.map((hall) => {
                            const Icon = hall.icon;
                            return (
                                <StaggerItem key={hall.id} className="glass-panel p-8 md:p-10 rounded-lg flex flex-col justify-between border border-surface-border">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/5 p-3 rounded-full text-primary">
                                                    <Icon size={24} />
                                                </div>
                                                <h3 className="text-2xl font-[Playfair_Display] font-semibold text-primary">{hall.title}</h3>
                                            </div>
                                            {hall.capacity && (
                                                <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-full border border-surface-border text-primary shrink-0 flex items-center gap-1 shadow-2xs">
                                                    <Users size={12} className="text-soft-gold" /> {String(hall.capacity).toLowerCase().includes('guest') ? hall.capacity : `${hall.capacity} Guests`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-surface-border">
                                            <HomeMediaImage src={hall.imageUrl} alt={hall.title} className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-on-surface-variant font-light text-sm leading-relaxed line-clamp-3">
                                            {hall.desc}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-on-surface-variant">
                                            {hall.features.map((feat, i) => (
                                                <span key={i} className="flex items-center gap-1.5">✓ {feat}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <Link to={hall.url} className="btn-stitch-primary w-full text-center inline-block text-xs font-bold uppercase tracking-wider">
                                            {hall.buttonText}
                                        </Link>
                                    </div>
                                </StaggerItem>
                            );
                        })}
                    </StaggerGrid>
                </div>

                {/* 5. TIMINGS & OFFERS */}
                <div className="bg-surface-container py-20 px-6">
                    <Reveal className="max-w-4xl mx-auto bg-white rounded-lg border border-surface-border shadow-sm overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/2 bg-primary text-white p-10 flex flex-col justify-center items-center text-center">
                            <Tag size={40} className="mb-4 text-soft-gold" />
                            <h3 className="text-2xl font-[Playfair_Display] font-bold mb-2">Exquisite Offers</h3>
                            <div className="w-16 h-[2px] bg-soft-gold rounded-full mb-6"></div>
                            <p className="text-sm opacity-90 mb-6 font-[Montserrat]">
                                Celebrate with us. Ask our hosts about our special curate packages for celebrations and gatherings.
                            </p>
                            <Link to="/reservations/inquiry" className="bg-white text-primary px-6 py-2.5 rounded-full font-semibold text-xs tracking-wider uppercase hover:bg-soft-gold hover:text-primary transition duration-300">
                                Inquiry 
                            </Link>
                        </div>
                        <div className="md:w-1/2 p-10 flex flex-col justify-center items-center text-center">
                            <Clock size={40} className="mb-4 text-primary" />
                            <h3 className="text-2xl font-[Playfair_Display] font-bold text-primary mb-2">Hours of Calm</h3>
                            <div className="w-16 h-[2px] bg-soft-gold rounded-full mb-6"></div>
                            <div className="space-y-1 font-[Montserrat]">
                                <p className="text-on-surface-variant uppercase tracking-wider text-xs font-semibold">Every Day</p>
                                <p className="text-3xl font-bold text-primary">6:00 PM</p>
                                <p className="text-on-surface-variant text-xs font-light">to</p>
                                <p className="text-3xl font-bold text-primary">10:30 PM</p>
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* 6. CAPTURED MOMENTS GALLERY REDIRECT */}
                <div className="py-24 px-6 max-w-container-max mx-auto text-center">
                    <Reveal>
                        <span className="text-soft-gold tracking-widest uppercase mb-2 font-semibold text-xs block">Aesthetic Sanctuary</span>
                        <h2 className="text-3xl md:text-5xl font-[Playfair_Display] text-primary font-bold mb-8">Captured Moments</h2>
                    </Reveal>

                    <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-6 h-[400px] mb-8">
                        <StaggerItem className="rounded-lg overflow-hidden border border-surface-border">
                            <HomeMediaImage src={homeImage('gallery-1')} alt="Atmosphere" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </StaggerItem>
                        <StaggerItem className="rounded-lg overflow-hidden border border-surface-border">
                            <HomeMediaImage src={homeImage('gallery-2')} alt="Espresso brew" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </StaggerItem>
                        <StaggerItem className="rounded-lg overflow-hidden border border-surface-border">
                            <HomeMediaImage src={homeImage('gallery-3')} alt="Theatre seating" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </StaggerItem>
                        <StaggerItem className="rounded-lg overflow-hidden border border-surface-border">
                            <HomeMediaImage src={homeImage('gallery-4')} alt="Hall celebrations" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </StaggerItem>
                    </StaggerGrid>
                    <Link to="/gallery" className="btn-stitch-outline text-sm">
                        View Full Gallery
                    </Link>
                </div>

                {/* 7. CUSTOMER REVIEWS (Infinite Scrolling & Submission) */}
                <div className="bg-surface-container-low py-24 border-t border-surface-border">
                    <div className="max-w-container-max mx-auto px-6">
                        <Reveal className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
                            <div className="text-left">
                                <span className="text-soft-gold tracking-widest uppercase mb-1 font-semibold text-xs block font-[Montserrat]">Testimonials</span>
                                <h3 className="text-3xl font-[Playfair_Display] font-bold text-primary">Guest Reflections</h3>
                            </div>
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="btn-stitch-primary py-2.5 px-6 text-xs"
                            >
                                + Share Your Experience
                            </button>
                        </Reveal>

                        {/* Infinite horizontal scroll rows — row 2 scrolls opposite to row 1 */}
                        <div className="space-y-8 overflow-hidden py-4">
                            <div className="relative w-full overflow-hidden">
                                <div className="flex w-max animate-scroll-left hover:pause-on-hover gap-6">
                                    {displayedReviews.map((review, index) => (
                                        <div key={`row1-${index}`} className="w-[300px] md:w-[380px] flex-shrink-0 bg-white border border-surface-border p-8 rounded-lg soft-shadow">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg font-[Playfair_Display]">
                                                    {review.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-primary text-sm">{review.name}</h4>
                                                    <div className="flex text-soft-gold mt-1 gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-soft-gold" : "text-gray-300"} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-on-surface-variant font-light text-sm italic leading-relaxed">"{review.comment}"</p>
                                            {review.status === 'pending' && <span className="text-[10px] text-soft-gold mt-3 block font-semibold uppercase tracking-wider">(Awaiting approval)</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative w-full overflow-hidden">
                                <div className="flex w-max animate-scroll-right hover:pause-on-hover gap-6">
                                    {secondRowReviews.map((review, index) => (
                                        <div key={`row2-${index}`} className="w-[300px] md:w-[380px] flex-shrink-0 bg-white border border-surface-border p-8 rounded-lg soft-shadow">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg font-[Playfair_Display]">
                                                    {review.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-primary text-sm">{review.name}</h4>
                                                    <div className="flex text-soft-gold mt-1 gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-soft-gold" : "text-gray-300"} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-on-surface-variant font-light text-sm italic leading-relaxed">"{review.comment}"</p>
                                            {review.status === 'pending' && <span className="text-[10px] text-soft-gold mt-3 block font-semibold uppercase tracking-wider">(Awaiting approval)</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-6">Your review helps to improve the experience for other customers.</p>
                    </div>
                </div>

                {/* Add Review Modal */}
                <AnimatePresence>
                {showReviewModal && (
                    <Motion.div
                        className="fixed inset-0 z-[10000] bg-primary/20 backdrop-blur-sm flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Motion.div
                            className="bg-white rounded-lg border border-surface-border w-full max-w-md p-8 shadow-xl relative"
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-[Playfair_Display] font-bold text-primary mb-6">Write a Review</h3>
                            <form onSubmit={handleReviewSubmit} className="space-y-4 font-[Montserrat] text-sm">
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wide">Your Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                        placeholder="Enter your name"
                                        value={newReview.name}
                                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wide">Rating *</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className={`transition transform hover:scale-110 ${newReview.rating >= star ? 'text-soft-gold' : 'text-gray-300'}`}
                                            >
                                                <Star size={28} fill={newReview.rating >= star ? "currentColor" : "none"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wide">Comments</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition h-24 resize-none"
                                        placeholder="Tell us about your experience..."
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newReview.name || newReview.rating === 0}
                                    className="w-full btn-stitch-primary py-3 rounded-lg text-xs font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Review
                                </button>
                            </form>
                        </Motion.div>
                    </Motion.div>
                )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default LandingPage;