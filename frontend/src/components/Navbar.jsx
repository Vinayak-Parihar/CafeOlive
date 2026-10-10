import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `font-[Montserrat] text-[12px] font-semibold tracking-[0.15em] transition-all duration-300 relative py-2 px-3 rounded-full hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
            isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'
        }`;
    };

    return (
        <nav className="fixed w-full z-50 bg-surface/95 backdrop-blur-xl border-b border-surface-border/80 shadow-sm" aria-label="Primary navigation">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-24 relative">

                    {/* Left Links */}
                    <div className="hidden lg:flex flex-1 items-center justify-start space-x-8">
                        <Link to="/reservations" className={getLinkClass('/reservations')}>RESERVE NOW</Link>
                        <Link to="/gallery" className={getLinkClass('/gallery')}>GALLERY</Link>
                        <Link to="/reservations/inquiry" className={getLinkClass('/reservations/inquiry')}>INQUIRY</Link>
                    </div>

                    {/* Logo (Center) */}
                    <div className="flex-shrink-0 flex items-center absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none lg:mx-auto">
                        <Link to="/" className="flex items-center rounded-sm" aria-label="Oliv Cafe home">
                            <h1 id="navbar-logo" className="text-primary font-[Playfair_Display] text-3xl tracking-[0.2em] font-bold uppercase whitespace-nowrap">
                                O L I V
                            </h1>
                        </Link>
                    </div>

                    {/* Right Links & CTA */}
                    <div className="hidden lg:flex flex-1 items-center justify-end space-x-8">
                        <Link to="/" className={getLinkClass('/')}>HOME</Link>
                        <Link to="/menu" className={getLinkClass('/menu')}>MENU</Link>
                        <Link to="/celebrate" className={getLinkClass('/celebrate')}>CELEBRATE</Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="lg:hidden absolute right-4">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-primary hover:text-primary-container p-2 transition duration-300 rounded-full"
                            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden bg-surface border-t border-surface-border overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pt-4 pb-8 space-y-4 text-center flex flex-col items-center">
                    <Link
                        to="/"
                        onClick={() => setIsOpen(false)}
                        className={`block w-full py-2 rounded-full text-sm font-semibold tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${location.pathname === '/' ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
                    >
                        HOME
                    </Link>

                    <Link
                        to="/menu"
                        onClick={() => setIsOpen(false)}
                        className={`block w-full py-2 rounded-full text-sm font-semibold tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${location.pathname === '/menu' ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
                    >
                        MENU
                    </Link>

                    <Link
                        to="/gallery"
                        onClick={() => setIsOpen(false)}
                        className={`block w-full py-2 rounded-full text-sm font-semibold tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${location.pathname === '/gallery' ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
                    >
                        GALLERY
                    </Link>

                    <Link
                        to="/reservations/inquiry"
                        onClick={() => setIsOpen(false)}
                        className={`block w-full py-2 rounded-full text-sm font-semibold tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${location.pathname === '/reservations/inquiry' ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
                    >
                        INQUIRY
                    </Link>

                    {/* <Link
                        to="/celebrate"
                        onClick={() => setIsOpen(false)}
                        className={`block w-full py-2 rounded-full text-sm font-semibold tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${location.pathname === '/celebrate' ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
                    >
                        CELEBRATE
                    </Link> */}

                    <Link
                        to="/reservations"
                        onClick={() => setIsOpen(false)}
                        className={`block w-full py-2 rounded-full text-sm font-semibold tracking-widest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${location.pathname === '/reservations' ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
                    >
                        RESERVE NOW
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
