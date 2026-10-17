import React from 'react';

/**
 * Artisanal Tea & Coffee Cup Silhouette Motif
 * Architectural fine-line vector featuring:
 * 1. Ceramic tea/coffee cup sitting on a layered saucer
 * 2. Elegant rising steam trails floating upwards in subtle organic curves (dashed)
 * 3. Intertwined olive branch sprig base with delicate leaves and olives
 * 4. Soft radial botanical aura with blur-3xl for atmospheric warmth
 */
const ArtisanalCupMotif = ({
    className = '',
    opacity = 'opacity-[0.09]',
    scale = 'scale-100',
    isFixed = false,
}) => {
    return (
        <div
            className={`pointer-events-none select-none ${
                isFixed ? 'fixed' : 'absolute'
            } inset-0 flex items-center justify-center overflow-hidden ${className}`}
            aria-hidden="true"
        >
            {/* Soft Radial Botanical Aura (blur-3xl) */}
            <div className="absolute w-[460px] h-[460px] sm:w-[560px] sm:h-[560px] rounded-full bg-gradient-to-tr from-[#c2a677]/20 via-[#8b9d83]/15 to-transparent blur-3xl transform -translate-y-4" />

            {/* Fine-line Architectural Vector Motif */}
            <svg
                viewBox="0 0 500 420"
                className={`relative w-[480px] sm:w-[600px] md:w-[680px] max-w-none text-[#1e2a1b] stroke-current fill-none transition-all duration-700 ${opacity} ${scale}`}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="steamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="currentColor" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* --- 1. RISING STEAM TRAILS --- */}
                <g strokeWidth="1.1" strokeLinecap="round" strokeDasharray="3 3.5" className="animate-steam origin-bottom">
                    {/* Left steam trail */}
                    <path
                        d="M 220 165 C 205 130, 222 95, 212 55 C 204 25, 215 10, 218 0"
                        stroke="url(#steamGradient)"
                    />
                    {/* Center steam trail */}
                    <path
                        d="M 250 162 C 242 120, 258 80, 250 40 C 246 18, 252 5, 254 0"
                        stroke="url(#steamGradient)"
                    />
                    {/* Right steam trail */}
                    <path
                        d="M 280 165 C 295 130, 278 95, 288 55 C 296 25, 286 10, 282 0"
                        stroke="url(#steamGradient)"
                    />
                </g>

                {/* --- 2. CERAMIC TEA & COFFEE CUP --- */}
                <g strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    {/* Upper Outer Rim Ellipse */}
                    <ellipse cx="250" cy="180" rx="92" ry="13" />

                    {/* Inner Rim Lip */}
                    <ellipse cx="250" cy="180" rx="84" ry="10" strokeWidth="0.8" opacity="0.6" />

                    {/* Liquid Level Line */}
                    <path d="M 172 184 C 190 188, 310 188, 328 184" strokeWidth="0.75" opacity="0.45" />

                    {/* Tapered Ceramic Cup Body */}
                    <path d="M 158 180 C 160 228, 192 262, 250 262 C 308 262, 340 228, 342 180" />

                    {/* Architectural Handle (Right) */}
                    <path d="M 336 195 C 385 195, 396 252, 332 255" strokeWidth="1.2" />
                    <path d="M 334 204 C 372 204, 382 244, 332 247" strokeWidth="0.85" opacity="0.65" />

                    {/* Cup Base Ring */}
                    <ellipse cx="250" cy="262" rx="34" ry="4" strokeWidth="1" />
                </g>

                {/* --- 3. LAYERED SAUCER --- */}
                <g strokeWidth="1.2" strokeLinecap="round">
                    {/* Saucer Inner Recess */}
                    <path d="M 178 266 C 205 272, 295 272, 322 266" strokeWidth="0.9" opacity="0.7" />

                    {/* Upper Saucer Rim */}
                    <path d="M 112 288 C 175 281, 325 281, 388 288" />

                    {/* Lower Layered Saucer Curve */}
                    <path d="M 116 290 C 160 318, 340 318, 384 290" />

                    {/* Bottom Foot of Saucer */}
                    <path d="M 195 316 C 220 320, 280 320, 305 316" strokeWidth="0.9" opacity="0.6" />
                </g>

                {/* --- 4. OLIVE BOTANICAL SPRIG BASE --- */}
                {/* Intertwined Olive Branch Stems */}
                <g strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                    {/* Left Stem Arch */}
                    <path d="M 250 312 C 190 310, 130 295, 65 318" />

                    {/* Right Stem Arch */}
                    <path d="M 250 312 C 310 310, 370 295, 435 318" />

                    {/* Cross-twining lower stem */}
                    <path d="M 150 326 C 210 308, 290 314, 360 322" strokeWidth="0.9" opacity="0.75" />
                </g>

                {/* Delicate Olive Leaves (Left side) */}
                <g strokeWidth="0.95" strokeLinecap="round" strokeLinejoin="round">
                    {/* Leaf 1 (Far Left Tip) */}
                    <path d="M 68 317 C 78 307, 94 308, 98 316 C 94 324, 78 325, 68 317 Z" />
                    <path d="M 72 317 Q 85 316 95 316" strokeWidth="0.5" opacity="0.5" />

                    {/* Leaf 2 (Upper left) */}
                    <path d="M 110 300 C 118 290, 134 290, 140 299 C 134 307, 118 308, 110 300 Z" />

                    {/* Leaf 3 (Lower left angle) */}
                    <path d="M 132 322 C 134 334, 146 342, 154 338 C 156 326, 144 318, 132 322 Z" />

                    {/* Leaf 4 (Mid-left branch) */}
                    <path d="M 168 308 C 176 298, 192 300, 196 310 C 190 318, 174 316, 168 308 Z" />

                    {/* Leaf 5 (Near center left) */}
                    <path d="M 204 322 C 208 335, 222 342, 228 334 C 228 322, 214 316, 204 322 Z" />
                </g>

                {/* Delicate Olive Leaves (Right side) */}
                <g strokeWidth="0.95" strokeLinecap="round" strokeLinejoin="round">
                    {/* Leaf 6 (Near center right) */}
                    <path d="M 296 322 C 292 335, 278 342, 272 334 C 272 322, 286 316, 296 322 Z" />

                    {/* Leaf 7 (Mid-right branch) */}
                    <path d="M 332 308 C 324 298, 308 300, 304 310 C 310 318, 326 316, 332 308 Z" />

                    {/* Leaf 8 (Lower right angle) */}
                    <path d="M 368 322 C 366 334, 354 342, 346 338 C 344 326, 356 318, 368 322 Z" />

                    {/* Leaf 9 (Upper right) */}
                    <path d="M 390 300 C 382 290, 366 290, 360 299 C 366 307, 382 308, 390 300 Z" />

                    {/* Leaf 10 (Far Right Tip) */}
                    <path d="M 432 317 C 422 307, 406 308, 402 316 C 406 324, 422 325, 432 317 Z" />
                    <path d="M 428 317 Q 415 316 405 316" strokeWidth="0.5" opacity="0.5" />
                </g>

                {/* Sub-saucer Falling Leaf (Centered below 100%) */}
                <g strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 250 350 C 244 362, 244 374, 250 382 C 256 374, 256 362, 250 350 Z" />
                    <path d="M 250 354 L 250 378" strokeWidth="0.5" opacity="0.4" />

                    <path d="M 295 352 C 308 356, 316 366, 312 372 C 300 372, 290 362, 295 352 Z" opacity="0.6" />
                </g>

                {/* Ripe Olives Hanging along the Sprigs */}
                <g strokeWidth="0.95" fill="none">
                    {/* Left Olive 1 */}
                    <ellipse cx="106" cy="328" rx="6" ry="8" transform="rotate(-20 106 328)" />
                    <path d="M 102 322 L 105 318" strokeWidth="0.75" />

                    {/* Left Olive 2 (dangling) */}
                    <ellipse cx="186" cy="330" rx="5.5" ry="7.5" transform="rotate(15 186 330)" />
                    <path d="M 188 322 L 186 318" strokeWidth="0.75" />

                    {/* Right Olive 1 */}
                    <ellipse cx="394" cy="328" rx="6" ry="8" transform="rotate(20 394 328)" />
                    <path d="M 398 322 L 395 318" strokeWidth="0.75" />

                    {/* Right Olive 2 (dangling) */}
                    <ellipse cx="314" cy="330" rx="5.5" ry="7.5" transform="rotate(-15 314 330)" />
                    <path d="M 312 322 L 314 318" strokeWidth="0.75" />
                </g>
            </svg>
        </div>
    );
};

export default ArtisanalCupMotif;
