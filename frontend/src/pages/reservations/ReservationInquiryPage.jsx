import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, Send, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ReservationInquiryPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        inquiryType: '',
        preferredDate: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');
        try {
            await axios.post('/api/inquiries', formData);
            setSuccessMessage('Thank you for your inquiry! Our events team will review your request and get back to you shortly.');
            setFormData({
                name: '',
                phone: '',
                email: '',
                inquiryType: '',
                preferredDate: '',
                message: ''
            });
        } catch (error) {
            setErrorMessage('Failed to send inquiry. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-olive-deep font-sans antialiased selection:bg-olive-rich selection:text-linen">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
                {/* Breadcrumb Navigation */}
                <div>
                    <Link
                        to="/reservations"
                        className="inline-flex items-center text-xs tracking-[0.18em] uppercase font-semibold text-olive-muted hover:text-olive-deep transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 transform transition-transform group-hover:-translate-x-1" />
                        Back to Reservations
                    </Link>
                </div>

                {/* Hero Card */}
                <section className="bg-white rounded-3xl p-7 md:p-10 shadow-sm border border-[#e8e4d8] text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-olive-light/60 border border-olive-muted/20 flex items-center justify-center text-olive-deep mb-5 shadow-inner">
                            <HelpCircle className="w-7 h-7 text-gold-accent" />
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-olive-deep tracking-wide mb-3">
                            Reservation Inquiry
                        </h1>
                        <p className="text-olive-muted text-sm sm:text-base leading-relaxed max-w-xl font-light">
                            Have a question before booking? Whether it’s about our Private Mini Theatre, Party Halls, or bespoke celebration packages — we’re here to help.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs font-medium text-olive-muted uppercase tracking-wider">
                            <span>Private Mini Theatre</span>
                            <span className="text-gold-accent">•</span>
                            <span>Party Halls</span>
                            <span className="text-gold-accent">•</span>
                            <span>Birthday & Anniversaries</span>
                            <span className="text-gold-accent">•</span>
                            <span>Custom Menus</span>
                        </div>
                    </div>
                </section>

                {/* Inquiry Form Card */}
                <section className="bg-white rounded-3xl p-7 md:p-10 shadow-sm border border-[#e8e4d8]">
                    <div className="mb-7 pb-4 border-b border-[#ece7dc] flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-olive-deep tracking-wide">
                                Inquiry Form
                            </h2>
                            <p className="text-xs text-olive-muted mt-1 font-light">
                                Please fill in your details; required fields are marked with (*)
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-olive-deep bg-olive-light/50 px-3 py-1.5 rounded-full border border-olive-muted/20 font-medium">
                            <Clock className="w-3.5 h-3.5 text-gold-accent" />
                            Avg. Reply: &lt; 2 Hours
                        </div>
                    </div>

                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <div>
                                <label className="block text-xs font-bold tracking-wider uppercase text-olive-deep mb-2" htmlFor="name">
                                    Full Name <span className="text-gold-accent">*</span>
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Rohan Dusane"
                                    required
                                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-olive-deep placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-wider uppercase text-olive-deep mb-2" htmlFor="phone">
                                    Phone Number <span className="text-gold-accent">*</span>
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    required
                                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-olive-deep placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-wider uppercase text-olive-deep mb-2" htmlFor="email">
                                    Email <span className="text-olive-muted font-normal">(Optional)</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-olive-deep placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-wider uppercase text-olive-deep mb-2" htmlFor="inquiryType">
                                    Inquiry Type <span className="text-gold-accent">*</span>
                                </label>
                                <select
                                    id="inquiryType"
                                    name="inquiryType"
                                    value={formData.inquiryType}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-olive-deep text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep cursor-pointer"
                                >
                                    <option value="" disabled>Select inquiry type...</option>
                                    <option value="theatre">Private Mini Theatre</option>
                                    <option value="hall-1">Party Hall 1 (Up to 50 Guests)</option>
                                    <option value="hall-2">Party Hall 2 (Grand Celebrations)</option>
                                    <option value="corporate">Corporate Event / Workshop</option>
                                    <option value="pricing">Custom Package & Pricing</option>
                                    <option value="other">Other Inquiry</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-wider uppercase text-olive-deep mb-2" htmlFor="preferredDate">
                                Preferred Date <span className="text-olive-muted font-normal">(Optional)</span>
                            </label>
                            <input
                                id="preferredDate"
                                name="preferredDate"
                                type="date"
                                value={formData.preferredDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-olive-deep text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-wider uppercase text-olive-deep mb-2" htmlFor="message">
                                Message & Questions <span className="text-gold-accent">*</span>
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us about your event, expected guest count, food preferences..."
                                required
                                className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-olive-deep placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold tracking-widest uppercase transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? 'Submitting...' : 'Submit Inquiry'}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default ReservationInquiryPage;
