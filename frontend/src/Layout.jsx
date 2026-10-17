import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Outlet } from 'react-router-dom';
import SmoothScrollProvider from './components/motion/SmoothScrollProvider';
import ArtisanalCupMotif from './components/ArtisanalCupMotif';

const Layout = () => {
    return (
        <SmoothScrollProvider>
            <div className="flex flex-col min-h-screen relative bg-linen overflow-x-hidden">
                {/* Fixed Viewport Background Motif: Ceramic cup & olive branch stays locked in the middle of the screen during all scrolling */}
                <ArtisanalCupMotif
                    isFixed
                    opacity="opacity-[0.08] sm:opacity-[0.09]"
                    scale="scale-110 sm:scale-125 md:scale-135"
                    className="z-0"
                />

                <div className="relative z-10 flex flex-col min-h-screen">
                    <Navbar />

                    <main className="flex-grow pt-20">
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
        </SmoothScrollProvider>
    );
};

export default Layout;