import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ManagedImage, mediaUrl, usePublicMedia } from '../../utils/mediaUtils';
import { Film, PartyPopper, ArrowLeft, ArrowRight, Minus, Plus, CalendarDays, Clock } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const GUEST_LIMITS = {
    theatre: { min: 2, max: 8 },
    partyHall1: { min: 10, max: 35 },
    partyHall2: { min: 5, max: 15 }
};

const ZONE_LABELS = {
    theatre: 'Mini Theatre',
    partyHall1: 'Party Hall 1',
    partyHall2: 'Party Hall 2'
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Convert a Date object to a YYYY-MM-DD string using LOCAL time.
 * (Do NOT use .toISOString() — that converts to UTC and shifts the date.)
 */
const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Today's YYYY-MM-DD string in local time */
const todayLocal = () => toLocalDateStr(new Date());

/**
 * Compute end time given a "HH:00 AM/PM" startTime string and duration in hours.
 * Handles wrap-around past midnight.
 */
const getEndTime = (startTime, dur) => {
    if (!startTime) return '';
    const [timePart, period] = startTime.split(' ');
    let h = parseInt(timePart.split(':')[0], 10);
    // Convert to 24h
    if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period?.toUpperCase() === 'AM' && h === 12) h = 0;
    let endH = (h + dur) % 24;
    // Convert back to 12h
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    if (endH > 12) endH -= 12;
    if (endH === 0) endH = 12;
    return `${String(endH).padStart(2, '0')}:00 ${endPeriod}`;
};

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.querySelector('script[src*="checkout.razorpay"]')) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// ─── Component ─────────────────────────────────────────────────────────────────
const VenueBookingPage = () => {
    const media = usePublicMedia();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // ── Rates (server is the source of truth; fetched, never hardcoded) ─────────
    const [rates, setRates] = useState({});
    useEffect(() => {
        axios.get('/api/reservations/rates')
            .then(res => { if (res.data.success) setRates(res.data.data); })
            .catch(err => console.error('Error fetching venue rates:', err));
    }, []);

    // ── Zone ────────────────────────────────────────────────────────────────────
    const [selectedZone, setSelectedZone] = useState(() => {
        const q = searchParams.get('zone');
        return ['theatre', 'partyHall1', 'partyHall2'].includes(q) ? q : 'theatre';
    });

    // ── Date ────────────────────────────────────────────────────────────────────
    const [useCustomDate, setUseCustomDate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(todayLocal);   // always YYYY-MM-DD local
    const [daysList, setDaysList] = useState([]);

    useEffect(() => {
        const list = [];
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            list.push({
                dateString: toLocalDateStr(d),        // ← local time, not UTC
                dayLabel: days[d.getDay()],
                dayNum: d.getDate()
            });
        }
        setDaysList(list);
    }, []);

    // ── Duration ────────────────────────────────────────────────────────────────
    const [useCustomDuration, setUseCustomDuration] = useState(false);
    const [duration, setDuration] = useState(2);
    const [customDurationInput, setCustomDurationInput] = useState('2');

    const activeDuration = useCustomDuration
        ? Math.max(1, Math.min(24, parseInt(customDurationInput, 10) || 1))
        : duration;

    // ── Time ────────────────────────────────────────────────────────────────────
    const [amPm, setAmPm] = useState('PM');   // default PM (existing behaviour)
    const [startTime, setStartTime] = useState('');
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // ── Guests ──────────────────────────────────────────────────────────────────
    const [guests, setGuests] = useState(2);

    // ── Contact Form ────────────────────────────────────────────────────────────
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [occasion, setOccasion] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    const [placingBooking, setPlacingBooking] = useState(false);

    // ── Reset guests & time when zone changes ───────────────────────────────────
    useEffect(() => {
        setGuests(GUEST_LIMITS[selectedZone].min);
        setStartTime('');
    }, [selectedZone]);

    // ── Reset selected start time on date / amPm change ─────────────────────────
    useEffect(() => {
        setStartTime('');
    }, [selectedDate, amPm]);

    // ── Fetch availability ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoadingSlots(true);
            try {
                const res = await axios.get(
                    `/api/reservations/availability?type=${selectedZone}&date=${selectedDate}`
                );
                if (res.data.success) setSlots(res.data.data);
            } catch (err) {
                console.error('Error fetching availability:', err);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [selectedZone, selectedDate]);

    // ── Filter visible slots by AM/PM toggle ────────────────────────────────────
    const visibleSlots = slots.filter(slot => {
        const period = slot.time.split(' ')[1]?.toUpperCase();
        return period === amPm;
    });

    // ── Check if slot range is fully available ───────────────────────────────────
    const isSlotRangeBooked = useCallback((startSlot) => {
        if (!startSlot) return true;
        const startHour = startSlot.hourValue;
        for (let i = 0; i < activeDuration; i++) {
            const currentHour = startHour + i;
            const match = slots.find(s => s.hourValue === currentHour);
            if (!match || match.isBooked) return true;
        }
        // Disable past hours for today
        if (selectedDate === todayLocal()) {
            const currentHour = new Date().getHours();
            if (startHour <= currentHour) return true;
        }
        return false;
    }, [slots, activeDuration, selectedDate]);

    // ── Price ────────────────────────────────────────────────────────────────────
    const hourlyRate = rates[selectedZone] || 0;
    const totalAmount = hourlyRate * activeDuration;

    // ── Guests controls ──────────────────────────────────────────────────────────
    const handleGuestsChange = (val) => {
        const limit = GUEST_LIMITS[selectedZone];
        setGuests(prev => {
            const next = prev + val;
            if (next < limit.min) return limit.min;
            if (next > limit.max) return limit.max;
            return next;
        });
    };

    // ── Confirm Booking ──────────────────────────────────────────────────────────
    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        if (!name || !phone || !email || !startTime) {
            alert('Please complete all required fields and select a start time.');
            return;
        }

        setPlacingBooking(true);
        try {
            const payload = {
                type: selectedZone,
                name, phone, email,
                date: selectedDate,
                startTime,
                duration: activeDuration,
                guests, occasion, specialRequests
            };

            const orderRes = await axios.post('/api/reservations/create-payment-order', payload);
            if (!orderRes.data.success) {
                alert('Failed to initiate booking payment.');
                return;
            }

            const { reservation, razorpayOrder, razorpayKeyId } = orderRes.data.data;

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                alert('Razorpay failed to load. Please check your connection.');
                return;
            }

            const options = {
                key: razorpayKeyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Café Olive',
                description: `Sanctuary Booking: ${ZONE_LABELS[selectedZone]}`,
                order_id: razorpayOrder.id,
                handler: async (paymentResponse) => {
                    try {
                        setPlacingBooking(true);
                        const verifyRes = await axios.post('/api/reservations/verify-and-confirm', {
                            razorpayOrderId: paymentResponse.razorpay_order_id,
                            razorpayPaymentId: paymentResponse.razorpay_payment_id,
                            razorpaySignature: paymentResponse.razorpay_signature,
                            reservationId: reservation._id
                        });
                        if (verifyRes.data.success) {
                            navigate(`/reservations/confirmation/${reservation._id}`);
                        } else {
                            alert('Payment verification failed.');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        alert('Failed to confirm booking.');
                    } finally {
                        setPlacingBooking(false);
                    }
                },
                modal: { ondismiss: () => setPlacingBooking(false) },
                prefill: { name, email, contact: phone },
                theme: { color: '#0b5d4b' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error('Booking failed:', err);
            alert('Booking failed: ' + (err.response?.data?.message || 'Internal error'));
            setPlacingBooking(false);
        }
    };

    // ─── Derived display values for Booking Summary ───────────────────────────────
    const endTime = getEndTime(startTime, activeDuration);

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6 font-[Montserrat]">
            <div className="max-w-container-max mx-auto space-y-12">

                {/* Back button */}
                <button
                    onClick={() => navigate('/reservations')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider hover:opacity-85 transition"
                >
                    <ArrowLeft size={16} /> All Sanctuaries
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* ── LEFT: Interactive form ─────────────────────────────── */}
                    <div className="lg:col-span-8 space-y-12">
                        <div>
                            <span className="text-soft-gold text-xs font-semibold uppercase tracking-[0.25em] mb-2 block">
                                Premium Venue Booking
                            </span>
                            <h1 className="text-4xl md:text-5xl font-[Playfair_Display] text-primary font-bold mb-4">
                                Curate Your Event
                            </h1>
                            <p className="text-on-surface-variant font-light text-sm max-w-xl">
                                Configure date, duration, guests and check real-time slot availability. 
                                Complete pre-payment to confirm your booking.
                            </p>
                        </div>

                        {/* ── 1. Zone Selection ──────────────────────────────── */}
                        <section className="space-y-4">
                            <label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                                1. Select Sanctuary Zone
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'theatre', label: 'Mini Theatre', sub: 'Plush Recliners', Icon: Film },
                                    { key: 'partyHall1', label: 'Party Hall 1', sub: 'Up to 35 guests', Icon: PartyPopper },
                                    { key: 'partyHall2', label: 'Party Hall 2', sub: 'Up to 15 guests', Icon: PartyPopper }
                                ].map(({ key, label, sub, Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedZone(key)}
                                        className={`p-6 rounded-lg border-2 text-left bg-white transition duration-300 ${
                                            selectedZone === key
                                                ? 'border-primary shadow-sm'
                                                : 'border-surface-border hover:border-soft-gold'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${
                                            selectedZone === key ? 'bg-primary text-white' : 'bg-soft-gold/10 text-soft-gold'
                                        }`}>
                                            <Icon size={20} />
                                        </div>
                                        <h3 className="font-[Playfair_Display] font-bold text-primary text-lg">{label}</h3>
                                        <p className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest mt-1">{sub}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── 2–4. Date, Duration & Time ────────────────────── */}
                        <section className="glass-panel p-8 rounded-lg space-y-6">

                            {/* ── 2. Date ─────────────────────────────────────── */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-primary whitespace-nowrap">
                                        2. Choose Date
                                    </label>
                                    {/* Custom date toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-on-surface-variant">
                                        <div
                                            role="checkbox"
                                            aria-checked={useCustomDate}
                                            onClick={() => {
                                                setUseCustomDate(v => !v);
                                                setStartTime('');
                                                // Reset to today if switching back
                                                if (useCustomDate) setSelectedDate(todayLocal());
                                            }}
                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-300 cursor-pointer ${
                                                useCustomDate ? 'bg-primary justify-end' : 'bg-surface-border justify-start'
                                            }`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300" />
                                        </div>
                                        <CalendarDays size={13} className="text-primary" />
                                        Choose Custom Date
                                    </label>
                                </div>

                                {/* Predefined 7-day cards */}
                                {!useCustomDate && (
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {daysList.map(item => (
                                            <button
                                                type="button"
                                                key={item.dateString}
                                                onClick={() => setSelectedDate(item.dateString)}
                                                className={`flex-none flex flex-col items-center p-3 w-16 rounded-lg border transition ${
                                                    selectedDate === item.dateString
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white border-surface-border hover:border-soft-gold text-on-surface-variant'
                                                }`}
                                            >
                                                <span className="text-[9px] font-bold tracking-widest uppercase opacity-75">
                                                    {item.dayLabel}
                                                </span>
                                                <span className="font-[Playfair_Display] text-lg font-bold mt-1">
                                                    {item.dayNum}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Custom date picker */}
                                {useCustomDate && (
                                    <div className="flex flex-col gap-1.5">
                                        <input
                                            id="custom-date-picker"
                                            type="date"
                                            value={selectedDate}
                                            min={todayLocal()}
                                            onChange={e => setSelectedDate(e.target.value)}
                                            className="bg-white border border-surface-border rounded-lg px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition w-full sm:w-56"
                                        />
                                        <span className="text-[10px] text-on-surface-variant italic">
                                            Select any future date (including months ahead)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── 3. Duration ─────────────────────────────────── */}
                            <div className="space-y-4 pt-4 border-t border-surface-border/50">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-primary whitespace-nowrap">
                                        3. Duration
                                    </label>
                                    {/* Custom duration toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-on-surface-variant">
                                        <div
                                            role="checkbox"
                                            aria-checked={useCustomDuration}
                                            onClick={() => {
                                                setUseCustomDuration(v => !v);
                                                setStartTime('');
                                            }}
                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-300 cursor-pointer ${
                                                useCustomDuration ? 'bg-primary justify-end' : 'bg-surface-border justify-start'
                                            }`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300" />
                                        </div>
                                        <Clock size={13} className="text-primary" />
                                        Custom Duration
                                    </label>
                                </div>

                                {/* Predefined select */}
                                {!useCustomDuration && (
                                    <select
                                        value={duration}
                                        onChange={e => {
                                            setDuration(parseInt(e.target.value));
                                            setStartTime('');
                                        }}
                                        className="w-full sm:w-56 bg-white border border-surface-border rounded-lg p-3.5 focus:ring-primary focus:border-primary text-sm font-semibold outline-none"
                                    >
                                        <option value="1">1 Hour</option>
                                        <option value="2">2 Hours</option>
                                        <option value="3">3 Hours</option>
                                        <option value="4">4 Hours</option>
                                    </select>
                                )}

                                {/* Custom duration input */}
                                {useCustomDuration && (
                                    <div className="flex items-center gap-4">
                                        <input
                                            id="custom-duration-input"
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={customDurationInput}
                                            onChange={e => {
                                                setCustomDurationInput(e.target.value);
                                                setStartTime('');
                                            }}
                                            className="w-28 bg-white border border-surface-border rounded-lg px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                        />
                                        <span className="text-sm font-semibold text-on-surface-variant">
                                            {activeDuration === 1 ? 'hour' : 'hours'}
                                        </span>
                                        <span className="text-xs text-soft-gold font-bold">
                                            ₹{(hourlyRate * activeDuration).toLocaleString()} total
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── 4. Start Time ────────────────────────────────── */}
                            <div className="space-y-4 pt-4 border-t border-surface-border/50">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-primary whitespace-nowrap">
                                        4. Select Start Time
                                    </label>

                                    {/* AM / PM toggle */}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold transition-colors ${amPm === 'AM' ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                                            AM
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="Toggle AM/PM"
                                            onClick={() => setAmPm(a => a === 'AM' ? 'PM' : 'AM')}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                                                amPm === 'PM' ? 'bg-primary' : 'bg-soft-gold/50'
                                            }`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                                amPm === 'PM' ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                        </button>
                                        <span className={`text-xs font-bold transition-colors ${amPm === 'PM' ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                                            PM
                                        </span>
                                    </div>
                                </div>

                                {loadingSlots ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
                                    </div>
                                ) : (
                                    <>
                                        {visibleSlots.length === 0 ? (
                                            <p className="text-xs text-on-surface-variant italic py-4">
                                                No {amPm} time slots available. Switch to {amPm === 'AM' ? 'PM' : 'AM'} or choose a different date.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                {visibleSlots.map(slot => {
                                                    const disabled = isSlotRangeBooked(slot);
                                                    const isSelected = startTime === slot.time;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={slot.time}
                                                            disabled={disabled}
                                                            onClick={() => setStartTime(slot.time)}
                                                            className={`p-3 rounded-lg border text-xs font-semibold transition ${
                                                                disabled
                                                                    ? 'bg-surface-container-highest/20 border-surface-border/40 text-gray-300 cursor-not-allowed line-through'
                                                                    : isSelected
                                                                    ? 'bg-primary text-white border-primary shadow-xs'
                                                                    : 'bg-white border-surface-border text-primary hover:border-soft-gold'
                                                            }`}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="flex gap-4 pt-2 text-[10px] font-bold tracking-widest text-on-surface-variant">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 bg-white border border-surface-border rounded-xs" />
                                                AVAILABLE
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 bg-surface-container-highest/20 border border-surface-border/40 rounded-xs" />
                                                UNAVAILABLE
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ── 5. Guests ─────────────────────────────────────── */}
                            <div className="pt-6 border-t border-surface-border/50 space-y-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                                    5. Guest Count
                                </label>
                                <div className="flex items-center gap-6">
                                    <button
                                        type="button"
                                        onClick={() => handleGuestsChange(-1)}
                                        className="w-10 h-10 rounded-full border border-surface-border flex items-center justify-center hover:bg-soft-gold/10 transition"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <div className="text-center w-20">
                                        <span className="font-[Playfair_Display] text-3xl font-bold text-primary">{guests}</span>
                                        <p className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Guests</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleGuestsChange(1)}
                                        className="w-10 h-10 rounded-full border border-surface-border flex items-center justify-center hover:bg-soft-gold/10 transition"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-on-surface-variant italic">
                                    Allowed range for this zone: {GUEST_LIMITS[selectedZone].min} – {GUEST_LIMITS[selectedZone].max} people.
                                </p>
                            </div>
                        </section>

                        {/* ── 6. Contact Information ────────────────────────── */}
                        <section className="bg-white border border-surface-border p-8 rounded-lg space-y-6">
                            <h2 className="text-xl font-[Playfair_Display] font-bold text-primary">6. Contact Information</h2>
                            <div className="grid md:grid-cols-2 gap-6 text-sm">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Mobile number"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                                        Occasion (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Birthday, Anniversary"
                                        value={occasion}
                                        onChange={e => setOccasion(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                    />
                                </div>
                            </div>
                            <div className="text-sm">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                                    Special Requests (Optional)
                                </label>
                                <textarea
                                    placeholder="Balloon setups, custom menus, timing requests..."
                                    value={specialRequests}
                                    onChange={e => setSpecialRequests(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition h-20 resize-none"
                                />
                            </div>
                        </section>
                    </div>

                    {/* ── RIGHT: Summary card ────────────────────────────────── */}
                    <aside className="lg:col-span-4 lg:sticky lg:top-32 space-y-8 w-full">
                        <div className="w-full aspect-video md:aspect-[4/3] arch-frame overflow-hidden soft-shadow border border-surface-border bg-surface-container">
                            <ManagedImage
                                src={mediaUrl(media, 'reservation-venue-booking')}
                                alt="Restaurant Interior"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Booking Summary Card */}
                        <div className="bg-primary text-white p-8 rounded-lg soft-shadow space-y-6">
                            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-soft-gold border-b border-white/10 pb-4">
                                Booking Summary
                            </h3>

                            <div className="space-y-4 font-[Montserrat] text-sm font-light">
                                <div className="flex justify-between">
                                    <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase">Sanctuary</span>
                                    <span className="font-semibold">{ZONE_LABELS[selectedZone]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase">Selected Date</span>
                                    <span className="font-semibold">{selectedDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase">Start Time</span>
                                    <span className="font-semibold">{startTime || '— Select a slot'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase">Duration</span>
                                    <span className="font-semibold">{activeDuration} {activeDuration === 1 ? 'hour' : 'hours'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase">End Time</span>
                                    <span className="font-semibold">{startTime ? endTime : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase">Guests</span>
                                    <span className="font-semibold">{guests} Guests</span>
                                </div>

                                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                    <div>
                                        <span className="opacity-60 text-[10px] font-bold tracking-wider uppercase block">Total Amount</span>
                                        <span className="text-[10px] text-soft-gold font-bold">₹{hourlyRate}/hr × {activeDuration}h</span>
                                    </div>
                                    <span className="font-[Playfair_Display] text-3xl font-bold text-soft-gold">
                                        ₹{totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmBooking}
                                disabled={placingBooking || !startTime}
                                className="w-full bg-soft-gold text-primary font-bold text-xs uppercase tracking-wider py-4 rounded-full flex items-center justify-center gap-2 hover:bg-white hover:text-primary transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {placingBooking ? 'Processing...' : 'Verify & Pay Reservation'}
                                <ArrowRight size={14} />
                            </button>

                            <p className="text-[9px] opacity-40 text-center italic">
                                Razorpay transaction occurs securely. Cancellations allowed 24h prior.
                            </p>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
};

export default VenueBookingPage;
