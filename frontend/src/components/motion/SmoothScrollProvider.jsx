import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SmoothScrollProvider ensures healthy, fluid scrolling across route transitions
 * and page renders without hijacking the browser's native wheel/touch events.
 * Eliminates virtual scroll locking and stuck scroll states.
 */
const SmoothScrollProvider = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        // Ensure html and body are never stuck in an overflow-locked state
        document.documentElement.classList.remove('lenis', 'lenis-stopped', 'lenis-scrolling');
        document.body.classList.remove('lenis', 'lenis-stopped', 'lenis-scrolling');

        if (document.documentElement.style.overflow === 'hidden') {
            document.documentElement.style.overflow = '';
        }
        if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = '';
        }

        // Scroll to top cleanly on route change
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [location.pathname]);

    return children;
};

export default SmoothScrollProvider;

