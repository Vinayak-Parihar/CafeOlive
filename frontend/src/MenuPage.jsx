import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
    Search, ShoppingBag, Plus, Minus, X, Check,
    Clock, Sparkles, Coffee, AlertCircle, Utensils, Receipt
} from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'motion/react';
import {
    getBillSession,
    setBillSession,
    generateSessionId,
    rotateBillSession
} from './utils/sessionUtils';

const MenuPage = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuError, setMenuError] = useState('');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [billSession, setBillSessionState] = useState(null);

    // Read table from query or local storage
    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        if (tableFromUrl) {
            localStorage.setItem('cafeolive_table', tableFromUrl);
            setTableNumber(tableFromUrl);
        } else {
            const stored = localStorage.getItem('cafeolive_table');
            if (stored) setTableNumber(stored);
        }
    }, [searchParams]);

    // Check active bill session
    useEffect(() => {
        const checkSession = async () => {
            const sess = getBillSession();
            setBillSessionState(sess);
            if (sess?.billSessionId) {
                try {
                    const res = await axios.get(`/api/order/bill/${sess.billSessionId}`);
                    if (res.data?.data?.sessionPaid) {
                        const newSess = rotateBillSession();
                        setBillSessionState(newSess);
                    }
                } catch {
                    // Ignore background check errors
                }
            }
        };
        checkSession();
    }, []);

    // Fetch menu
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setMenuError('');
                const res = await axios.get('/api/menu/list');
                if (res.data.success) {
                    setMenuItems(res.data.data);
                }
            } catch (err) {
                setMenuError('We could not load the menu right now. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    // Unique categories from items
    const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category?.name).filter(Boolean)))];

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Cart operations
    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId, change) => {
        setCart(prev => prev.map(item => {
            if (item._id === itemId) {
                return { ...item, quantity: Math.max(0, item.quantity + change) };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Modals
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderSuccessModal, setOrderSuccessModal] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custEmail, setCustEmail] = useState('');
    const [nameError, setNameError] = useState('');

    const placeOrder = useCallback(async (sessionId, cName, cPhone, cEmail) => {
        setIsPlacingOrder(true);
        try {
            const isAdminRoute = location.pathname.startsWith('/admin');
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
            const isWaiter = isAdminRoute && adminUser && (adminUser.role === 'waiter' || adminUser.role === 'admin');

            const payload = {
                items: cart.map(i => ({ _id: i._id, name: i.name, quantity: i.quantity })),
                totalAmount: cartTotal,
                tableNumber: tableNumber || '01',
                customerName: cName,
                customerPhone: cPhone,
                customerEmail: cEmail,
                orderSource: isWaiter ? 'waiter' : 'customer',
                ...(isWaiter ? { waiterName: adminUser.fullName || 'Staff', waiterId: adminUser._id } : { billSessionId: sessionId })
            };

            const res = await axios.post('/api/order/place', payload);
            if (res.data.success) {
                setCart([]);
                setIsCartOpen(false);
                setOrderSuccessModal(true);
                setBillSessionState(getBillSession());
            } else {
                toast.error(res.data?.message || 'Could not place order.');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || '';
            if (error.response?.status === 400 && (errorMsg.includes('paid') || errorMsg.includes('session'))) {
                const newSession = rotateBillSession();
                setBillSessionState(newSession);
                toast('Rotated to fresh session. Please press Place Order again.');
            } else {
                toast.error(errorMsg || 'Failed to place order.');
            }
        } finally {
            setIsPlacingOrder(false);
        }
    }, [cart, cartTotal, tableNumber, location.pathname]);

    const handlePlaceOrderClick = () => {
        if (cart.length === 0) return;
        const sess = getBillSession();
        if (sess?.billSessionId) {
            placeOrder(sess.billSessionId, sess.customerName || '', sess.customerPhone || '', sess.customerEmail || '');
        } else {
            setShowNameModal(true);
        }
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        const trimmedName = custName.trim();
        const trimmedPhone = custPhone.replace(/\D/g, '').slice(0, 10);
        if (!trimmedName) {
            setNameError('Please enter your name');
            return;
        }
        if (!trimmedPhone || trimmedPhone.length !== 10) {
            setNameError('Please enter a valid 10-digit phone number');
            return;
        }
        setNameError('');
        const newSessionId = generateSessionId();
        setBillSession(newSessionId, trimmedName, trimmedPhone, custEmail.trim());
        setBillSessionState(getBillSession());
        setShowNameModal(false);
        placeOrder(newSessionId, trimmedName, trimmedPhone, custEmail.trim());
    };

    return (
        <div className="min-h-screen bg-transparent text-olive-deep font-sans antialiased selection:bg-olive-rich selection:text-linen">
            {/* Top Ambient Harvest Ticker */}
            <aside className="w-full bg-[#263316] text-[#d4eab7] py-2.5 px-4 overflow-hidden relative shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="uppercase tracking-widest font-semibold text-white">Live Harvest Notice</span>
                    </div>
                    <div className="hidden sm:block text-center font-light tracking-wider text-[#d8e9be] truncate">
                        Morning Levain Drops: <strong>7:00 AM & 1:00 PM</strong> • Single-Estate Geisha Roasts • Stoneground Heritage Flour
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-300 shrink-0">
                        <Clock size={13} className="text-gold-accent" />
                        <span>Hearth Live: 7:30 AM – 9:00 PM</span>
                    </div>
                </div>
            </aside>

            {/* Editorial Hero Section */}
            <section className="w-full bg-cream-surface/70 backdrop-blur-[0.5px] px-6 lg:px-12 py-12 lg:py-16 border-b border-[#e8e4d8]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                    <div className="lg:col-span-8 space-y-4">
                        <div className="inline-flex items-center gap-2 text-gold-accent text-xs uppercase tracking-[0.25em] font-semibold">
                            <Sparkles size={14} />
                            Organic Sophistication • Atelier Provisions
                        </div>
                        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-olive-deep tracking-tight leading-tight">
                            Curated Culinary, Hearth & Roastery Offerings
                        </h1>
                        <p className="text-olive-muted text-sm sm:text-base max-w-2xl font-light leading-relaxed">
                            Rooted in ancient soil stewardship and culinary stillness. Each day at OLIV unfolds around 72-hour cold-fermented levain pulled warm from our stone hearth, cold-pressed estate olive oils, and zero-emission micro-lot coffees.
                        </p>

                        {/* Sourcing Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#e8e4d8]">
                                <span className="font-serif text-2xl font-bold text-olive-deep block">72 hr</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-olive-muted block mt-0.5">Cold Ferment Levain</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#e8e4d8]">
                                <span className="font-serif text-2xl font-bold text-olive-deep block">&lt;0.18%</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-olive-muted block mt-0.5">Free Acidity Extra Virgin</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#e8e4d8]">
                                <span className="font-serif text-2xl font-bold text-olive-deep block">88+ SCA</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-olive-muted block mt-0.5">Specialty Micro-Lots</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#e8e4d8]">
                                <span className="font-serif text-2xl font-bold text-olive-deep block">100%</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-olive-muted block mt-0.5">Regenerative Flour</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Order / Table status */}
                    <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#e8e4d8] shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider font-bold text-olive-muted">Table Service</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive-light text-olive-deep text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                Table {tableNumber || '01'} Active
                            </span>
                        </div>
                        <p className="text-xs text-olive-muted leading-relaxed">
                            Order dishes directly from your phone. They'll be prepared and served fresh to your table without pre-payment.
                        </p>
                        {billSession?.billSessionId && (
                            <Link
                                to="/bill"
                                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-cream-surface hover:bg-olive-light text-olive-deep text-xs font-bold uppercase tracking-wider transition border border-[#d8d3c5]"
                            >
                                <Receipt size={14} /> View Active Bill Session
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#e8e4d8] flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search dishes, ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#d8d3c5] text-xs text-olive-deep placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive-deep"
                        />
                    </div>

                    {/* Category pills */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {categories.map(cat => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider transition shrink-0 ${
                                        isSelected
                                            ? 'bg-olive-deep text-white shadow-sm font-bold'
                                            : 'bg-white text-olive-deep border border-[#e8e4d8] hover:border-gold-accent font-medium'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Menu Items Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="text-center py-20 text-olive-muted text-sm">
                        Curating artisanal offerings...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <p className="text-olive-muted text-sm">No culinary items match your search or category.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                            className="text-xs uppercase font-bold tracking-wider text-gold-accent underline"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                        {filteredItems.map((item, idx) => {
                            const inCartItem = cart.find(i => i._id === item._id);
                            const qty = inCartItem?.quantity || 0;

                            return (
                                <Motion.article
                                    key={item._id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-20px' }}
                                    transition={{ duration: 0.35, delay: (idx % 6) * 0.04 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-5 border border-[#e8e4d8] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
                                >
                                    <div className="space-y-1.5 sm:space-y-3">
                                        <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                    <Utensils size={20} className="sm:w-7 sm:h-7" />
                                                </div>
                                            )}
                                            {item.category?.name && (
                                                <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-sm text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-olive-deep shadow-2xs">
                                                    {item.category.name}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
                                                <h3 className="font-serif text-xs sm:text-lg font-semibold text-olive-deep line-clamp-1 leading-tight" title={item.name}>
                                                    {item.name}
                                                </h3>
                                                <span className="font-serif text-xs sm:text-lg font-bold text-olive-deep shrink-0">
                                                    ₹{item.price}
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className="hidden sm:block text-xs text-olive-muted font-light mt-1 line-clamp-2 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add / Qty Control */}
                                    <div className="pt-2 sm:pt-4 mt-1 sm:mt-2 border-t border-[#f1eee7] flex items-center justify-between">
                                        {qty === 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item)}
                                                className="w-full py-1.5 sm:py-2.5 rounded-full bg-cream-surface hover:bg-olive-deep hover:text-white text-olive-deep text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border border-[#d8d3c5] flex items-center justify-center gap-1 active:scale-95"
                                            >
                                                <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                                                <span className="hidden min-[380px]:inline sm:inline">Add</span>
                                            </button>
                                        ) : (
                                            <div className="w-full flex items-center justify-between bg-olive-light/60 rounded-full px-1 py-0.5 sm:px-2 sm:py-1 border border-olive-muted/20">
                                                <button
                                                    onClick={() => updateQuantity(item._id, -1)}
                                                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white flex items-center justify-center text-olive-deep shadow-2xs active:scale-90"
                                                >
                                                    <Minus size={11} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                                <span className="font-bold text-[10px] sm:text-xs text-olive-deep">{qty}</span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, 1)}
                                                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-olive-deep text-white flex items-center justify-center shadow-2xs active:scale-90"
                                                >
                                                    <Plus size={11} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Motion.article>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Floating Cart Pill */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="flex items-center gap-3 px-6 py-4 rounded-full bg-olive-deep text-white shadow-2xl hover:bg-olive-rich transition-all transform hover:scale-105 active:scale-95"
                    >
                        <ShoppingBag size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                            {cartItemCount} item{cartItemCount > 1 ? 's' : ''} • ₹{cartTotal}
                        </span>
                    </button>
                </div>
            )}

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />
                        <Motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col justify-between"
                        >
                            <div className="p-6 border-b border-[#ece7dc] flex items-center justify-between">
                                <div>
                                    <h2 className="font-serif text-2xl font-bold text-olive-deep">Your Order</h2>
                                    <span className="text-xs text-olive-muted">Table {tableNumber || '01'} • Dine-In</span>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-[#f5f2eb]">
                                {cart.map(item => (
                                    <div key={item._id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-olive-deep">{item.name}</h4>
                                            <span className="text-xs text-olive-muted">₹{item.price} each</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item._id, -1)}
                                                className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-xs font-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item._id, 1)}
                                                className="w-7 h-7 rounded-full bg-olive-deep text-white flex items-center justify-center"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <span className="font-serif text-sm font-bold text-olive-deep w-14 text-right">
                                            ₹{item.price * item.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-cream-surface border-t border-[#ece7dc] space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold uppercase tracking-wider text-olive-muted">Subtotal</span>
                                    <span className="font-serif text-2xl font-bold text-olive-deep">₹{cartTotal}</span>
                                </div>
                                <button
                                    onClick={handlePlaceOrderClick}
                                    disabled={isPlacingOrder || cart.length === 0}
                                    className="w-full py-4 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold uppercase tracking-widest transition shadow-md disabled:opacity-50"
                                >
                                    {isPlacingOrder ? 'Sending to Kitchen...' : 'Send Order to Kitchen'}
                                </button>
                                <p className="text-[11px] text-center text-olive-muted font-light">
                                    Pay at table or via UPI when you're finished dining.
                                </p>
                            </div>
                        </Motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Customer Details Modal (for first order in session) */}
            <AnimatePresence>
                {showNameModal && (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 border border-[#e8e4d8] shadow-2xl">
                            <h3 className="font-serif text-2xl font-bold text-olive-deep">Start Dining Session</h3>
                            <p className="text-xs text-olive-muted leading-relaxed">
                                Enter your name and phone number to start your bill session at Table {tableNumber || '01'}.
                            </p>
                            {nameError && (
                                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs">{nameError}</div>
                            )}
                            <form onSubmit={handleNameSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-olive-deep block mb-1">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Rohan Dusane"
                                        value={custName}
                                        onChange={(e) => setCustName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#d8d3c5] text-sm focus:outline-none focus:ring-2 focus:ring-olive-deep"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-olive-deep">
                                            Phone Number *
                                        </label>
                                        <span className={`text-[11px] font-mono font-semibold ${
                                            custPhone.length === 10
                                                ? 'text-emerald-700 font-bold'
                                                : 'text-stone-400'
                                        }`}>
                                            {custPhone.length === 10 ? '✓ 10/10 Digits' : `${custPhone.length}/10 Digits`}
                                        </span>
                                    </div>
                                    <div className="relative flex items-center rounded-xl border border-[#d8d3c5] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-olive-deep focus-within:border-transparent">
                                        <span className="px-3.5 py-3 bg-[#FAF8F3] border-r border-[#d8d3c5] text-xs font-bold text-stone-600 select-none">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            required
                                            inputMode="numeric"
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            placeholder="98765 43210"
                                            value={custPhone}
                                            onKeyDown={(e) => {
                                                // Allow control keys (backspace, delete, tab, arrows, copy/paste)
                                                if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) {
                                                    return;
                                                }
                                                // Block any non-digit
                                                if (!/^[0-9]$/.test(e.key)) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                                // Hard block if already 10 digits
                                                if (custPhone.length >= 10) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pasted = e.clipboardData.getData('text');
                                                const clean = pasted.replace(/\D/g, '').slice(0, 10);
                                                setCustPhone(clean);
                                                if (nameError) setNameError('');
                                            }}
                                            onInput={(e) => {
                                                const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                if (e.target.value !== clean) {
                                                    e.target.value = clean;
                                                }
                                            }}
                                            onChange={(e) => {
                                                const numericVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setCustPhone(numericVal);
                                                if (nameError) setNameError('');
                                            }}
                                            className="w-full px-3.5 py-3 text-sm focus:outline-none tracking-widest font-mono text-olive-deep placeholder:tracking-normal placeholder:font-sans"
                                        />
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-1">
                                        Enter exactly 10 digits mobile number (numbers only)
                                    </p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNameModal(false)}
                                        className="w-1/2 py-3 rounded-full border border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-1/2 py-3 rounded-full bg-olive-deep text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Order Placed Success Modal */}
            <AnimatePresence>
                {orderSuccessModal && (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 border border-[#e8e4d8] shadow-2xl">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <Check size={36} />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-olive-deep">Order Sent to Kitchen!</h3>
                            <p className="text-xs text-olive-muted leading-relaxed">
                                Our chefs have received your order. Track preparation progress on your live bill.
                            </p>
                            <div className="pt-2 flex flex-col gap-2">
                                <Link
                                    to="/bill"
                                    onClick={() => setOrderSuccessModal(false)}
                                    className="w-full py-3.5 rounded-full bg-olive-deep text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                                >
                                    Track Live Bill & Status
                                </Link>
                                <button
                                    onClick={() => setOrderSuccessModal(false)}
                                    className="w-full py-2.5 text-xs text-olive-muted uppercase font-bold tracking-wider"
                                >
                                    Continue Browsing Menu
                                </button>
                            </div>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MenuPage;
