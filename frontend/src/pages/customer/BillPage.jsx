import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
    Coffee, CheckCircle, AlertCircle, ArrowLeft,
    ShoppingBag, CreditCard, Loader2, Receipt,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { getBillSession, clearBillSession } from '../../utils/sessionUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay SDK loader
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// BillPage Component
// ─────────────────────────────────────────────────────────────────────────────
const BillPage = () => {
    const navigate = useNavigate();
    const session = getBillSession();

    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedOrders, setExpandedOrders] = useState({});

    // Payment state
    const [paymentState, setPaymentState] = useState('idle'); // idle | processing | success | failed
    const [paymentMessage, setPaymentMessage] = useState('');

    // ── Fetch the current bill ──────────────────────────────────────────────
    const fetchBill = useCallback(async () => {
        if (!session?.billSessionId) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`/api/order/bill/${session.billSessionId}`);
            if (res.data.success) {
                setBillData(res.data.data);
            }
        } catch (err) {
            setError('Failed to load your bill. Please try again.');
            console.error('Bill fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [session?.billSessionId]);

    useEffect(() => {
        fetchBill();
    }, [fetchBill]);

    // ── Toggle order item accordion ─────────────────────────────────────────
    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    // ── Pay Bill ────────────────────────────────────────────────────────────
    const handlePayBill = async () => {
        if (!session?.billSessionId || !billData?.grandTotal) return;

        setPaymentState('processing');

        try {
            // 1. Create a Razorpay order on the backend for the session total
            const payRes = await axios.post(`/api/order/bill/${session.billSessionId}/pay`);
            const { razorpayOrder, razorpayKeyId } = payRes.data.data;

            // 2. Load Razorpay SDK
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setPaymentState('failed');
                setPaymentMessage('Razorpay failed to load. Check your connection.');
                return;
            }

            // 3. Open Razorpay checkout
            const options = {
                key: razorpayKeyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Café Olive',
                description: `Bill Settlement — ${billData.orders.length} Order${billData.orders.length > 1 ? 's' : ''}`,
                order_id: razorpayOrder.id,
                handler: async (paymentResponse) => {
                    setPaymentState('processing');
                    try {
                        // 4. Verify on backend — this marks all orders as paid
                        const verifyRes = await axios.post(
                            `/api/order/bill/${session.billSessionId}/verify`,
                            {
                                razorpayOrderId: paymentResponse.razorpay_order_id,
                                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                                razorpaySignature: paymentResponse.razorpay_signature
                            }
                        );

                        if (verifyRes.data.success) {
                            // 5. Clear the session cookie — bill is settled
                            clearBillSession();
                            setPaymentState('success');
                            setPaymentMessage(
                                `Payment of ₹${billData.grandTotal} received. Thank you, ${billData.customerName || 'valued guest'}!`
                            );
                        } else {
                            setPaymentState('failed');
                            setPaymentMessage('Payment verification failed. Contact staff.');
                        }
                    } catch (verifyErr) {
                        console.error('Verify error:', verifyErr);
                        setPaymentState('failed');
                        setPaymentMessage(
                            verifyErr.response?.data?.message || 'Verification error. Please contact staff.'
                        );
                    }
                },
                modal: {
                    ondismiss: () => {
                        setPaymentState('idle');
                    }
                },
                prefill: {
                    name: billData.customerName || session.customerName || 'Guest'
                },
                theme: {
                    color: '#0b5d4b'
                }
            };

            setPaymentState('idle'); // Reset before opening Razorpay
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                setPaymentState('failed');
                setPaymentMessage('Payment failed. Please try again or contact staff.');
            });
            rzp.open();
        } catch (err) {
            console.error('Pay bill error:', err);
            setPaymentState('failed');
            setPaymentMessage(err.response?.data?.message || 'Failed to initiate payment.');
        }
    };

    // ── No session state ────────────────────────────────────────────────────
    if (!session) {
        return (
            <div className="min-h-screen bg-background font-[Montserrat] flex items-center justify-center px-6">
                <div className="text-center max-w-md space-y-6">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                        <Receipt className="text-primary" size={36} />
                    </div>
                    <h1 className="text-3xl font-[Playfair_Display] font-bold text-primary">No Active Bill</h1>
                    <p className="text-on-surface-variant text-sm">
                        You don't have an active bill session. Place an order from the menu to begin.
                    </p>
                    <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 btn-stitch-primary px-6 py-3 text-xs font-bold uppercase tracking-wider"
                    >
                        <Coffee size={16} /> Go to Menu
                    </Link>
                </div>
            </div>
        );
    }

    // ── Payment Success state ───────────────────────────────────────────────
    if (paymentState === 'success') {
        return (
            <div className="min-h-screen bg-background font-[Montserrat] flex items-center justify-center px-6">
                <div className="text-center max-w-md space-y-6 animate-fade-in">
                    <div className="w-24 h-24 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="text-green-600" size={48} />
                    </div>
                    <h1 className="text-3xl font-[Playfair_Display] font-bold text-primary">Bill Settled!</h1>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{paymentMessage}</p>
                    <p className="text-xs text-gray-400">
                        Your orders are confirmed and payment is recorded. We hope to see you again soon.
                    </p>
                    <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 btn-stitch-primary px-6 py-3 text-xs font-bold uppercase tracking-wider"
                    >
                        <Coffee size={16} /> Order Again
                    </Link>
                </div>
            </div>
        );
    }

    // ── Loading state ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-background font-[Montserrat] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-on-surface-variant text-sm">Loading your bill...</p>
                </div>
            </div>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-background font-[Montserrat] flex items-center justify-center px-6">
                <div className="text-center max-w-md space-y-4">
                    <AlertCircle className="text-red-500 mx-auto" size={48} />
                    <h2 className="text-xl font-[Playfair_Display] font-bold text-primary">Something went wrong</h2>
                    <p className="text-on-surface-variant text-sm">{error}</p>
                    <button onClick={fetchBill} className="btn-stitch-primary px-6 py-3 text-xs font-bold uppercase tracking-wider">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ── Session already paid ────────────────────────────────────────────────
    if (billData?.sessionPaid) {
        return (
            <div className="min-h-screen bg-background font-[Montserrat] flex items-center justify-center px-6">
                <div className="text-center max-w-md space-y-6">
                    <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="text-green-600" size={36} />
                    </div>
                    <h1 className="text-3xl font-[Playfair_Display] font-bold text-primary">Bill Already Paid</h1>
                    <p className="text-on-surface-variant text-sm">
                        This bill session has been settled. Thank you for visiting Café Olive!
                    </p>
                    <Link to="/menu" className="inline-flex items-center gap-2 btn-stitch-primary px-6 py-3 text-xs font-bold uppercase tracking-wider">
                        <Coffee size={16} /> Order Again
                    </Link>
                </div>
            </div>
        );
    }

    const { orders, grandTotal, customerName, tableNumber } = billData || {};
    const displayName = customerName || session.customerName || 'Guest';

    // ── Main Bill View ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background font-[Montserrat] pt-24 pb-32 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">

                {/* Back link */}
                <Link
                    to="/menu"
                    className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary text-xs font-semibold uppercase tracking-wider transition mb-8"
                >
                    <ArrowLeft size={14} /> Back to Menu
                </Link>

                {/* Header */}
                <div className="text-center mb-10">
                    <span className="text-soft-gold text-xs font-semibold uppercase tracking-[0.25em] mb-2 block">
                        Your Café Olive Bill
                    </span>
                    <h1 className="text-4xl font-[Playfair_Display] font-bold text-primary mb-2">
                        {tableNumber ? `Table ${tableNumber}` : displayName}
                    </h1>
                    <div className="h-[2px] w-16 bg-soft-gold mx-auto opacity-70 mb-4" />
                    <p className="text-on-surface-variant text-xs">
                        {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''} in your current session
                    </p>
                </div>

                {/* Orders List */}
                {!orders || orders.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <ShoppingBag className="mx-auto text-gray-300" size={48} />
                        <p className="text-on-surface-variant">No orders in your current bill.</p>
                        <Link to="/menu" className="btn-stitch-primary px-6 py-3 text-xs font-bold uppercase tracking-wider inline-block">
                            Browse Menu
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4 mb-8">
                        {orders.map((order, idx) => {
                            const isExpanded = expandedOrders[order._id] !== false; // default open
                            return (
                                <div
                                    key={order._id}
                                    className="bg-white border border-surface-border rounded-xl overflow-hidden shadow-sm"
                                >
                                    {/* Order header */}
                                    <button
                                        onClick={() => toggleOrder(order._id)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-surface-container-lowest transition text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-sm font-semibold text-primary">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-[Playfair_Display] font-bold text-primary">
                                                ₹{order.totalAmount}
                                            </span>
                                            {isExpanded
                                                ? <ChevronUp size={16} className="text-on-surface-variant" />
                                                : <ChevronDown size={16} className="text-on-surface-variant" />
                                            }
                                        </div>
                                    </button>

                                    {/* Order items */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-surface-border/50">
                                            <div className="pt-4 space-y-2">
                                                {order.items.map((item, iIdx) => (
                                                    <div
                                                        key={iIdx}
                                                        className="flex justify-between items-center text-sm"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-on-surface-variant font-medium">{item.quantity}×</span>
                                                            <span className="text-primary font-medium">{item.name}</span>
                                                        </div>
                                                        <span className="text-on-surface-variant text-xs font-semibold">
                                                            ₹{item.price * item.quantity}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Grand Total & Pay Button */}
                {orders && orders.length > 0 && (
                    <div className="bg-white border border-surface-border rounded-xl p-6 shadow-sm space-y-6">
                        {/* Breakdown */}
                        <div className="space-y-2">
                            {orders.map((order, idx) => (
                                <div key={order._id} className="flex justify-between text-xs text-on-surface-variant">
                                    <span>Order {idx + 1} ({order.items.length} items)</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-surface-border pt-4 flex justify-between items-center">
                            <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                                Grand Total
                            </span>
                            <span className="text-4xl font-[Playfair_Display] font-bold text-primary">
                                ₹{grandTotal}
                            </span>
                        </div>

                        {/* Payment failed notice */}
                        {paymentState === 'failed' && paymentMessage && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-red-700 text-xs">{paymentMessage}</p>
                            </div>
                        )}

                        <button
                            onClick={handlePayBill}
                            disabled={paymentState === 'processing'}
                            className="w-full btn-stitch-primary py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {paymentState === 'processing' ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={16} />
                                    Pay ₹{grandTotal}
                                </>
                            )}
                        </button>

                        <p className="text-center text-[10px] text-gray-400">
                            Secured by Razorpay · All orders in this session will be settled.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillPage;
