import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, SearchX, CheckCircle2 } from 'lucide-react';

const getSpaceLabel = (type) => {
    switch (type) {
        case 'theatre': return 'Private Mini Theatre';
        case 'partyHall1': return 'Bespoke Party Hall 1';
        case 'partyHall2': return 'Bespoke Party Hall 2';
        default: return 'Premium Sanctuary Zone';
    }
};

const getEndTime = (start, dur) => {
    if (!start) return '';
    let [time, period] = start.split(' ');
    let [hour] = time.split(':');
    let h = parseInt(hour, 10);

    if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period?.toUpperCase() === 'AM' && h === 12) h = 0;

    let newH = h + dur;
    let newPeriod = newH >= 12 ? 'PM' : 'AM';
    if (newH > 12) newH -= 12;
    if (newH === 0) newH = 12;

    return `${String(newH).padStart(2, '0')}:00 ${newPeriod}`;
};

const ReservationLookup = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedCode = code.trim();
        if (!trimmedCode) {
            setError('Enter your reservation code to search.');
            setResult(null);
            setNotFound(false);
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setNotFound(false);

        try {
            const response = await axios.get('/api/reservations/lookup', { params: { code: trimmedCode } });
            setResult(response.data.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setNotFound(true);
            } else {
                setError(err.response?.data?.message || 'Something went wrong while searching. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white border border-surface-border p-8 md:p-12 rounded-lg soft-shadow space-y-6 mb-16">
            <div className="text-center space-y-2">
                <Search className="mx-auto text-soft-gold" size={36} />
                <h3 className="text-2xl font-[Playfair_Display] font-bold text-primary">Find Your Reservation</h3>
                <p className="text-on-surface-variant text-sm font-light leading-relaxed max-w-xl mx-auto">
                    Look up a confirmed booking using your reservation code.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 text-sm max-w-xl mx-auto">
                <div className="flex-1">
                    <label htmlFor="lookup-code" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                        Reservation Code
                    </label>
                    <input
                        id="lookup-code"
                        type="text"
                        name="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter your reservation code"
                        className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-stitch-primary py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed sm:self-end sm:mb-0.5"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={14} />}
                    {loading ? 'Searching...' : 'Find'}
                </button>
            </form>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            {notFound && (
                <div className="p-6 bg-surface-container-low border border-surface-border rounded-lg text-center space-y-2">
                    <SearchX className="mx-auto text-soft-gold/70" size={28} />
                    <p className="text-sm font-semibold text-primary">No reservation found</p>
                    <p className="text-xs text-on-surface-variant">Double-check your details, or contact us if you believe this is a mistake.</p>
                </div>
            )}

            {result && (
                <div className="border border-primary/20 bg-primary/5 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <CheckCircle2 size={18} /> Reservation Found
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-xs text-on-surface-variant">
                        <div className="flex justify-between border-b border-surface-border pb-2 sm:col-span-2">
                            <span>Reservation Code</span>
                            <span className="font-semibold text-primary">{result._id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Name</span>
                            <span className="font-semibold text-primary">{result.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Mobile Number</span>
                            <span className="font-semibold text-primary">{result.phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Venue</span>
                            <span className="font-semibold text-primary">{getSpaceLabel(result.type)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Party Size</span>
                            <span className="font-semibold text-primary">{result.guests} Guests</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date</span>
                            <span className="font-semibold text-primary">{result.date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Time</span>
                            <span className="font-semibold text-primary">{result.startTime} - {getEndTime(result.startTime, result.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Amount Paid</span>
                            <span className="font-semibold text-primary">₹{result.totalAmount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Status</span>
                            <span className="font-semibold text-green-600 uppercase tracking-wider text-[10px]">{result.status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationLookup;
