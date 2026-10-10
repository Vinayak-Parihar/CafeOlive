import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Adds inertia-based smooth scrolling to the public site and keeps it in
 * lockstep with GSAP's ticker so ScrollTrigger stays in sync. Disabled
 * entirely under prefers-reduced-motion, falling back to native scroll.
 */
const SmoothScrollProvider = ({ children }) => {
    const reducedMotion = usePrefersReducedMotion();
    const location = useLocation();

    useEffect(() => {
        if (reducedMotion) return undefined;

        const lenis = new Lenis({
            duration: 1.1,
            smoothWheel: true,
        });

        lenis.on('scroll', ScrollTrigger.update);

        const update = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(update);
            lenis.destroy();
        };
    }, [reducedMotion]);

    useEffect(() => {
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
    }, [location.pathname]);

    return children;
};

export default SmoothScrollProvider;
