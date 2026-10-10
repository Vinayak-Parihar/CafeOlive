import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, LogOut, Menu, Users, ChefHat, Coffee, X, Settings as SettingsIcon, Calendar, MessageSquare } from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                await axios.get('/api/users/current-user');
            } catch (error) {
                console.error("Session expired or invalid:", error);
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
            <div className="flex h-screen items-center justify-center bg-oliv-cream dark:bg-oliv-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-oliv-gold" />
            </div>
        );
    }

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    if (!user || !user.role) {
        return <Navigate to="/admin" replace />;
    }

    const isAdmin = user?.role === 'admin';
    const canManageSettings = ['admin', 'manager'].includes(user?.role);
    const isChef = user?.role === 'chef' || isAdmin;
    const isWaiter = user?.role === 'waiter' || isAdmin;

    const isActive = (path) => location.pathname === path;

    return (
            <div className="fixed inset-0 flex h-dvh min-h-0 overflow-hidden bg-oliv-cream dark:bg-oliv-dark text-oliv-dark dark:text-oliv-cream font-sans transition-colors duration-300">

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-oliv-cream dark:bg-oliv-dark p-4 flex justify-between items-center z-40 border-b border-oliv-gold/30 shadow-md transition-colors duration-300">
                <h2 className="text-xl font-bold text-oliv-green dark:text-soft-gold flex items-center gap-2 font-serif">
                    <Coffee size={24} /> CafeOlive Admin
                </h2>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'} aria-expanded={isSidebarOpen} className="text-oliv-green dark:text-oliv-cream bg-white/70 dark:bg-white/10 p-2 rounded-lg transition-colors duration-300">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-72 h-full min-h-0 flex flex-col bg-oliv-cream dark:bg-oliv-dark shadow-2xl transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:block flex-shrink-0 border-r border-oliv-gold/30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-oliv-gold/30 flex justify-between items-center transition-colors duration-300">
                    <h2 className="text-2xl font-bold text-oliv-green dark:text-soft-gold flex items-center gap-2 font-serif">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin'}
                    </h2>
                    <button onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar" className="lg:hidden text-oliv-green hover:text-oliv-gold dark:text-oliv-cream dark:hover:text-soft-gold">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {isAdmin && (
                        <Link
                            to="/admin/dashboard"
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/dashboard')
                                ? 'bg-oliv-green text-white shadow-lg'
                                : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                }`}
                        >
                            <LayoutDashboard size={20} />
                            Dashboard
                        </Link>
                    )}

                    {isAdmin && (
                        <>
                            <Link
                                to="/admin/staff"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/staff')
                                    ? 'bg-oliv-green text-white shadow-lg'
                                    : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                    }`}
                            >
                                <Users size={20} />
                                Staff
                            </Link>

                            <Link
                                to="/admin/add-menu"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/add-menu')
                                    ? 'bg-oliv-green text-white shadow-lg'
                                    : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                    }`}
                            >
                                <PlusCircle size={20} />
                                Add Items
                            </Link>

                            <Link
                                to="/admin/reviews"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/reviews')
                                    ? 'bg-orange-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <SettingsIcon size={20} />
                                Reviews
                            </Link>
                        </>
                    )}

                    {canManageSettings && (
                        <Link
                            to="/admin/settings"
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings')
                                ? 'bg-oliv-green text-white shadow-lg'
                                : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                }`}
                        >
                            <SettingsIcon size={20} />
                            Settings
                        </Link>
                    )}

                    {isChef && (
                        <Link
                            to="/admin/kitchen"
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/kitchen')
                                ? 'bg-oliv-green text-white shadow-lg'
                                : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                }`}
                        >
                            <ChefHat size={20} />
                            Kitchen (KDS)
                        </Link>
                    )}

                    {isWaiter && (
                        <>
                            <Link
                                to="/admin/service"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/service')
                                    ? 'bg-oliv-green text-white shadow-lg'
                                    : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                    }`}
                            >
                                <Coffee size={20} />
                                Service
                            </Link>

                            <Link
                                to="/admin/take-order"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/take-order')
                                    ? 'bg-oliv-green text-white shadow-lg'
                                    : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                    }`}
                            >
                                <PlusCircle size={20} />
                                Take Order
                            </Link>

                            <Link
                                to="/admin/reservations"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/reservations')
                                    ? 'bg-oliv-green text-white shadow-lg'
                                    : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                    }`}
                            >
                                <Calendar size={20} />
                                Reservations
                            </Link>

                            <Link
                                to="/admin/inquiries"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/inquiries')
                                    ? 'bg-oliv-green text-white shadow-lg'
                                    : 'text-oliv-dark/75 dark:text-oliv-cream/75 hover:bg-oliv-gold/15 dark:hover:bg-white/10 hover:text-oliv-green dark:hover:text-white'
                                    }`}
                            >
                                <MessageSquare size={20} />
                                Inquiries
                            </Link>
                        </>
                    )}
                </nav>


                <div className="p-4 border-t border-oliv-gold/30 space-y-2 transition-colors duration-300">
                    <div className="flex justify-between items-center px-4 py-2 bg-white/60 dark:bg-white/5 rounded-lg transition-colors duration-300">
                        <span className="text-oliv-dark/70 dark:text-oliv-cream/70 text-sm font-medium">Theme</span>
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8">
                    <Outlet />
                </div>
            </main>
        </div >
    );
};

export default AdminLayout;
