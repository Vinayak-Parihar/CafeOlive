import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Outlet } from 'react-router-dom';
import SmoothScrollProvider from './components/motion/SmoothScrollProvider';

const Layout = () => {
    return (
        <SmoothScrollProvider>
            <div className="flex flex-col min-h-screen">
                <Navbar />

                <main className="flex-grow pt-20">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </SmoothScrollProvider>
    );
};

export default Layout;