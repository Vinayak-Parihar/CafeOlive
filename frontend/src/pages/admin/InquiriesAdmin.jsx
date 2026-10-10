import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    MessageSquare, Phone, Mail, Calendar, Tag,
    CheckCircle, Clock, AlertCircle, Trash2, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG = {
    new: {
        label: 'New',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        border: 'border-l-blue-500',
        Icon: AlertCircle,
    },
    in_progress: {
        label: 'In Progress',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        border: 'border-l-orange-500',
        Icon: Clock,
    },
    resolved: {
        label: 'Resolved',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        border: 'border-l-green-500',
        Icon: CheckCircle,
    },
};

const InquiriesAdmin = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/inquiries');
            if (res.data.success) setInquiries(res.data.data);
        } catch (err) {
            console.error('Failed to fetch inquiries:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const res = await axios.patch(`/api/inquiries/${id}/status`, { status });
            if (res.data.success) {
                setInquiries(prev =>
                    prev.map(inq => inq._id === id ? { ...inq, status } : inq)
                );
            }
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.message || 'Error'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this inquiry? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/inquiries/${id}`);
            setInquiries(prev => prev.filter(inq => inq._id !== id));
        } catch (err) {
            alert('Failed to delete inquiry: ' + (err.response?.data?.message || 'Error'));
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = inquiries.filter(
        inq => statusFilter === 'all' || inq.status === statusFilter
    );

    const counts = {
        all: inquiries.length,
        new: inquiries.filter(i => i.status === 'new').length,
        in_progress: inquiries.filter(i => i.status === 'in_progress').length,
        resolved: inquiries.filter(i => i.status === 'resolved').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-oliv-green dark:text-soft-gold">
                        Reservation Inquiries
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Customer pre-booking inquiries submitted through the website.
                    </p>
                </div>
                <button
                    onClick={fetchInquiries}
                    className="flex items-center gap-2 px-4 py-2 bg-oliv-green text-white text-sm font-semibold rounded-lg hover:bg-primary transition"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Status summary tabs */}
            <div className="flex flex-wrap gap-3">
                {[
                    { key: 'all', label: 'All', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' },
                    { key: 'new', label: 'New', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                    { key: 'in_progress', label: 'In Progress', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
                    { key: 'resolved', label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                ].map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition border-2 ${
                            statusFilter === key
                                ? 'border-orange-500 ' + color
                                : 'border-transparent ' + color + ' opacity-70 hover:opacity-100'
                        }`}
                    >
                        {label} ({counts[key]})
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No inquiries found for this filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filtered.map(inq => {
                        const cfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                        const { Icon } = cfg;
                        return (
                            <div
                                key={inq._id}
                                className={`p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${cfg.border} rounded-xl shadow-xs transition duration-300`}
                            >
                                {/* Top row: type badge + status badge */}
                                <div className="flex justify-between items-start mb-4 gap-2">
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                        <Tag size={13} className="text-orange-500" />
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                                            {inq.inquiryType}
                                        </span>
                                    </div>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md whitespace-nowrap ${cfg.color}`}>
                                        <Icon size={11} />
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Name */}
                                <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-3">
                                    {inq.name}
                                </h3>

                                {/* Contact info row */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 mb-3 font-medium">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <Phone size={13} className="flex-none text-gray-400" /> {inq.phone}
                                    </span>
                                    {inq.email && (
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Mail size={13} className="flex-none text-gray-400" /> {inq.email}
                                        </span>
                                    )}
                                    {inq.preferredDate && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={13} className="flex-none text-gray-400" /> {inq.preferredDate}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-gray-400">
                                        <Clock size={13} className="flex-none" />
                                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Message */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700/60 p-3 rounded-lg text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4 italic">
                                    "{inq.message}"
                                </div>

                                {/* Action row */}
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    {/* Status transitions */}
                                    {inq.status !== 'in_progress' && (
                                        <button
                                            onClick={() => updateStatus(inq._id, 'in_progress')}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 text-[11px] font-bold uppercase rounded-lg transition"
                                        >
                                            <Clock size={12} /> In Progress
                                        </button>
                                    )}
                                    {inq.status !== 'resolved' && (
                                        <button
                                            onClick={() => updateStatus(inq._id, 'resolved')}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 text-[11px] font-bold uppercase rounded-lg transition"
                                        >
                                            <CheckCircle size={12} /> Resolve
                                        </button>
                                    )}
                                    {/* Contact shortcuts */}
                                    <a
                                        href={`tel:${inq.phone}`}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase rounded-lg transition"
                                        title="Call customer"
                                    >
                                        <Phone size={12} />
                                    </a>
                                    {inq.email && (
                                        <a
                                            href={`mailto:${inq.email}`}
                                            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase rounded-lg transition"
                                            title="Email customer"
                                        >
                                            <Mail size={12} />
                                        </a>
                                    )}
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(inq._id)}
                                        disabled={deletingId === inq._id}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase rounded-lg transition disabled:opacity-50"
                                        title="Delete inquiry"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InquiriesAdmin;
