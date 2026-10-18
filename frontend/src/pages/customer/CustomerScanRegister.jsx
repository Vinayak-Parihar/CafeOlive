import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, QrCode, User, Phone, ArrowRight, Sparkles, CheckCircle2, Coffee, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setBillSession } from '../../utils/sessionUtils';

const CustomerScanRegister = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const urlTable = searchParams.get('table') || '';
    const [tableNumber, setTableNumber] = useState(urlTable || localStorage.getItem('cafeolive_table') || '');
    const [customerName, setCustomerName] = useState(localStorage.getItem('cafeolive_customer_name') || '');
    const [customerPhone, setCustomerPhone] = useState(localStorage.getItem('cafeolive_customer_phone') || '');

    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [existingSession, setExistingSession] = useState(null);
    const [tableInfo, setTableInfo] = useState(null);

    // Sync table number if query param changes
    useEffect(() => {
        if (urlTable) {
            setTableNumber(urlTable);
            localStorage.setItem('cafeolive_table', urlTable);
        }
    }, [urlTable]);

    // Check table & existing session status on mount
    useEffect(() => {
        const verifyScan = async () => {
            const tableToCheck = urlTable || tableNumber;
            if (!tableToCheck) {
                setCheckingStatus(false);
                return;
            }

            try {
                const token = localStorage.getItem('cafeolive_customer_token');
                const headers = token ? { 'x-session-token': token } : {};

                const res = await axios.get(`/api/tables/scan-info?table=${encodeURIComponent(tableToCheck)}`, { headers });
                if (res.data?.success) {
                    const data = res.data.data;
                    setTableInfo(data.table);

                    if (data.isCurrentDiner && data.activeSession) {
                        setExistingSession(data.activeSession);
                        if (data.activeSession.customer_name) setCustomerName(data.activeSession.customer_name);
                        if (data.activeSession.customer_phone) setCustomerPhone(data.activeSession.customer_phone);
                    }
                }
            } catch (err) {
                console.error("Scan verification error:", err);
            } finally {
                setCheckingStatus(false);
            }
        };

        verifyScan();
    }, [urlTable, tableNumber]);

    const handleContinueExisting = () => {
        if (existingSession) {
            setBillSession(
                existingSession.bill_session_id,
                existingSession.customer_name,
                existingSession.customer_phone
            );
            localStorage.setItem('cafeolive_table', tableNumber);
            localStorage.setItem('cafeolive_customer_token', existingSession.session_token);
        }
        toast.success(`Welcome back! Redirecting to Table ${tableNumber} menu...`);
        navigate(`/menu?table=${encodeURIComponent(tableNumber)}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanTable = String(tableNumber).trim();
        const cleanName = String(customerName).trim();
        const cleanPhone = String(customerPhone).trim();

        if (!cleanTable) {
            toast.error("Please enter a valid table number.");
            return;
        }
        if (!cleanName || cleanName.length < 2) {
            toast.error("Please enter your full name (minimum 2 characters).");
            return;
        }
        if (!cleanPhone || cleanPhone.length < 7) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post('/api/tables/register-session', {
                table_number: cleanTable,
                customer_name: cleanName,
                customer_phone: cleanPhone
            });

            if (res.data?.success) {
                const sessionData = res.data.data;

                // Persist session details across browser
                localStorage.setItem('cafeolive_table', cleanTable);
                localStorage.setItem('cafeolive_customer_token', sessionData.session_token);
                setBillSession(
                    sessionData.bill_session_id,
                    cleanName,
                    cleanPhone
                );

                toast.success(`Table ${cleanTable} assigned! Welcome, ${cleanName}.`);
                navigate(`/menu?table=${encodeURIComponent(cleanTable)}`);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Registration failed. Please ask our staff.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF8F3] text-[#1e2a1b] flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Ambient Background Circles */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#c2a677]/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-[#1e2a1b]/5 blur-3xl pointer-events-none" />

            {/* Header Motif */}
            <header className="pt-8 px-6 text-center z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#e8e2d5] shadow-xs text-xs tracking-widest uppercase font-semibold text-[#c2a677] mb-3">
                    <Sparkles size={13} className="text-[#c2a677]" />
                    <span>Dine-In Concierge</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-[#1e2a1b]">
                    CAFE OLIVE
                </h1>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500 mt-1">
                    Atelier & Botanical Dining
                </p>
            </header>

            {/* Main Interactive Container */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-white/90 backdrop-blur-md border border-[#e8e2d5] rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5"
                >
                    {/* Table Badge Card */}
                    <div className="bg-[#1e2a1b] text-white rounded-2xl p-4 mb-6 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                <Utensils size={20} className="text-[#c2a677]" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest text-[#c2a677] font-semibold block">
                                    Assigned Seat
                                </span>
                                <span className="font-serif text-xl font-bold tracking-wide">
                                    {tableNumber ? `Table ${tableNumber}` : 'Select Table'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>QR Scanned</span>
                        </div>
                    </div>

                    {checkingStatus ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
                            <div className="w-8 h-8 rounded-full border-2 border-[#1e2a1b] border-t-transparent animate-spin" />
                            <span className="text-xs tracking-wider uppercase font-semibold">Validating Table...</span>
                        </div>
                    ) : existingSession ? (
                        /* Returning Diner Card */
                        <div className="space-y-6">
                            <div className="bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl p-4 text-center">
                                <CheckCircle2 size={32} className="text-emerald-700 mx-auto mb-2" />
                                <h3 className="font-serif text-lg font-bold text-[#1e2a1b]">
                                    Welcome back, {existingSession.customer_name}!
                                </h3>
                                <p className="text-xs text-stone-600 mt-1">
                                    You have an active dining session on Table {tableNumber}.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleContinueExisting}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#1e2a1b] text-white text-sm font-semibold tracking-wider uppercase shadow-md hover:bg-[#283824] transition duration-200"
                                >
                                    <span>Continue to Digital Menu</span>
                                    <ArrowRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExistingSession(null)}
                                    className="w-full py-2.5 text-xs text-stone-500 hover:text-[#1e2a1b] uppercase tracking-wider font-semibold transition"
                                >
                                    Switch or Register New Guest
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* New Customer Registration Form */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                                    Table Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        placeholder="e.g. 5 or A-1"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl text-sm font-semibold text-[#1e2a1b] focus:outline-none focus:border-[#1e2a1b] focus:ring-1 focus:ring-[#1e2a1b] transition"
                                    />
                                    <QrCode size={18} className="absolute left-3.5 top-3.5 text-stone-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                                    Your Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter your name"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl text-sm text-[#1e2a1b] focus:outline-none focus:border-[#1e2a1b] focus:ring-1 focus:ring-[#1e2a1b] transition"
                                    />
                                    <User size={18} className="absolute left-3.5 top-3.5 text-stone-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-600 mb-1.5">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="e.g. 9876543210"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl text-sm text-[#1e2a1b] focus:outline-none focus:border-[#1e2a1b] focus:ring-1 focus:ring-[#1e2a1b] transition"
                                    />
                                    <Phone size={18} className="absolute left-3.5 top-3.5 text-stone-400" />
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-[#c2a677]" />
                                    <span>Used solely for your order and receipt updates.</span>
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#1e2a1b] text-white text-sm font-semibold tracking-wider uppercase shadow-md hover:bg-[#283824] active:scale-[0.99] disabled:opacity-60 transition duration-200"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        <span>Setting Up Your Table...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Start Ordering</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </main>

            {/* Footer Assurance */}
            <footer className="py-6 px-4 text-center z-10 text-xs text-stone-500 flex items-center justify-center gap-2">
                <Coffee size={14} className="text-[#c2a677]" />
                <span>Contact any waiter or the cashier desk for assistance.</span>
            </footer>
        </div>
    );
};

export default CustomerScanRegister;
