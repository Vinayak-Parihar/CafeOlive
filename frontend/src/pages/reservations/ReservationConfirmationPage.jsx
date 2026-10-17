import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    CheckCircle2, Calendar, Clock, ArrowRight, Printer, Phone, Mail, 
    Users, Sparkles, Utensils, CreditCard, Banknote, MessageSquareShare, 
    Copy, Check, MapPin, ShieldCheck
} from 'lucide-react';
import { ManagedImage, mediaUrl, usePublicMedia } from '../../utils/mediaUtils';
import { sendReservationWhatsAppReceipt } from '../../utils/whatsappReceipt';

const ReservationConfirmationPage = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const media = usePublicMedia();

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await axios.get('/api/reservations');
                if (res.data?.success) {
                    const found = res.data.data.find(item => item._id === id);
                    setBooking(found);
                }
            } catch (err) {
                console.error("Error fetching reservation:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const getSpaceLabel = (type) => {
        switch (type) {
            case 'theatre': return 'Private Mini Theatre';
            case 'partyHall1': return 'Bespoke Party Hall 1';
            case 'partyHall2': return 'Grand Celebration Hall 2';
            default: return 'Premium Sanctuary Zone';
        }
    };

    const getEndTime = (start, dur) => {
        if (!start) return '';
        const trimmed = start.trim();
        let hour = 12;
        let minute = 0;

        if (trimmed.includes(':') && !trimmed.toLowerCase().includes('pm') && !trimmed.toLowerCase().includes('am')) {
            const [h, m] = trimmed.split(':');
            hour = parseInt(h, 10) || 0;
            minute = parseInt(m, 10) || 0;
        } else {
            const [time, period] = trimmed.split(/\s+/);
            const [h, m] = (time || "").split(':');
            hour = parseInt(h, 10) || 0;
            minute = parseInt(m, 10) || 0;
            if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
            if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;
        }

        const durHours = Number(dur) || 1;
        const totalMinutes = hour * 60 + minute + Math.round(durHours * 60);
        let endH = Math.floor(totalMinutes / 60) % 24;
        let endM = totalMinutes % 60;
        const endPeriod = endH >= 12 ? 'PM' : 'AM';
        if (endH > 12) endH -= 12;
        if (endH === 0) endH = 12;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endPeriod}`;
    };

    const handleCopyCode = () => {
        if (booking?._id) {
            navigator.clipboard.writeText(booking._id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1e2a1b]"></div>
                <span className="text-xs font-serif text-stone-500 uppercase tracking-widest">Retrieving Your Sanctuary...</span>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#FAF8F3] pt-32 pb-24 px-6 text-center font-sans">
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-[#e8e2d5] shadow-lg">
                    <h1 className="text-2xl font-bold font-serif text-[#1e2a1b]">Sanctuary Reservation Not Found</h1>
                    <p className="text-stone-500 mt-3 text-xs leading-relaxed font-light">
                        The reservation identifier could not be located in our records. Please verify your link or connect with our atelier concierge.
                    </p>
                    <Link 
                        to="/reservations/booking" 
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1e2a1b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#2d3e29] transition shadow-md"
                    >
                        Book A Sanctuary <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    const isPaid = booking.paymentStatus === 'paid';
    const isCash = booking.paymentMethod === 'cash';
    const isHalf = booking.paymentPlan === 'half';

    return (
        <div className="min-h-screen bg-[#0e170d] text-stone-800 font-sans antialiased relative selection:bg-[#1e2a1b] selection:text-white">
            {/* Ambient Background with subtle warm vignette */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <ManagedImage
                    src={mediaUrl(media, 'reservation-confirmation')}
                    alt="Sanctuary Ambience"
                    className="w-full h-full object-cover brightness-[0.35] scale-105 transform blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
            </div>

            <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                {/* Printable Header (Visible only when printing) */}
                <div className="hidden print:block text-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b]">CAFÉ OLIVE</h1>
                    <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">Official Sanctuary Reservation Voucher</p>
                </div>

                {/* Master Luxury Voucher Card */}
                <div className="bg-[#FAF8F3] rounded-[2rem] border border-[#d8d0c0] shadow-2xl overflow-hidden print:shadow-none print:border-none print:bg-white print:rounded-none">
                    
                    {/* Top Seal & Header Banner */}
                    <div className="bg-[#1A281A] text-white p-8 sm:p-10 text-center relative overflow-hidden border-b border-[#2d3e29]">
                        <div className="absolute -right-16 -top-16 w-52 h-52 bg-gold-accent/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                        {/* Gold-Ringed Checkmark Seal */}
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#243823] border-2 border-gold-accent text-gold-accent shadow-lg mb-4">
                            <CheckCircle2 size={36} className="text-gold-accent" />
                        </div>

                        <span className="text-[10px] sm:text-xs font-bold tracking-[0.28em] uppercase text-gold-accent block mb-2">
                            Sanctuary Reservation Confirmed
                        </span>
                        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
                            Your Sanctuary Awaits.
                        </h1>
                        <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto font-light leading-relaxed">
                            Your reservation at Café Olive has been successfully secured. Our team is curating an extraordinary atmosphere tailored to your celebration.
                        </p>
                    </div>

                    {/* Main Voucher Body */}
                    <div className="p-6 sm:p-10 space-y-8">
                        
                        {/* Event Essentials Grid (4 Cards) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="p-4 rounded-2xl bg-white border border-[#e8e2d5] shadow-xs text-center flex flex-col justify-center">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 block mb-1">DATE</span>
                                <span className="font-serif font-bold text-base sm:text-lg text-[#1e2a1b]">{booking.date}</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-white border border-[#e8e2d5] shadow-xs text-center flex flex-col justify-center">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 block mb-1">TIME WINDOW</span>
                                <span className="font-serif font-bold text-base sm:text-lg text-[#1e2a1b] truncate">
                                    {booking.startTime}
                                </span>
                                <span className="text-[10px] text-stone-400 font-medium">to {getEndTime(booking.startTime, booking.duration)}</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-white border border-[#e8e2d5] shadow-xs text-center flex flex-col justify-center">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 block mb-1">SANCTUARY</span>
                                <span className="font-serif font-bold text-base sm:text-lg text-[#1e2a1b] truncate">
                                    {getSpaceLabel(booking.type)}
                                </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-white border border-[#e8e2d5] shadow-xs text-center flex flex-col justify-center">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 block mb-1">PARTY SIZE</span>
                                <span className="font-serif font-bold text-base sm:text-lg text-[#1e2a1b]">{booking.guests} Guests</span>
                            </div>
                        </div>

                        {/* Detailed Guest & Experience Specifications */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            
                            {/* Left: Guest Profile */}
                            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8e2d5] shadow-xs space-y-4">
                                <div className="border-b border-[#ece7dc] pb-2 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        Guest & Contact Details
                                    </span>
                                    {booking.occasion && (
                                        <span className="text-[10px] font-semibold text-[#935a16] bg-[#fef7ea] px-2.5 py-0.5 rounded-full border border-[#f5dfb8]">
                                            ✨ {booking.occasion}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1">
                                        <span className="text-stone-500">Full Name</span>
                                        <span className="font-bold text-[#1e2a1b]">{booking.name}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-stone-500">Phone Number</span>
                                        <a href={`tel:${booking.phone}`} className="font-medium text-[#1e2a1b] hover:text-[#c2a677] transition">
                                            {booking.phone}
                                        </a>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-stone-500">Email Address</span>
                                        <span className="font-medium text-stone-600 truncate max-w-[200px]">{booking.email}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-stone-500">Duration Booked</span>
                                        <span className="font-semibold text-stone-700">{booking.duration} Hour(s)</span>
                                    </div>
                                </div>

                                {booking.specialRequests && (
                                    <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#ece7dc] text-xs text-stone-600 italic leading-relaxed">
                                        "{booking.specialRequests}"
                                    </div>
                                )}
                            </div>

                            {/* Right: Curated Add-ons & Policy */}
                            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8e2d5] shadow-xs space-y-4 flex flex-col justify-between">
                                <div>
                                    <div className="border-b border-[#ece7dc] pb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                            Hall Styling & Dining Plan
                                        </span>
                                    </div>

                                    {/* Hall Decoration Status */}
                                    <div className="pt-3 space-y-3">
                                        <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#ece7dc] flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2">
                                                <Sparkles size={16} className={booking.hasDecoration ? 'text-amber-600 mt-0.5' : 'text-stone-300 mt-0.5'} />
                                                <div>
                                                    <span className="text-xs font-bold text-[#1e2a1b] block">
                                                        {booking.hasDecoration ? 'Premium Hall Decoration Included' : 'No Decoration Included'}
                                                    </span>
                                                    {booking.hasDecoration && (
                                                        <span className="text-[10px] text-amber-900 block font-light mt-0.5 leading-tight">
                                                            ⚠️ Confirmed: Requires 1-hour early setup arrival.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-stone-700">
                                                {booking.hasDecoration ? '+₹1,500' : '₹0'}
                                            </span>
                                        </div>

                                        {/* Catering Plan */}
                                        <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#ece7dc] space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                                                <Utensils size={13} className="text-[#c2a677]" /> Selected Catering Service
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {booking.mealPlan && booking.mealPlan.length > 0 ? (
                                                    booking.mealPlan.map(meal => (
                                                        <span
                                                            key={meal}
                                                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1e2a1b] text-white capitalize"
                                                        >
                                                            🍽️ {meal}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-stone-400 italic">No catering package selected</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[10px] text-stone-400 flex items-center gap-1 font-light pt-2">
                                    <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
                                    <span>Slot reserved exclusively for you with a 30m turnover buffer.</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Settlement & Receipt Slip */}
                        <div className="bg-[#1A281A] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-stone-800 space-y-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-700/60 pb-4">
                                <div>
                                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-gold-accent block mb-1">
                                        Reservation Reference Code
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                                            {booking._id}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                            title="Copy reservation code"
                                        >
                                            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                        </button>
                                    </div>
                                </div>

                                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                                    isPaid
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                        : isCash
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                            : 'bg-stone-500/20 text-stone-300 border-stone-500/40'
                                }`}>
                                    {isPaid ? 'PAID & CLEARED ✓' : isCash ? '💵 CASH AT VENUE (PENDING)' : 'PAYMENT PENDING'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">PAYMENT METHOD</span>
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                        {isCash ? <Banknote size={14} className="text-gold-accent" /> : <CreditCard size={14} className="text-gold-accent" />}
                                        {isCash ? 'Cash at Venue' : 'Online Gateway'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">PAYMENT PLAN</span>
                                    <span className="font-semibold text-stone-200">
                                        {isHalf ? '50% Advance Booking' : 'Full Payment (100%)'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">ADVANCE DEPOSIT</span>
                                    <span className="font-serif font-bold text-emerald-400 text-base">
                                        ₹{booking.advanceAmount || 0}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">REMAINING AT VENUE</span>
                                    <span className={`font-serif font-bold text-base ${booking.balanceDue > 0 ? 'text-gold-accent' : 'text-stone-400'}`}>
                                        ₹{booking.balanceDue || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-stone-700/60 pt-4 flex items-baseline justify-between">
                                <span className="text-xs uppercase tracking-wider font-bold text-stone-400">Total Package Price</span>
                                <span className="font-serif text-3xl font-bold text-white">₹{booking.totalAmount}</span>
                            </div>
                        </div>

                        {/* Action Buttons Toolbar (Hidden when printing) */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-md"
                                >
                                    <Printer size={15} className="text-gold-accent" /> Print Official Receipt
                                </button>

                                <button
                                    type="button"
                                    onClick={() => sendReservationWhatsAppReceipt(booking)}
                                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-md"
                                    title="Send full reservation receipt on WhatsApp"
                                >
                                    <MessageSquareShare size={15} /> Save on WhatsApp
                                </button>
                            </div>

                            <Link
                                to="/"
                                className="w-full sm:w-auto text-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1e2a1b] hover:text-[#c2a677] flex items-center justify-center gap-1.5 transition"
                            >
                                Return Home <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-center text-xs text-stone-400 mt-6 font-light print:hidden">
                    Café Olive • Sanctuary & Lounge • For modifications, kindly contact management at least 24 hours prior.
                </p>
            </main>
        </div>
    );
};

export default ReservationConfirmationPage;
