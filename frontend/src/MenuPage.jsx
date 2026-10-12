import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Coffee, CheckCircle, Search, X, Receipt, Plus, Minus, Loader2, SearchX, User, Phone, Mail, Compass } from 'lucide-react';
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
    const [itemsPerRow, setItemsPerRow] = useState(4);

    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Table number from QR code
    const [tableNumber, setTableNumber] = useState('');

    // Active bill session (null if no session cookie)
    const [billSession, setBillSessionState] = useState(null);

    // Read table number from URL (?table=5) and store in localStorage
    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        if (tableFromUrl) {
            localStorage.setItem('cafeolive_table', tableFromUrl);
            setTableNumber(tableFromUrl);
        } else {
            const storedTable = localStorage.getItem('cafeolive_table');
            if (storedTable) {
                setTableNumber(storedTable);
            }
        }
    }, [searchParams]);

    // Read active bill session from cookie on mount & detect if already paid
    useEffect(() => {
        const checkSessionStatus = async () => {
            const session = getBillSession();
            setBillSessionState(session);
            if (session?.billSessionId) {
                try {
                    const res = await axios.get(`/api/order/bill/${session.billSessionId}`);
                    if (res.data?.data?.sessionPaid) {
                        const newSession = rotateBillSession();
                        setBillSessionState(newSession);
                    }
                } catch {
                    // Ignore session check errors on initial mount
                }
            }
        };
        checkSessionStatus();
    }, []);

    // Fetch menu
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setMenuError('');
                const response = await axios.get('/api/menu/list');
                if (response.data.success) {
                    setMenuItems(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching menu:", error);
                setMenuError('We could not load the menu right now. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    // Fetch admin-configured grid layout for the menu page
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/home/settings');
                const configured = Number(response.data?.data?.menuItemsPerRow);
                if (Number.isInteger(configured) && configured >= 2 && configured <= 10) {
                    setItemsPerRow(configured);
                }
            } catch (error) {
                console.error("Error fetching menu layout settings:", error);
            }
        };
        fetchSettings();
    }, []);

    // Get unique categories
    let categories = ['All'];
    try {
        if (Array.isArray(menuItems) && menuItems.length > 0) {
            const cats = new Set(menuItems.map(item => item.category?.name).filter(Boolean));
            categories = ['All', ...cats];
        }
    } catch (e) {
        console.error("Category Error", e);
    }

    // Filter items
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All';
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
    };

    // ─── Cart Functions ──────────────────────────────────────────────────────
    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        // Note: Do not auto-open the cart drawer so customers can freely select multiple items.
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

    // ─── Modal States ──────────────────────────────────────────────────────────
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Separate from the initial menu-fetch `loading` flag so placing an order
    // never hides the already-loaded menu grid behind a spinner.
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Customer Details Prompt (required for first order when no active session)
    const [showNamePromptModal, setShowNamePromptModal] = useState(false);
    const [customerNameInput, setCustomerNameInput] = useState('');
    const [customerPhoneInput, setCustomerPhoneInput] = useState('');
    const [customerEmailInput, setCustomerEmailInput] = useState('');
    const [namePromptError, setNamePromptError] = useState('');
    const [placedCustomerName, setPlacedCustomerName] = useState('');

    // Lock background scroll while the order panel or a modal is open (mobile-safe)
    useEffect(() => {
        const shouldLock = isCartOpen || showOrderModal || showNamePromptModal;
        if (shouldLock) {
            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = previousOverflow; };
        }
    }, [isCartOpen, showOrderModal, showNamePromptModal]);

    // Escape key closes the order panel / name prompt
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            if (showNamePromptModal) {
                setShowNamePromptModal(false);
                setNamePromptError('');
            } else if (isCartOpen) {
                setIsCartOpen(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isCartOpen, showNamePromptModal]);

    // ─── Place Order (Session-Based) ───────────────────────────────────────────
    const placeOrder = useCallback(async (sessionId, custName, custPhone, custEmail) => {
        setIsPlacingOrder(true);
        setShowOrderModal(true);
        setOrderSuccess(false);

        try {
            const isAdminRoute = location.pathname.startsWith('/admin');
            const adminUserStr = localStorage.getItem('adminUser');
            const adminUser = JSON.parse(adminUserStr || 'null');
            const isWaiterOrder = isAdminRoute && adminUser && (adminUser.role === 'waiter' || adminUser.role === 'admin');

            const orderPayload = {
                items: cart.map(item => ({
                    _id: item._id,
                    quantity: item.quantity,
                    name: item.name
                })),
                totalAmount: cartTotal,
            };

            if (tableNumber) orderPayload.tableNumber = tableNumber;
            if (custName) orderPayload.customerName = custName;
            if (custPhone) orderPayload.customerPhone = custPhone;
            if (custEmail) orderPayload.customerEmail = custEmail;

            if (isWaiterOrder) {
                orderPayload.orderSource = 'waiter';
                orderPayload.waiterName = adminUser.fullName || adminUser.username || 'Staff';
                orderPayload.waiterId = adminUser._id;
            } else {
                orderPayload.orderSource = 'customer';
                orderPayload.billSessionId = sessionId;
            }

            const response = await axios.post('/api/order/place', orderPayload);

            if (response.data.success) {
                setOrderSuccess(true);
                setCart([]);
                setCustomerNameInput('');
                setCustomerPhoneInput('');
                setCustomerEmailInput('');
                setPlacedCustomerName(custName);
                setBillSessionState(getBillSession());

                setTimeout(() => {
                    setShowOrderModal(false);
                    setIsCartOpen(false);
                    setOrderSuccess(false);
                }, 3000);
            } else {
                toast.error(response.data?.message || "We couldn't place your order. Please try again.");
                setShowOrderModal(false);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || '';

            // Handle scenario where previous bill session was already paid (e.g. cash settlement or previous visit)
            if (
                error.response?.status === 400 &&
                (errorMsg.includes("already been paid") || errorMsg.includes("session"))
            ) {
                const newSession = rotateBillSession();
                setBillSessionState(newSession);

                try {
                    const retryPayload = {
                        items: cart.map(item => ({
                            _id: item._id,
                            quantity: item.quantity,
                            name: item.name
                        })),
                        totalAmount: cartTotal,
                        orderSource: 'customer',
                        billSessionId: newSession.billSessionId,
                        customerName: newSession.customerName || custName,
                        customerPhone: newSession.customerPhone || custPhone,
                        customerEmail: newSession.customerEmail || custEmail
                    };
                    if (tableNumber) retryPayload.tableNumber = tableNumber;

                    const retryResponse = await axios.post('/api/order/place', retryPayload);

                    if (retryResponse.data.success) {
                        setOrderSuccess(true);
                        setCart([]);
                        setCustomerNameInput('');
                        setCustomerPhoneInput('');
                        setCustomerEmailInput('');
                        setPlacedCustomerName(retryPayload.customerName);
                        setBillSessionState(getBillSession());

                        setTimeout(() => {
                            setShowOrderModal(false);
                            setIsCartOpen(false);
                            setOrderSuccess(false);
                        }, 3000);
                        return;
                    }
                } catch {
                    // Fall through to generic error toast below
                }
            }

            setShowOrderModal(false);
            toast.error(error.response?.data?.message || "We couldn't place your order. Please try again.");
        } finally {
            setIsPlacingOrder(false);
        }
    }, [cart, cartTotal, tableNumber, location.pathname]);

    // ─── Handle "Confirm Order" click ──────────────────────────────────────────
    const handlePlaceOrderClick = () => {
        if (cart.length === 0) return;

        const isAdminRoute = location.pathname.startsWith('/admin');
        const adminUserStr = localStorage.getItem('adminUser');
        const adminUser = JSON.parse(adminUserStr || 'null');
        const isWaiterOrder = isAdminRoute && adminUser && (adminUser.role === 'waiter' || adminUser.role === 'admin');

        if (isWaiterOrder) {
            placeOrder(null, '');
            return;
        }

        const existingSession = getBillSession();

        if (existingSession?.billSessionId) {
            placeOrder(
                existingSession.billSessionId,
                existingSession.customerName || '',
                existingSession.customerPhone || '',
                existingSession.customerEmail || ''
            );
        } else {
            setShowNamePromptModal(true);
        }
    };

    // ─── Handle Customer Details Submission (first customer order) ────────────
    const handleNameSubmit = () => {
        const trimmedName = customerNameInput.trim();
        const trimmedPhone = customerPhoneInput.trim();
        const trimmedEmail = customerEmailInput.trim();

        if (!trimmedName) {
            setNamePromptError('Please enter your full name.');
            return;
        }
        if (trimmedName.length > 50) {
            setNamePromptError('Name must be 50 characters or less.');
            return;
        }
        if (!trimmedPhone) {
            setNamePromptError('Please enter your phone number.');
            return;
        }
        const cleanPhone = trimmedPhone.replace(/[\s\-\(\)\+]/g, '');
        if (cleanPhone.length < 10) {
            setNamePromptError('Please enter a valid 10-digit phone number.');
            return;
        }
        if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setNamePromptError('Please enter a valid email address or leave it empty.');
            return;
        }

        setNamePromptError('');
        const newSessionId = generateSessionId();
        setBillSession(newSessionId, trimmedName, trimmedPhone, trimmedEmail);
        setBillSessionState(getBillSession());

        setShowNamePromptModal(false);
        placeOrder(newSessionId, trimmedName, trimmedPhone, trimmedEmail);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background font-[Montserrat] pt-10 md:pt-14 pb-24 px-4 sm:px-6 relative">
            <style>{`
                .menu-grid { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); }
                @media (min-width: 640px) { .menu-grid { grid-template-columns: repeat(${Math.min(2, itemsPerRow)}, minmax(0, 1fr)); } }
                @media (min-width: 1024px) { .menu-grid { grid-template-columns: repeat(${Math.min(3, itemsPerRow)}, minmax(0, 1fr)); } }
                @media (min-width: 1280px) { .menu-grid { grid-template-columns: repeat(${itemsPerRow}, minmax(0, 1fr)); } }
                .menu-card-footer { container-type: inline-size; container-name: menu-card-footer; }
                .add-to-order-icon { display: none; }
                @container menu-card-footer (max-width: 230px) {
                    .add-to-order-label { display: none; }
                    .add-to-order-icon { display: inline-flex; }
                }
            `}</style>

            {/* Cart backdrop */}
            <AnimatePresence>
                {isCartOpen && (
                    <Motion.div
                        className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40"
                        onClick={() => setIsCartOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>

            {/* ── ORDER PANEL ─────────────────────────────────────────────── */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Your Order"
                aria-hidden={!isCartOpen}
                inert={!isCartOpen || undefined}
                className={`fixed inset-y-0 right-0 w-full md:w-[420px] bg-surface-container-lowest border-l border-surface-border shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-6 md:p-8 border-b border-surface-border flex justify-between items-center bg-surface-container-low">
                    <div className="flex items-center gap-3">
                        <Coffee className="text-primary" size={22} />
                        <div>
                            <h2 className="text-xl font-[Playfair_Display] font-bold text-primary leading-tight">Your Order</h2>
                            {cartItemCount > 0 && (
                                <p className="text-[11px] text-on-surface-variant font-medium">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''} selected</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        aria-label="Close order panel"
                        className="text-on-surface-variant hover:text-primary transition p-2 bg-surface-container rounded-full"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Active session banner */}
                {billSession && (
                    <div className="px-6 md:px-8 py-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0" />
                            <span className="text-xs font-semibold text-primary truncate">
                                Active Bill · {billSession.customerName || `Table ${tableNumber}`}
                            </span>
                        </div>
                        <Link
                            to="/bill"
                            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 shrink-0"
                            onClick={() => setIsCartOpen(false)}
                        >
                            <Receipt size={11} /> View Bill
                        </Link>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-on-surface-variant mt-16 flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                                <Coffee size={30} className="text-soft-gold" />
                            </div>
                            <p className="text-base font-semibold text-primary">Your order is empty</p>
                            <p className="text-xs text-on-surface-variant max-w-[220px]">Add something from the menu to begin your visit.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex justify-between items-center gap-3 bg-surface-container-low border border-surface-border p-4 rounded-lg soft-shadow">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-primary text-sm line-clamp-1">{item.name}</h4>
                                    <p className="text-xs text-on-surface-variant mt-1">₹{item.price} × {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-2.5 bg-white p-1 rounded-full border border-surface-border">
                                        <button
                                            onClick={() => updateQuantity(item._id, -1)}
                                            aria-label={`Decrease quantity of ${item.name}`}
                                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary hover:bg-surface-container active:scale-90 transition"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="font-bold text-xs text-primary w-4 text-center" aria-live="polite">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item._id, 1)}
                                            aria-label={`Increase quantity of ${item.name}`}
                                            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:brightness-110 active:scale-90 transition"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <span className="text-sm font-bold text-primary w-14 text-right shrink-0">₹{item.price * item.quantity}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 md:p-8 border-t border-surface-border bg-surface-container-low space-y-4 shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Total</span>
                        <span className="text-3xl font-[Playfair_Display] font-bold text-primary">₹{cartTotal}</span>
                    </div>

                    <button
                        onClick={handlePlaceOrderClick}
                        className="w-full btn-stitch-primary py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                        disabled={cart.length === 0 || isPlacingOrder}
                    >
                        {isPlacingOrder ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Processing...
                            </>
                        ) : (
                            billSession ? 'Add to My Bill' : 'Confirm Order'
                        )}
                    </button>

                    {billSession && (
                        <Link
                            to="/bill"
                            onClick={() => setIsCartOpen(false)}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs uppercase tracking-wider rounded-lg transition"
                        >
                            <Receipt size={14} /> View & Pay My Bill
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Floating Order Summary Bar (multi-item selection) ──────── */}
            {!isCartOpen && cart.length > 0 && (
                <div
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg bg-primary text-white p-3 px-5 rounded-2xl shadow-2xl flex items-center justify-between border border-soft-gold/30 backdrop-blur-md transition-all duration-300"
                    style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-soft-gold shrink-0">
                            <Coffee size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-white">
                                {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'} Selected
                            </p>
                            <p className="text-base font-bold text-soft-gold font-[Playfair_Display]">
                                ₹{cartTotal}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="bg-white text-primary hover:bg-soft-gold/20 hover:text-white py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-xl shadow transition active:scale-95 flex items-center gap-2 shrink-0"
                    >
                        <span>View Order</span>
                        <span>→</span>
                    </button>
                </div>
            )}

            {/* ── Floating "View Bill" button (when cart is empty but active session exists) */}
            {!isCartOpen && cart.length === 0 && billSession && (
                <Link
                    to="/bill"
                    className="fixed right-6 md:right-8 bg-white border border-primary text-primary p-4 px-6 rounded-full shadow-xl z-30 flex items-center gap-3 hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105"
                    style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <Receipt size={18} />
                    <span className="font-bold text-xs uppercase tracking-wider">View My Bill</span>
                </Link>
            )}

            {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
            <div className="max-w-container-max mx-auto">
                <div className="relative text-center mb-12 md:mb-14 overflow-hidden">
                    <div aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 w-[420px] h-[420px] rounded-full bg-soft-gold/10 blur-3xl pointer-events-none -z-10" />
                    <span className="text-soft-gold text-xs font-semibold uppercase tracking-[0.3em] mb-3 block">Taste The Calm</span>
                    <h1 className="text-4xl md:text-6xl font-[Playfair_Display] text-primary font-bold mb-4">The Menu</h1>
                    <div className="h-[2px] w-20 bg-soft-gold mx-auto opacity-70" />
                    <p className="mt-6 text-on-surface-variant font-light text-base md:text-lg max-w-2xl mx-auto whitespace-nowrap">
                        Organic coffees, artisan teas, and slow-crafted plates — order at your own pace.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-5">
                        {tableNumber && (
                            <div className="inline-block bg-primary/5 border border-primary/20 text-primary text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                Dining at Table: {tableNumber}
                            </div>
                        )}
                        {billSession && (
                            <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                Active Bill · {billSession.customerName}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-10 md:mb-12 space-y-6 max-w-4xl mx-auto">
                    <div className="relative group">
                        <label htmlFor="menu-search" className="sr-only">Search the menu</label>
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-soft-gold h-5 w-5 pointer-events-none" />
                        <input
                            id="menu-search"
                            type="text"
                            placeholder="Search the menu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-11 py-3.5 rounded-full border border-surface-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white shadow-sm text-sm transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-surface-container-low transition"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 md:gap-3" role="group" aria-label="Filter by category">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                aria-pressed={selectedCategory === cat}
                                className={`px-5 md:px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 active:scale-95 ${selectedCategory === cat
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-white text-on-surface-variant border border-surface-border hover:border-primary/30 hover:text-primary'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div className="menu-grid gap-5 md:gap-6 lg:gap-8" aria-busy="true" aria-label="Loading menu">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border border-surface-border overflow-hidden animate-pulse">
                                <div className="aspect-square p-4 pb-0">
                                    <div className="w-full h-full arch-frame bg-surface-container-high" />
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 w-2/3 bg-surface-container-high rounded" />
                                    <div className="h-3 w-full bg-surface-container-high rounded" />
                                    <div className="h-3 w-4/5 bg-surface-container-high rounded" />
                                    <div className="h-6 w-1/3 bg-surface-container-high rounded mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : menuError ? (
                    <div className="max-w-md mx-auto text-center py-16 px-6 bg-surface-container-low border border-surface-border rounded-lg">
                        <Coffee className="h-12 w-12 mx-auto mb-4 text-soft-gold" />
                        <h2 className="text-xl font-[Playfair_Display] font-semibold text-primary">The menu is resting</h2>
                        <p className="text-sm text-on-surface-variant mt-2 mb-6">{menuError}</p>
                        <button onClick={() => window.location.reload()} className="btn-stitch-primary text-xs uppercase tracking-wider">Try Again</button>
                    </div>
                ) : (
                    <>
                        {filteredItems.length === 0 ? (
                            menuItems.length === 0 ? (
                                <div className="text-center py-16 text-on-surface-variant max-w-md mx-auto">
                                    <Coffee className="h-12 w-12 mx-auto mb-4 text-soft-gold/60" />
                                    <h2 className="text-lg font-[Playfair_Display] font-semibold text-primary mb-2">Our menu is being prepared</h2>
                                    <p className="text-sm font-light">Please check back shortly, or ask your server for today's specials.</p>
                                </div>
                            ) : (
                                <div className="text-center py-16 text-on-surface-variant max-w-md mx-auto">
                                    <SearchX className="h-12 w-12 mx-auto mb-4 text-soft-gold/60" />
                                    <h2 className="text-lg font-[Playfair_Display] font-semibold text-primary mb-2">No dishes match your search</h2>
                                    <p className="text-sm font-light mb-6">Try a different keyword or explore another category.</p>
                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className="btn-stitch-outline text-xs uppercase tracking-wider !py-2.5 !px-6">
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="menu-grid gap-5 md:gap-6 lg:gap-8">
                                {filteredItems.map((item) => (
                                    <div key={item._id} className="bg-white rounded-lg border border-surface-border overflow-hidden soft-shadow flex flex-col group relative premium-hover">
                                        <div className="aspect-square overflow-hidden relative p-4 pb-0">
                                            <div className="w-full h-full arch-frame overflow-hidden border border-surface-border ring-0 ring-soft-gold/0 group-hover:ring-2 group-hover:ring-soft-gold/40 transition-all duration-300">
                                                <img
                                                    src={item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop'}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop' }}
                                                />
                                            </div>
                                            <div className="absolute top-6 right-6 bg-white/95 border border-surface-border px-3 py-1 rounded-full text-[10px] font-semibold text-primary uppercase tracking-wider">
                                                {item.category?.name || 'Organic'}
                                            </div>
                                        </div>

                                        <div className="p-6 flex-grow flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-[Playfair_Display] font-bold text-primary">{item.name}</h3>
                                                {item.description && (
                                                    <p className="text-on-surface-variant text-sm font-light line-clamp-2 leading-relaxed">{item.description}</p>
                                                )}
                                            </div>
                                            <div className="menu-card-footer flex justify-between items-center mt-6 pt-4 border-t border-surface-border/50">
                                                <span className="text-lg font-bold text-primary">₹{item.price}</span>
                                                {(() => {
                                                    const cartItem = cart.find(c => c._id === item._id);
                                                    if (cartItem && cartItem.quantity > 0) {
                                                        return (
                                                            <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-full p-1 shrink-0">
                                                                <button
                                                                    onClick={() => updateQuantity(item._id, -1)}
                                                                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-surface-container active:scale-90 transition"
                                                                    aria-label="Decrease quantity"
                                                                >
                                                                    <Minus size={13} />
                                                                </button>
                                                                <span className="font-bold text-xs text-primary px-1.5 min-w-[20px] text-center">
                                                                    {cartItem.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item._id, 1)}
                                                                    className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:brightness-110 active:scale-90 transition"
                                                                    aria-label="Increase quantity"
                                                                >
                                                                    <Plus size={13} />
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            title="Add to Order"
                                                            aria-label="Add to Order"
                                                            className="btn-stitch-outline !px-4 !py-2 text-xs font-semibold tracking-wider uppercase whitespace-nowrap bg-white/50 flex items-center justify-center shrink-0 hover:bg-primary hover:text-white transition"
                                                        >
                                                            <Plus size={14} className="shrink-0 mr-1" />
                                                            <span>Add</span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── ORDER PROCESSING MODAL ────────────────────────────────── */}
            <AnimatePresence>
            {showOrderModal && (
                <Motion.div
                    className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    role="dialog" aria-modal="true" aria-live="polite"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && orderSuccess) {
                            setShowOrderModal(false);
                            setIsCartOpen(false);
                            setOrderSuccess(false);
                        }
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Motion.div
                        className="bg-white rounded-lg border border-surface-border w-full max-w-sm p-8 text-center shadow-2xl relative"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {orderSuccess ? (
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowOrderModal(false); setIsCartOpen(false); setOrderSuccess(false); }}
                                    className="absolute top-4 right-4 text-on-surface-variant/60 hover:text-primary transition p-1.5 rounded-full hover:bg-surface-container"
                                    aria-label="Close modal"
                                >
                                    <X size={16} />
                                </button>
                                <div className="mx-auto w-16 h-16 bg-primary/5 border border-primary/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="text-primary w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-[Playfair_Display] font-bold text-primary">Added to Your Bill!</h3>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Your order is on its way to the kitchen. Continue browsing or settle up whenever you're ready.
                                </p>
                                {tableNumber ? (
                                    <span className="inline-block bg-primary/5 text-primary text-xs font-semibold px-3 py-1 rounded-full">Table: {tableNumber}</span>
                                ) : placedCustomerName ? (
                                    <span className="inline-block bg-primary/5 text-primary text-xs font-semibold px-3 py-1 rounded-full">Bill: {placedCustomerName}</span>
                                ) : null}

                                <div className="space-y-2 pt-2">
                                    <Link
                                        to="/bill"
                                        onClick={() => { setShowOrderModal(false); setIsCartOpen(false); setOrderSuccess(false); }}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 border border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs uppercase tracking-wider rounded-lg transition"
                                    >
                                        <Receipt size={14} /> View My Bill
                                    </Link>
                                    <Link
                                        to="/"
                                        onClick={() => { setShowOrderModal(false); setIsCartOpen(false); setOrderSuccess(false); }}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider rounded-lg transition shadow-xs"
                                    >
                                        <Compass size={14} /> Explore More About Olive Cafe
                                    </Link>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setShowOrderModal(false); setIsCartOpen(false); setOrderSuccess(false); }}
                                    className="block w-full text-center text-[11px] font-medium text-on-surface-variant hover:text-primary transition pt-0.5"
                                >
                                    Continue Browsing Menu
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary" size={28} />
                                </div>
                                <h3 className="text-lg font-[Playfair_Display] font-bold text-primary">Sending Your Order...</h3>
                                <p className="text-xs text-on-surface-variant">Please wait while we let the kitchen know.</p>
                            </div>
                        )}
                    </Motion.div>
                </Motion.div>
            )}
            </AnimatePresence>

            {/* ── CUSTOMER NAME PROMPT MODAL ────────────────────────────── */}
            <AnimatePresence>
            {showNamePromptModal && (
                <Motion.div
                    className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    role="dialog" aria-modal="true" aria-label="Start your bill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Motion.div
                        className="bg-white rounded-lg border border-surface-border w-full max-w-md p-8 shadow-2xl flex flex-col gap-6"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Coffee className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-[Playfair_Display] font-bold text-primary">Welcome to OLIV</h3>
                            <p className="text-xs text-on-surface-variant">
                                Please share your details to place your order — we won't ask again during this visit.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label htmlFor="customer-name" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                                    <User size={13} className="text-primary" /> Full Name <span className="text-error">*</span>
                                </label>
                                <input
                                    id="customer-name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={customerNameInput}
                                    onChange={(e) => {
                                        setCustomerNameInput(e.target.value);
                                        if (namePromptError) setNamePromptError('');
                                    }}
                                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
                                    maxLength={50}
                                    autoFocus
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1">
                                <label htmlFor="customer-phone" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                                    <Phone size={13} className="text-primary" /> Phone Number <span className="text-error">*</span>
                                </label>
                                <input
                                    id="customer-phone"
                                    type="tel"
                                    placeholder="Enter 10-digit phone number"
                                    value={customerPhoneInput}
                                    onChange={(e) => {
                                        setCustomerPhoneInput(e.target.value);
                                        if (namePromptError) setNamePromptError('');
                                    }}
                                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
                                    maxLength={15}
                                />
                            </div>

                            {/* Email ID (Optional) */}
                            <div className="space-y-1">
                                <label htmlFor="customer-email" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                                    <Mail size={13} className="text-primary" /> Email ID <span className="text-xs font-normal opacity-70 normal-case">(Optional)</span>
                                </label>
                                <input
                                    id="customer-email"
                                    type="email"
                                    placeholder="Enter email address (optional)"
                                    value={customerEmailInput}
                                    onChange={(e) => {
                                        setCustomerEmailInput(e.target.value);
                                        if (namePromptError) setNamePromptError('');
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); }}
                                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
                                    maxLength={80}
                                />
                            </div>

                            {namePromptError && (
                                <p className="text-error text-xs font-medium">{namePromptError}</p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowNamePromptModal(false);
                                    setCustomerNameInput('');
                                    setCustomerPhoneInput('');
                                    setCustomerEmailInput('');
                                    setNamePromptError('');
                                }}
                                className="flex-1 py-3 border border-surface-border text-on-surface-variant hover:bg-surface-container-low font-semibold text-xs uppercase tracking-wider rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNameSubmit}
                                className="flex-1 py-3 btn-stitch-primary text-xs font-bold uppercase tracking-wider"
                            >
                                Confirm & Order
                            </button>
                        </div>
                    </Motion.div>
                </Motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default MenuPage;
