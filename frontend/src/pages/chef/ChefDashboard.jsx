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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Kitchen Display System</span>
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight flex items-center gap-2.5">
                        <ChefHat size={28} className="text-[#c2a677]" /> Culinary Atelier KDS
                    </h1>
                    <p className="text-stone-500 text-sm mt-0.5">Live incoming kitchen orders and preparation line tickets.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition duration-200"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Tickets
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-[#e8e2d5]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1e2a1b]" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#e8e2d5] text-stone-500">
                    <div className="text-4xl mb-3">🌿</div>
                    <p className="text-lg font-serif text-[#1e2a1b]">Kitchen line is clear. No active tickets.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div key={order._id} className="rounded-2xl overflow-hidden shadow-xs border border-[#e8e2d5] bg-white flex flex-col">
                            {/* Header */}
                            <div className={`p-4 border-b flex justify-between items-start ${
                                order.status === 'placed' 
                                    ? 'bg-[#FAF8F3] border-[#e8e2d5] border-t-4 border-t-[#c2a677]' 
                                    : 'bg-[#fef7ea] border-[#f5dfb8] border-t-4 border-t-[#935a16]'
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
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 border inline-block ${
                                        order.status === 'placed' 
                                            ? 'bg-[#fef7ea] text-[#935a16] border-[#f5dfb8]' 
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
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-[#FAF8F3] border-t border-[#ece7dc]">
                                {order.status === 'placed' && (
                                    <button
                                        onClick={() => updateStatus(order._id, 'preparing')}
                                        className="w-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-xs"
                                    >
                                        <Clock size={15} /> Start Preparing
                                    </button>
                                )}
                                {order.status === 'preparing' && (
                                    <button
                                        onClick={() => updateStatus(order._id, 'ready')}
                                        className="w-full bg-[#2d5a27] hover:bg-[#23471f] text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-xs"
                                    >
                                        <CheckCircle size={15} /> Mark Ready
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
