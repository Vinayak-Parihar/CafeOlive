import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import ArtisanalCupMotif from './components/ArtisanalCupMotif';

const Preloader = ({ onAnimationDone }) => {
    const [progress, setProgress] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [isFlying, setIsFlying] = useState(false);
    const [flyStyles, setFlyStyles] = useState({});
    const [soundActive, setSoundActive] = useState(false);

    const audioContextRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainNodeRef = useRef(null);
    const hasTriggeredRef = useRef(false);
    const logoRef = useRef(null);

    // Initial page alignment & navbar logo setup
    useEffect(() => {
        window.scrollTo(0, 0);
        const navbarLogo = document.getElementById('navbar-brand-logo');
        if (navbarLogo) {
            navbarLogo.style.opacity = '0';
        }

        return () => {
            const el = document.getElementById('navbar-brand-logo');
            if (el) {
                el.style.opacity = '1';
            }
        };
    }, []);

    // Smooth Logo Flight to Header Animation with Zero Overlap
    const handleEnter = () => {
        if (hasTriggeredRef.current) return;
        hasTriggeredRef.current = true;

        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        const sourceEl = logoRef.current;
        const targetEl = document.getElementById('navbar-brand-text');
        const navbarLogo = document.getElementById('navbar-brand-logo');

        let tx = 0;
        let ty = -350;
        let scale = 0.25;

        if (sourceEl && targetEl) {
            const sourceRect = sourceEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();

            const sourceCenterX = sourceRect.left + sourceRect.width / 2;
            const sourceCenterY = sourceRect.top + sourceRect.height / 2;

            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;

            tx = targetCenterX - sourceCenterX;
            ty = targetCenterY - sourceCenterY;

            // Pixel-perfect scale calculation matching identical letter-spacing
            if (sourceRect.width > 0 && targetRect.width > 0) {
                scale = targetRect.width / sourceRect.width;
            } else {
                const targetFontSize = parseFloat(window.getComputedStyle(targetEl).fontSize) || 24;
                const sourceFontSize = parseFloat(window.getComputedStyle(sourceEl).fontSize) || 36;
                scale = targetFontSize / sourceFontSize;
            }
        }

        // Keep the static navbar logo strictly invisible during the flight so only ONE logo is ever visible
        if (navbarLogo) {
            navbarLogo.style.opacity = '0';
            navbarLogo.style.transition = 'none';
        }

        // Reveal the underlying page smoothly as the logo takes flight
        const flightDuration = 850; // ms
        setIsExiting(true);
        setIsFlying(true);

        setFlyStyles({
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
            transition: `transform ${flightDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            zIndex: 100000
        });

        // Gracefully ramp down audio
        if (gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.linearRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.6);
            setTimeout(() => {
                oscillatorRef.current?.stop();
                audioContextRef.current?.close();
            }, 600);
        }

        // Exact Landing Hand-off with ZERO Blink:
        // The instant the flight reaches destination, swap to the navbar logo continuously
        // with 100% solid opacity — no 60ms fade out, no opacity dip, zero flicker.
        let completed = false;
        const completeLanding = () => {
            if (completed) return;
            completed = true;

            if (navbarLogo) {
                navbarLogo.style.transition = 'none';
                navbarLogo.style.opacity = '1';
            }

            onAnimationDone();
        };

        const sourceNode = sourceEl;
        const handleTransitionEnd = (e) => {
            if (e.target === sourceNode && e.propertyName === 'transform') {
                sourceNode.removeEventListener('transitionend', handleTransitionEnd);
                completeLanding();
            }
        };

        if (sourceNode) {
            sourceNode.addEventListener('transitionend', handleTransitionEnd);
        }

        // Safety fallback timer matching flight duration + brief grace period
        setTimeout(() => {
            if (sourceNode) {
                sourceNode.removeEventListener('transitionend', handleTransitionEnd);
            }
            completeLanding();
        }, flightDuration + 40);
    };

    // Live progress counter up to 100% with smooth, visible pacing
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                const increment = Math.floor(Math.random() * 3) + 2;
                return Math.min(100, prev + increment);
            });
        }, 45);

        return () => clearInterval(interval);
    }, []);

    // Automatically transition to the home page upon completing 100%
    useEffect(() => {
        if (progress >= 100 && !hasTriggeredRef.current) {
            const timer = setTimeout(() => {
                handleEnter();
            }, 500); // Elegant pause to show full 100% bar before flight transition
            return () => clearTimeout(timer);
        }
    }, [progress]);

    // 432Hz ambient soundscape synthesizer
    const toggleSoundscape = () => {
        if (!soundActive) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = ctx;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                // 432 Hz frequency (Concert pitch for deep calm & wellness)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(432, ctx.currentTime);

                // Subtle, gentle harmonic warmth
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();

                oscillatorRef.current = osc;
                gainNodeRef.current = gain;
                setSoundActive(true);
            } catch (err) {
                console.error("Audio initialization error:", err);
            }
        } else {
            if (gainNodeRef.current && audioContextRef.current) {
                gainNodeRef.current.gain.linearRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.8);
                setTimeout(() => {
                    oscillatorRef.current?.stop();
                    audioContextRef.current?.close();
                    setSoundActive(false);
                }, 800);
            } else {
                setSoundActive(false);
            }
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[99999] text-[#1e2a1b] font-sans flex flex-col justify-between p-5 sm:p-12 md:p-14 select-none ${
                isExiting ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
        >
            {/* Background Canvas: Smooth GPU opacity fade reveals underlying page cleanly without color jump */}
            <div
                className={`fixed inset-0 z-0 transition-opacity duration-700 ease-out pointer-events-none ${
                    isExiting ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                    backgroundColor: '#FAF8F3',
                    backgroundImage: 'radial-gradient(#d6cfc2 1.15px, transparent 1.15px)',
                    backgroundSize: '28px 28px'
                }}
            />
            {/* Background Artisanal Cup & Botanical Sprig Silhouette Motif */}
            <div className={`transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                <ArtisanalCupMotif
                    opacity="opacity-[0.14] sm:opacity-[0.12]"
                    scale="scale-90 sm:scale-115"
                />
            </div>

            {/* Top Bar Navigation */}
            <div className={`w-full flex items-center justify-between z-20 transition-opacity duration-400 gap-2 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                {/* Top-Left: Estate & Wellness */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 text-[9px] sm:text-xs tracking-[0.18em] sm:tracking-[0.28em] uppercase font-medium text-stone-500 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#c2a677] inline-block shrink-0" />
                    <span>ESTATE · RESERVE · WELLNESS</span>
                </div>

                {/* Top-Right: 432Hz Soundscape */}
                <button
                    type="button"
                    onClick={toggleSoundscape}
                    className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs tracking-[0.14em] sm:tracking-[0.22em] font-medium transition-all group shrink-0 whitespace-nowrap"
                    title="Toggle 432Hz meditative soundscape"
                >
                    <span className="hidden min-[480px]:inline text-stone-500 uppercase">Soundscape</span>
                    <span className="text-[#c2a677] font-semibold group-hover:underline">
                        Lush Calm [432Hz]
                    </span>
                    {soundActive ? (
                        <Volume2 size={14} className="text-[#c2a677] animate-pulse ml-0.5 sm:w-4 sm:h-4" />
                    ) : (
                        <VolumeX size={14} className="text-stone-400 group-hover:text-stone-600 ml-0.5 sm:w-4 sm:h-4" />
                    )}
                </button>
            </div>

            {/* Centerpiece Hero */}
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-6 sm:py-8 z-20 relative">
                {/* Minimalist Coffee & Olive Emblem */}
                <div className={`mb-3 sm:mb-4 text-[#1e2a1b]/60 flex items-center justify-center gap-3 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                    {/* Coffee Cup Icon */}
                    <svg
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-current fill-none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                        <line x1="6" y1="2" x2="6" y2="4" />
                        <line x1="10" y1="2" x2="10" y2="4" />
                        <line x1="14" y1="2" x2="14" y2="4" />
                    </svg>
                    <span className="text-[#c2a677]/70 font-light text-xs select-none">|</span>
                    {/* Olive Leaf Icon */}
                    <svg
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-current fill-none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>
                </div>

                {/* Flying Brand Logo: Exact target matching */}
                <h1
                    ref={logoRef}
                    className="font-serif text-3xl min-[390px]:text-4xl sm:text-7xl md:text-8xl lg:text-9xl text-[#1e2a1b] font-medium tracking-[0.38em] pl-[0.38em] whitespace-nowrap select-none"
                    style={{
                        fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
                        transformOrigin: 'center center',
                        willChange: 'transform',
                        ...(isFlying ? flyStyles : {})
                    }}
                >
                    O L I V
                </h1>

                {/* Tagline */}
                <div
                    className={`text-[10px] sm:text-sm tracking-[0.24em] sm:tracking-[0.34em] uppercase text-[#c2a677] font-medium mt-2 sm:mt-3 mb-5 sm:mb-7 whitespace-nowrap transition-all duration-300 ${
                        isExiting ? 'opacity-0 translate-y-2' : 'opacity-100'
                    }`}
                >
                    TASTE THE CALM
                </div>

                {/* Visible Luxury Loading Bar & Percentage Counter */}
                <div className={`w-52 sm:w-72 flex flex-col items-center mb-6 sm:mb-8 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                    {/* Progress Bar Track & Gradient Fill */}
                    <div className="w-full h-2 sm:h-2.5 bg-[#e4ded4] border border-[#cfc6b8] rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-[#c2a677] via-[#2d3e29] to-[#1e2a1b] rounded-full transition-all duration-150 ease-out shadow-xs"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Live Percentage Counter */}
                    <div className="mt-2.5 text-xs sm:text-xs font-mono tracking-widest text-[#1e2a1b] font-semibold">
                        {progress}%
                    </div>
                </div>

                {/* Interactive Action: ENTER SANCTUARY */}
                <button
                    type="button"
                    onClick={handleEnter}
                    className={`group relative px-7 sm:px-11 py-2.5 sm:py-3.5 rounded-full border border-stone-400/80 hover:border-[#1e2a1b] bg-transparent hover:bg-[#1e2a1b] text-stone-700 hover:text-[#FAF8F3] text-[11px] sm:text-[13px] tracking-[0.2em] sm:tracking-[0.22em] uppercase font-medium transition-all duration-300 shadow-xs hover:shadow-md active:scale-95 mb-3 sm:mb-4 whitespace-nowrap ${
                        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                >
                    <span>ENTER SANCTUARY</span>
                </button>

                {/* Pure Cold-Pressed Harvest Subtitle */}
                <div className={`text-[9px] sm:text-[11px] uppercase tracking-[0.24em] sm:tracking-[0.3em] text-stone-400 font-light whitespace-nowrap transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                    PURE COLD-PRESSED HARVEST
                </div>
            </div>

            {/* Bottom Bar Footer */}
            <div className={`w-full flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-center sm:text-left z-20 transition-opacity duration-400 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                {/* Bottom-Left */}
                <div className="text-[9px] sm:text-[11.5px] tracking-[0.18em] sm:tracking-[0.25em] text-stone-400 uppercase font-medium whitespace-nowrap">
                    MEDITERRANEAN ORIGIN · EST. 2024
                </div>

                {/* Bottom-Right */}
                <div className="flex items-center gap-4 sm:gap-8 text-[9px] sm:text-[11.5px] tracking-[0.18em] sm:tracking-[0.25em] uppercase font-medium text-stone-400 whitespace-nowrap">
                    <span className="hover:text-stone-700 transition cursor-default">PHILOSOPHY</span>
                    <span className="hover:text-stone-700 transition cursor-default">PURITY REPORT</span>
                    <span className="text-[#c2a677] font-semibold">VOL. 01</span>
                </div>
            </div>
        </div>
    );
};

export default Preloader;
