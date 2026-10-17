import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Film, PartyPopper, HelpCircle, Check, X, Clock, Users, Phone, Mail } from 'lucide-react';

const ReservationsAdmin = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reservations');
            if (response.data.success) {
                setReservations(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            const response = await axios.patch(`/api/reservations/${id}/status`, { status: newStatus });
            if (response.data.success) {
                setReservations(prev => prev.map(res => res._id === id ? { ...res, status: newStatus } : res));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status: " + (error.response?.data?.message || "Unknown error"));
        }
    };

    const getSpaceIcon = (type) => {
        switch (type) {
            case 'theatre': return <Film size={18} className="text-orange-500" />;
            case 'partyHall1':
            case 'partyHall2': return <PartyPopper size={18} className="text-purple-500" />;
            default: return <HelpCircle size={18} className="text-blue-500" />;
        }
    };

    const getSpaceLabel = (type) => {
        switch (type) {
            case 'theatre': return 'Private Mini Theatre';
            case 'partyHall1': return 'Party Hall 1';
            case 'partyHall2': return 'Party Hall 2';
            case 'inquiry': return 'Custom Inquiry';
            default: return 'General';
        }
    };

    const filteredReservations = reservations.filter(res => {
        const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
        const matchesType = typeFilter === 'all' || res.type === typeFilter;
        return matchesStatus && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Venue Sanctuary</span>
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight">Reservations Dashboard</h1>
                    <p className="text-stone-500 text-sm mt-0.5">Review and manage bookings for the private mini theatre, celebration halls, and bespoke inquiries.</p>
                </div>
                <button 
                    onClick={fetchReservations}
                    className="px-5 py-2.5 bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition duration-200"
                >
                    Refresh List
                </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 p-5 bg-white rounded-2xl border border-[#e8e2d5] shadow-xs">
                <div>
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Status Filter</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl px-3.5 py-2 text-xs font-medium text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Space Type Filter</label>
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl px-3.5 py-2 text-xs font-medium text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                    >
                        <option value="all">All spaces</option>
                        <option value="theatre">Mini Theatre</option>
                        <option value="partyHall1">Party Hall 1</option>
                        <option value="partyHall2">Party Hall 2</option>
                        <option value="inquiry">Custom Inquiry</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-[#e8e2d5]">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1e2a1b]"></div>
                </div>
            ) : filteredReservations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#e8e2d5] text-stone-500">
                    <Calendar size={44} className="mx-auto mb-3 opacity-40 text-stone-400" />
                    <p className="text-base font-serif">No reservations found matching your selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredReservations.map((res) => (
                        <div 
                            key={res._id}
                            className={`p-6 bg-white border rounded-2xl shadow-xs transition duration-200 ${
                                res.status === 'confirmed' ? 'border-[#c4dec0] border-l-4 border-l-[#2d5a27]' :
                                res.status === 'cancelled' ? 'border-[#f7cdcd] border-l-4 border-l-[#9b2c2c]' :
                                'border-[#f5dfb8] border-l-4 border-l-[#c2a677]'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 bg-[#f6f4ee] px-3 py-1 rounded-full border border-[#ece7dc]">
                                    {getSpaceIcon(res.type)}
                                    <span className="text-xs font-semibold text-[#1e2a1b]">{getSpaceLabel(res.type)}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                    res.status === 'confirmed' ? 'bg-[#eaf3e8] text-[#245220] border-[#cbe4c7]' :
                                    res.status === 'cancelled' ? 'bg-[#fdeeed] text-[#9a2c2c] border-[#f7cdcd]' :
                                    'bg-[#fef7ea] text-[#935a16] border-[#f5dfb8]'
                                }`}>
                                    {res.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold font-serif text-[#1e2a1b] mb-2">{res.name}</h3>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 mb-4 font-medium">
                                <span className="flex items-center gap-1.5"><Phone size={13} className="text-[#c2a677]" /> {res.phone}</span>
                                <span className="flex items-center gap-1.5 truncate"><Mail size={13} className="text-[#c2a677]" /> {res.email}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={13} className="text-[#c2a677]" /> {res.date}</span>
                                <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#c2a677]" /> {res.startTime} ({res.duration}h)</span>
                                <span className="flex items-center gap-1.5"><Users size={13} className="text-[#c2a677]" /> {res.guests} Guests</span>
                                <span className="font-bold text-[#1e2a1b]">₹{res.totalAmount} <span className="text-[10px] uppercase font-normal text-stone-400">({res.paymentStatus})</span></span>
                                {res.occasion && <span className="truncate col-span-2 text-stone-700">✨ {res.occasion}</span>}
                            </div>

                            {res.specialRequests && (
                                <div className="bg-[#FAF8F3] border border-[#ece7dc] p-3 rounded-xl text-xs text-stone-600 italic mb-4 leading-relaxed">
                                    "{res.specialRequests}"
                                </div>
                            )}

                            {res.status === 'pending' && (
                                <div className="flex gap-3 pt-3 border-t border-[#ece7dc]">
                                    <button 
                                        onClick={() => updateStatus(res._id, 'confirmed')}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2d5a27] hover:bg-[#23471f] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition duration-200"
                                    >
                                        <Check size={14} /> Confirm
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(res._id, 'cancelled')}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 hover:bg-[#fdeeed] text-stone-700 hover:text-[#9a2c2c] border border-stone-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition duration-200"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReservationsAdmin;
