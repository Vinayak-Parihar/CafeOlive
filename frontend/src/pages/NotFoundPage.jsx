import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Utensils, Sparkles, Coffee } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center font-sans bg-[#FAF8F3] text-[#1e2a1b]">
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-md border border-[#e8e2d5] rounded-3xl p-8 sm:p-12 shadow-xl shadow-black/5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#e8e2d5] text-[11px] font-semibold tracking-widest uppercase text-[#c2a677] mb-6">
                    <Sparkles size={13} className="text-[#c2a677]" />
                    <span>404 • Destination Unknown</span>
                </div>

                <div className="font-serif text-7xl sm:text-8xl font-bold tracking-tight text-[#1e2a1b] mb-3">
                    404
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1e2a1b] mb-3">
                    This Table Is Not Set
                </h1>

                <p className="text-sm text-stone-500 font-light max-w-sm mx-auto mb-8 leading-relaxed">
                    The page you are looking for may have been moved, renamed, or is currently reserved for a private tasting.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-[#e8e2d5] bg-[#FAF8F3] hover:bg-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-700 transition"
                    >
                        <ArrowLeft size={16} />
                        <span>Go Back</span>
                    </button>
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1e2a1b] hover:bg-[#283824] text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition"
                    >
                        <Home size={16} />
                        <span>Back to Atelier</span>
                    </Link>
                    <Link
                        to="/menu"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-[#c2a677]/40 bg-[#c2a677]/10 hover:bg-[#c2a677]/20 text-xs font-semibold uppercase tracking-wider text-[#917647] transition"
                    >
                        <Utensils size={16} />
                        <span>View Menu</span>
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-xs text-stone-400 flex items-center justify-center gap-2">
                <Coffee size={14} className="text-[#c2a677]" />
                <span>Cafe Olive • Artisanal Culinary & Botanical Sanctuary</span>
            </div>
        </div>
    );
};

export default NotFoundPage;
