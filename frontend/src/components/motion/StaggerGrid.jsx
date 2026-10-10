import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const containerVariants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Wrap a grid/row of cards; each direct <StaggerItem> child fades/slides in
 * with a staggered delay as the group enters the viewport.
 */
export const StaggerGrid = ({ children, as = 'div', className = '', amount = 0.15, ...rest }) => {
    const reducedMotion = usePrefersReducedMotion();
    const Component = motion[as] || motion.div;

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
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount }}
            {...rest}
        >
            {children}
        </Component>
    );
};

export const StaggerItem = ({ children, as = 'div', className = '', ...rest }) => {
    const reducedMotion = usePrefersReducedMotion();
    const Component = motion[as] || motion.div;

    if (reducedMotion) {
        const Static = as;
        return (
            <Static className={className} {...rest}>
                {children}
            </Static>
        );
    }

    return (
        <Component className={className} variants={itemVariants} {...rest}>
            {children}
        </Component>
    );
};
