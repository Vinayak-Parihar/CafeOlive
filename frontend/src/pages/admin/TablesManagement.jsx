import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    QrCode, Plus, RefreshCw, Printer, Download, Copy,
    Users, Utensils, CheckCircle, Clock, AlertCircle, Trash2, Search, Eye, X
} from 'lucide-react';

const TablesManagement = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newCapacity, setNewCapacity] = useState('4');
    const [isSaving, setIsSaving] = useState(false);

    // QR Preview & Print modal
    const [selectedTableForPrint, setSelectedTableForPrint] = useState(null);
    const [resettingTableId, setResettingTableId] = useState(null);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/tables');
            if (res.data?.success) {
                setTables(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch tables:", err);
            toast.error(err.response?.data?.message || "Failed to load tables list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    // Filtered tables list
    const filteredTables = useMemo(() => {
        return tables.filter(t => {
            const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
            const search = searchQuery.toLowerCase();
            const matchesSearch =
                t.table_number.toLowerCase().includes(search) ||
                (t.current_customer_name && t.current_customer_name.toLowerCase().includes(search)) ||
                (t.current_customer_phone && t.current_customer_phone.includes(search));
            return matchesFilter && matchesSearch;
        });
    }, [tables, filterStatus, searchQuery]);

    // Statistics counts
    const stats = useMemo(() => {
        const total = tables.length;
        const available = tables.filter(t => t.status === 'available').length;
        const occupied = tables.filter(t => t.status === 'occupied').length;
        const inactive = tables.filter(t => t.status === 'inactive').length;
        return { total, available, occupied, inactive };
    }, [tables]);

    // Add / Generate Table
    const handleAddTable = async (e) => {
        e.preventDefault();
        const cleanNumber = newTableNumber.trim();
        if (!cleanNumber) {
            toast.error("Please enter a table number.");
            return;
        }

        try {
            setIsSaving(true);
            const res = await axios.post('/api/tables', {
                table_number: cleanNumber,
                capacity: Number(newCapacity) || 4
            });

            if (res.data?.success) {
                toast.success(`Table ${cleanNumber} generated with dynamic QR code.`);
                setNewTableNumber('');
                setIsAddModalOpen(false);
                fetchTables();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create table.");
        } finally {
            setIsSaving(false);
        }
    };

    // Close / Reset Table Session
    const handleResetSession = async (table) => {
        if (!window.confirm(`Close active dining session for Table ${table.table_number}? This will reset table to available for the next guests.`)) {
            return;
        }

        try {
            setResettingTableId(table.id);
            const res = await axios.post(`/api/tables/${table.id}/reset`);
            if (res.data?.success) {
                toast.success(`Table ${table.table_number} session closed & marked available!`);
                fetchTables();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset table session.");
        } finally {
            setResettingTableId(null);
        }
    };

    // Delete Table
    const handleDeleteTable = async (table) => {
        if (!window.confirm(`Are you sure you want to delete Table ${table.table_number}?`)) {
            return;
        }

        try {
            const res = await axios.delete(`/api/tables/${table.id}`);
            if (res.data?.success) {
                toast.success(`Table ${table.table_number} deleted.`);
                fetchTables();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete table.");
        }
    };

    // Download QR Code PNG
    const handleDownloadQr = (table) => {
        if (!table.qr_code_url) return;
        const link = document.createElement('a');
        link.href = table.qr_code_url;
        link.download = `cafe-olive-table-${table.table_number}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded QR code for Table ${table.table_number}`);
    };

    // Copy Scan Link
    const handleCopyLink = (table) => {
        const link = `${window.location.origin}/scan?table=${encodeURIComponent(table.table_number)}`;
        navigator.clipboard.writeText(link);
        toast.success(`Copied: ${link}`);
    };

    // Trigger Print Window for QR Tent Card
    const triggerPrint = (table) => {
        const printWindow = window.open('', '_blank');
        const scanUrl = `${window.location.origin}/scan?table=${encodeURIComponent(table.table_number)}`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Table ${table.table_number} QR Tent Card - Cafe Olive</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                    body {
                        margin: 0;
                        padding: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: #FAF8F3;
                        color: #1e2a1b;
                    }
                    .card {
                        width: 360px;
                        background: #ffffff;
                        border: 2px solid #e8e2d5;
                        border-radius: 24px;
                        padding: 36px 28px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    }
                    .brand {
                        font-family: 'Playfair Display', serif;
                        font-size: 26px;
                        letter-spacing: 4px;
                        font-weight: 700;
                        color: #1e2a1b;
                        margin: 0;
                    }
                    .tagline {
                        font-size: 10px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        color: #c2a677;
                        font-weight: 600;
                        margin-top: 4px;
                    }
                    .badge {
                        display: inline-block;
                        margin: 20px 0 16px 0;
                        padding: 6px 18px;
                        background: #1e2a1b;
                        color: #ffffff;
                        border-radius: 30px;
                        font-size: 15px;
                        font-weight: 700;
                        letter-spacing: 1px;
                    }
                    .qr-wrap {
                        padding: 14px;
                        background: #FAF8F3;
                        border-radius: 20px;
                        display: inline-block;
                        margin-bottom: 16px;
                        border: 1px solid #e8e2d5;
                    }
                    .qr-wrap img {
                        width: 200px;
                        height: 200px;
                        display: block;
                    }
                    .instructions {
                        font-size: 13px;
                        font-weight: 600;
                        color: #1e2a1b;
                        margin-bottom: 6px;
                    }
                    .sub-instructions {
                        font-size: 11px;
                        color: #78716c;
                        line-height: 1.4;
                    }
                    .url-caption {
                        font-size: 9px;
                        color: #a8a29e;
                        margin-top: 14px;
                        word-break: break-all;
                    }
                    @media print {
                        body { background: transparent; padding: 0; }
                        .card { border: 1px solid #ccc; box-shadow: none; margin: 0 auto; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1 class="brand">CAFE OLIVE</h1>
                    <div class="tagline">Atelier & Dining Sanctuary</div>
                    <div class="badge">TABLE ${table.table_number}</div>
                    <div class="qr-wrap">
                        <img src="${table.qr_code_url}" alt="Table ${table.table_number} QR Code" />
                    </div>
                    <div class="instructions">Scan with your phone camera</div>
                    <div class="sub-instructions">View our digital menu & order directly from your table.</div>
                    <div class="url-caption">${scanUrl}</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e8e2d5] shadow-xs">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#e8e2d5] text-[11px] font-semibold tracking-wider uppercase text-[#c2a677] mb-2">
                        <QrCode size={13} className="text-[#c2a677]" />
                        <span>Dining Floor & Table QR Desk</span>
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1e2a1b]">
                        Tables & QR Code Ordering
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Generate dynamic QR codes for tabletop dining, track active guests, and close sessions on checkout.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTables}
                        disabled={loading}
                        className="p-3 rounded-2xl border border-[#e8e2d5] bg-[#FAF8F3] text-stone-600 hover:text-[#1e2a1b] hover:bg-stone-100 transition"
                        title="Refresh Tables"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-[#1e2a1b] text-white rounded-2xl text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#283824] transition"
                    >
                        <Plus size={16} />
                        <span>Add Table</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Counter */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#e8e2d5] flex items-center justify-between">
                    <div>
                        <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Total Tables</span>
                        <span className="font-serif text-2xl font-bold text-[#1e2a1b]">{stats.total}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Utensils size={18} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e8e2d5] flex items-center justify-between">
                    <div>
                        <span className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold block">Available</span>
                        <span className="font-serif text-2xl font-bold text-emerald-700">{stats.available}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle size={18} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e8e2d5] flex items-center justify-between">
                    <div>
                        <span className="text-[11px] uppercase tracking-wider text-amber-600 font-semibold block">Seated / Occupied</span>
                        <span className="font-serif text-2xl font-bold text-amber-700">{stats.occupied}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Users size={18} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e8e2d5] flex items-center justify-between">
                    <div>
                        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">Inactive</span>
                        <span className="font-serif text-2xl font-bold text-stone-500">{stats.inactive}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                        <AlertCircle size={18} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e8e2d5]">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {['all', 'available', 'occupied', 'inactive'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold capitalize transition ${
                                filterStatus === status
                                    ? 'bg-[#1e2a1b] text-white shadow-xs'
                                    : 'bg-[#FAF8F3] text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search by table or guest..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:border-[#1e2a1b]"
                    />
                </div>
            </div>

            {/* Tables Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
                    <div className="w-8 h-8 rounded-full border-2 border-[#1e2a1b] border-t-transparent animate-spin" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Loading tables...</span>
                </div>
            ) : filteredTables.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-[#e8e2d5] text-center space-y-3">
                    <QrCode size={40} className="mx-auto text-stone-300" />
                    <h3 className="font-serif text-lg font-bold text-stone-700">No tables found</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        {tables.length === 0
                            ? "Get started by adding tables to generate dynamic QR ordering codes."
                            : "No tables match your selected filter or search term."}
                    </p>
                    {tables.length === 0 && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e2a1b] text-white rounded-xl text-xs font-semibold uppercase tracking-wider"
                        >
                            <Plus size={14} />
                            Add First Table
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTables.map((table) => {
                        const isOccupied = table.status === 'occupied';
                        const isResetting = resettingTableId === table.id;

                        return (
                            <div
                                key={table.id}
                                className={`bg-white rounded-3xl border transition duration-200 overflow-hidden flex flex-col justify-between shadow-xs ${
                                    isOccupied ? 'border-amber-200 ring-1 ring-amber-200/50' : 'border-[#e8e2d5]'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-[#f0ece3]">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-[#c2a677] font-semibold block">
                                                Dining Station
                                            </span>
                                            <h3 className="font-serif text-2xl font-bold text-[#1e2a1b]">
                                                Table {table.table_number}
                                            </h3>
                                            <span className="text-xs text-stone-500 font-medium">
                                                Capacity: {table.capacity || 4} guests
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            {isOccupied ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                    Occupied
                                                </span>
                                            ) : table.status === 'available' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Available
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body: Seated Guest or QR Preview */}
                                <div className="p-5 flex-1 flex flex-col justify-center">
                                    {isOccupied ? (
                                        <div className="bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl p-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-500 font-medium">Guest Name:</span>
                                                <span className="font-semibold text-[#1e2a1b]">{table.current_customer_name || 'Anonymous Guest'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-500 font-medium">Contact:</span>
                                                <span className="font-semibold text-stone-700">{table.current_customer_phone || 'N/A'}</span>
                                            </div>
                                            {table.orders && table.orders.length > 0 && (
                                                <div className="pt-2 border-t border-[#e8e2d5] flex items-center justify-between text-xs">
                                                    <span className="text-stone-500 font-medium">Active Tab:</span>
                                                    <span className="font-serif font-bold text-[#1e2a1b]">₹{table.totalBill} ({table.orders.length} orders)</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl p-3">
                                            {table.qr_code_url ? (
                                                <img
                                                    src={table.qr_code_url}
                                                    alt={`QR Code Table ${table.table_number}`}
                                                    className="w-16 h-16 rounded-xl border border-stone-200 bg-white p-1 cursor-pointer hover:scale-105 transition"
                                                    onClick={() => setSelectedTableForPrint(table)}
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-stone-200 flex items-center justify-center text-stone-400">
                                                    <QrCode size={24} />
                                                </div>
                                            )}
                                            <div className="text-xs">
                                                <span className="font-semibold text-[#1e2a1b] block">Ready for Scan</span>
                                                <p className="text-[11px] text-stone-500 mt-0.5">
                                                    Prints tent card or scan directly from tabletop.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Actions */}
                                <div className="p-4 bg-stone-50/70 border-t border-[#f0ece3] flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => triggerPrint(table)}
                                            title="Print QR Acrylic Tent Card"
                                            className="p-2.5 rounded-xl bg-white border border-[#e8e2d5] text-stone-600 hover:text-[#1e2a1b] hover:bg-stone-50 transition"
                                        >
                                            <Printer size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadQr(table)}
                                            title="Download QR PNG"
                                            className="p-2.5 rounded-xl bg-white border border-[#e8e2d5] text-stone-600 hover:text-[#1e2a1b] hover:bg-stone-50 transition"
                                        >
                                            <Download size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleCopyLink(table)}
                                            title="Copy Direct Scan URL"
                                            className="p-2.5 rounded-xl bg-white border border-[#e8e2d5] text-stone-600 hover:text-[#1e2a1b] hover:bg-stone-50 transition"
                                        >
                                            <Copy size={15} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOccupied && (
                                            <button
                                                onClick={() => handleResetSession(table)}
                                                disabled={isResetting}
                                                className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-amber-700 active:scale-95 transition disabled:opacity-50"
                                            >
                                                {isResetting ? "Resetting..." : "Reset Table"}
                                            </button>
                                        )}
                                        {!isOccupied && (
                                            <button
                                                onClick={() => handleDeleteTable(table)}
                                                title="Delete Table"
                                                className="p-2.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Table Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-[#e8e2d5] shadow-2xl p-6 sm:p-8 relative">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        >
                            <X size={18} />
                        </button>

                        <div className="mb-5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#e8e2d5] text-[10px] font-semibold tracking-wider uppercase text-[#c2a677] mb-2">
                                <Plus size={12} />
                                <span>Floor Setup</span>
                            </div>
                            <h2 className="font-serif text-2xl font-bold text-[#1e2a1b]">Add New Dining Table</h2>
                            <p className="text-xs text-stone-500 mt-1">
                                An instant high-resolution dynamic QR code will be generated for this table.
                            </p>
                        </div>

                        <form onSubmit={handleAddTable} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-600 mb-1">
                                    Table Number / Identifier
                                </label>
                                <input
                                    type="text"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                    placeholder="e.g. 5, T-12, Outdoor-1"
                                    required
                                    className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl text-sm font-semibold text-[#1e2a1b] focus:outline-none focus:border-[#1e2a1b]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-600 mb-1">
                                    Seating Capacity
                                </label>
                                <select
                                    value={newCapacity}
                                    onChange={(e) => setNewCapacity(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#e8e2d5] rounded-2xl text-sm font-semibold text-[#1e2a1b] focus:outline-none focus:border-[#1e2a1b]"
                                >
                                    <option value="2">2 Guests (Intimate / Bistro)</option>
                                    <option value="4">4 Guests (Standard Booth)</option>
                                    <option value="6">6 Guests (Family Table)</option>
                                    <option value="8">8 Guests (Large Group)</option>
                                    <option value="12">12+ Guests (Sanctuary Hall)</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-stone-500 hover:bg-stone-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-xl bg-[#1e2a1b] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#283824] disabled:opacity-60 transition"
                                >
                                    {isSaving ? "Generating QR..." : "Generate & Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Preview Modal */}
            {selectedTableForPrint && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full border border-[#e8e2d5] shadow-2xl p-6 text-center relative">
                        <button
                            onClick={() => setSelectedTableForPrint(null)}
                            className="absolute right-4 top-4 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="font-serif text-xl font-bold text-[#1e2a1b] mb-1">
                            Table {selectedTableForPrint.table_number} QR Code
                        </h3>
                        <p className="text-xs text-stone-500 mb-4">
                            High-res dynamic scan code for tabletop ordering.
                        </p>
                        <img
                            src={selectedTableForPrint.qr_code_url}
                            alt={`Table ${selectedTableForPrint.table_number}`}
                            className="w-56 h-56 mx-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xs"
                        />
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                onClick={() => triggerPrint(selectedTableForPrint)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e2a1b] text-white rounded-xl text-xs uppercase tracking-wider font-semibold hover:bg-[#283824] transition"
                            >
                                <Printer size={15} />
                                <span>Print Tent Card</span>
                            </button>
                            <button
                                onClick={() => handleDownloadQr(selectedTableForPrint)}
                                className="flex items-center gap-2 px-4 py-2.5 border border-[#e8e2d5] text-stone-700 rounded-xl text-xs uppercase tracking-wider font-semibold hover:bg-stone-50 transition"
                            >
                                <Download size={15} />
                                <span>Download PNG</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesManagement;
