import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ManagedImage, usePublicMedia } from '../../utils/mediaUtils';
import { Film, PartyPopper, ArrowLeft, ArrowRight, Minus, Plus, CalendarDays, Clock, Check, Sparkles, AlertTriangle, Utensils, CheckCircle2, CreditCard, Banknote } from 'lucide-react';

const GUEST_LIMITS = {
    theatre: { min: 2, max: 8 },
    partyHall1: { min: 5, max: 50 },
    partyHall2: { min: 5, max: 100 }
};

const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const todayLocal = () => toLocalDateStr(new Date());

const parseTimeToHourMinute = (timeStr) => {
    if (!timeStr) return { hour: 12, minute: 0 };
    const trimmed = timeStr.trim();
    if (trimmed.includes(':') && !trimmed.toLowerCase().includes('pm') && !trimmed.toLowerCase().includes('am')) {
        const [h, m] = trimmed.split(':');
        return { hour: parseInt(h, 10) || 0, minute: parseInt(m, 10) || 0 };
    }
    const [time, period] = trimmed.split(/\s+/);
    const [h, m] = (time || "").split(':');
    let hour = parseInt(h, 10) || 0;
    const minute = parseInt(m, 10) || 0;
    if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
};

const getEndTime = (startTime, dur) => {
    if (!startTime) return '';
    const { hour, minute } = parseTimeToHourMinute(startTime);
    const durHours = Number(dur) || 1;
    const totalMinutes = hour * 60 + minute + Math.round(durHours * 60);
    let endH = Math.floor(totalMinutes / 60) % 24;
    let endM = totalMinutes % 60;
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    if (endH > 12) endH -= 12;
    if (endH === 0) endH = 12;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endPeriod}`;
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

const VenueBookingPage = () => {
    const media = usePublicMedia();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [rates, setRates] = useState({});
    useEffect(() => {
        axios.get('/api/reservations/rates')
            .then(res => { if (res.data.success) setRates(res.data.data); })
            .catch(err => console.error('Error fetching rates:', err));
    }, []);

    const [selectedZone, setSelectedZone] = useState(() => {
        const q = searchParams.get('zone');
        return ['theatre', 'partyHall1', 'partyHall2'].includes(q) ? q : 'theatre';
    });

    const [useCustomDate, setUseCustomDate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(todayLocal);
    const [weekOffset, setWeekOffset] = useState(0);
    const [daysList, setDaysList] = useState([]);

    useEffect(() => {
        const list = [];
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const base = new Date();
        base.setDate(base.getDate() + weekOffset * 7);

        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            list.push({
                dateString: toLocalDateStr(d),
                dayLabel: days[d.getDay()],
                dayNum: d.getDate(),
                monthLabel: months[d.getMonth()]
            });
        }
        setDaysList(list);
    }, [weekOffset]);

    const [duration, setDuration] = useState(2);
    const [useCustomDuration, setUseCustomDuration] = useState(false);
    const [customDurationInput, setCustomDurationInput] = useState('2');

    const activeDuration = useCustomDuration
        ? Math.max(1, Math.min(24, parseInt(customDurationInput, 10) || 1))
        : duration;

    const [amPm, setAmPm] = useState('PM');
    const [startTime, setStartTime] = useState('');
    const [slots, setSlots] = useState([]);
    const [bookedRanges, setBookedRanges] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [guests, setGuests] = useState(2);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [occasion, setOccasion] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [hasDecoration, setHasDecoration] = useState(false);
    const [decorationAgreement, setDecorationAgreement] = useState(false);
    const [mealPlan, setMealPlan] = useState([]);
    const [paymentPlan, setPaymentPlan] = useState('full'); // 'full' or 'half'
    const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cash'
    const [placingBooking, setPlacingBooking] = useState(false);

    const toggleMeal = (meal) => {
        setMealPlan(prev => prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]);
    };

    const zoneDetails = {
        theatre: {
            title: 'Mini Theatre',
            sub: 'Up to 8 Guests',
            rateText: '₹1,200/hr',
            min: 2,
            max: 8,
            image: media['reservation-theatre']?.imageUrl || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80'
        },
        partyHall1: {
            title: 'Hall 1',
            sub: 'Up to 50 Guests',
            rateText: '₹1,500/hr',
            min: 5,
            max: 50,
            image: media['reservation-party-hall-1']?.imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
        },
        partyHall2: {
            title: 'Hall 2',
            sub: 'Up to 100 Guests',
            rateText: '₹2,800/hr',
            min: 5,
            max: 100,
            image: media['reservation-party-hall-2']?.imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
        }
    };

    useEffect(() => {
        const limit = zoneDetails[selectedZone] || GUEST_LIMITS[selectedZone];
        setGuests(prev => Math.min(Math.max(prev, limit.min), limit.max));
        setStartTime('');
    }, [selectedZone]);

    useEffect(() => {
        setStartTime('');
    }, [selectedDate, amPm]);

    useEffect(() => {
        const fetchAvailability = async () => {
            setLoadingSlots(true);
            try {
                const res = await axios.get(
                    `/api/reservations/availability?type=${selectedZone}&date=${selectedDate}`
                );
                if (res.data.success) {
                    const slotData = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.slots || []);
                    const ranges = res.data.data?.bookedRanges || [];
                    setSlots(slotData);
                    setBookedRanges(ranges);
                }
            } catch (err) {
                console.error('Error fetching availability:', err);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [selectedZone, selectedDate]);

    const visibleSlots = slots.filter(slot => {
        const period = slot.time.split(' ')[1]?.toUpperCase();
        return period === amPm;
    });

    const isSlotRangeBooked = useCallback((startSlot) => {
        if (!startSlot || startSlot.isBooked) return true;

        const { hour, minute } = parseTimeToHourMinute(startSlot.time);
        const [y, m, d] = selectedDate.split('-').map(Number);
        const candStartMs = new Date(y, m - 1, d, hour, minute, 0, 0).getTime();
        const candEndMs = candStartMs + activeDuration * 60 * 60 * 1000;

        if (selectedDate === todayLocal() && candStartMs <= Date.now()) {
            return true;
        }

        const BUFFER_MS = 30 * 60 * 1000;
        return bookedRanges.some(b => candStartMs < (b.endMs + BUFFER_MS) && b.startMs < (candEndMs + BUFFER_MS));
    }, [bookedRanges, activeDuration, selectedDate]);

    const hourlyRate = rates[selectedZone] || (selectedZone === 'theatre' ? 1200 : selectedZone === 'partyHall2' ? 2800 : 1500);
    const baseTotal = hourlyRate * activeDuration;
    const decorationCost = hasDecoration ? 1500 : 0;
    const totalAmount = baseTotal + decorationCost;
    const payableAmount = paymentPlan === 'half' ? Math.round(totalAmount / 2) : totalAmount;
    const balanceDue = totalAmount - payableAmount;
    const endTimeDisplay = getEndTime(startTime, activeDuration);

    const handleGuestsChange = (val) => {
        const limit = zoneDetails[selectedZone];
        setGuests(prev => Math.min(Math.max(prev + val, limit.min), limit.max));
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        if (!name || !phone || !email || !startTime) {
            alert('Please complete all required fields and select a start time.');
            return;
        }

        if (hasDecoration && !decorationAgreement) {
            alert('Please tick the checkbox to agree that hall decoration requires booking 1 hour early for setup.');
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
                guests, occasion, specialRequests,
                hasDecoration,
                decorationAgreement,
                mealPlan,
                paymentPlan,
                paymentMethod
            };

            const orderRes = await axios.post('/api/reservations/create-payment-order', payload);
            if (!orderRes.data.success) {
                alert('Failed to initiate booking payment.');
                return;
            }

            // Direct cash payment reservation confirmed
            if (orderRes.data.data?.isCash) {
                navigate(`/reservations/confirmation/${orderRes.data.data.reservation._id}`);
                return;
            }

            const { reservation, razorpayOrder, razorpayKeyId } = orderRes.data.data;

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                alert('Razorpay failed to load.');
                return;
            }

            const options = {
                key: razorpayKeyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Café Olive',
                description: `Sanctuary Booking - ${zoneDetails[selectedZone].title}`,
                order_id: razorpayOrder.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await axios.post('/api/reservations/verify-payment', {
                            reservationId: reservation._id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        if (verifyRes.data.success) {
                            navigate(`/reservations/confirmation/${reservation._id}`);
                        } else {
                            alert('Payment verification failed.');
                        }
                    } catch (err) {
                        alert('Error verifying payment.');
                    }
                },
                prefill: { name, email, contact: phone },
                theme: { color: '#1e2a1b' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating reservation.');
        } finally {
            setPlacingBooking(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-olive-deep font-sans antialiased selection:bg-olive-rich selection:text-linen">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="mb-6">
                    <Link
                        to="/reservations"
                        className="inline-flex items-center text-xs tracking-widest uppercase font-semibold text-olive-muted hover:text-olive-deep transition"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> All Sanctuaries
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Booking Form Column */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                        <div>
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold-accent block mb-1">
                                Premium Venue Booking
                            </span>
                            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-olive-deep">
                                Curate Your Event
                            </h1>
                            <p className="text-olive-muted text-sm sm:text-base max-w-2xl font-light leading-relaxed mt-2">
                                Configure date, duration, guests and check real-time slot availability. Complete pre-payment to confirm your booking.
                            </p>
                        </div>

                        {/* Step 1: Zone Selector */}
                        <div className="space-y-3">
                            <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block">
                                1. Select Sanctuary Zone
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {Object.entries(zoneDetails).map(([key, zone]) => {
                                    const isSelected = selectedZone === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedZone(key)}
                                            className={`relative flex flex-col p-4 rounded-2xl text-left transition-all ${
                                                isSelected
                                                    ? 'bg-white border-2 border-olive-deep shadow-md'
                                                    : 'bg-white/80 border border-[#e8e4d8] hover:border-gold-accent'
                                            }`}
                                        >
                                            {isSelected && (
                                                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-olive-deep text-white flex items-center justify-center">
                                                    <Check className="w-3 h-3" />
                                                </span>
                                            )}
                                            <div className="w-10 h-10 rounded-xl bg-olive-light/60 flex items-center justify-center text-olive-deep mb-3">
                                                {key === 'theatre' ? <Film size={18} /> : <PartyPopper size={18} />}
                                            </div>
                                            <h3 className="font-serif text-base font-bold text-olive-deep">{zone.title}</h3>
                                            <span className="text-[11px] font-medium tracking-wider uppercase text-olive-muted mt-0.5">
                                                {zone.sub}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 2: Date Picker */}
                        <div className="bg-white p-5 rounded-3xl border border-[#e8e4d8] space-y-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece7dc] pb-3">
                                <span className="text-xs font-bold tracking-widest uppercase text-olive-deep">
                                    2. Choose Date
                                </span>
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setWeekOffset(0)}
                                        className={`px-3 py-1 rounded-lg font-medium transition ${weekOffset === 0 ? 'bg-olive-deep text-white' : 'bg-stone-100 text-stone-600'}`}
                                    >
                                        This Week
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWeekOffset(1)}
                                        className={`px-3 py-1 rounded-lg font-medium transition ${weekOffset === 1 ? 'bg-olive-deep text-white' : 'bg-stone-100 text-stone-600'}`}
                                    >
                                        Next Week
                                    </button>
                                    <label className="flex items-center gap-1.5 ml-2 cursor-pointer text-olive-muted">
                                        <input
                                            type="checkbox"
                                            checked={useCustomDate}
                                            onChange={(e) => setUseCustomDate(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded text-olive-deep"
                                        />
                                        <span>Custom Date</span>
                                    </label>
                                </div>
                            </div>

                            {useCustomDate ? (
                                <input
                                    type="date"
                                    min={todayLocal()}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] bg-linen/50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                />
                            ) : (
                                <div className="grid grid-cols-7 gap-2">
                                    {daysList.map((d) => {
                                        const isSelected = selectedDate === d.dateString;
                                        return (
                                            <button
                                                key={d.dateString}
                                                type="button"
                                                onClick={() => setSelectedDate(d.dateString)}
                                                className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition ${
                                                    isSelected
                                                        ? 'bg-olive-deep text-white shadow-md'
                                                        : 'bg-white border border-[#e8e4d8] hover:border-olive-deep text-stone-700'
                                                }`}
                                            >
                                                <span className="text-[10px] uppercase font-bold text-gold-accent">{d.monthLabel}</span>
                                                <span className="text-[11px] font-semibold uppercase">{d.dayLabel}</span>
                                                <span className="font-serif text-lg sm:text-xl font-bold mt-0.5">{d.dayNum}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Duration */}
                        <div className="bg-white p-5 rounded-3xl border border-[#e8e4d8] space-y-3 shadow-sm">
                            <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block">
                                3. Duration
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((hrs) => (
                                    <button
                                        key={hrs}
                                        type="button"
                                        onClick={() => { setDuration(hrs); setUseCustomDuration(false); }}
                                        className={`py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition ${
                                            !useCustomDuration && duration === hrs
                                                ? 'bg-olive-deep text-white shadow-sm'
                                                : 'bg-white border border-[#e8e4d8] hover:border-olive-deep text-stone-700'
                                        }`}
                                    >
                                        {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 4: Start Time Slots */}
                        <div className="bg-white p-5 rounded-3xl border border-[#e8e4d8] space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#ece7dc] pb-3">
                                <span className="text-xs font-bold tracking-widest uppercase text-olive-deep">
                                    4. Select Start Time
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAmPm('AM')}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${amPm === 'AM' ? 'bg-olive-deep text-white' : 'bg-stone-100 text-stone-600'}`}
                                    >
                                        AM
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAmPm('PM')}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${amPm === 'PM' ? 'bg-olive-deep text-white' : 'bg-stone-100 text-stone-600'}`}
                                    >
                                        PM
                                    </button>
                                </div>
                            </div>

                            {loadingSlots ? (
                                <p className="text-xs text-olive-muted text-center py-4">Checking slot availability...</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {visibleSlots.map((slot) => {
                                        const booked = isSlotRangeBooked(slot);
                                        const isSelected = startTime === slot.time;
                                        return (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                disabled={booked}
                                                onClick={() => setStartTime(slot.time)}
                                                className={`py-2.5 px-1 rounded-xl text-xs font-semibold transition ${
                                                    isSelected
                                                        ? 'bg-olive-deep text-white shadow-md'
                                                        : booked
                                                        ? 'bg-stone-100 text-stone-300 cursor-not-allowed border border-stone-200/50'
                                                        : 'bg-white border border-[#e8e4d8] text-olive-deep hover:border-olive-deep'
                                                }`}
                                            >
                                                {slot.time}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 5: Guest Count */}
                        <div className="bg-white p-5 rounded-3xl border border-[#e8e4d8] space-y-3 shadow-sm">
                            <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block">
                                5. Guest Count
                            </span>
                            <div className="flex items-center gap-6">
                                <div className="inline-flex items-center bg-stone-50 p-1.5 rounded-2xl border border-[#e8e4d8]">
                                    <button
                                        type="button"
                                        onClick={() => handleGuestsChange(-1)}
                                        className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 font-bold"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <div className="px-6 text-center">
                                        <span className="font-serif text-2xl font-bold text-olive-deep">{guests}</span>
                                        <span className="block text-[10px] tracking-wider uppercase font-semibold text-stone-400">Guests</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleGuestsChange(1)}
                                        className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 font-bold"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-olive-muted font-medium">
                                    Capacity limit: <strong className="text-olive-deep">{zoneDetails[selectedZone].sub}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Step 6: Contact Information */}
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] space-y-4 shadow-sm">
                            <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block mb-2">
                                6. Contact Information
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-1">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full name"
                                        className="w-full px-4 py-3 rounded-xl border border-[#d8d3c5] bg-linen/50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Mobile number"
                                        className="w-full px-4 py-3 rounded-xl border border-[#d8d3c5] bg-linen/50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email address"
                                        className="w-full px-4 py-3 rounded-xl border border-[#d8d3c5] bg-linen/50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-1">
                                        Occasion (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={occasion}
                                        onChange={(e) => setOccasion(e.target.value)}
                                        placeholder="e.g. Birthday, Anniversary"
                                        className="w-full px-4 py-3 rounded-xl border border-[#d8d3c5] bg-linen/50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-1">
                                        Special Requests (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={specialRequests}
                                        onChange={(e) => setSpecialRequests(e.target.value)}
                                        placeholder="Custom seating setup, dietary preferences..."
                                        className="w-full px-4 py-3 rounded-xl border border-[#d8d3c5] bg-linen/50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 7: Hall Decoration & Setup Policy */}
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block">
                                    7. Hall Decoration & Setup
                                </span>
                                <span className="text-[11px] font-bold text-gold-accent bg-[#f8f5ee] px-2.5 py-0.5 rounded-full border border-[#ece4d0]">
                                    +₹1,500
                                </span>
                            </div>

                            <label className="flex items-start gap-3 p-4 rounded-2xl bg-linen/40 border border-[#e2dcd0] cursor-pointer hover:border-[#1e2a1b]/40 transition select-none">
                                <input
                                    type="checkbox"
                                    checked={hasDecoration}
                                    onChange={(e) => {
                                        setHasDecoration(e.target.checked);
                                        if (!e.target.checked) setDecorationAgreement(false);
                                    }}
                                    className="mt-1 w-4 h-4 rounded text-olive-deep focus:ring-olive-deep accent-[#1e2a1b]"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-olive-deep block">
                                        Include Premium Hall Decoration
                                    </span>
                                    <span className="text-xs text-olive-muted block mt-0.5 font-light">
                                        Artisanal balloon styling, celebratory backdrop, table styling, and ambient illumination.
                                    </span>
                                </div>
                            </label>

                            {/* Warning and Agreement Checkbox (Required if decoration is requested) */}
                            {hasDecoration && (
                                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3 animate-fadeIn">
                                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                                        <AlertTriangle size={16} className="text-amber-700 shrink-0" />
                                        <span>Mandatory Decoration Setup Notice</span>
                                    </div>
                                    <p className="text-[11px] text-amber-900/90 leading-relaxed font-normal">
                                        <strong>⚠️ Preparation Rule:</strong> If you want to decorate the hall, you must book <strong>1 hour early</strong> to allow our decorator team enough time to finish the setup before your guests arrive.
                                    </p>
                                    <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={decorationAgreement}
                                            onChange={(e) => setDecorationAgreement(e.target.checked)}
                                            className="mt-0.5 w-4 h-4 rounded text-amber-900 focus:ring-amber-800 accent-[#b45309]"
                                        />
                                        <span className="text-xs font-semibold text-amber-950">
                                            I agree and confirm that hall decoration requires 1-hour early setup booking. *
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Step 8: Dining & Refreshments (Meal Plan) */}
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] space-y-4 shadow-sm">
                            <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block">
                                8. Catering & Meal Plan (Optional)
                            </span>
                            <p className="text-xs text-olive-muted font-light">
                                Select any food & beverage services to include for your gathering:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'lunch', label: 'Lunch Service', desc: 'Curated 3-course midday dining' },
                                    { id: 'dinner', label: 'Dinner Banquet', desc: 'Evening artisanal spread & mains' },
                                    { id: 'refreshments', label: 'Refreshments & Tea', desc: 'Artisanal bites, coffee & mocktails' }
                                ].map((meal) => {
                                    const checked = mealPlan.includes(meal.id);
                                    return (
                                        <label
                                            key={meal.id}
                                            onClick={() => toggleMeal(meal.id)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition select-none flex flex-col justify-between ${
                                                checked
                                                    ? 'bg-[#1e2a1b] text-white border-[#1e2a1b] shadow-xs'
                                                    : 'bg-linen/30 border-[#e2dcd0] text-stone-700 hover:border-stone-400'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Utensils size={16} className={checked ? 'text-gold-accent' : 'text-stone-400'} />
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    readOnly
                                                    className="w-4 h-4 accent-gold-accent"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold block">{meal.label}</span>
                                                <span className={`text-[10px] block mt-1 leading-tight ${checked ? 'text-stone-300' : 'text-stone-400'}`}>
                                                    {meal.desc}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 9: Payment Choice (Cash vs Online & Full vs Half Payment) */}
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e4d8] space-y-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-widest uppercase text-olive-deep block">
                                    9. Payment Method & Plan
                                </span>
                                <span className="text-[11px] font-semibold text-olive-muted">
                                    {paymentMethod === 'online' ? 'Instant Online Gateway' : 'Pay at Venue Counter'}
                                </span>
                            </div>

                            {/* Payment Method (Online vs Cash) */}
                            <div>
                                <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                        onClick={() => setPaymentMethod('online')}
                                        className={`p-4 rounded-2xl border cursor-pointer transition select-none flex items-start gap-3.5 ${
                                            paymentMethod === 'online'
                                                ? 'bg-[#1e2a1b] text-white border-[#1e2a1b] shadow-md'
                                                : 'bg-linen/30 border-[#e2dcd0] text-stone-700 hover:border-stone-400'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'online'}
                                            onChange={() => setPaymentMethod('online')}
                                            className="mt-1 w-4 h-4 accent-gold-accent"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold">Online Payment</span>
                                                <CreditCard size={16} className={paymentMethod === 'online' ? 'text-gold-accent' : 'text-stone-400'} />
                                            </div>
                                            <span className={`text-[11px] block leading-tight ${paymentMethod === 'online' ? 'text-stone-300' : 'text-stone-500'}`}>
                                                UPI, Google Pay, PhonePe, Cards & NetBanking via Razorpay.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-4 rounded-2xl border cursor-pointer transition select-none flex items-start gap-3.5 ${
                                            paymentMethod === 'cash'
                                                ? 'bg-[#1e2a1b] text-white border-[#1e2a1b] shadow-md'
                                                : 'bg-linen/30 border-[#e2dcd0] text-stone-700 hover:border-stone-400'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'cash'}
                                            onChange={() => setPaymentMethod('cash')}
                                            className="mt-1 w-4 h-4 accent-gold-accent"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold">Pay in Cash at Venue</span>
                                                <Banknote size={16} className={paymentMethod === 'cash' ? 'text-gold-accent' : 'text-stone-400'} />
                                            </div>
                                            <span className={`text-[11px] block leading-tight ${paymentMethod === 'cash' ? 'text-stone-300' : 'text-stone-500'}`}>
                                                Pay directly in cash at Café Olive counter on your event day.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Payment Plan (Full vs Half Payment) */}
                            <div className="pt-2 border-t border-[#ece7db]">
                                <label className="text-[11px] font-bold tracking-wider uppercase text-olive-deep block mb-2">
                                    Payment Amount Plan
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                        onClick={() => setPaymentPlan('full')}
                                        className={`p-4 rounded-2xl border cursor-pointer transition select-none flex items-start gap-3 ${
                                            paymentPlan === 'full'
                                                ? 'bg-[#FAF8F3] border-[#1e2a1b] ring-2 ring-[#1e2a1b]'
                                                : 'bg-linen/30 border-[#e2dcd0] text-stone-600 hover:border-stone-400'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentPlan"
                                            checked={paymentPlan === 'full'}
                                            onChange={() => setPaymentPlan('full')}
                                            className="mt-1 w-4 h-4 accent-[#1e2a1b]"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-olive-deep block">
                                                Full Payment (100%)
                                            </span>
                                            <span className="text-[11px] text-olive-muted block mt-0.5">
                                                {paymentMethod === 'online' ? `Pay ₹${totalAmount} now online.` : `Pay ₹${totalAmount} total in cash.`} Complete settlement upfront.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => setPaymentPlan('half')}
                                        className={`p-4 rounded-2xl border cursor-pointer transition select-none flex items-start gap-3 ${
                                            paymentPlan === 'half'
                                                ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600'
                                                : 'bg-linen/30 border-[#e2dcd0] text-stone-600 hover:border-stone-400'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentPlan"
                                            checked={paymentPlan === 'half'}
                                            onChange={() => setPaymentPlan('half')}
                                            className="mt-1 w-4 h-4 accent-emerald-700"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-emerald-950 block">
                                                Half Payment (50% Advance)
                                            </span>
                                            <span className="text-[11px] text-emerald-800/80 block mt-0.5">
                                                {paymentMethod === 'online' ? `Pay ₹${payableAmount} advance deposit now.` : `Pay ₹${payableAmount} advance deposit in cash.`} Balance ₹{balanceDue} payable on event day.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sticky Summary Column */}
                    <div className="lg:col-span-5 xl:col-span-4 sticky top-28 space-y-5">
                        <div className="relative w-full h-52 sm:h-60 rounded-3xl overflow-hidden border border-[#e8e4d8] shadow-md bg-stone-200">
                            <ManagedImage
                                src={zoneDetails[selectedZone].image}
                                alt={zoneDetails[selectedZone].title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                                <span className="text-[10px] tracking-widest uppercase font-bold text-gold-accent">Live Room Preview</span>
                                <h3 className="font-serif text-xl font-bold">{zoneDetails[selectedZone].title}</h3>
                            </div>
                        </div>

                        {/* Rich Forest Olive Booking Summary Card */}
                        <div className="bg-[#1A281A] rounded-3xl p-6 text-[#FAF8F3] shadow-xl border border-stone-800 space-y-5">
                            <div className="border-b border-stone-700/60 pb-3">
                                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gold-accent">
                                    Booking Summary
                                </h2>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Sanctuary</span>
                                    <span className="font-serif font-bold text-sm text-white">{zoneDetails[selectedZone].title}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Date</span>
                                    <span className="font-semibold text-stone-200">{selectedDate}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Start Time</span>
                                    <span className="font-semibold text-gold-accent">{startTime || 'Not Selected'}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Duration</span>
                                    <span className="font-semibold text-stone-200">{activeDuration} Hour(s)</span>
                                </div>
                                {startTime && (
                                    <div className="flex justify-between py-0.5">
                                        <span className="tracking-widest uppercase text-stone-400">Ending Time</span>
                                        <span className="font-semibold text-stone-200">{endTimeDisplay}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Guests</span>
                                    <span className="font-semibold text-stone-200">{guests} Guests</span>
                                </div>
                                {hasDecoration && (
                                    <div className="flex justify-between py-0.5 text-gold-accent font-semibold">
                                        <span className="tracking-widest uppercase">Decoration</span>
                                        <span>+₹1,500</span>
                                    </div>
                                )}
                                {mealPlan.length > 0 && (
                                    <div className="flex justify-between py-0.5">
                                        <span className="tracking-widest uppercase text-stone-400">Meals</span>
                                        <span className="font-semibold text-stone-200 capitalize">{mealPlan.join(', ')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Payment Method</span>
                                    <span className="font-semibold text-gold-accent">
                                        {paymentMethod === 'cash' ? '💵 Cash at Venue' : '💳 Online (UPI / Card)'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="tracking-widest uppercase text-stone-400">Payment Plan</span>
                                    <span className="font-semibold text-emerald-400">
                                        {paymentPlan === 'half' ? '50% Advance' : 'Full (100%)'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-stone-700/60 pt-4 space-y-2">
                                <div className="flex justify-between text-xs text-stone-400">
                                    <span className="tracking-widest uppercase">Total Package</span>
                                    <span>₹{totalAmount}</span>
                                </div>
                                {paymentPlan === 'half' && (
                                    <div className="flex justify-between text-xs text-stone-400">
                                        <span className="tracking-widest uppercase">Remaining At Venue</span>
                                        <span>₹{balanceDue}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="text-xs tracking-widest uppercase font-bold text-gold-accent">
                                        {paymentPlan === 'half' ? 'Payable Deposit (50%)' : 'Total Amount'}
                                    </span>
                                    <span className="font-serif text-3xl font-bold text-white">₹{payableAmount}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirmBooking}
                                disabled={placingBooking || !startTime}
                                className="w-full bg-[#3C5B3E] hover:bg-[#496E4C] active:bg-[#253B27] disabled:opacity-50 text-white py-4 px-6 rounded-2xl font-bold text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition duration-200 shadow-lg group"
                            >
                                <span>
                                    {placingBooking
                                        ? 'Processing...'
                                        : paymentMethod === 'cash'
                                            ? `Confirm Booking (Pay ₹${payableAmount} in Cash)`
                                            : `Verify & Pay ₹${payableAmount} Online (${paymentPlan === 'half' ? '50% Advance' : 'Full Payment'})`
                                    }
                                </span>
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-[10px] tracking-wider text-stone-400 text-center font-light">
                                {paymentMethod === 'cash'
                                    ? '💵 Your slot will be reserved immediately. Settle in cash at the counter.'
                                    : '⚡ 100% secure transaction with Razorpay. Free cancellation 24h prior.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VenueBookingPage;
