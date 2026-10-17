import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, LogOut, Menu, Users, ChefHat,
    Coffee, X, Settings as SettingsIcon, Calendar, MessageSquare, Star, Sparkles, Receipt
} from 'lucide-react';
import axios from 'axios';
import ArtisanalCupMotif from '../components/ArtisanalCupMotif';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    const handleLogout = async () => {
        try {
            await axios.post('/api/users/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('adminUser');
            navigate('/admin');
        }
    };

    useEffect(() => {
        const verifySession = async () => {
            try {
                await axios.get('/api/users/current-user');
            } catch (error) {
                console.error("Session expired:", error);
                localStorage.removeItem('adminUser');
                navigate('/admin');
            } finally {
                setIsCheckingSession(false);
            }
        };
        verifySession();
    }, [navigate]);

    if (isCheckingSession) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FAF8F3]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e2a1b]" />
            </div>
        );
    }

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (!user || !user.role) {
        return <Navigate to="/admin" replace />;
    }

    const isAdmin = user?.role === 'admin';
    const canManageSettings = ['admin', 'manager', 'cashier'].includes(user?.role);
    const isChef = user?.role === 'chef' || isAdmin;
    const isWaiter = user?.role === 'waiter' || isAdmin;
    const isCashier = ['admin', 'manager', 'cashier'].includes(user?.role);
    // Hall & Venue booking access granted to all staff members: Admin, Manager, Receiver (Cashier), Kitchen (Chef), Servant (Waiter)
    const canViewHallReservations = ['admin', 'manager', 'cashier', 'chef', 'waiter'].includes(user?.role);

    const isActive = (path) => location.pathname === path;

    const navItemClass = (path) => {
        const active = isActive(path);
        return `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all duration-200 ${
            active
                ? 'bg-[#1e2a1b] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#1e2a1b] hover:bg-black/5'
        }`;
    };

    const roleName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin';

    return (
        <div className="fixed inset-0 flex h-dvh min-h-0 overflow-hidden bg-[#FAF8F3] text-[#1e2a1b] font-sans">
            {/* Mobile Top Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md px-4 flex justify-between items-center z-40 border-b border-[#e8e2d5] shadow-sm">
                <Link to="/" className="flex items-center gap-2">
                    <span className="font-serif text-xl font-bold tracking-widest text-[#1e2a1b]">OLIV</span>
                    <span className="text-[10px] text-[#c2a677] uppercase tracking-wider font-semibold">Desk</span>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    className="p-2 rounded-xl bg-stone-100 text-[#1e2a1b]"
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 w-72 h-full min-h-0 flex flex-col bg-white border-r border-[#e8e2d5] shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:block flex-shrink-0 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Brand & User Profile */}
                <div className="p-6 border-b border-[#ece7dc] space-y-3">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex flex-col">
                            <span className="font-serif text-2xl font-bold tracking-[0.3em] text-[#1e2a1b]">OLIV</span>
                            <span className="text-[8px] uppercase tracking-[0.4em] text-[#c2a677] font-semibold">Atelier Portal</span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden p-1 text-stone-400 hover:text-stone-700"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="pt-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ee] text-[#1e2a1b] text-[11px] font-semibold tracking-wider">
                            <Sparkles size={12} className="text-[#c2a677]" />
                            <span>{roleName} Role</span>
                        </div>
                        <p className="text-xs text-stone-500 font-light mt-1 truncate">
                            {user.fullName || user.username || 'Staff Member'}
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
                    {isAdmin && (
                        <Link
                            to="/admin/dashboard"
                            onClick={() => setIsSidebarOpen(false)}
                            className={navItemClass('/admin/dashboard')}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>
                    )}

                    {isChef && (
                        <Link
                            to="/admin/kitchen"
                            onClick={() => setIsSidebarOpen(false)}
                            className={navItemClass('/admin/kitchen')}
                        >
                            <ChefHat size={18} />
                            Kitchen (KDS)
                        </Link>
                    )}

                    {isWaiter && (
                        <>
                            <Link
                                to="/admin/service"
                                onClick={() => setIsSidebarOpen(false)}
                                className={navItemClass('/admin/service')}
                            >
                                <Coffee size={18} />
                                Service Floor
                            </Link>

                            <Link
                                to="/admin/take-order"
                                onClick={() => setIsSidebarOpen(false)}
                                className={navItemClass('/admin/take-order')}
                            >
                                <PlusCircle size={18} />
                                Take Order
                            </Link>
                        </>
                    )}

                    {isCashier && (
                        <Link
                            to="/admin/billing"
                            onClick={() => setIsSidebarOpen(false)}
                            className={navItemClass('/admin/billing')}
                        >
                            <Receipt size={18} />
                            Billing Desk
                        </Link>
                    )}

                    {/* Hall & Sanctuary Reservations - Visible to all staff members (Admin, Manager, Cashier, Chef, Waiter) */}
                    {canViewHallReservations && (
                        <Link
                            to="/admin/reservations"
                            onClick={() => setIsSidebarOpen(false)}
                            className={navItemClass('/admin/reservations')}
                        >
                            <Calendar size={18} />
                            Reservations
                        </Link>
                    )}

                    {isAdmin && (
                        <>
                            <Link
                                to="/admin/inquiries"
                                onClick={() => setIsSidebarOpen(false)}
                                className={navItemClass('/admin/inquiries')}
                            >
                                <MessageSquare size={18} />
                                Inquiries
                            </Link>

                            <Link
                                to="/admin/add-menu"
                                onClick={() => setIsSidebarOpen(false)}
                                className={navItemClass('/admin/add-menu')}
                            >
                                <PlusCircle size={18} />
                                Add Menu
                            </Link>

                            <Link
                                to="/admin/staff"
                                onClick={() => setIsSidebarOpen(false)}
                                className={navItemClass('/admin/staff')}
                            >
                                <Users size={18} />
                                Staff Team
                            </Link>

                            <Link
                                to="/admin/reviews"
                                onClick={() => setIsSidebarOpen(false)}
                                className={navItemClass('/admin/reviews')}
                            >
                                <Star size={18} />
                                Reviews
                            </Link>
                        </>
                    )}

                    {canManageSettings && (
                        <Link
                            to="/admin/settings"
                            onClick={() => setIsSidebarOpen(false)}
                            className={navItemClass('/admin/settings')}
                        >
                            <SettingsIcon size={18} />
                            Settings
                        </Link>
                    )}
                </nav>

                {/* Footer Logout Action */}
                <div className="p-4 border-t border-[#ece7dc] space-y-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-rose-700 hover:bg-rose-50 rounded-2xl text-xs uppercase tracking-wider font-semibold transition"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Outlet Workspace */}
            <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden bg-[#FAF8F3] relative">
                {/* Stationary cup motif in the center of the admin workspace */}
                <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0">
                    <ArtisanalCupMotif opacity="opacity-[0.06]" scale="scale-110" />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8 relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
