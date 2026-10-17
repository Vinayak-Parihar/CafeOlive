import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    MessageSquare, Phone, Mail, Calendar, Tag,
    CheckCircle, Clock, AlertCircle, Trash2, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG = {
    new: {
        label: 'New',
        color: 'bg-[#eef2f6] text-[#2c4766] border border-[#d3dfed]',
        border: 'border-l-[#2c4766]',
        Icon: AlertCircle,
    },
    in_progress: {
        label: 'In Progress',
        color: 'bg-[#fef7ea] text-[#935a16] border border-[#f5dfb8]',
        border: 'border-l-[#c2a677]',
        Icon: Clock,
    },
    resolved: {
        label: 'Resolved',
        color: 'bg-[#eaf3e8] text-[#245220] border border-[#cbe4c7]',
        border: 'border-l-[#2d5a27]',
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
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Guest Relations</span>
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight">
                        Reservation Inquiries
                    </h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        Customer pre-booking requests and inquiries submitted through the atelier website.
                    </p>
                </div>
                <button
                    onClick={fetchInquiries}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition duration-200"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Status summary tabs */}
            <div className="flex flex-wrap gap-2.5 p-2 bg-white rounded-2xl border border-[#e8e2d5] w-fit shadow-xs">
                {[
                    { key: 'all', label: 'All Inquiries' },
                    { key: 'new', label: 'New' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'resolved', label: 'Resolved' },
                ].map(({ key, label }) => {
                    const active = statusFilter === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition duration-200 ${
                                active
                                    ? 'bg-[#1e2a1b] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-[#1e2a1b] hover:bg-black/5'
                            }`}
                        >
                            {label} ({counts[key]})
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-[#e8e2d5]">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1e2a1b]" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#e8e2d5] text-stone-500">
                    <MessageSquare size={44} className="mx-auto mb-3 opacity-30 text-stone-400" />
                    <p className="text-base font-serif">No inquiries found matching this status.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filtered.map(inq => {
                        const cfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                        const { Icon } = cfg;
                        return (
                            <div
                                key={inq._id}
                                className={`p-6 bg-white border border-[#e8e2d5] border-l-4 ${cfg.border} rounded-2xl shadow-xs transition duration-200`}
                            >
                                {/* Top row: type badge + status badge */}
                                <div className="flex justify-between items-start mb-4 gap-2">
                                    <div className="flex items-center gap-2 bg-[#f6f4ee] px-3 py-1 rounded-full border border-[#ece7dc]">
                                        <Tag size={12} className="text-[#c2a677]" />
                                        <span className="text-xs font-semibold text-[#1e2a1b] truncate max-w-[160px]">
                                            {inq.inquiryType}
                                        </span>
                                    </div>
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.color}`}>
                                        <Icon size={11} />
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Name */}
                                <h3 className="text-xl font-bold font-serif text-[#1e2a1b] mb-3">
                                    {inq.name}
                                </h3>

                                {/* Contact info row */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mb-3 font-medium">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <Phone size={13} className="flex-none text-[#c2a677]" /> {inq.phone}
                                    </span>
                                    {inq.email && (
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Mail size={13} className="flex-none text-[#c2a677]" /> {inq.email}
                                        </span>
                                    )}
                                    {inq.preferredDate && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={13} className="flex-none text-[#c2a677]" /> {inq.preferredDate}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-stone-400">
                                        <Clock size={13} className="flex-none" />
                                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Message */}
                                <div className="bg-[#FAF8F3] border border-[#ece7dc] p-3.5 rounded-xl text-xs text-stone-700 leading-relaxed mb-4 italic">
                                    "{inq.message}"
                                </div>

                                {/* Action row */}
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#ece7dc]">
                                    {/* Status transitions */}
                                    {inq.status !== 'in_progress' && (
                                        <button
                                            onClick={() => updateStatus(inq._id, 'in_progress')}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#fef7ea] hover:bg-[#faeed6] text-[#935a16] border border-[#f5dfb8] text-[11px] font-semibold uppercase tracking-wider rounded-xl transition duration-200"
                                        >
                                            <Clock size={12} /> In Progress
                                        </button>
                                    )}
                                    {inq.status !== 'resolved' && (
                                        <button
                                            onClick={() => updateStatus(inq._id, 'resolved')}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#eaf3e8] hover:bg-[#d8edd4] text-[#245220] border border-[#cbe4c7] text-[11px] font-semibold uppercase tracking-wider rounded-xl transition duration-200"
                                        >
                                            <CheckCircle size={12} /> Resolve
                                        </button>
                                    )}
                                    {/* Contact shortcuts */}
                                    <a
                                        href={`tel:${inq.phone}`}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#1e2a1b] text-[11px] font-semibold rounded-xl transition"
                                        title="Call customer"
                                    >
                                        <Phone size={13} />
                                    </a>
                                    {inq.email && (
                                        <a
                                            href={`mailto:${inq.email}`}
                                            className="flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#1e2a1b] text-[11px] font-semibold rounded-xl transition"
                                            title="Email customer"
                                        >
                                            <Mail size={13} />
                                        </a>
                                    )}
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(inq._id)}
                                        disabled={deletingId === inq._id}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-[#fdeeed] hover:bg-[#fad8d8] text-[#9a2c2c] text-[11px] font-semibold rounded-xl transition disabled:opacity-50"
                                        title="Delete inquiry"
                                    >
                                        <Trash2 size={13} />
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
