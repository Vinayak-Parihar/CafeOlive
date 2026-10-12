import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, CheckCircle, Clock, ChefHat } from 'lucide-react';

const ChefDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/order/kitchen');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch kitchen orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.patch(`/api/order/status/${orderId}`, { status: newStatus });
            fetchOrders(); // Refresh immediately
        } catch (error) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="p-3 sm:p-6 bg-oliv-cream dark:bg-oliv-dark min-h-screen text-oliv-dark dark:text-oliv-cream transition-colors">
            <div className="flex justify-between items-center mb-8 border-b border-gray-300 dark:border-gray-700 pb-4">
                <h1 className="text-3xl font-bold font-serif flex items-center gap-3 text-oliv-green dark:text-soft-gold">
                    <ChefHat size={32} /> Kitchen Display System (KDS)
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
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-xl">All caught up! No active orders.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div key={order._id} className={`rounded-xl overflow-hidden shadow-lg border-2 flex flex-col transition-colors ${order.status === 'placed' ? 'border-red-500 bg-white dark:bg-gray-800' : 'border-yellow-500 bg-white dark:bg-gray-800'
                            }`}>
                            {/* Header */}
                            <div className={`p-4 flex justify-between items-center ${order.status === 'placed' ? 'bg-red-500/20' : 'bg-yellow-500/20'
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
                                                : (order.paymentMethod === 'Cash' ? 'bg-amber-400 text-black font-bold' : 'bg-yellow-600 text-black')
                                        }`}>
                                            {order.paymentStatus === 'paid'
                                                ? `✓ Paid (${order.paymentMethod || 'Online'})`
                                                : (order.paymentMethod === 'Cash' ? '💵 Cash Pending' : '💳 Online Pending')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-70">
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={`text-sm font-bold uppercase px-2 py-1 rounded mt-1 ${order.status === 'placed' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
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
                                            <div>
                                                <div className="font-bold text-lg">{item.quantity} x {item.name}</div>
                                                {/* Add modifiers here if we have them later */}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {order.status === 'placed' && (
                                    <button
                                        onClick={() => updateStatus(order._id, 'preparing')}
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                    >
                                        <Clock size={20} /> Start Preparing
                                    </button>
                                )}
                                {order.status === 'preparing' && (
                                    <button
                                        onClick={() => updateStatus(order._id, 'ready')}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                    >
                                        <CheckCircle size={20} /> Mark Ready
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChefDashboard;
