import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, TrendingUp, DollarSign, Clock, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        console.log("Fetching dashboard data...");
        try {
            const [statsRes, pendingRes] = await Promise.all([
                axios.get('/api/admin/stats'),
                axios.get('/api/admin/pending-orders')
            ]);
            setStats(statsRes.data.data);
            setPendingOrders(pendingRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-oliv-dark dark:text-oliv-cream text-center mt-10">Loading dashboard...</div>;

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-full">
            {/* Main Stats Area */}
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold font-serif text-oliv-green dark:text-soft-gold">Dashboard Overview</h1>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 bg-white/70 dark:bg-white/10 hover:bg-oliv-gold/15 px-4 py-2 rounded-lg text-sm transition text-oliv-green dark:text-oliv-cream border border-oliv-gold/30"
                    >
                        <RefreshCw size={16} /> Refresh Now
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Orders"
                        value={stats?.totalOrders || 0}
                        icon={<ShoppingBag size={24} />}
                        color="bg-oliv-green"
                    />
                    <StatCard
                        title="Today's Orders"
                        value={stats?.todayOrders || 0}
                        icon={<TrendingUp size={24} />}
                        color="bg-oliv-gold"
                    />
                    <StatCard
                        title="Online Payments"
                        value={stats?.todayOnlinePayments || 0}
                        subLabel="Today"
                        icon={<DollarSign size={24} />}
                        color="bg-primary"
                    />
                    <StatCard
                        title="Revenue Today"
                        value={`₹${stats?.todayRevenue || 0}`}
                        icon={<DollarSign size={24} />}
                        color="bg-deep-olive"
                    />
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-white dark:bg-oliv-dark/80 p-6 rounded-lg shadow-lg border border-oliv-gold/30 transition-colors duration-300">
                    <h3 className="text-xl font-semibold mb-4 text-oliv-green dark:text-oliv-cream">Order Status Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {stats?.statusBreakdown && Object.entries(stats.statusBreakdown).map(([status, count]) => (
                            <div key={status} className="bg-oliv-cream dark:bg-white/10 p-3 rounded flex justify-between items-center transition-colors">
                                <span className="capitalize text-oliv-dark/75 dark:text-oliv-cream/75">{status}</span>
                                <span className="font-bold text-oliv-dark dark:text-white">{count}</span>
                            </div>
                        ))}
                        {(!stats?.statusBreakdown || Object.keys(stats.statusBreakdown).length === 0) && (
                            <p className="text-gray-400">No orders yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Pending Orders */}
            <div className="w-full xl:w-80 bg-white dark:bg-oliv-dark/80 p-4 rounded-lg shadow-lg overflow-y-auto max-h-[calc(100vh-100px)] border border-oliv-gold/30 transition-colors duration-300">
                <h3 className="text-xl font-bold text-oliv-green dark:text-soft-gold mb-4 flex items-center gap-2">
                    <Clock size={20} /> Pending Orders
                </h3>
                <div className="space-y-3">
                    {pendingOrders.map(order => (
                        <div key={order._id} className="bg-oliv-cream dark:bg-white/10 p-3 rounded border-l-4 border-oliv-gold transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-oliv-dark dark:text-white">
                                    {(() => {
                                        const table = order.tableNumber;
                                        const customer = order.customerName;
                                        const invalidValues = ['n/a', 'null', 'undefined', 'walk-in', 'unknown', 'takeaway'];
                                        const isValidTable = table && !invalidValues.includes(String(table).toLowerCase().trim());
                                        if (isValidTable) {
                                            return `Table #${table}`;
                                        }
                                        if (customer) {
                                            return `Customer: ${customer}`;
                                        }
                                        return 'Customer';
                                    })()}
                                </span>
                                <span className="text-xs bg-soft-gold text-primary px-2 py-0.5 rounded capitalize">{order.status}</span>
                            </div>
                            <p className="text-sm text-oliv-dark/70 dark:text-oliv-cream/70">Total: ₹{order.totalAmount}</p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                <div>Payment: <span className={`font-semibold capitalize ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>{order.paymentStatus || 'Pending'}</span></div>
                                {order.paymentMethod && <div>Method: {order.paymentMethod}</div>}
                                {order.paymentTimestamp && <div>Paid At: {new Date(order.paymentTimestamp).toLocaleTimeString()}</div>}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                Created: {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                            {/* Potential Action Buttons could go here */}
                        </div>
                    ))}
                    {pendingOrders.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No pending orders.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, subLabel }) => (
    <div className={`p-4 rounded-lg shadow-lg ${color} text-white`}>
        <div className="flex items-center justify-between mb-2">
            <span className="opacity-80 font-medium">{title}</span>
            <div className="bg-white/20 p-2 rounded-full">{icon}</div>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        {subLabel && <div className="text-sm opacity-70 mt-1">{subLabel}</div>}
    </div>
);

export default AdminDashboard;
