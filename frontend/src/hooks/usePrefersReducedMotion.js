import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (e) => setReduced(e.matches);
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    return reduced;
}
