import React, { useState } from 'react';
import { PartyPopper, Clock, Users, Coffee, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ManagedImage, mediaUrl, usePublicMedia } from '../../utils/mediaUtils';

const PartyHall1BookingPage = () => {
    const media = usePublicMedia();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        date: '',
        timeSlot: '',
        guests: 15,
        occasion: '',
        specialRequests: ''
    });

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const timeSlots = [
        "12:00 PM - 03:00 PM (Lunch)",
        "07:00 PM - 10:00 PM (Dinner)"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errorMessage) setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await axios.post('/api/reservations', {
                type: 'partyHall1',
                ...formData
            });

            if (response.data.success) {
                setSuccessMessage("Thank you! Your party hall 1 booking inquiry has been recorded. Our team will contact you to verify details and confirm the slot.");
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    date: '',
                    timeSlot: '',
                    guests: 15,
                    occasion: '',
                    specialRequests: ''
                });
            } else {
                setErrorMessage(response.data.message || "Failed to record booking inquiry.");
            }
        } catch (error) {
            console.error("Booking error:", error);
            setErrorMessage(error.response?.data?.message || "Something went wrong. Please check inputs and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6 font-[Montserrat]">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Back button */}
                <Link to="/reservations" className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider hover:opacity-85 transition">
                    <ArrowLeft size={16} /> Back to Reservations
                </Link>

                {/* Banner */}
                <div className="grid md:grid-cols-2 gap-12 items-center bg-white border border-surface-border p-8 rounded-lg soft-shadow">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-3 rounded-full text-primary">
                                <PartyPopper size={24} />
                            </div>
                            <h1 className="text-3xl font-[Playfair_Display] font-bold text-primary">Bespoke Party Hall 1</h1>
                        </div>
                        <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                            Bespoke hosting venue crafted for elegant family get-togethers, dinner events, and private birthdays. Custom catering, dynamic lighting, and sound configuration options.
                        </p>
                        <div className="space-y-3 font-[Montserrat] text-xs text-on-surface-variant font-medium">
                            <span className="flex items-center gap-2"><Clock size={16} className="text-soft-gold" /> 3-Hour Celebration Block</span>
                            <span className="flex items-center gap-2"><Users size={16} className="text-soft-gold" /> Suitable for 10 - 35 Guests</span>
                            <span className="flex items-center gap-2"><Coffee size={16} className="text-soft-gold" /> Custom buffet packages available</span>
                        </div>
                    </div>
                    <div className="w-full aspect-video rounded-lg overflow-hidden border border-surface-border">
                        <ManagedImage
                            src={mediaUrl(media, 'reservation-party-hall-1')}
                            alt="Party Hall 1" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Booking Form */}
                <div className="bg-white border border-surface-border p-8 md:p-12 rounded-lg soft-shadow">
                    <h2 className="text-2xl font-[Playfair_Display] font-semibold text-primary mb-6">Reservation Form</h2>
                    
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-6 rounded-lg mb-8 leading-relaxed font-medium">
                            {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-6 rounded-lg mb-8 font-medium">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Your Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Phone Number *</label>
                                <input 
                                    type="tel" 
                                    required 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                                    placeholder="Enter mobile number"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Email Address *</label>
                                <input 
                                    type="email" 
                                    required 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Guests Count *</label>
                                <select 
                                    name="guests"
                                    value={formData.guests}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                >
                                    {[10, 15, 20, 25, 30, 35].map(g => (
                                        <option key={g} value={g}>{g} Guests</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Target Date *</label>
                                <input 
                                    type="date" 
                                    required 
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-on-surface-variant" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Preferred Slot *</label>
                                <select 
                                    required
                                    name="timeSlot"
                                    value={formData.timeSlot}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                                >
                                    <option value="">Select time slot</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Occasion (Optional)</label>
                                <input 
                                    type="text" 
                                    name="occasion"
                                    value={formData.occasion}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                                    placeholder="e.g. Birthday, Reunion"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Special Requests (Optional)</label>
                                <input 
                                    type="text" 
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                                    placeholder="e.g. Theme decoration details"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full btn-stitch-primary py-4 text-xs font-bold uppercase tracking-wider"
                        >
                            {loading ? 'Submitting Reservation...' : 'Request Slot Booking'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default PartyHall1BookingPage;
