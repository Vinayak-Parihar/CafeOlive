import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import ArtisanalCupMotif from './components/ArtisanalCupMotif';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('/api/users/login', formData);
            if (response.status === 200) {
                const user = response.data.data.user;
                localStorage.setItem('adminUser', JSON.stringify(user));

                if (user.role === 'chef') {
                    navigate('/admin/kitchen');
                } else if (user.role === 'waiter') {
                    navigate('/admin/service');
                } else if (user.role === 'cashier') {
                    navigate('/admin/billing');
                } else {
                    navigate('/admin/dashboard');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid staff credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-[#FAF8F3] text-[#1e2a1b] font-sans p-6 select-none relative overflow-hidden"
            style={{
                backgroundImage: 'radial-gradient(#d6cfc2 1.15px, transparent 1.15px)',
                backgroundSize: '28px 28px'
            }}
        >
            {/* Background cup motif */}
            <ArtisanalCupMotif opacity="opacity-[0.10]" scale="scale-110" />

            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-xl border border-[#e8e2d5] w-full max-w-md relative z-10 overflow-hidden">
                {/* Top Brand Identity */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ee] text-[#c2a677] text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">
                        <Sparkles size={13} />
                        Staff Portal
                    </div>
                    <h1
                        className="font-serif text-3xl sm:text-4xl font-medium tracking-[0.3em] text-[#1e2a1b] pl-[0.3em]"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                        OLIV
                    </h1>
                    <span className="block text-[9px] uppercase tracking-[0.35em] text-[#c2a677] font-semibold mt-1">
                        Atelier Desk & Management
                    </span>
                </div>

                {error && (
                    <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1e2a1b] mb-1.5">
                            Username or Email
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter staff ID or email"
                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F3]/60 border border-[#d8d3c5] text-sm text-[#1e2a1b] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1e2a1b]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1e2a1b] mb-1.5">
                            Security Key / Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F3]/60 border border-[#d8d3c5] text-sm text-[#1e2a1b] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1e2a1b]"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full bg-[#1e2a1b] hover:bg-[#253723] active:bg-[#152312] text-white font-bold text-xs tracking-[0.2em] uppercase transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                        <span>{loading ? 'Authenticating...' : 'Enter Atelier'}</span>
                        <ArrowRight size={15} />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#f1eee7] text-center">
                    <p className="text-[11px] text-stone-400 font-light tracking-wider flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#8b9d83]" />
                        Authorized personnel only • 256-bit SSL
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
