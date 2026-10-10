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
                    <h1 className="text-3xl font-bold font-serif text-oliv-green dark:text-soft-gold">Reservations Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Review and manage slot bookings for private theatre, halls, and inquiries.</p>
                </div>
                <button 
                    onClick={fetchReservations}
                    className="px-4 py-2 bg-oliv-green text-white text-sm font-semibold rounded-lg hover:bg-primary transition"
                >
                    Refresh List
                </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors shadow-xs">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status Filter</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-700 dark:text-white focus:outline-none"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Space Type Filter</label>
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-700 dark:text-white focus:outline-none"
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
                <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            ) : filteredReservations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-55 text-gray-300" />
                    <p className="text-lg">No reservations matching your filter options were found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredReservations.map((res) => (
                        <div 
                            key={res._id}
                            className={`p-6 bg-white dark:bg-gray-800 border rounded-xl shadow-xs transition duration-300 ${
                                res.status === 'confirmed' ? 'border-l-4 border-l-green-500 border-gray-200 dark:border-gray-700' :
                                res.status === 'cancelled' ? 'border-l-4 border-l-red-500 border-gray-200 dark:border-gray-700' :
                                'border-l-4 border-l-orange-500 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-600/30">
                                    {getSpaceIcon(res.type)}
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{getSpaceLabel(res.type)}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                    res.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    res.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                    {res.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-2">{res.name}</h3>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300 mb-4 font-medium">
                                <span className="flex items-center gap-1.5"><Phone size={14} /> {res.phone}</span>
                                <span className="flex items-center gap-1.5 className='truncate'"><Mail size={14} /> {res.email}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {res.date}</span>
                                <span className="flex items-center gap-1.5"><Clock size={14} /> {res.startTime} ({res.duration}h)</span>
                                <span className="flex items-center gap-1.5"><Users size={14} /> {res.guests} Guests</span>
                                <span className="font-bold text-orange-600 dark:text-orange-500">₹{res.totalAmount} ({res.paymentStatus})</span>
                                {res.occasion && <span className="truncate col-span-2">🎉 {res.occasion}</span>}
                            </div>

                            {res.specialRequests && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700/60 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-300 italic mb-4 leading-relaxed">
                                    " {res.specialRequests} "
                                </div>
                            )}

                            {res.status === 'pending' && (
                                <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <button 
                                        onClick={() => updateStatus(res._id, 'confirmed')}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase rounded-lg transition"
                                    >
                                        <Check size={14} /> Confirm
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(res._id, 'cancelled')}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-lg transition"
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
