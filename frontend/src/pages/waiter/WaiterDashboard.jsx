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
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Floor Service Atelier</span>
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight flex items-center gap-2.5">
                        <Coffee size={28} className="text-[#c2a677]" /> Service & Floor Dashboard
                    </h1>
                    <p className="text-stone-500 text-sm mt-0.5">Active dining orders ready for table service and bill settlement.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition duration-200"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Orders
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-[#e8e2d5]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1e2a1b]" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#e8e2d5] text-stone-500">
                    <div className="text-4xl mb-3">🌿</div>
                    <p className="text-lg font-serif text-[#1e2a1b]">All tables served! No orders awaiting delivery.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div key={order._id} className="rounded-2xl overflow-hidden shadow-xs border border-[#e8e2d5] bg-white flex flex-col">
                            {/* Header */}
                            <div className={`p-4 border-b flex justify-between items-start ${
                                order.status === 'ready' 
                                    ? 'bg-[#eaf3e8] border-[#cbe4c7] border-t-4 border-t-[#2d5a27]' 
                                    : 'bg-[#FAF8F3] border-[#e8e2d5] border-t-4 border-t-[#c2a677]'
                            }`}>
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Order For</span>
                                    <div className="text-xl font-serif font-bold text-[#1e2a1b]">
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
                                        <div className="text-[11px] font-medium text-stone-500 mt-0.5">
                                            📞 {order.customerPhone || order.guestDetails?.phone}
                                        </div>
                                    )}
                                    {/* Order Source & Payment Info */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {order.orderSource === 'waiter' ? (
                                            <span className="text-[10px] bg-[#eef2f6] text-[#2c4766] border border-[#d3dfed] px-2 py-0.5 rounded-full font-semibold">
                                                👤 {order.waiterName || 'Service'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-[#FAF8F3] text-stone-600 border border-[#e8e2d5] px-2 py-0.5 rounded-full font-semibold">
                                                Guest Direct
                                            </span>
                                        )}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                            order.paymentStatus === 'paid'
                                                ? 'bg-[#eaf3e8] text-[#245220] border-[#cbe4c7]'
                                                : (order.paymentMethod === 'Cash' ? 'bg-[#fef7ea] text-[#935a16] border-[#f5dfb8]' : 'bg-[#FAF8F3] text-stone-700 border-[#e8e2d5]')
                                        }`}>
                                            {order.paymentStatus === 'paid'
                                                ? `✓ Paid (${order.paymentMethod || 'Online'})`
                                                : (order.paymentMethod === 'Cash' ? '💵 Cash Pending' : '💳 Online Pending')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] text-stone-400 font-mono">
                                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 border inline-block ${
                                        order.status === 'ready' 
                                            ? 'bg-[#eaf3e8] text-[#245220] border-[#cbe4c7]' 
                                            : 'bg-[#eef2f6] text-[#2c4766] border-[#d3dfed]'
                                    }`}>
                                        {order.status}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="p-4 flex-1 overflow-y-auto max-h-80">
                                <ul className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-start border-b border-[#ece7dc] last:border-0 pb-2.5 last:pb-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-bold text-[#c2a677] bg-[#FAF8F3] px-2 py-0.5 rounded-md border border-[#e8e2d5] font-mono">
                                                    {item.quantity}x
                                                </span>
                                                <span className="font-serif font-bold text-stone-800 text-sm">{item.name}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-3 border-t border-[#ece7dc] text-right text-base font-serif font-bold text-[#1e2a1b]">
                                    Total: ₹{order.totalAmount}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-[#FAF8F3] border-t border-[#ece7dc] flex flex-col gap-2">
                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => updateStatus(order._id, 'served')}
                                        className="w-full bg-[#2d5a27] hover:bg-[#23471f] text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-xs"
                                    >
                                        <CheckCircle size={15} /> Mark Served
                                    </button>
                                )}
                                {order.status === 'served' && (
                                    <button
                                        onClick={() => handlePaymentClick(order)}
                                        className="w-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-xs"
                                    >
                                        <DollarSign size={15} /> Collect Payment
                                    </button>
                                )}
                                {order.paymentStatus !== 'paid' && order.paymentMethod === 'Cash' && order.status !== 'served' && (
                                    <button
                                        onClick={() => handlePaymentClick(order)}
                                        className="w-full bg-[#935a16] hover:bg-[#784912] text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-xs"
                                    >
                                        <Banknote size={15} /> Collect Cash (₹{order.totalAmount})
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Modal */}
            {paymentModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-[#e8e2d5]">
                        <div className="flex justify-between items-center mb-6 border-b border-[#ece7dc] pb-4">
                            <h2 className="text-2xl font-serif font-bold text-[#1e2a1b]">Collect Settlement</h2>
                            <button onClick={() => setPaymentModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-stone-400 text-xs uppercase tracking-wider font-semibold">Total Amount Due</p>
                            <p className="text-4xl font-serif font-bold text-[#1e2a1b] mt-1">₹{selectedOrder.totalAmount}</p>
                            <p className="text-stone-500 text-xs mt-2">
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
                            </p>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'cash'
                                    ? 'border-[#1e2a1b] bg-[#FAF8F3] text-[#1e2a1b]'
                                    : 'border-[#e8e2d5] hover:border-stone-400 text-stone-600'
                                    }`}
                            >
                                <Banknote size={26} className="text-[#c2a677]" />
                                <span className="font-semibold text-xs uppercase tracking-wider">Cash Settle</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('manual_online')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'manual_online'
                                    ? 'border-[#1e2a1b] bg-[#FAF8F3] text-[#1e2a1b]'
                                    : 'border-[#e8e2d5] hover:border-stone-400 text-stone-600'
                                    }`}
                            >
                                <CreditCard size={26} className="text-[#c2a677]" />
                                <span className="font-semibold text-xs uppercase tracking-wider">Card / UPI</span>
                            </button>
                        </div>

                        <button
                            onClick={confirmPayment}
                            className="w-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white font-semibold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-xs transition duration-200"
                        >
                            Confirm Settlement Received
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaiterDashboard;
