import { useLayoutEffect } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Runs a GSAP + ScrollTrigger effect scoped to `scopeRef`, reverting all
 * tweens/ScrollTriggers on cleanup. Skipped entirely under reduced motion.
 *
 * @param {React.RefObject} scopeRef - container the effect is scoped to
 * @param {(ctx: { gsap, ScrollTrigger }) => void} effect
 * @param {Array} deps
 */
export function useScrollTween(scopeRef, effect, deps = []) {
    const reducedMotion = usePrefersReducedMotion();

    useLayoutEffect(() => {
        if (reducedMotion || !scopeRef.current) return undefined;

        const ctx = gsap.context(() => effect({ gsap, ScrollTrigger }), scopeRef);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reducedMotion, ...deps]);
}
