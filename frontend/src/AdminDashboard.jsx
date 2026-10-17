import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag, TrendingUp, DollarSign, Clock, RefreshCw,
    CheckCircle2, Phone, Sparkles, PieChart, BarChart3,
    ArrowUpRight, Activity, Banknote, CreditCard, ChefHat, Coffee
} from 'lucide-react';

// Real Live Number Component - Direct, rock-solid, and immediate without fake rolling numbers
const CountUp = ({ value, prefix = '', suffix = '' }) => {
    const numericValue = typeof value === 'string'
        ? parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
        : (typeof value === 'number' ? value : 0);

    return (
        <span>
            {prefix}
            {numericValue.toLocaleString()}
            {suffix}
        </span>
    );
};

// SVG Smooth Curve / Area Chart Component
const SalesTrendChart = ({ data = [], activeMetric, setActiveMetric }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Fallback data if none exists
    const chartData = useMemo(() => {
        if (data && data.length > 0) return data;
        return [
            { label: 'Oct 8', orders: 12, revenue: 2400 },
            { label: 'Oct 9', orders: 18, revenue: 3800 },
            { label: 'Oct 10', orders: 15, revenue: 3100 },
            { label: 'Oct 11', orders: 8, revenue: 2233 },
            { label: 'Oct 12', orders: 22, revenue: 6342 },
            { label: 'Oct 13', orders: 16, revenue: 4200 },
            { label: 'Today', orders: 20, revenue: 5100 }
        ];
    }, [data]);

    const values = chartData.map(d => (activeMetric === 'revenue' ? d.revenue : d.orders));
    const maxVal = Math.max(...values, 1);
    const minVal = 0;

    // ViewBox dimensions
    const width = 640;
    const height = 240;
    const padX = 45;
    const padY = 35;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const points = chartData.map((d, i) => {
        const val = activeMetric === 'revenue' ? d.revenue : d.orders;
        const x = padX + (i / Math.max(chartData.length - 1, 1)) * plotW;
        const y = padY + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;
        return { x, y, data: d, val };
    });

    // Create smooth bezier curve path string
    const linePath = useMemo(() => {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
        }
        return path;
    }, [points]);

    // Area closed path for gradient fill
    const areaPath = useMemo(() => {
        if (!linePath || points.length === 0) return '';
        const first = points[0];
        const last = points[points.length - 1];
        const bottomY = padY + plotH;
        return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
    }, [linePath, points, padY, plotH]);

    // Peak value point to display ambient pulse halo
    const maxValPoint = useMemo(() => {
        if (!points.length) return null;
        return points.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), points[0]);
    }, [points]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e2d5] shadow-sm space-y-4"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1eee7]">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#FAF8F3] text-[#1e2a1b]">
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg font-bold text-[#1e2a1b]">
                            Order & Revenue Velocity
                        </h3>
                        <span className="text-[11px] text-stone-400 font-medium">Recent Activity Timeline</span>
                    </div>
                </div>

                {/* Metric Switcher with Animated Sliding Pill */}
                <div className="relative inline-flex p-1 rounded-xl bg-[#f5f3ee] border border-[#ece7dc] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveMetric('orders')}
                        className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-colors duration-200 ${
                            activeMetric === 'orders'
                                ? 'text-white'
                                : 'text-stone-600 hover:text-[#1e2a1b]'
                        }`}
                    >
                        {activeMetric === 'orders' && (
                            <motion.div
                                layoutId="metricPill"
                                className="absolute inset-0 bg-[#1e2a1b] rounded-lg shadow-xs -z-10"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        Orders Count
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMetric('revenue')}
                        className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-colors duration-200 ${
                            activeMetric === 'revenue'
                                ? 'text-white'
                                : 'text-stone-600 hover:text-[#1e2a1b]'
                        }`}
                    >
                        {activeMetric === 'revenue' && (
                            <motion.div
                                layoutId="metricPill"
                                className="absolute inset-0 bg-[#1e2a1b] rounded-lg shadow-xs -z-10"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        Revenue (₹)
                    </button>
                </div>
            </div>

            {/* SVG Interactive Animated Chart */}
            <div className="relative w-full overflow-hidden">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto overflow-visible select-none"
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (!rect.width) return;
                        const svgX = ((e.clientX - rect.left) / rect.width) * width;
                        let closestIdx = 0;
                        let minDiff = Infinity;
                        points.forEach((pt, idx) => {
                            const diff = Math.abs(pt.x - svgX);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestIdx = idx;
                            }
                        });
                        if (minDiff < plotW / (Math.max(points.length - 1, 1) * 1.2)) {
                            setHoveredIndex(closestIdx);
                        }
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c2a677" stopOpacity="0.4" />
                            <stop offset="60%" stopColor="#c2a677" stopOpacity="0.09" />
                            <stop offset="100%" stopColor="#c2a677" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#1e2a1b" />
                            <stop offset="50%" stopColor="#c2a677" />
                            <stop offset="100%" stopColor="#1e2a1b" />
                        </linearGradient>
                        <clipPath id="chartAreaClip">
                            <motion.rect
                                key={`clip-${activeMetric}-${chartData.length}`}
                                x={0}
                                y={0}
                                height={height}
                                initial={{ width: 0 }}
                                animate={{ width: width }}
                                transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </clipPath>
                    </defs>

                    {/* Horizontal Gridlines with Staggered Entrance */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                        const y = padY + plotH * (1 - pct);
                        const val = Math.round(minVal + (maxVal - minVal) * pct);
                        return (
                            <g key={idx}>
                                <motion.line
                                    x1={padX}
                                    y1={y}
                                    x2={padX + plotW}
                                    y2={y}
                                    stroke="#ece7dc"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                    initial={{ opacity: 0, x2: padX }}
                                    animate={{ opacity: 1, x2: padX + plotW }}
                                    transition={{ duration: 0.55, delay: idx * 0.07, ease: "easeOut" }}
                                />
                                <motion.text
                                    x={padX - 8}
                                    y={y + 3.5}
                                    textAnchor="end"
                                    className="text-[10px] fill-stone-400 font-mono select-none"
                                    initial={{ opacity: 0, x: padX - 14 }}
                                    animate={{ opacity: 1, x: padX - 8 }}
                                    transition={{ duration: 0.4, delay: idx * 0.07 + 0.1 }}
                                >
                                    {activeMetric === 'revenue' ? `₹${val}` : val}
                                </motion.text>
                            </g>
                        );
                    })}

                    {/* Gradient Area Fill with Left-to-Right Reveal */}
                    <motion.path
                        key={`area-${activeMetric}-${chartData.length}`}
                        d={areaPath}
                        fill="url(#areaGradient)"
                        clipPath="url(#chartAreaClip)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    />

                    {/* Main Curved Line with Path Draw Animation */}
                    <motion.path
                        key={`line-${activeMetric}-${chartData.length}`}
                        d={linePath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        clipPath="url(#chartAreaClip)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Interactive Animated Data Points */}
                    {points.map((pt, i) => {
                        const isPeak = maxValPoint && pt.val === maxValPoint.val && pt.val > 0;
                        const isHovered = hoveredIndex === i;

                        return (
                            <motion.g
                                key={`pt-${i}-${activeMetric}`}
                                className="cursor-pointer group"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    duration: 0.45,
                                    delay: 0.25 + (i / Math.max(points.length - 1, 1)) * 0.7,
                                    type: 'spring',
                                    stiffness: 320,
                                    damping: 22
                                }}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Ambient pulse ring on peak value node */}
                                {isPeak && (
                                    <motion.circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={9}
                                        fill="none"
                                        stroke="#c2a677"
                                        strokeWidth="1.5"
                                        animate={{
                                            scale: [1, 1.8, 1],
                                            opacity: [0.8, 0, 0.8]
                                        }}
                                        transition={{
                                            duration: 2.6,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                )}

                                {/* Hover halo aura */}
                                {isHovered && (
                                    <motion.circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={12}
                                        fill="#c2a677"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 0.28, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.18 }}
                                    />
                                )}

                                {/* Vertical Hover Guide Line */}
                                {isHovered && (
                                    <motion.line
                                        x1={pt.x}
                                        y1={padY}
                                        x2={pt.x}
                                        y2={padY + plotH}
                                        stroke="#c2a677"
                                        strokeDasharray="3 3"
                                        strokeWidth="1.5"
                                        initial={{ opacity: 0, y1: padY + plotH }}
                                        animate={{ opacity: 0.9, y1: padY }}
                                        transition={{ duration: 0.18 }}
                                    />
                                )}

                                {/* Circle Dot */}
                                <motion.circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? 6.5 : 4.5}
                                    fill="#ffffff"
                                    stroke="#1e2a1b"
                                    strokeWidth={isHovered ? 3 : 2}
                                    whileHover={{ scale: 1.3 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className="transition-all duration-150"
                                />

                                {/* Bottom Date Label with Staggered Entrance */}
                                <motion.text
                                    x={pt.x}
                                    y={height - 8}
                                    textAnchor="middle"
                                    initial={{ opacity: 0, y: height - 3 }}
                                    animate={{ opacity: 1, y: height - 8 }}
                                    transition={{
                                        duration: 0.35,
                                        delay: 0.35 + (i / Math.max(points.length - 1, 1)) * 0.65
                                    }}
                                    className={`text-[10px] font-sans transition-colors ${
                                        isHovered ? 'fill-[#1e2a1b] font-bold' : 'fill-stone-400 font-medium'
                                    }`}
                                >
                                    {pt.data.label}
                                </motion.text>
                            </motion.g>
                        );
                    })}
                </svg>

                {/* Animated Floating Tooltip Overlay */}
                <AnimatePresence>
                    {hoveredIndex !== null && points[hoveredIndex] && (
                        <motion.div
                            key={hoveredIndex}
                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.92 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className="absolute pointer-events-none bg-[#1e2a1b]/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-[#c2a677]/30 text-xs transform -translate-x-1/2 -translate-y-full mb-3 z-30"
                            style={{
                                left: `${(points[hoveredIndex].x / width) * 100}%`,
                                top: `${(points[hoveredIndex].y / height) * 100}%`
                            }}
                        >
                            <div className="font-bold text-[#c2a677] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c2a677] inline-block animate-pulse" />
                                {points[hoveredIndex].data.date || points[hoveredIndex].data.label}
                            </div>
                            <div className="font-serif font-bold text-base text-white">
                                {activeMetric === 'revenue'
                                    ? `₹${points[hoveredIndex].data.revenue.toLocaleString()}`
                                    : `${points[hoveredIndex].data.orders} Orders`}
                            </div>
                            <div className="text-[10px] text-stone-300 mt-0.5">
                                {activeMetric === 'revenue'
                                    ? `${points[hoveredIndex].data.orders} total orders`
                                    : `₹${points[hoveredIndex].data.revenue.toLocaleString()} revenue generated`}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// SVG Donut Chart Component for Order Status Breakdown
const StatusDistributionDonut = ({ breakdown = {}, totalOrders = 0 }) => {
    const statusConfig = {
        completed: { label: 'Completed', color: '#276749', bg: 'bg-[#276749]' },
        served: { label: 'Served', color: '#c2a677', bg: 'bg-[#c2a677]' },
        placed: { label: 'Placed', color: '#d97706', bg: 'bg-[#d97706]' },
        preparing: { label: 'Preparing', color: '#4f46e5', bg: 'bg-[#4f46e5]' },
        pending_payment: { label: 'Pending Payment', color: '#e11d48', bg: 'bg-[#e11d48]' },
    };

    const segments = useMemo(() => {
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
        let cumulativeAngle = 0;

        return Object.entries(breakdown).map(([status, count]) => {
            const pct = (count / total) * 100;
            const config = statusConfig[status.toLowerCase()] || {
                label: status,
                color: '#71717a',
                bg: 'bg-stone-500'
            };

            const segment = {
                status,
                label: config.label,
                count,
                pct: pct.toFixed(1),
                color: config.color,
                bg: config.bg,
                offsetPct: cumulativeAngle,
            };
            cumulativeAngle += pct;
            return segment;
        });
    }, [breakdown]);

    const radius = 54;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e2d5] shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1eee7]">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#FAF8F3] text-[#1e2a1b]">
                        <PieChart size={18} />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg font-bold text-[#1e2a1b]">
                            Status Proportions
                        </h3>
                        <span className="text-[11px] text-stone-400 font-medium">Kitchen & Service Ratio</span>
                    </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Live
                </span>
            </div>

            {/* Donut Graphic & Center Metric */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                        {/* Background track circle */}
                        <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            fill="transparent"
                            stroke="#f5f3ee"
                            strokeWidth="16"
                        />

                        {/* Segment slices */}
                        {segments.map((seg, i) => {
                            const strokeLength = (seg.pct / 100) * circumference;
                            const strokeOffset = -((seg.offsetPct / 100) * circumference);

                            return (
                                <circle
                                    key={i}
                                    cx="70"
                                    cy="70"
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth="16"
                                    strokeDasharray={`${strokeLength} ${circumference}`}
                                    strokeDashoffset={strokeOffset}
                                    className="transition-all duration-700 hover:opacity-80"
                                />
                            );
                        })}
                    </svg>

                    {/* Center Animated Metric */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="font-serif text-2xl font-bold text-[#1e2a1b] leading-tight">
                            <CountUp value={totalOrders} />
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">
                            Total Orders
                        </span>
                    </div>
                </div>

                {/* Legend List */}
                <div className="space-y-2 w-full max-w-xs">
                    {segments.map((seg, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                                <span className="font-medium text-stone-700 capitalize">{seg.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-stone-400 text-[11px]">{seg.pct}%</span>
                                <span className="font-bold text-[#1e2a1b] font-serif w-8 text-right">
                                    <CountUp value={seg.count} />
                                </span>
                            </div>
                        </div>
                    ))}
                    {segments.length === 0 && (
                        <p className="text-stone-400 text-xs">No order status data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMetric, setActiveMetric] = useState('orders');
    const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'cash', 'paid'

    const fetchData = async () => {
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
        fetchData();
        const interval = setInterval(fetchData, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleAdminSettle = async (order, method) => {
        try {
            if (order.billSessionId) {
                await axios.post(`/api/order/bill/${order.billSessionId}/settle`, {
                    paymentMethod: method
                });
            } else {
                await axios.patch(`/api/order/status/${order._id}`, {
                    status: 'completed',
                    paymentStatus: 'paid',
                    paymentMethod: method
                });
            }
            toast.success(`Payment settled as ${method} for Table #${order.tableNumber || '01'}`);
            fetchData();
        } catch (error) {
            console.error("Error settling payment:", error);
            toast.error("Failed to settle payment");
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center text-stone-500 text-sm">
                <RefreshCw size={20} className="animate-spin mr-2 text-[#1e2a1b]" />
                Loading Atelier metrics...
            </div>
        );
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 h-full">
            {/* Main Stats Area */}
            <div className="flex-1 space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ece7dc]">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ee] text-[#c2a677] text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">
                            <Sparkles size={12} />
                            Real-Time Operations
                        </div>
                        <h1 className="text-3xl font-serif font-semibold text-[#1e2a1b]">
                            Dashboard Overview
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F3] px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition text-[#1e2a1b] border border-[#d8d3c5] shadow-xs active:scale-95"
                    >
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                </div>

                {/* Stats Cards Grid with Live Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Orders"
                        rawValue={stats?.totalOrders || 0}
                        icon={<ShoppingBag size={20} />}
                        badge="All-Time"
                    />
                    <StatCard
                        title="Today's Orders"
                        rawValue={stats?.todayOrders || 0}
                        icon={<TrendingUp size={20} />}
                        badge="Today"
                    />
                    <StatCard
                        title="Online Payments"
                        rawValue={stats?.totalOnlinePayments ?? stats?.todayOnlinePayments ?? 0}
                        icon={<CreditCard size={20} />}
                        badge="UPI & Card"
                    />
                    <StatCard
                        title="Revenue Today"
                        rawValue={stats?.todayRevenue || 0}
                        prefix="₹"
                        icon={<DollarSign size={20} />}
                        badge="Gross"
                        highlight
                    />
                </div>

                {/* Live Real-Time Restaurant Services Scan Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#e8e2d5] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Service Scan:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 font-semibold flex items-center gap-1.5">
                            <ChefHat size={14} className="text-orange-600" />
                            Kitchen Prep: <strong>{stats?.services?.kitchen || 0}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex items-center gap-1.5">
                            <Coffee size={14} className="text-blue-600" />
                            Floor Service: <strong>{stats?.services?.serviceFloor || 0}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-center gap-1.5">
                            <Banknote size={14} className="text-amber-600" />
                            Cash To Collect: <strong>{pendingOrders.filter(o => o.paymentMethod === 'Cash' && o.paymentStatus !== 'paid' && !o.isPaid).length}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-semibold flex items-center gap-1.5">
                            <Clock size={14} className="text-purple-600" />
                            Unpaid Bills: <strong>{stats?.services?.unpaidOrders || 0}</strong>
                        </span>
                    </div>
                </div>

                {/* Visual Analytics & Graphs Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Graph 1: Area Curve for Sales & Orders Trend */}
                    <div className="lg:col-span-7">
                        <SalesTrendChart
                            data={stats?.salesTimeline}
                            activeMetric={activeMetric}
                            setActiveMetric={setActiveMetric}
                        />
                    </div>

                    {/* Graph 2: Donut Chart for Status Proportion */}
                    <div className="lg:col-span-5">
                        <StatusDistributionDonut
                            breakdown={stats?.statusBreakdown || {}}
                            totalOrders={stats?.totalOrders || 0}
                        />
                    </div>
                </div>

                {/* Order Status Breakdown with Animated Number Counting */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#e8e2d5] shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#f1eee7]">
                        <h3 className="font-serif text-xl font-bold text-[#1e2a1b]">
                            Order Status Breakdown
                        </h3>
                        <span className="text-xs text-stone-400 uppercase tracking-widest font-medium">Live Kitchen Flow</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {stats?.statusBreakdown && Object.entries(stats.statusBreakdown).map(([status, count]) => (
                            <div key={status} className="bg-[#FAF8F3] p-4 rounded-2xl border border-[#ece7dc] flex flex-col justify-between hover:shadow-xs transition">
                                <span className="capitalize text-xs font-semibold tracking-wider text-stone-500 uppercase">{status}</span>
                                <span className="font-serif text-2xl font-bold text-[#1e2a1b] mt-2">
                                    <CountUp value={count} />
                                </span>
                            </div>
                        ))}
                        {(!stats?.statusBreakdown || Object.keys(stats.statusBreakdown).length === 0) && (
                            <p className="text-stone-400 text-xs py-4 col-span-full">No orders recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Live Dining & Pending Orders */}
            <div className="w-full xl:w-96 bg-white p-6 rounded-3xl border border-[#e8e2d5] shadow-sm flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
                <div className="pb-3 border-b border-[#ece7dc] mb-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-[#c2a677]" />
                            <h3 className="font-serif text-xl font-bold text-[#1e2a1b]">
                                Dining Orders
                            </h3>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3ee] text-[#1e2a1b] text-xs font-bold">
                            <CountUp value={
                                orderFilter === 'cash'
                                    ? pendingOrders.filter(o => o.paymentMethod === 'Cash' && o.paymentStatus !== 'paid' && !o.isPaid).length
                                    : orderFilter === 'paid'
                                    ? pendingOrders.filter(o => o.paymentStatus === 'paid' || o.isPaid).length
                                    : pendingOrders.length
                            } />
                        </span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1">
                        <button
                            type="button"
                            onClick={() => setOrderFilter('all')}
                            className={`px-3 py-1 rounded-full font-semibold transition shrink-0 ${
                                orderFilter === 'all'
                                    ? 'bg-[#1e2a1b] text-white shadow-xs'
                                    : 'bg-[#FAF8F3] text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            All ({pendingOrders.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderFilter('cash')}
                            className={`px-3 py-1 rounded-full font-semibold transition shrink-0 flex items-center gap-1 ${
                                orderFilter === 'cash'
                                    ? 'bg-amber-700 text-white shadow-xs'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            💵 Cash ({pendingOrders.filter(o => o.paymentMethod === 'Cash' && o.paymentStatus !== 'paid' && !o.isPaid).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderFilter('paid')}
                            className={`px-3 py-1 rounded-full font-semibold transition shrink-0 flex items-center gap-1 ${
                                orderFilter === 'paid'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                        >
                            ✓ Paid ({pendingOrders.filter(o => o.paymentStatus === 'paid' || o.isPaid).length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {pendingOrders
                        .filter(order => {
                            const isPaid = order.paymentStatus === 'paid' || order.isPaid;
                            const isCash = order.paymentMethod === 'Cash' && !isPaid;
                            if (orderFilter === 'cash') return isCash;
                            if (orderFilter === 'paid') return isPaid;
                            return true;
                        })
                        .map(order => {
                        const table = order.tableNumber;
                        const customer = order.customerName || order.guestDetails?.name;
                        const invalidValues = ['n/a', 'null', 'undefined', 'walk-in', 'unknown', 'takeaway'];
                        const isValidTable = table && !invalidValues.includes(String(table).toLowerCase().trim());

                        let titleDisplay = 'Customer';
                        if (customer && isValidTable) titleDisplay = `${customer} (Table #${table})`;
                        else if (customer) titleDisplay = customer;
                        else if (isValidTable) titleDisplay = `Table #${table}`;

                        const isPaid = order.paymentStatus === 'paid' || order.isPaid;
                        const isCashRequested = order.paymentMethod === 'Cash';

                        return (
                            <div key={order._id} className={`p-4 rounded-2xl border space-y-2.5 transition ${
                                isPaid
                                    ? 'bg-[#f4faf2] border-emerald-200'
                                    : isCashRequested
                                    ? 'bg-[#fef9ee] border-amber-300'
                                    : 'bg-[#FAF8F3] border-[#e8e2d5]'
                            }`}>
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <h4 className="font-serif font-bold text-[#1e2a1b] text-sm">
                                            {titleDisplay}
                                        </h4>
                                        {(order.customerPhone || order.guestDetails?.phone) && (
                                            <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                                <Phone size={11} /> {order.customerPhone || order.guestDetails?.phone}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#d8d3c5] text-[#1e2a1b]">
                                        {order.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="text-xs text-stone-500">Order Total</span>
                                    <span className="font-serif text-base font-bold text-[#1e2a1b]">
                                        ₹{order.totalAmount}
                                    </span>
                                </div>

                                {order.items && order.items.length > 0 && (
                                    <div className="text-[11px] text-stone-600 border-t border-[#ece7dc] pt-1.5 space-y-0.5">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span className="text-stone-400">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Payment Status Display */}
                                <div className="pt-2 border-t border-[#ece7dc] space-y-2">
                                    {isPaid ? (
                                        <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                                                <span>Payment Complete</span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                                                {order.paymentMethod || 'Online'}
                                            </span>
                                        </div>
                                    ) : isCashRequested ? (
                                        <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs space-y-1.5">
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="flex items-center gap-1.5 text-amber-900">
                                                    <Banknote size={15} className="text-amber-700 shrink-0" />
                                                    Customer is giving Cash
                                                </span>
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                                    Cash
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-amber-800">
                                                Please collect <strong className="text-amber-950 font-bold">₹{order.totalAmount}</strong> in cash at Table #{table || '01'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleAdminSettle(order, 'Cash')}
                                                className="w-full py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-1.5 mt-1"
                                            >
                                                <CheckCircle2 size={13} /> Confirm Cash Received
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-stone-500">Payment:</span>
                                                <span className="font-semibold text-stone-700 flex items-center gap-1">
                                                    <CreditCard size={12} /> Online / UPI Pending
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdminSettle(order, 'Cash')}
                                                    className="py-2 px-2 rounded-xl bg-white hover:bg-emerald-700 hover:text-white text-emerald-800 border border-emerald-300 text-[11px] font-bold uppercase tracking-wider transition"
                                                >
                                                    ✓ Cash Paid
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdminSettle(order, 'Online')}
                                                    className="py-2 px-2 rounded-xl bg-[#1e2a1b] hover:bg-[#253723] text-white text-[11px] font-bold uppercase tracking-wider transition"
                                                >
                                                    ✓ Online Paid
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {order.createdAt && (
                                        <div className="text-[10px] text-stone-400 text-right">
                                            Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {pendingOrders.length === 0 && (
                        <div className="text-center py-12 text-stone-400 text-xs">
                            <CheckCircle2 size={32} className="mx-auto mb-2 text-stone-300" />
                            No dining orders right now.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// StatCard with CountUp integration
const StatCard = ({ title, rawValue, prefix = '', suffix = '', icon, badge, highlight }) => (
    <div className={`p-6 rounded-3xl border transition shadow-sm flex flex-col justify-between ${
        highlight
            ? 'bg-[#1e2a1b] text-white border-[#1e2a1b]'
            : 'bg-white text-[#1e2a1b] border-[#e8e2d5]'
    }`}>
        <div className="flex items-center justify-between mb-4">
            <span className={`text-xs uppercase tracking-wider font-semibold ${highlight ? 'text-stone-300' : 'text-stone-500'}`}>
                {title}
            </span>
            <div className={`p-2 rounded-2xl ${highlight ? 'bg-white/10 text-white' : 'bg-[#FAF8F3] text-[#1e2a1b]'}`}>
                {icon}
            </div>
        </div>
        <div>
            <div className="font-serif text-3xl font-bold tracking-tight mb-1">
                <CountUp value={rawValue} prefix={prefix} suffix={suffix} />
            </div>
            {badge && (
                <span className={`text-[10px] uppercase tracking-widest font-medium ${highlight ? 'text-[#c2a677]' : 'text-stone-400'}`}>
                    {badge}
                </span>
            )}
        </div>
    </div>
);

export default AdminDashboard;
