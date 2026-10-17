import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Calendar, ArrowRight, MapPin, Printer } from 'lucide-react';
import { ManagedImage, mediaUrl, usePublicMedia } from '../../utils/mediaUtils';

const ReservationConfirmationPage = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const media = usePublicMedia();

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                // Get all reservations and find matching ID
                const res = await axios.get('/api/reservations');
                if (res.data.success) {
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
            case 'partyHall2': return 'Bespoke Party Hall 2';
            default: return 'Premium Sanctuary Zone';
        }
    };

    const getEndTime = (start, dur) => {
        if (!start) return '';
        let [time, period] = start.split(' ');
        let [hour] = time.split(':');
        let h = parseInt(hour, 10);

        // Convert to 24-hour
        if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
        if (period?.toUpperCase() === 'AM' && h === 12) h = 0;

        let newH = h + dur;

        // Convert back to 12-hour
        let newPeriod = newH >= 12 ? 'PM' : 'AM';
        if (newH > 12) newH -= 12;
        if (newH === 0) newH = 12;

        return `${String(newH).padStart(2, '0')}:00 ${newPeriod}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-transparent pt-32 pb-24 px-6 text-center font-[Montserrat]">
                <h1 className="text-3xl font-bold font-[Playfair_Display] text-primary">Sanctuary Reservation Not Found</h1>
                <p className="text-on-surface-variant mt-4 font-light">The reservation code supplied is invalid or could not be located.</p>
                <Link to="/reservations/booking" className="btn-stitch-primary mt-8 inline-block">Book A Sanctuary</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-[Montserrat]">
            {/* Success Hero Section */}
            <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-6 py-16">
                
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <ManagedImage
                        src={mediaUrl(media, 'reservation-confirmation')}
                        alt="Confirmation Background" 
                        className="w-full h-full object-cover brightness-[0.3]" 
                    />
                    <div className="absolute inset-0 bg-primary/20"></div>
                </div>

                {/* Content Card */}
                <div className="relative z-10 w-full max-w-4xl mx-auto">
                    <div className="glass-panel p-8 md:p-16 rounded-lg shadow-2xl border border-white/20 flex flex-col items-center text-center">
                        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white">
                            <CheckCircle size={36} className="text-soft-gold" />
                        </div>
                        <h1 className="font-[Playfair_Display] text-4xl md:text-5xl text-primary font-bold mb-4">Your Sanctuary Awaits.</h1>
                        <p className="font-body-lg text-on-surface-variant max-w-xl mb-12 text-sm leading-relaxed">
                            Your reservation at Olive Café is confirmed. A chef is preparing an exceptional organic culinary journey tailored just for you.
                        </p>

                        {/* Reservation Details Grid */}
                        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-surface-border mb-12">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">DATE</span>
                                <span className="font-[Playfair_Display] text-xl font-bold text-primary">{booking.date}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">TIME WINDOW</span>
                                <span className="font-[Playfair_Display] text-xl font-bold text-primary truncate max-w-[160px]">{booking.startTime}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">SANCTUARY</span>
                                <span className="font-[Playfair_Display] text-xl font-bold text-primary">{booking.type === 'theatre' ? 'Theatre' : 'Party Hall'}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">PARTY</span>
                                <span className="font-[Playfair_Display] text-xl font-bold text-primary">{booking.guests} Guests</span>
                            </div>
                        </div>

                        {/* Booking Summary metadata */}
                        <div className="w-full max-w-md bg-surface-container/50 border border-surface-border p-6 rounded-lg text-left text-xs space-y-3 mb-10 text-on-surface-variant">
                            <div className="flex justify-between font-semibold text-primary text-sm border-b border-surface-border pb-2 mb-2">
                                <span>Reservation Code:</span>
                                <span>{booking._id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Venue Selected:</span>
                                <span>{getSpaceLabel(booking.type)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Hours Booked:</span>
                                <span>{booking.startTime} to {getEndTime(booking.startTime, booking.duration)} ({booking.duration} Hours)</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Customer Name:</span>
                                <span>{booking.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment Amount:</span>
                                <span>₹{booking.totalAmount}</span>
                            </div>
                            <div className="flex justify-between font-bold text-primary">
                                <span>Transaction Status:</span>
                                <span className="text-green-600 uppercase tracking-widest text-[10px]">{booking.paymentStatus}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <button 
                                onClick={() => window.print()}
                                className="bg-primary text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:brightness-115 transition"
                            >
                                <Printer size={16} /> Print Receipt
                            </button>
                            <Link 
                                to="/" 
                                className="text-xs font-bold uppercase tracking-wider text-primary hover:text-soft-gold flex items-center gap-1.5 transition"
                            >
                                Return Home <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ReservationConfirmationPage;
