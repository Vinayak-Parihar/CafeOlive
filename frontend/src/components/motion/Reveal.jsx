import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const OFFSETS = {
    up: { y: 32 },
    down: { y: -32 },
    left: { x: 32 },
    right: { x: -32 },
    none: {},
};

/**
 * Fades/slides children in once when they enter the viewport.
 * Renders in its final state immediately when the user prefers reduced motion.
 */
const Reveal = ({
    children,
    as = 'div',
    direction = 'up',
    delay = 0,
    duration = 0.7,
    amount = 0.25,
    className = '',
    ...rest
}) => {
    const reducedMotion = usePrefersReducedMotion();
    const Component = motion[as] || motion.div;
    const offset = OFFSETS[direction] || OFFSETS.up;

    if (reducedMotion) {
        const Static = as;
        return (
            <Static className={className} {...rest}>
                {children}
            </Static>
        );
    }

    return (
        <Component
            className={className}
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount }}
            transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default Reveal;
