import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Home, Utensils, Image, Calendar, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getBillSession } from '../utils/sessionUtils';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const hasActiveSession = !!getBillSession()?.billSessionId;

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navLinkClass = (path) => {
        const active = isActive(path);
        return `relative text-[11.5px] tracking-[0.2em] uppercase transition-all duration-300 py-1.5 ${
            active
                ? 'text-olive-deep font-semibold'
                : 'text-stone-600 hover:text-olive-deep font-medium'
        } after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-[1.5px] after:bg-olive-deep after:transition-all after:duration-300 ${
            active ? 'after:w-full' : 'after:w-0 hover:after:w-full'
        }`;
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50 h-20 bg-[#FAF8F3] border-b border-[#e8e2d5] shadow-[0_2px_12px_rgba(30,42,27,0.04)] transition-all">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
                
                {/* Left Navigation Links */}
                <nav className="hidden lg:flex items-center space-x-9">
                    <Link to="/" className={navLinkClass('/')}>
                        Home
                    </Link>
                    <Link to="/menu" className={navLinkClass('/menu')}>
                        Menu
                    </Link>
                    <Link to="/bill" className={`${navLinkClass('/bill')} inline-flex items-center gap-2`}>
                        <span>Your Order</span>
                        {hasActiveSession ? (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                            </span>
                        ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                        )}
                    </Link>
                </nav>

                {/* Center Brand Identity */}
                <div className="text-center flex-shrink-0" id="navbar-brand-logo">
                    <Link to="/" className="inline-flex flex-col items-center group">
                        <span id="navbar-brand-text" className="font-serif text-2xl sm:text-3xl tracking-[0.38em] font-medium text-olive-deep pl-[0.38em] group-hover:text-olive-rich transition-colors whitespace-nowrap">
                            O L I V
                        </span>
                        <span className="text-[8.5px] tracking-[0.45em] uppercase text-gold-accent font-sans -mt-0.5 font-semibold">
                            Sanctuary & Lounge
                        </span>
                    </Link>
                </div>

                {/* Right Navigation & CTA Action */}
                <div className="hidden lg:flex items-center space-x-7">
                    <Link to="/gallery" className={navLinkClass('/gallery')}>
                        Gallery
                    </Link>
                    <Link to="/reservations/inquiry" className={navLinkClass('/reservations/inquiry')}>
                        Inquiry
                    </Link>
                    
                    {/* Signature Luxury CTA Pill */}
                    <Link
                        to="/reservations"
                        className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-olive-deep text-linen hover:bg-olive-rich text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Reserve Now
                    </Link>

                    {/* Quick Order/Cart Bag Icon */}
                    <Link
                        to="/bill"
                        aria-label="View Active Order"
                        className="p-2 rounded-full text-stone-600 hover:text-olive-deep hover:bg-black/5 transition relative flex items-center justify-center"
                    >
                        <ShoppingBag size={18} />
                        {hasActiveSession && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                    </Link>
                </div>

                {/* Mobile Menu & Quick Actions */}
                <div className="lg:hidden flex items-center space-x-2 sm:space-x-3">
                    <Link
                        to="/reservations"
                        className="px-3 sm:px-4 py-1.5 rounded-full bg-olive-deep text-linen text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase shadow-xs active:scale-95 transition-transform"
                    >
                        Reserve
                    </Link>
                    <Link
                        to="/bill"
                        className="p-1.5 text-olive-deep relative active:scale-95 transition-transform"
                        aria-label="View Order"
                    >
                        <ShoppingBag size={18} />
                        {hasActiveSession && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                    </Link>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-olive-deep p-1.5 rounded-lg hover:bg-black/5 active:scale-90 transition-all flex items-center justify-center w-9 h-9 relative"
                        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isOpen ? (
                                <motion.span
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                    className="flex items-center justify-center"
                                >
                                    <X size={20} />
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                    className="flex items-center justify-center"
                                >
                                    <Menu size={20} />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Mobile Backdrop & Solid Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Dimmed backdrop to block out underlying page content */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 top-20 bg-black/50 backdrop-blur-[2px] z-40 lg:hidden"
                        />

                        {/* 100% Solid, Opaque Drawer with Rich Staggered Animations */}
                        <motion.div
                            initial={{ opacity: 0, y: -16, scaleY: 0.96 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -12, scaleY: 0.96 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute top-full left-0 w-full border-b border-[#dcd6c8] shadow-2xl z-50 lg:hidden overflow-hidden"
                            style={{ transformOrigin: 'top center', backgroundColor: '#FAF8F3' }}
                        >
                            <div className="px-5 py-4 space-y-2 max-w-sm mx-auto">
                                {[
                                    { to: '/', label: 'Home', icon: Home },
                                    { to: '/menu', label: 'Artisanal Menu', icon: Utensils },
                                    { to: '/bill', label: 'Your Order', icon: ShoppingBag, badge: hasActiveSession },
                                    { to: '/gallery', label: 'Gallery', icon: Image },
                                    { to: '/reservations/inquiry', label: 'Private Inquiries', icon: Calendar }
                                ].map((item, idx) => {
                                    const active = isActive(item.to);
                                    const Icon = item.icon;

                                    return (
                                        <motion.div
                                            key={item.to}
                                            initial={{ opacity: 0, x: -14, y: -4 }}
                                            animate={{ opacity: 1, x: 0, y: 0 }}
                                            transition={{
                                                delay: idx * 0.04,
                                                duration: 0.24,
                                                ease: [0.22, 1, 0.36, 1]
                                            }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Link
                                                to={item.to}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-[0.16em] transition-all group ${
                                                    active
                                                        ? 'bg-olive-deep text-white font-bold shadow-xs'
                                                        : 'bg-white/85 hover:bg-white text-olive-deep border border-[#e8e2d5] font-semibold hover:border-gold-accent/40 hover:shadow-2xs'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    <Icon
                                                        size={14}
                                                        className={`transition-transform duration-200 group-hover:scale-110 ${
                                                            active ? 'text-gold-accent' : 'text-stone-400 group-hover:text-olive-deep'
                                                        }`}
                                                    />
                                                    <span>{item.label}</span>
                                                </span>
                                                {item.badge ? (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <ChevronRight
                                                        size={13}
                                                        className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
                                                            active ? 'text-white/60' : 'text-stone-300 group-hover:text-olive-deep'
                                                        }`}
                                                    />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}

                                {/* Table Booking Call to Action */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.22, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                    whileTap={{ scale: 0.96 }}
                                    className="pt-2"
                                >
                                    <Link
                                        to="/reservations"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-2.5 rounded-full bg-olive-deep hover:bg-olive-rich text-linen text-xs font-bold tracking-widest uppercase shadow-md flex items-center justify-center gap-2 transition-all group"
                                    >
                                        <Sparkles size={13} className="text-gold-accent animate-pulse" />
                                        <span>Reserve A Table</span>
                                        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                                    </Link>
                                </motion.div>

                                {/* Aesthetic Subtle Watermark */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.28, duration: 0.3 }}
                                    className="pt-1.5 text-center"
                                >
                                    <span className="text-[8.5px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold select-none">
                                        Sanctuary & Lounge • Est. 2024
                                    </span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
