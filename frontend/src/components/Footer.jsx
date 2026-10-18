import React from 'react';
import { Instagram, Phone, MapPin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-primary text-white pt-20 pb-12 border-t border-white/10">
            <div className="max-w-container-max mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                
                {/* Brand Column */}
                <div className="flex flex-col space-y-4">
                    <h2 className="text-3xl font-[Playfair_Display] font-bold tracking-[0.15em] text-soft-gold">O L I V</h2>
                    <p className="text-on-primary-container text-sm font-medium tracking-wide">TASTE THE CALM</p>
                    <p className="text-gray-300 text-sm leading-relaxed max-w-xs pt-2">
                        Experience organic culinary craftmanship in an environment designed for absolute serenity.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-soft-gold font-[Playfair_Display] text-lg font-semibold mb-6">Explore</h4>
                    <ul className="space-y-3 font-[Montserrat] text-sm text-gray-300">
                        <li><Link to="/" className="hover:text-soft-gold transition duration-200">Home</Link></li>
                        <li><Link to="/menu" className="hover:text-soft-gold transition duration-200">Our Menu</Link></li>
                        <li><Link to="/gallery" className="hover:text-soft-gold transition duration-200">Gallery</Link></li>
                        <li><Link to="/celebrate" className="hover:text-soft-gold transition duration-200">Celebrate</Link></li>
                    </ul>
                </div>

                {/* Reservations */}
                <div>
                    <h4 className="text-soft-gold font-[Playfair_Display] text-lg font-semibold mb-6">Reservations</h4>
                    <ul className="space-y-3 font-[Montserrat] text-sm text-gray-300">
                        <li><Link to="/reservations/booking?zone=theatre" className="hover:text-soft-gold transition duration-200">Private Mini Theatre</Link></li>
                        <li><Link to="/reservations/inquiry" className="hover:text-soft-gold transition duration-200">General Inquiry</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <h4 className="text-soft-gold font-[Playfair_Display] text-lg font-semibold mb-6">Reach Us</h4>
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                        <MapPin size={18} className="text-soft-gold shrink-0 mt-0.5" />
                        <span>Olive Café, Main Road, City Center</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Phone size={18} className="text-soft-gold shrink-0" />
                        <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Mail size={18} className="text-soft-gold shrink-0" />
                        <span>reservations@olivecafe.com</span>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <a href="#" className="p-2.5 bg-white/10 rounded-full hover:bg-soft-gold hover:text-primary transition duration-300"><Instagram size={18} /></a>
                    </div>
                </div>
            </div>

            <div className="max-w-container-max mx-auto px-6 lg:px-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                <p>© 2026 OLIV Cafe. All rights reserved.</p>
                <p>Designed with ❤️ for Foodies.</p>
            </div>
        </footer>
    );
};

export default Footer;