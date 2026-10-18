import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Receipt, Banknote, CreditCard, RefreshCw, CheckCircle2,
    Search, Printer, Phone, Clock, ChevronDown, ChevronUp,
    Utensils, AlertCircle, Sparkles, QrCode, X, ArrowRight, MessageSquareShare, Calendar, Download, FileText
} from 'lucide-react';
import { sendWhatsAppReceipt, sendPdfBillToWhatsApp, downloadBillPdf } from '../../utils/whatsappReceipt';

const CashierBillingPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // 'active', 'cash', 'online', 'settled'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCards, setExpandedCards] = useState({});
    
    // Settlement Modals
    const [settleModal, setSettleModal] = useState({ open: false, session: null, method: 'Cash' });
    const [cashReceived, setCashReceived] = useState('');
    const [isSettling, setIsSettling] = useState(false);

    // Print Receipt Modal
    const [printModal, setPrintModal] = useState({ open: false, session: null });
    const receiptRef = useRef(null);

    const fetchBillingSessions = async () => {
        try {
            const res = await axios.get('/api/order/billing/sessions');
            if (res.data?.success) {
                setSessions(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to load cashier billing sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingSessions();
        const interval = setInterval(fetchBillingSessions, 4000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpand = (id) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filtered Sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            const isPaid = session.paymentStatus === 'paid';
            const isCash = session.paymentMethod === 'Cash' && !isPaid;
            const isOnline = session.paymentMethod !== 'Cash' && !isPaid;

            if (filter === 'active' && isPaid) return false;
            if (filter === 'cash' && !isCash) return false;
            if (filter === 'online' && !isOnline) return false;
            if (filter === 'settled' && !isPaid) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const tableMatch = String(session.tableNumber).toLowerCase().includes(q);
                const nameMatch = String(session.customerName).toLowerCase().includes(q);
                const phoneMatch = String(session.customerPhone).toLowerCase().includes(q);
                const itemMatch = session.items?.some(it => String(it.name).toLowerCase().includes(q));
                return tableMatch || nameMatch || phoneMatch || itemMatch;
            }
            return true;
        });
    }, [sessions, filter, searchQuery]);

    // Fast Counters
    const activeCount = sessions.filter(s => s.paymentStatus !== 'paid').length;
    const cashCount = sessions.filter(s => s.paymentMethod === 'Cash' && s.paymentStatus !== 'paid').length;
    const onlineCount = sessions.filter(s => s.paymentMethod !== 'Cash' && s.paymentStatus !== 'paid').length;
    const settledCount = sessions.filter(s => s.paymentStatus === 'paid').length;

    const totalUnpaidAmount = sessions
        .filter(s => s.paymentStatus !== 'paid')
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const totalCashAmount = sessions
        .filter(s => s.paymentMethod === 'Cash' && s.paymentStatus !== 'paid')
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const totalSettledTodayAmount = sessions
        .filter(s => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    // Open Settle Modal
    const handleOpenSettle = (session, method) => {
        setSettleModal({ open: true, session, method });
        setCashReceived(String(session.grandTotal || ''));
    };

    // Execute Settlement
    const handleConfirmSettle = async () => {
        const { session, method } = settleModal;
        if (!session) return;

        setIsSettling(true);
        try {
            if (session.billSessionId) {
                await axios.post(`/api/order/bill/${session.billSessionId}/settle`, {
                    paymentMethod: method
                });
            } else if (session.primaryOrderId) {
                await axios.patch(`/api/order/status/${session.primaryOrderId}`, {
                    status: 'completed',
                    paymentStatus: 'paid',
                    paymentMethod: method
                });
            }
            toast.success(`Payment settled as ${method} for Table #${session.tableNumber}`);
            if (session.customerPhone) {
                handleSendPdfWhatsApp({
                    ...session,
                    paymentMethod: method,
                    paymentStatus: 'paid'
                });
            }
            setSettleModal({ open: false, session: null, method: 'Cash' });
            fetchBillingSessions();
        } catch (error) {
            console.error("Settlement failed:", error);
            toast.error("Failed to settle bill payment");
        } finally {
            setIsSettling(false);
        }
    };

    // Print Handler
    const handlePrint = (session) => {
        setPrintModal({ open: true, session });
    };

    const triggerBrowserPrint = () => {
        window.print();
    };

    // WhatsApp PDF & Download handlers
    const handleSendPdfWhatsApp = async (session) => {
        if (!session) return;
        try {
            const res = await sendPdfBillToWhatsApp({
                customerPhone: session.customerPhone,
                customerName: session.customerName,
                tableNumber: session.tableNumber,
                items: session.items,
                totalAmount: session.grandTotal,
                paymentMethod: session.paymentMethod || 'Cash',
                paymentStatus: session.paymentStatus || 'pending',
                billSessionId: session.billSessionId || session._id || ''
            });
            if (res.aborted) return;
            if (res.method === 'share') {
                toast.success(`PDF Bill shared for Table #${session.tableNumber}!`);
            } else {
                toast.success(`PDF Bill downloaded & WhatsApp opened for Table #${session.tableNumber}!`);
            }
        } catch (err) {
            console.error("PDF WhatsApp share error:", err);
            sendWhatsAppReceipt({
                customerPhone: session.customerPhone,
                customerName: session.customerName,
                tableNumber: session.tableNumber,
                items: session.items,
                totalAmount: session.grandTotal,
                paymentMethod: session.paymentMethod || 'Cash',
                paymentStatus: session.paymentStatus || 'pending'
            });
            toast.success("Opening WhatsApp bill!");
        }
    };

    const handleDownloadPdfBill = (session) => {
        if (!session) return;
        downloadBillPdf({
            customerPhone: session.customerPhone,
            customerName: session.customerName,
            tableNumber: session.tableNumber,
            items: session.items,
            totalAmount: session.grandTotal,
            paymentMethod: session.paymentMethod || 'Cash',
            paymentStatus: session.paymentStatus || 'pending',
            billSessionId: session.billSessionId || session._id || ''
        });
        toast.success(`Downloaded PDF Bill for Table #${session.tableNumber}!`);
    };

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center text-stone-500 text-sm">
                <RefreshCw size={22} className="animate-spin mr-2.5 text-[#1e2a1b]" />
                Scanning active dining tables & bills...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#ece7dc]">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ee] text-[#c2a677] text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">
                        <Sparkles size={12} />
                        Billing Counter
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b]">
                        Cashier & Billing Desk
                    </h1>
                    <p className="text-xs text-stone-500 font-light mt-1">
                        Consolidated dining receipts, itemized order tracking, and table settlement.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchBillingSessions}
                        className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F3] px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition text-[#1e2a1b] border border-[#d8d3c5] shadow-xs"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar - Interactive Filter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 1. Active Open Tables Card */}
                <button
                    type="button"
                    onClick={() => setFilter('active')}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs ${
                        filter === 'active'
                            ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900 shadow-md scale-[1.01]'
                            : 'bg-white border-[#e8e2d5] hover:border-[#1e2a1b]/40 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                                filter === 'active' ? 'text-stone-300' : 'text-stone-400'
                            }`}>
                                Active Open Tables
                            </span>
                            {filter === 'active' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-700 text-stone-200 font-bold uppercase tracking-wider">
                                    Selected
                                </span>
                            )}
                        </div>
                        <span className={`text-3xl font-serif font-bold block mt-1 ${
                            filter === 'active' ? 'text-white' : 'text-[#1e2a1b]'
                        }`}>
                            {activeCount}
                        </span>
                        <span className={`text-[11px] mt-0.5 block ${
                            filter === 'active' ? 'text-stone-300' : 'text-stone-500'
                        }`}>
                            ₹{totalUnpaidAmount.toLocaleString()} to collect • Tap to view
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        filter === 'active'
                            ? 'bg-stone-800 border-stone-700 text-[#c2a677]'
                            : 'bg-[#FAF8F3] border-[#e8e2d5] text-[#1e2a1b]'
                    }`}>
                        <Receipt size={24} className="text-[#c2a677]" />
                    </div>
                </button>

                {/* 2. Cash To Collect Card */}
                <button
                    type="button"
                    onClick={() => setFilter('cash')}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs ${
                        filter === 'cash'
                            ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500 shadow-md scale-[1.01]'
                            : 'bg-[#fef9ee] border-amber-300 hover:border-amber-400 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                                filter === 'cash' ? 'text-amber-100' : 'text-amber-800'
                            }`}>
                                Cash To Collect
                            </span>
                            {filter === 'cash' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-800 text-amber-100 font-bold uppercase tracking-wider">
                                    Selected
                                </span>
                            )}
                        </div>
                        <span className={`text-3xl font-serif font-bold block mt-1 ${
                            filter === 'cash' ? 'text-white' : 'text-amber-950'
                        }`}>
                            {cashCount}
                        </span>
                        <span className={`text-[11px] font-medium mt-0.5 block ${
                            filter === 'cash' ? 'text-amber-100' : 'text-amber-800'
                        }`}>
                            ₹{totalCashAmount.toLocaleString()} in cash • Tap to view
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        filter === 'cash'
                            ? 'bg-amber-700 border-amber-500 text-white'
                            : 'bg-amber-100/80 border-amber-300 text-amber-900'
                    }`}>
                        <Banknote size={24} className={filter === 'cash' ? 'text-white' : 'text-amber-700'} />
                    </div>
                </button>

                {/* 3. Settled Today Card */}
                <button
                    type="button"
                    onClick={() => setFilter('settled')}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs ${
                        filter === 'settled'
                            ? 'bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-600 shadow-md scale-[1.01]'
                            : 'bg-[#f4faf2] border-emerald-300 hover:border-emerald-400 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                                filter === 'settled' ? 'text-emerald-100' : 'text-emerald-800'
                            }`}>
                                Settled Today (Paid)
                            </span>
                            {filter === 'settled' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-200 font-bold uppercase tracking-wider">
                                    Showing
                                </span>
                            )}
                        </div>
                        <span className={`text-3xl font-serif font-bold block mt-1 ${
                            filter === 'settled' ? 'text-white' : 'text-emerald-950'
                        }`}>
                            ₹{totalSettledTodayAmount.toLocaleString()}
                        </span>
                        <span className={`text-[11px] font-medium mt-0.5 block ${
                            filter === 'settled' ? 'text-emerald-200' : 'text-emerald-700'
                        }`}>
                            {settledCount} tables cleared • Tap to view list
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        filter === 'settled'
                            ? 'bg-emerald-900 border-emerald-700 text-white'
                            : 'bg-emerald-100/80 border-emerald-300 text-emerald-900'
                    }`}>
                        <CheckCircle2 size={24} className={filter === 'settled' ? 'text-white' : 'text-emerald-700'} />
                    </div>
                </button>

                {/* 4. Total Bills / All Orders Card */}
                <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs sm:col-span-3 lg:col-span-1 ${
                        filter === 'all'
                            ? 'bg-[#1e2a1b] text-white border-[#1e2a1b] ring-2 ring-[#1e2a1b] shadow-md scale-[1.01]'
                            : 'bg-white border-[#e8e2d5] hover:border-[#1e2a1b]/40 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                                filter === 'all' ? 'text-stone-300' : 'text-stone-500'
                            }`}>
                                Total Bills / Orders
                            </span>
                            {filter === 'all' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-700 text-stone-200 font-bold uppercase tracking-wider">
                                    All
                                </span>
                            )}
                        </div>
                        <span className={`text-3xl font-serif font-bold block mt-1 ${
                            filter === 'all' ? 'text-white' : 'text-[#1e2a1b]'
                        }`}>
                            {sessions.length}
                        </span>
                        <span className={`text-[11px] mt-0.5 block ${
                            filter === 'all' ? 'text-stone-300' : 'text-stone-500'
                        }`}>
                            Active & Settled • Tap to view all
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        filter === 'all'
                            ? 'bg-stone-800 border-stone-700 text-white'
                            : 'bg-[#FAF8F3] border-[#e8e2d5] text-[#1e2a1b]'
                    }`}>
                        <Receipt size={24} className={filter === 'all' ? 'text-amber-300' : 'text-[#c2a677]'} />
                    </div>
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e8e2d5] shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                            filter === 'all'
                                ? 'bg-[#1e2a1b] text-white shadow-xs'
                                : 'bg-[#FAF8F3] text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        All Orders ({sessions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('active')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                            filter === 'active'
                                ? 'bg-[#1e2a1b] text-white shadow-xs'
                                : 'bg-[#FAF8F3] text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        Active ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('cash')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 ${
                            filter === 'cash'
                                ? 'bg-amber-700 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                        <Banknote size={14} /> Cash ({cashCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('online')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 ${
                            filter === 'online'
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                        <CreditCard size={14} /> Online ({onlineCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('settled')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 ${
                            filter === 'settled'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                    >
                        <CheckCircle2 size={14} /> Settled Bills ({settledCount})
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search Table #, guest name, dish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#d8d3c5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:ring-2 focus:ring-[#1e2a1b]"
                    />
                </div>
            </div>

            {/* Billing Sessions Cards Grid */}
            {filteredSessions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-[#e8e2d5] space-y-4 p-6 shadow-xs">
                    <Receipt size={40} className="mx-auto text-stone-300" />
                    <h3 className="font-serif text-xl font-bold text-[#1e2a1b]">
                        {filter === 'active' ? 'No Active Pending Tables Right Now' : 'No Bills Found For This Filter'}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        {filter === 'active' && settledCount > 0
                            ? `All current dining orders are cleared! You have ${settledCount} settled orders today totaling ₹${totalSettledTodayAmount.toLocaleString()}.`
                            : 'No orders match this filter. Use the buttons above to view other categories.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {settledCount > 0 && filter !== 'settled' && (
                            <button
                                type="button"
                                onClick={() => setFilter('settled')}
                                className="py-2.5 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-xs transition"
                            >
                                <CheckCircle2 size={14} /> View All {settledCount} Settled Orders
                            </button>
                        )}
                        {filter !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setFilter('all')}
                                className="py-2.5 px-5 rounded-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-xs transition"
                            >
                                <Receipt size={14} /> View All Orders ({sessions.length})
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredSessions.map((session, sIdx) => {
                        const cardKey = session.billSessionId || session.primaryOrderId || sIdx;
                        const isExpanded = expandedCards[cardKey] ?? true;
                        const isPaid = session.paymentStatus === 'paid';
                        const isCashRequested = session.paymentMethod === 'Cash' && !isPaid;

                        return (
                            <div
                                key={cardKey}
                                className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
                                    isPaid
                                        ? 'border-emerald-300'
                                        : isCashRequested
                                        ? 'border-amber-400 ring-2 ring-amber-200/60'
                                        : 'border-[#e8e2d5]'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="p-5 pb-4 border-b border-[#ece7dc] space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-12 h-12 rounded-2xl bg-[#1e2a1b] text-white flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[9px] uppercase tracking-wider text-stone-300 font-semibold">Tbl</span>
                                                <span className="font-serif text-lg font-bold leading-tight">
                                                    #{session.tableNumber}
                                                </span>
                                            </span>
                                            <div>
                                                <h3 className="font-serif text-lg font-bold text-[#1e2a1b]">
                                                    {session.customerName}
                                                </h3>
                                                {session.customerPhone && (
                                                    <div className="text-xs text-stone-500 flex items-center gap-1 font-mono">
                                                        <Phone size={11} className="text-[#c2a677]" />
                                                        {session.customerPhone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                isPaid
                                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                                    : 'bg-[#FAF8F3] text-stone-700 border-[#d8d3c5]'
                                            }`}>
                                                {session.status || 'Active'}
                                            </span>
                                            {session.createdAt && (
                                                <div className="text-[10px] text-stone-500 font-mono flex items-center gap-1.5 bg-[#FAF8F3] px-2 py-0.5 rounded-md border border-[#e8e2d5]">
                                                    <Calendar size={11} className="text-[#c2a677]" />
                                                    <span>{new Date(session.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="text-stone-300">•</span>
                                                    <Clock size={10} className="text-stone-400" />
                                                    <span>{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Status Banner */}
                                    {isPaid ? (
                                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <CheckCircle2 size={15} className="text-emerald-700" />
                                                Bill Paid & Cleared ({session.paymentMethod || 'Online'})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handlePrint(session)}
                                                className="text-[11px] font-bold underline hover:text-emerald-950 flex items-center gap-1"
                                            >
                                                <Printer size={12} /> Print Invoice
                                            </button>
                                        </div>
                                    ) : isCashRequested ? (
                                        <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs space-y-1">
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="flex items-center gap-1.5 text-amber-900">
                                                    <Banknote size={15} className="text-amber-700" />
                                                    Customer is Giving Cash
                                                </span>
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                                    Cash Mode
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-amber-800">
                                                Collect exactly <strong className="text-amber-950 font-bold">₹{session.grandTotal}</strong> from customer at Table #{session.tableNumber}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <CreditCard size={14} className="text-blue-600" />
                                                Online / UPI Pending (Customer Paying via Razorpay)
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                                                Pending
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Itemized Dishes List */}
                                <div className="p-5 py-4 space-y-2 flex-1">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 pb-1 border-b border-[#ece7dc]">
                                        <span>Ordered Dishes ({session.items?.length || 0})</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(cardKey)}
                                            className="text-stone-400 hover:text-stone-700 p-0.5"
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                                            {session.items && session.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-1 border-b border-[#f5f3ee] last:border-none">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-md bg-[#f5f3ee] text-[#1e2a1b] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                                                            {item.quantity}×
                                                        </span>
                                                        <span className="font-medium text-stone-800">{item.name}</span>
                                                    </div>
                                                    <div className="font-mono text-stone-600">
                                                        ₹{item.subtotal || (item.price * item.quantity)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Total Calculation */}
                                    <div className="pt-3 border-t border-[#ece7dc] flex items-baseline justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                            Grand Total Due
                                        </span>
                                        <span className="font-serif text-3xl font-bold text-[#1e2a1b]">
                                            ₹{session.grandTotal || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Settle / Action Footer */}
                                <div className="p-4 bg-[#FAF8F3] border-t border-[#ece7dc] flex items-center gap-2">
                                    {!isPaid ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenSettle(session, 'Cash')}
                                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-1.5 ${
                                                    isCashRequested
                                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                        : 'bg-white hover:bg-stone-100 text-emerald-800 border border-emerald-300'
                                                }`}
                                            >
                                                <Banknote size={15} />
                                                Collect Cash (₹{session.grandTotal})
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenSettle(session, 'Online')}
                                                className="flex-1 py-3 px-4 rounded-xl bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs font-bold uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-1.5"
                                            >
                                                <CreditCard size={15} />
                                                Collect Online / QR
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleSendPdfWhatsApp(session)}
                                                title="Send PDF Bill via WhatsApp"
                                                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition"
                                            >
                                                <MessageSquareShare size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDownloadPdfBill(session)}
                                                title="Download PDF Bill"
                                                className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-[#d8d3c5] text-stone-700 transition"
                                            >
                                                <Download size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handlePrint(session)}
                                                title="Print Bill Receipt"
                                                className="p-3 rounded-xl bg-white hover:bg-stone-100 border border-[#d8d3c5] text-stone-600"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full flex items-center justify-between">
                                            <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                                                <CheckCircle2 size={15} /> Bill cleared & recorded in records
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendPdfWhatsApp(session)}
                                                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 transition"
                                                    title="Send PDF Bill on WhatsApp"
                                                >
                                                    <MessageSquareShare size={14} /> WhatsApp PDF
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadPdfBill(session)}
                                                    className="py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-[#d8d3c5] text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 transition"
                                                    title="Download PDF Invoice"
                                                >
                                                    <Download size={14} /> PDF
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrint(session)}
                                                    className="py-2 px-3 rounded-xl bg-white hover:bg-stone-100 border border-[#d8d3c5] text-xs font-bold uppercase tracking-wider text-[#1e2a1b] flex items-center gap-1.5"
                                                >
                                                    <Printer size={14} /> Print
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Settlement Confirmation Modal */}
            {settleModal.open && settleModal.session && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-[#e8e2d5] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#ece7dc] pb-3">
                            <h3 className="font-serif text-2xl font-bold text-[#1e2a1b]">
                                Settle Table #{settleModal.session.tableNumber}
                            </h3>
                            <button
                                onClick={() => setSettleModal({ open: false, session: null, method: 'Cash' })}
                                className="p-1 text-stone-400 hover:text-stone-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#ece7dc] text-center space-y-1">
                            <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                                Bill Grand Total
                            </span>
                            <div className="text-4xl font-serif font-bold text-[#1e2a1b]">
                                ₹{settleModal.session.grandTotal}
                            </div>
                            <div className="text-xs text-stone-500 font-medium">
                                Customer: {settleModal.session.customerName}
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setSettleModal(prev => ({ ...prev, method: 'Cash' }))}
                                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition font-semibold text-xs uppercase tracking-wider ${
                                    settleModal.method === 'Cash'
                                        ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                                }`}
                            >
                                <Banknote size={24} className="text-amber-700" />
                                <span>Cash Payment</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSettleModal(prev => ({ ...prev, method: 'Online' }))}
                                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition font-semibold text-xs uppercase tracking-wider ${
                                    settleModal.method === 'Online'
                                        ? 'border-[#1e2a1b] bg-[#FAF8F3] text-[#1e2a1b] shadow-xs'
                                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                                }`}
                            >
                                <CreditCard size={24} className="text-[#1e2a1b]" />
                                <span>Online / UPI / QR</span>
                            </button>
                        </div>

                        {/* Cash Change Calculator */}
                        {settleModal.method === 'Cash' && (
                            <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                                    Cash Tendered from Customer (₹)
                                </label>
                                <input
                                    type="number"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    placeholder="Enter cash amount"
                                    className="w-full px-4 py-2.5 bg-white border border-[#d8d3c5] rounded-xl text-sm font-mono font-bold text-[#1e2a1b] focus:outline-none focus:ring-2 focus:ring-[#1e2a1b]"
                                />
                                {Number(cashReceived) >= settleModal.session.grandTotal && (
                                    <div className="flex justify-between items-center text-xs font-semibold text-emerald-800 pt-1">
                                        <span>Change to Return:</span>
                                        <span className="font-mono text-sm font-bold">
                                            ₹{Number(cashReceived) - settleModal.session.grandTotal}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {settleModal.method === 'Online' && (
                            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2 text-center">
                                <p className="font-medium">
                                    Customer can scan UPI QR code at counter or pay via online gateway.
                                </p>
                                <div className="text-[11px] text-blue-700">
                                    Once payment verification is received, click below to finalize.
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setSettleModal({ open: false, session: null, method: 'Cash' })}
                                className="w-1/2 py-3 rounded-full border border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSettle}
                                disabled={isSettling}
                                className="w-1/2 py-3 rounded-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
                            >
                                {isSettling ? 'Settling...' : `Confirm Paid (${settleModal.method})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Receipt / Invoice Modal */}
            {printModal.open && printModal.session && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 border border-[#e8e2d5] shadow-2xl">
                        <div className="flex justify-between items-center border-b border-[#ece7dc] pb-3">
                            <h3 className="font-serif text-xl font-bold text-[#1e2a1b]">Print Receipt</h3>
                            <button
                                onClick={() => setPrintModal({ open: false, session: null })}
                                className="p-1 text-stone-400 hover:text-stone-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Thermal Style Receipt Container */}
                        <div
                            ref={receiptRef}
                            className="bg-[#FAF8F3] p-5 rounded-2xl border border-dashed border-[#d8d3c5] font-mono text-xs text-stone-800 space-y-3"
                        >
                            <div className="text-center space-y-1 pb-3 border-b border-stone-300">
                                <h4 className="font-serif text-xl font-bold tracking-widest text-[#1e2a1b]">CAFÉ OLIVE</h4>
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest">Sanctuary & Lounge</p>
                                <p className="text-[9px] text-stone-400">Peloponnese Cold-Press & Artisanal Levain</p>
                            </div>

                            <div className="text-[10px] space-y-0.5 pb-2 border-b border-stone-300">
                                <div className="flex justify-between">
                                    <span>Date: {new Date(printModal.session.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    <span>Time: {new Date(printModal.session.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Table: #{printModal.session.tableNumber}</span>
                                    <span>Guest: {printModal.session.customerName}</span>
                                </div>
                                {printModal.session.customerPhone && (
                                    <div>Phone: {printModal.session.customerPhone}</div>
                                )}
                            </div>

                            <div className="space-y-1.5 py-1 text-[11px]">
                                {printModal.session.items && printModal.session.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>₹{item.subtotal || (item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 border-t-2 border-dashed border-stone-400 space-y-1">
                                <div className="flex justify-between font-bold text-sm text-[#1e2a1b]">
                                    <span>GRAND TOTAL:</span>
                                    <span>₹{printModal.session.grandTotal}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-stone-500">
                                    <span>Payment Method:</span>
                                    <span>{printModal.session.paymentMethod || 'Cash'}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-emerald-800 font-bold">
                                    <span>Status:</span>
                                    <span>{printModal.session.paymentStatus === 'paid' ? 'PAID & SETTLED' : 'PENDING'}</span>
                                </div>
                            </div>

                            <div className="text-center pt-3 border-t border-stone-300 text-[10px] text-stone-400">
                                <p>Thank you for dining with us!</p>
                                <p>Visit again soon</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => handleSendPdfWhatsApp(printModal.session)}
                                className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition"
                            >
                                <MessageSquareShare size={15} /> Send PDF Bill on Customer's WhatsApp
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDownloadPdfBill(printModal.session)}
                                className="w-full py-2.5 rounded-full border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
                            >
                                <Download size={14} /> Download PDF Invoice
                            </button>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setPrintModal({ open: false, session: null })}
                                className="w-1/2 py-3 rounded-full border border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-600"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={triggerBrowserPrint}
                                className="w-1/2 py-3 rounded-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Printer size={15} /> Print Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierBillingPage;
