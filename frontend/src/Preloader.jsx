import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const Preloader = ({ onAnimationDone }) => {
    const [progress, setProgress] = useState(0);
    const [textVisible, setTextVisible] = useState(false);
    const [moveUp, setMoveUp] = useState(false);
    // Read once from the real navbar logo's computed style — font-family/weight/color are copied
    // as-is; letter-spacing/line-height are kept as ratios-to-font-size so they stay proportional
    // while the hero renders much larger than the header pre-merge.
    const [syncedStyle, setSyncedStyle] = useState(null);
    // Set once we measure both elements at animation-start time — the exact translate/scale needed
    // to land the hero exactly on the header.
    const [flip, setFlip] = useState(null);

    const heroRef = useRef(null);
    const fallbackTimerRef = useRef(null);
    const doneRef = useRef(false);

    const finish = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        clearTimeout(fallbackTimerRef.current);
        onAnimationDone();
    };

    // Font sync: copy the header's exact typographic identity onto the hero so both are
    // guaranteed pixel-identical, rather than relying on two components' Tailwind classes
    // happening to agree.
    useEffect(() => {
        const headerEl = document.getElementById('navbar-logo');
        if (!headerEl) return;
        const cs = getComputedStyle(headerEl);
        const targetFontSize = parseFloat(cs.fontSize);
        const letterSpacingPx = parseFloat(cs.letterSpacing);
        const lineHeightPx = parseFloat(cs.lineHeight);
        setSyncedStyle({
            fontFamily: cs.fontFamily,
            fontWeight: cs.fontWeight,
            color: cs.color,
            letterSpacingEm: Number.isNaN(letterSpacingPx) ? null : letterSpacingPx / targetFontSize,
            lineHeightRatio: Number.isNaN(lineHeightPx) ? null : lineHeightPx / targetFontSize,
        });
    }, []);

    // The real navbar logo is always mounted underneath this overlay. Keep it hidden for the
    // whole intro — independent of the background fade below — and only ever reveal it in the
    // same commit that removes this overlay (the cleanup here), so the swap stays atomic.
    // useLayoutEffect (not useEffect) is required: passive-effect cleanup runs AFTER the browser
    // paints the frame where this component's DOM is already removed, which left a one-frame gap
    // where neither the hero nor the real logo was visible. useLayoutEffect's cleanup runs
    // synchronously in the same commit as the removal, before that frame is ever painted.
    useLayoutEffect(() => {
        const targetEl = document.getElementById('navbar-logo');
        if (!targetEl) return;
        targetEl.style.visibility = 'hidden';
        return () => {
            targetEl.style.visibility = '';
        };
    }, []);

    useEffect(() => {
        const showTextTimer = setTimeout(() => setTextVisible(true), 200);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setMoveUp(true), 500);
                    return 100;
                }
                return prev + 2;
            });
        }, 20);

        return () => {
            clearTimeout(showTextTimer);
            clearInterval(interval);
        };
    }, []);

    // FLIP: measure both elements fresh at animation-start time (never cached from mount, so a
    // scroll or resize beforehand can't leave us with stale coordinates) and derive the exact
    // translate + scale needed to land the hero on the header.
    useEffect(() => {
        if (!moveUp) return;

        const heroEl = heroRef.current;
        const headerEl = document.getElementById('navbar-logo');

        // Safety net: if measurement fails for any reason, don't leave the page stuck loading.
        fallbackTimerRef.current = setTimeout(finish, 1200);

        if (!heroEl || !headerEl) {
            return () => clearTimeout(fallbackTimerRef.current);
        }

        const centerRect = heroEl.getBoundingClientRect();
        const headerRect = headerEl.getBoundingClientRect();
        const dx = headerRect.left - centerRect.left;
        const dy = headerRect.top - centerRect.top;
        const scale = headerRect.width / centerRect.width;

        const raf = requestAnimationFrame(() => setFlip({ dx, dy, scale }));

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(fallbackTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moveUp]);

    const handleHeroTransitionEnd = (e) => {
        // Only the merge transition (triggered once `flip` is set) should end the intro —
        // ignore the earlier fade-in transition, which also animates `transform`.
        if (!flip || e.propertyName !== 'transform') return;
        finish();
    };

    // transform-origin is set to the top-left corner (see className) so that scale() shrinks the
    // box toward the same point translate() measured from — without that, translate()'s corner-based
    // delta and scale()'s default center-based pivot disagree and the merge lands off-target.
    const heroTransform = flip
        ? `translate(${flip.dx}px, ${flip.dy}px) scale(${flip.scale})`
        : `translateY(${textVisible ? '0px' : '40px'})`;

    return (
        <div className="fixed inset-0 z-[9999] text-primary pointer-events-none">
            {/* Background fill fades independently so the page reveals gradually during the
                upward move — kept separate from the content layer below so the hero text itself
                never fades and the real navbar logo (hidden via the effect above) can't bleed
                through before it's actually replaced. */}
            <div className={`absolute inset-0 bg-ivory-surface transition-opacity duration-1000 ease-out ${moveUp ? 'opacity-0' : 'opacity-100'}`} />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                    ref={heroRef}
                    onTransitionEnd={handleHeroTransitionEnd}
                    className={`relative z-50 font-[Playfair_Display] font-bold whitespace-nowrap text-5xl md:text-7xl tracking-[0.2em] origin-top-left transition-all duration-1000 ease-in-out ${textVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        transform: heroTransform,
                        fontFamily: syncedStyle?.fontFamily,
                        fontWeight: syncedStyle?.fontWeight,
                        color: syncedStyle?.color,
                        letterSpacing: syncedStyle?.letterSpacingEm != null ? `${syncedStyle.letterSpacingEm}em` : undefined,
                        lineHeight: syncedStyle?.lineHeightRatio ?? undefined,
                    }}
                >
                    O L I V
                </div>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 w-full flex flex-col items-center pt-32 transition-opacity duration-500 ${moveUp ? 'opacity-0' : 'opacity-100'}`}>
                    <div className={`text-soft-gold text-sm tracking-widest uppercase transition-opacity duration-500 mb-8 font-semibold ${textVisible ? 'opacity-100' : 'opacity-0'}`}>
                        Taste The Calm
                    </div>
                    <div className="w-64 h-[2px] bg-surface-container rounded-full overflow-hidden relative">
                        <div className="h-full bg-primary transition-all duration-100 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="mt-2 text-on-surface-variant text-xs font-mono">{progress}%</div>
                </div>
            </div>
        </div>
    );
};

export default Preloader;
