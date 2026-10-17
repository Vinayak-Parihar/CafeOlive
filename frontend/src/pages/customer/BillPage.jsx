import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Coffee, CheckCircle2, ArrowLeft, RefreshCw,
    CreditCard, Banknote, Clock, ChevronDown, ChevronUp,
    Receipt, Utensils
} from 'lucide-react';
import { getBillSession, clearBillSessionCookie } from '../../utils/sessionUtils';

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.querySelector('script[src*="checkout.razorpay"]')) {
            return resolve(true);
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const MAX_PREP_MINUTES = 25;

const calculateOrderProgress = (order, now) => {
    if (!order) {
        return {
            remainingText: `${MAX_PREP_MINUTES} mins max`,
            progressPercent: 25,
            activeStep: 1,
            headline: 'Order Received • Queued',
            subline: 'Kitchen has received your order and is queuing ingredients.'
        };
    }

    const createdAt = new Date(order.createdAt).getTime();
    const elapsedSec = Math.max(0, Math.floor((now - createdAt) / 1000));
    const totalSec = MAX_PREP_MINUTES * 60;
    const remainingSec = Math.max(0, totalSec - elapsedSec);
    const remainingMins = Math.floor(remainingSec / 60);
    const remainingSecs = remainingSec % 60;

    const status = order.status || 'placed';

    if (status === 'served' || status === 'completed') {
        return {
            remainingText: 'Served • Complete',
            progressPercent: 100,
            activeStep: 4,
            headline: 'Served • Bon Appétit!',
            subline: 'All dishes delivered to your table. Enjoy your feast!'
        };
    }

    if (status === 'ready') {
        return {
            remainingText: 'Ready Now! Coming to table',
            progressPercent: 75,
            activeStep: 3,
            headline: 'Order Confirmed & Ready!',
            subline: 'Chef has plated your order! Service team is bringing it over.'
        };
    }

    if (status === 'preparing') {
        const timeFraction = Math.min(1, elapsedSec / totalSec);
        const dynamicPercent = Math.min(70, Math.round(35 + timeFraction * 35));
        const isOvertime = remainingSec <= 0;
        const remainingText = isOvertime
            ? 'Final Touches • Plating now'
            : `${remainingMins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s remaining`;
        return {
            remainingText,
            progressPercent: dynamicPercent,
            activeStep: 2,
            headline: 'Chef Is Preparing Your Food',
            subline: 'Freshly crafting your artisanal dishes in the kitchen.'
        };
    }

    // Default 'placed'
    return {
        remainingText: `~${MAX_PREP_MINUTES} mins max prep window`,
        progressPercent: 25,
        activeStep: 1,
        headline: 'Order Received • Queued',
        subline: 'Kitchen has received your order and is queuing ingredients.'
    };
};

const BillPage = () => {
    const navigate = useNavigate();
    const session = getBillSession();

    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedOrders, setExpandedOrders] = useState({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [now, setNow] = useState(Date.now());

    // Payment state
    const [paymentState, setPaymentState] = useState('idle');
    const [paymentMessage, setPaymentMessage] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('online');
    const [cashRequested, setCashRequested] = useState(false);
    const [isUpdatingMethod, setIsUpdatingMethod] = useState(false);

    // Fetch bill
    const fetchBill = useCallback(async (isManual = false) => {
        if (!session?.billSessionId) {
            setLoading(false);
            return;
        }
        if (isManual) setIsRefreshing(true);
        try {
            const res = await axios.get(`/api/order/bill/${session.billSessionId}`);
            if (res.data.success) {
                setBillData(res.data.data);
                if (res.data.data?.paymentMethod === 'Cash') {
                    setCashRequested(true);
                    setSelectedMethod('cash');
                } else if (res.data.data?.paymentMethod === 'Online') {
                    setCashRequested(false);
                    setSelectedMethod('online');
                }
                if (res.data.data?.sessionPaid) {
                    clearBillSessionCookie();
                }
            }
        } catch (err) {
            setError('Failed to load your bill. Please try again.');
        } finally {
            setLoading(false);
            if (isManual) {
                setTimeout(() => setIsRefreshing(false), 500);
            }
        }
    }, [session?.billSessionId]);

    useEffect(() => {
        fetchBill();
        const pollInterval = setInterval(() => {
            fetchBill();
        }, 4000);
        return () => clearInterval(pollInterval);
    }, [fetchBill]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    const handleSelectCash = async () => {
        if (!session?.billSessionId) return;
        setIsUpdatingMethod(true);
        try {
            await axios.patch(`/api/order/bill/${session.billSessionId}/payment-method`, {
                paymentMethod: 'Cash'
            });
            setCashRequested(true);
            setSelectedMethod('cash');
            toast.success("Cash payment selected. Please hand over cash to staff after dining.");
        } catch {
            toast.error("Failed to select cash payment.");
        } finally {
            setIsUpdatingMethod(false);
        }
    };

    const handleSelectOnline = async () => {
        if (!session?.billSessionId) return;
        setIsUpdatingMethod(true);
        try {
            await axios.patch(`/api/order/bill/${session.billSessionId}/payment-method`, {
                paymentMethod: 'Online'
            });
            setCashRequested(false);
            setSelectedMethod('online');
        } catch (err) {
            console.error("Failed to update payment method:", err);
        } finally {
            setIsUpdatingMethod(false);
        }
    };

    const handlePayBill = async () => {
        if (!session?.billSessionId || !billData?.grandTotal) return;

        setPaymentState('processing');
        try {
            const payRes = await axios.post(`/api/order/bill/${session.billSessionId}/pay`);
            const { razorpayOrder, razorpayKeyId } = payRes.data.data;

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setPaymentState('failed');
                setPaymentMessage('Razorpay failed to load. Check your connection.');
                return;
            }

            const options = {
                key: razorpayKeyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Café Olive',
                description: `Bill Settlement — ${billData.orders?.length || 1} Order(s)`,
                order_id: razorpayOrder.id,
                handler: async (paymentResponse) => {
                    setPaymentState('processing');
                    try {
                        const verifyRes = await axios.post(
                            `/api/order/bill/${session.billSessionId}/verify`,
                            {
                                razorpayOrderId: paymentResponse.razorpay_order_id,
                                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                                razorpaySignature: paymentResponse.razorpay_signature
                            }
                        );

                        if (verifyRes.data.success) {
                            clearBillSessionCookie();
                            setPaymentState('success');
                            setPaymentMessage(`Payment of ₹${billData.grandTotal} received. Thank you!`);
                        } else {
                            setPaymentState('failed');
                            setPaymentMessage('Payment verification failed. Contact staff.');
                        }
                    } catch (verifyErr) {
                        setPaymentState('failed');
                        setPaymentMessage(verifyErr.response?.data?.message || 'Verification error.');
                    }
                },
                modal: {
                    ondismiss: () => setPaymentState('idle')
                },
                prefill: {
                    name: billData.customerName || session.customerName || 'Guest'
                },
                theme: {
                    color: '#1e2a1b'
                }
            };

            setPaymentState('idle');
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                setPaymentState('failed');
                setPaymentMessage('Payment failed. Please try again or contact staff.');
            });
            rzp.open();
        } catch (err) {
            setPaymentState('failed');
            setPaymentMessage(err.response?.data?.message || 'Failed to initiate payment.');
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-transparent font-sans flex items-center justify-center px-4 py-12">
                <div className="text-center max-w-sm space-y-5 bg-white p-8 rounded-3xl border border-[#e8e4d8] shadow-sm">
                    <div className="w-16 h-16 bg-olive-light/60 rounded-full flex items-center justify-center mx-auto text-olive-deep">
                        <Receipt size={32} className="text-gold-accent" />
                    </div>
                    <h1 className="text-2xl font-serif font-semibold text-olive-deep">No Active Bill</h1>
                    <p className="text-olive-muted text-xs leading-relaxed">
                        You don't have an active bill session. Place an order from our artisanal menu to begin.
                    </p>
                    <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        <Coffee size={15} /> Explore Menu
                    </Link>
                </div>
            </div>
        );
    }

    if (paymentState === 'success') {
        return (
            <div className="min-h-screen bg-transparent font-sans flex items-center justify-center px-4 py-12">
                <div className="text-center max-w-sm space-y-5 bg-white p-8 rounded-3xl border border-[#e8e4d8] shadow-sm">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={36} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-serif font-semibold text-olive-deep">Bill Settled!</h1>
                    <p className="text-olive-muted text-xs leading-relaxed">{paymentMessage}</p>
                    <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        <Coffee size={15} /> Order Again
                    </Link>
                </div>
            </div>
        );
    }

    const latestOrder = billData?.orders?.[billData.orders.length - 1];
    const progress = calculateOrderProgress(latestOrder, now);
    const tableDisplay = billData?.tableNumber || session.tableNumber || '01';

    return (
        <div className="min-h-screen bg-transparent font-sans text-olive-deep antialiased py-6 px-4 sm:px-6 flex justify-center selection:bg-olive-rich selection:text-linen">
            <main className="w-full max-w-[460px] flex flex-col space-y-4 pb-12">
                {/* Top Bar Nav */}
                <header className="flex items-center justify-between px-1">
                    <Link
                        to="/menu"
                        className="inline-flex items-center text-xs font-semibold tracking-wider text-olive-deep uppercase hover:opacity-75 transition-opacity py-1.5"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Menu
                    </Link>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-surface border border-[#dce6d7] text-[11px] font-medium text-olive-deep">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                        Table {tableDisplay} • Dine-In
                    </div>
                </header>

                {/* Customer Identity */}
                <section className="text-center pt-2 pb-1">
                    <span className="block text-[11px] font-bold tracking-[0.22em] uppercase text-gold-accent mb-1">
                        Your Café Olive Bill
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-olive-deep tracking-tight">
                        {billData?.customerName || session.customerName || 'Valued Guest'}
                    </h1>
                    <p className="text-xs text-olive-muted mt-1 font-normal tracking-wide">
                        {billData?.orders?.length || 1} order(s) in your current session
                    </p>
                </section>

                {/* Live Order Tracker Card */}
                <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#ece8df] relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                            </span>
                            <h2 className="text-sm font-bold text-olive-deep tracking-tight">
                                {progress.headline}
                            </h2>
                        </div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f1f5ee] border border-[#dce6d7] text-olive-deep text-[11px] font-medium whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1 text-gold-accent" />
                            {progress.remainingText}
                        </div>
                    </div>

                    <p className="text-xs text-olive-muted mt-2 leading-relaxed">
                        {progress.subline}
                    </p>

                    {/* Stepper Progress Bar */}
                    <div className="mt-4 pt-1">
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden p-0.5">
                            <div
                                className="bg-gradient-to-r from-gold-accent via-emerald-600 to-emerald-700 h-full rounded-full transition-all duration-700"
                                style={{ width: `${progress.progressPercent}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-4 mt-2.5 text-center text-[10.5px]">
                            <span className={progress.activeStep >= 1 ? 'font-bold text-olive-deep' : 'text-stone-400'}>1. Placed</span>
                            <span className={progress.activeStep >= 2 ? 'font-bold text-olive-deep' : 'text-stone-400'}>2. Making</span>
                            <span className={progress.activeStep >= 3 ? 'font-bold text-olive-deep' : 'text-stone-400'}>3. Ready</span>
                            <span className={progress.activeStep >= 4 ? 'font-bold text-olive-deep' : 'text-stone-400'}>4. Served</span>
                        </div>
                    </div>
                </section>

                {/* Orders Itemized Accordion */}
                <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#ece8df]">
                    <div className="flex items-center justify-between pb-3 border-b border-[#f1eee7]">
                        <h3 className="text-xs font-bold tracking-wider uppercase text-olive-deep">
                            Dishes in Session ({billData?.orders?.length || 0})
                        </h3>
                        <button
                            onClick={() => fetchBill(true)}
                            className="p-1 text-olive-muted hover:text-olive-deep transition"
                            title="Refresh bill"
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="divide-y divide-[#f5f2eb]">
                        {(billData?.orders || []).map((ord, idx) => {
                            const isExpanded = expandedOrders[ord._id] ?? true;
                            return (
                                <div key={ord._id || idx} className="py-3">
                                    <div
                                        onClick={() => toggleOrder(ord._id)}
                                        className="flex items-center justify-between cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-xs font-semibold text-olive-deep">
                                                Order #{idx + 1}
                                            </span>
                                            <span className="text-[10px] text-olive-muted ml-2">
                                                {ord.status || 'placed'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-olive-deep">
                                                ₹{ord.totalAmount}
                                            </span>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-2.5 space-y-1.5 pl-2 border-l-2 border-[#e8e4d8]">
                                            {ord.items?.map((it, itIdx) => (
                                                <div key={itIdx} className="flex justify-between text-xs text-olive-muted">
                                                    <span>{it.quantity}x {it.name}</span>
                                                    <span>₹{(it.price || 0) * (it.quantity || 1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Bill Breakdown Summary Card */}
                <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#ece8df] space-y-3">
                    <div className="flex justify-between text-xs text-olive-muted">
                        <span>Items Subtotal</span>
                        <span>₹{billData?.subtotal || billData?.grandTotal || 0}</span>
                    </div>
                    {billData?.taxAmount > 0 && (
                        <div className="flex justify-between text-xs text-olive-muted">
                            <span>Taxes & GST</span>
                            <span>₹{billData.taxAmount}</span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-[#f1eee7] flex justify-between items-baseline">
                        <span className="font-serif text-base font-semibold text-olive-deep">Grand Total</span>
                        <span className="font-serif text-2xl font-bold text-olive-deep">
                            ₹{billData?.grandTotal || 0}
                        </span>
                    </div>

                    {/* Payment Mode Selector */}
                    {!billData?.sessionPaid && (
                        <div className="pt-3 border-t border-[#f1eee7] grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleSelectOnline}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                    selectedMethod === 'online'
                                        ? 'border-olive-deep bg-olive-light/70 text-olive-deep'
                                        : 'border-stone-200 text-stone-600'
                                }`}
                            >
                                <CreditCard size={14} /> UPI / Online
                            </button>
                            <button
                                type="button"
                                onClick={handleSelectCash}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                    selectedMethod === 'cash'
                                        ? 'border-olive-deep bg-olive-light/70 text-olive-deep'
                                        : 'border-stone-200 text-stone-600'
                                }`}
                            >
                                <Banknote size={14} /> Pay Cash
                            </button>
                        </div>
                    )}

                    {/* Pay Button / Status */}
                    {!billData?.sessionPaid ? (
                        selectedMethod === 'online' ? (
                            <button
                                type="button"
                                onClick={handlePayBill}
                                disabled={paymentState === 'processing'}
                                className="w-full py-3.5 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold tracking-widest uppercase transition shadow-sm mt-2 disabled:opacity-50"
                            >
                                {paymentState === 'processing' ? 'Processing...' : `Pay ₹${billData?.grandTotal || 0} Now`}
                            </button>
                        ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs text-center mt-2 font-medium">
                                Cash payment chosen. Please inform your server or pay at the billing counter.
                            </div>
                        )
                    ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs text-center mt-2 font-medium">
                            ✓ Bill Settled & Paid. Thank you for dining with us!
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default BillPage;
