import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, CheckCircle, Coffee, DollarSign, X, CreditCard, Banknote } from 'lucide-react';

const WaiterDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Payment Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'online'
    const [qrCodeUrl, setQrCodeUrl] = useState('/qrcode.png');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/order/waiter');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch service orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.patch(`/api/order/status/${orderId}`, { status: newStatus });
            fetchOrders();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handlePaymentClick = (order) => {
        setSelectedOrder(order);
        setPaymentMethod(order.paymentMethod === 'Online' ? 'manual_online' : 'cash');
        setPaymentModalOpen(true);
    };

    const confirmPayment = async () => {
        if (!selectedOrder) return;

        try {
            await axios.patch(`/api/order/status/${selectedOrder._id}`, { 
                status: 'completed',
                paymentStatus: 'paid',
                paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'Online'
            });
            setPaymentModalOpen(false);
            setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            alert("Failed to complete payment");
        }
    };

    return (
        <div className="p-3 sm:p-6 bg-oliv-cream dark:bg-oliv-dark min-h-screen text-oliv-dark dark:text-oliv-cream relative transition-colors">
            <div className="flex justify-between items-center mb-8 border-b border-gray-300 dark:border-gray-700 pb-4">
                <h1 className="text-3xl font-bold font-serif flex items-center gap-3 text-oliv-green dark:text-soft-gold">
                    <Coffee size={32} /> Service Dashboard
                </h1>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 bg-white/70 dark:bg-white/10 hover:bg-oliv-gold/15 text-oliv-green dark:text-white border border-oliv-gold/30 px-4 py-2 rounded-lg transition"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <div className="text-6xl mb-4">🙌</div>
                    <p className="text-xl">No orders ready to serve.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div key={order._id} className={`rounded-xl overflow-hidden shadow-lg border-2 flex flex-col transition-colors ${order.status === 'ready' ? 'border-green-500 bg-white dark:bg-gray-800' : 'border-blue-500 bg-white dark:bg-gray-800'
                            }`}>
                            {/* Header */}
                            <div className={`p-4 flex justify-between items-center ${order.status === 'ready' ? 'bg-green-500/20' : 'bg-blue-500/20'
                                }`}>
                                <div>
                                    <span className="text-xs uppercase font-bold tracking-wider opacity-70">Order For</span>
                                    <div className="text-2xl font-bold">
                                        {(() => {
                                            const table = order.tableNumber;
                                            const customer = order.customerName || order.guestDetails?.name;
                                            const invalidValues = ['n/a', 'null', 'undefined', 'walk-in', 'unknown', 'takeaway'];
                                            const isValidTable = table && !invalidValues.includes(String(table).toLowerCase().trim());
                                            if (customer && isValidTable) {
                                                return `${customer} (Table #${table})`;
                                            }
                                            if (customer) {
                                                return customer;
                                            }
                                            if (isValidTable) {
                                                return `Table #${table}`;
                                            }
                                            return 'Customer';
                                        })()}
                                    </div>
                                    {(order.customerPhone || order.guestDetails?.phone) && (
                                        <div className="text-xs font-semibold opacity-85 mt-0.5">
                                            📞 {order.customerPhone || order.guestDetails?.phone}
                                        </div>
                                    )}
                                    {/* Order Source & Payment Info */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {order.orderSource === 'waiter' ? (
                                            <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full inline-block">
                                                👤 {order.waiterName || 'Waiter'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-gray-500 text-white px-2 py-0.5 rounded-full inline-block">
                                                Customer
                                            </span>
                                        )}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold ${
                                            order.paymentStatus === 'paid'
                                                ? 'bg-green-600 text-white'
                                                : (order.paymentMethod === 'Cash' ? 'bg-amber-400 text-black font-bold animate-pulse' : 'bg-yellow-600 text-black')
                                        }`}>
                                            {order.paymentStatus === 'paid'
                                                ? `✓ Paid (${order.paymentMethod || 'Online'})`
                                                : (order.paymentMethod === 'Cash' ? '💵 Cash Pending' : '💳 Online Pending')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-70">
                                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={`text-sm font-bold uppercase px-2 py-1 rounded mt-1 ${order.status === 'ready' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                        }`}>
                                        {order.status}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="p-4 flex-1 overflow-y-auto max-h-96">
                                <ul className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                                            <div className="font-bold text-lg">{item.quantity} x {item.name}</div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t border-gray-600 text-right text-xl font-bold text-green-400">
                                    Total: ₹{order.totalAmount}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => updateStatus(order._id, 'served')}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                    >
                                        <CheckCircle size={20} /> Mark Served
                                    </button>
                                )}
                                {order.status === 'served' && (
                                    <button
                                        onClick={() => handlePaymentClick(order)}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                    >
                                        <DollarSign size={20} /> Collect Payment
                                    </button>
                                )}
                                {order.paymentStatus !== 'paid' && order.paymentMethod === 'Cash' && order.status !== 'served' && (
                                    <button
                                        onClick={() => handlePaymentClick(order)}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition"
                                    >
                                        <Banknote size={18} /> Collect Cash (₹{order.totalAmount})
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Modal */}
            {paymentModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collect Payment</h2>
                            <button onClick={() => setPaymentModalOpen(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Amount Due</p>
                            <p className="text-5xl font-bold text-green-400 mt-2">₹{selectedOrder.totalAmount}</p>
                            <p className="text-gray-500 text-sm mt-2">
                                {(() => {
                                    const table = selectedOrder.tableNumber;
                                    const customer = selectedOrder.customerName || selectedOrder.guestDetails?.name;
                                    const invalidValues = ['n/a', 'null', 'undefined', 'walk-in', 'unknown', 'takeaway'];
                                    const isValidTable = table && !invalidValues.includes(String(table).toLowerCase().trim());
                                    if (customer && isValidTable) {
                                        return `${customer} · Table #${table}`;
                                    }
                                    if (customer) {
                                        return `Customer: ${customer}`;
                                    }
                                    if (isValidTable) {
                                        return `Table #${table}`;
                                    }
                                    return 'Customer';
                                })()}
                                {(selectedOrder.customerPhone || selectedOrder.guestDetails?.phone) && (
                                    <span className="block text-xs text-gray-400 mt-0.5">
                                        📞 {selectedOrder.customerPhone || selectedOrder.guestDetails?.phone}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'cash'
                                    ? 'border-green-500 bg-green-500/10 text-green-400'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <Banknote size={32} />
                                <span className="font-bold">Cash</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('manual_online')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'manual_online'
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <CreditCard size={32} />
                                <span className="font-bold">Manual Card / UPI</span>
                            </button>
                        </div>

                        <button
                            onClick={confirmPayment}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-transform active:scale-95"
                        >
                            Confirm Payment Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaiterDashboard;
