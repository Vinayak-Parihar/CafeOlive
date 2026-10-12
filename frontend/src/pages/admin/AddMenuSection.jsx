import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Plus,
    Upload,
    Tag,
    Layers,
    Search,
    Trash2,
    Edit3,
    RefreshCw,
    LayoutGrid,
    List,
    CheckCircle,
    XCircle,
    Utensils,
    X,
    AlertCircle,
    ChevronDown
} from 'lucide-react';

const AddMenuSection = () => {
    // --- Category State ---
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [categoryMsg, setCategoryMsg] = useState({ type: '', text: '' });
    const [categoryLoading, setCategoryLoading] = useState(false);

    // --- Mode: 'single' vs 'multiple' ---
    const [addMode, setAddMode] = useState('single');

    // --- Single Menu Item State ---
    const [itemData, setItemData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: null
    });
    const [itemMsg, setItemMsg] = useState({ type: '', text: '' });
    const [itemLoading, setItemLoading] = useState(false);

    // --- Multiple (Bulk) Menu Items State ---
    const [bulkDefaultCategory, setBulkDefaultCategory] = useState('');
    const [bulkRows, setBulkRows] = useState([
        { id: 'row-1', name: '', price: '', categoryId: '', description: '' },
        { id: 'row-2', name: '', price: '', categoryId: '', description: '' },
        { id: 'row-3', name: '', price: '', categoryId: '', description: '' }
    ]);
    const [bulkMsg, setBulkMsg] = useState({ type: '', text: '' });
    const [bulkLoading, setBulkLoading] = useState(false);

    // --- Existing Menu Directory State (Shown Underneath) ---
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // --- Edit Modal State ---
    const [editingItem, setEditingItem] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        price: '',
        description: '',
        categoryId: '',
        isAvailable: true,
        image: null
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editMsg, setEditMsg] = useState({ type: '', text: '' });

    // ── Fetch Categories ────────────────────────────────────────────────────────
    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/menu/category');
            if (response.data.success) {
                setCategories(response.data.data);
                // Preselect default category for bulk if not set
                if (!bulkDefaultCategory && response.data.data.length > 0) {
                    setBulkDefaultCategory(response.data.data[0]._id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    // ── Fetch Menu Items (Admin list or fallback) ───────────────────────────────
    const fetchMenuItems = async () => {
        setMenuLoading(true);
        try {
            // First try admin-list (includes out-of-stock items)
            let res;
            try {
                res = await axios.get('/api/menu/admin-list');
            } catch (err) {
                // Fallback to public list
                res = await axios.get('/api/menu/list');
            }
            if (res.data.success) {
                setMenuItems(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch menu items", error);
        } finally {
            setMenuLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchMenuItems();
    }, []);

    // ── Category Handlers ───────────────────────────────────────────────────────
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;
        setCategoryLoading(true);
        setCategoryMsg({ type: '', text: '' });

        try {
            await axios.post('/api/menu/category', { name: categoryName.trim() });
            setCategoryMsg({ type: 'success', text: 'Category added successfully!' });
            setCategoryName('');
            fetchCategories();
            fetchMenuItems();
        } catch (error) {
            setCategoryMsg({ type: 'error', text: error.response?.data?.message || 'Failed to add category' });
        } finally {
            setCategoryLoading(false);
        }
    };

    // ── Single Item Handlers ───────────────────────────────────────────────────
    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setItemData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setItemData(prev => ({ ...prev, image: e.target.files[0] }));
    };

    const handleSingleItemSubmit = async (e) => {
        e.preventDefault();
        setItemLoading(true);
        setItemMsg({ type: '', text: '' });

        const data = new FormData();
        data.append('name', itemData.name);
        data.append('description', itemData.description);
        data.append('price', itemData.price);
        data.append('categoryId', itemData.categoryId);
        if (itemData.image) {
            data.append('image', itemData.image);
        }

        try {
            await axios.post('/api/menu/item', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setItemMsg({ type: 'success', text: 'Menu item added successfully!' });
            setItemData({ name: '', description: '', price: '', categoryId: '', image: null });
            fetchMenuItems(); // Refresh list underneath
        } catch (error) {
            setItemMsg({ type: 'error', text: error.response?.data?.message || 'Failed to add item' });
        } finally {
            setItemLoading(false);
        }
    };

    // ── Multiple Items (Bulk) Handlers ─────────────────────────────────────────
    const handleBulkRowChange = (id, field, value) => {
        setBulkRows(prev =>
            prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const addBulkRow = (count = 1) => {
        setBulkRows(prev => {
            const newRows = [];
            for (let i = 0; i < count; i++) {
                newRows.push({
                    id: `row-${Date.now()}-${Math.random()}-${i}`,
                    name: '',
                    price: '',
                    categoryId: bulkDefaultCategory || '',
                    description: ''
                });
            }
            return [...prev, ...newRows];
        });
    };

    const removeBulkRow = (id) => {
        setBulkRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));
    };

    const handleBulkDefaultCategoryChange = (catId) => {
        setBulkDefaultCategory(catId);
        // Apply to any rows that don't have category set yet
        setBulkRows(prev =>
            prev.map(row => (!row.categoryId ? { ...row, categoryId: catId } : row))
        );
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        setBulkLoading(true);
        setBulkMsg({ type: '', text: '' });

        // Filter valid rows
        const validRows = bulkRows
            .filter(r => r.name.trim() && r.price)
            .map(r => ({
                name: r.name.trim(),
                price: Number(r.price),
                categoryId: r.categoryId || bulkDefaultCategory,
                description: r.description ? r.description.trim() : ''
            }));

        if (validRows.length === 0) {
            setBulkMsg({ type: 'error', text: 'Please fill in at least one item name, price, and category.' });
            setBulkLoading(false);
            return;
        }

        // Validate each has category
        const missingCat = validRows.find(r => !r.categoryId);
        if (missingCat) {
            setBulkMsg({ type: 'error', text: `Please select a category for item "${missingCat.name}".` });
            setBulkLoading(false);
            return;
        }

        try {
            const res = await axios.post('/api/menu/bulk', { items: validRows });
            const count = res.data.count || validRows.length;
            setBulkMsg({ type: 'success', text: `Successfully added ${count} menu items at once!` });
            // Reset to 3 clean rows
            setBulkRows([
                { id: `row-${Date.now()}-1`, name: '', price: '', categoryId: bulkDefaultCategory, description: '' },
                { id: `row-${Date.now()}-2`, name: '', price: '', categoryId: bulkDefaultCategory, description: '' },
                { id: `row-${Date.now()}-3`, name: '', price: '', categoryId: bulkDefaultCategory, description: '' }
            ]);
            fetchMenuItems(); // Refresh list underneath
        } catch (error) {
            setBulkMsg({ type: 'error', text: error.response?.data?.message || 'Failed to add items in bulk' });
        } finally {
            setBulkLoading(false);
        }
    };

    // ── Delete Menu Item ───────────────────────────────────────────────────────
    const handleDeleteItem = async (itemId, itemName) => {
        if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;
        try {
            await axios.delete(`/api/menu/item/${itemId}`);
            setMenuItems(prev => prev.filter(item => item._id !== itemId));
        } catch (error) {
            alert('Failed to delete item: ' + (error.response?.data?.message || error.message));
        }
    };

    // ── Toggle Item Availability ───────────────────────────────────────────────
    const handleToggleAvailability = async (item) => {
        const nextStatus = !item.isAvailable;
        try {
            await axios.patch(`/api/menu/item/${item._id}`, { isAvailable: nextStatus });
            setMenuItems(prev =>
                prev.map(i => (i._id === item._id ? { ...i, isAvailable: nextStatus } : i))
            );
        } catch (error) {
            console.error('Failed to update availability', error);
        }
    };

    // ── Edit Item Handlers ─────────────────────────────────────────────────────
    const openEditModal = (item) => {
        setEditingItem(item);
        setEditFormData({
            name: item.name || '',
            price: item.price || '',
            description: item.description || '',
            categoryId: item.category?._id || item.category || '',
            isAvailable: item.isAvailable !== false,
            image: null
        });
        setEditMsg({ type: '', text: '' });
    };

    const closeEditModal = () => {
        setEditingItem(null);
        setEditMsg({ type: '', text: '' });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingItem) return;
        setEditLoading(true);
        setEditMsg({ type: '', text: '' });

        const data = new FormData();
        data.append('name', editFormData.name);
        data.append('description', editFormData.description);
        data.append('price', editFormData.price);
        data.append('categoryId', editFormData.categoryId);
        data.append('isAvailable', editFormData.isAvailable);
        if (editFormData.image) {
            data.append('image', editFormData.image);
        }

        try {
            const res = await axios.put(`/api/menu/item/${editingItem._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                const updated = res.data.data;
                setMenuItems(prev =>
                    prev.map(i => (i._id === editingItem._id ? updated : i))
                );
                closeEditModal();
            }
        } catch (error) {
            setEditMsg({ type: 'error', text: error.response?.data?.message || 'Failed to update item' });
        } finally {
            setEditLoading(false);
        }
    };

    // ── Filtered Menu Items for Display ────────────────────────────────────────
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch =
                !searchQuery ||
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const itemCatId = item.category?._id || item.category;
            const matchesCategory =
                categoryFilter === 'all' || itemCatId === categoryFilter;

            const matchesStock =
                availabilityFilter === 'all' ||
                (availabilityFilter === 'in_stock' && item.isAvailable) ||
                (availabilityFilter === 'out_of_stock' && !item.isAvailable);

            return matchesSearch && matchesCategory && matchesStock;
        });
    }, [menuItems, searchQuery, categoryFilter, availabilityFilter]);

    return (
        <div className="space-y-10 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-orange-500 font-serif">Manage Menu</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Add individual items, add multiple items at once, and manage your full live menu directory.
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchCategories();
                        fetchMenuItems();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold hover:border-orange-500 transition shadow-xs"
                >
                    <RefreshCw size={14} className={menuLoading ? 'animate-spin' : ''} />
                    Refresh Menu
                </button>
            </div>

            {/* ── TOP SECTION: Add Category & Add Menu Item (Single or Multiple) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* ── Left Card: Add Category ─────────────────────────────────── */}
                <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                        <Tag className="text-orange-500" size={20} /> Add Category
                    </h2>

                    {categoryMsg.text && (
                        <div className={`p-3 mb-4 rounded-lg text-xs font-semibold ${categoryMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {categoryMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                placeholder="e.g. Starters, Main Course, Shakes"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={categoryLoading}
                            className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition text-sm ${categoryLoading ? 'opacity-50' : ''}`}
                        >
                            {categoryLoading ? 'Adding...' : 'Add Category'}
                        </button>
                    </form>

                    {/* Quick Category Badges */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                            Existing Categories ({categories.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                            {categories.map(cat => (
                                <span
                                    key={cat._id}
                                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md font-medium"
                                >
                                    {cat.name}
                                </span>
                            ))}
                            {categories.length === 0 && (
                                <span className="text-xs text-gray-400 italic">No categories created yet.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Card: Add Menu Item (Single OR Multiple with Single Time) ── */}
                <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
                    
                    {/* Header with Single vs Multiple Mode Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                            <Plus className="text-orange-500" size={20} />
                            {addMode === 'single' ? 'Add Menu Item (Single)' : 'Add Menu Items (Multiple at Once)'}
                        </h2>

                        {/* Mode Selector Pill Buttons */}
                        <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <button
                                type="button"
                                onClick={() => setAddMode('single')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                                    addMode === 'single'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'
                                }`}
                            >
                                <Plus size={14} /> Single Item
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddMode('multiple')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                                    addMode === 'multiple'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'
                                }`}
                            >
                                <Layers size={14} /> Multiple Items (Bulk)
                            </button>
                        </div>
                    </div>

                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* OPTION 1: SINGLE ITEM FORM                                */}
                    {/* ═════════════════════════════════════════════════════════ */}
                    {addMode === 'single' && (
                        <div className="pt-4">
                            {itemMsg.text && (
                                <div className={`p-3 mb-4 rounded-lg text-xs font-semibold ${itemMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                    {itemMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleSingleItemSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                            Item Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={itemData.name}
                                            onChange={handleItemChange}
                                            placeholder="e.g. Olive Special Pizza"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                            Price (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={itemData.price}
                                            onChange={handleItemChange}
                                            placeholder="e.g. 299"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                        Category *
                                    </label>
                                    <select
                                        name="categoryId"
                                        value={itemData.categoryId}
                                        onChange={handleItemChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                        required
                                    >
                                        <option value="" disabled>Select a Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        name="description"
                                        value={itemData.description}
                                        onChange={handleItemChange}
                                        placeholder="Ingredients, preparation, taste profile..."
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 h-20 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                        Dish Image (Optional)
                                    </label>
                                    <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:border-orange-500 transition">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                        />
                                        <div className="text-center">
                                            <Upload className="mx-auto h-6 w-6 text-gray-400" />
                                            <p className="mt-1 text-xs text-gray-400">
                                                {itemData.image ? itemData.image.name : "Click or drag dish photo to upload"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={itemLoading}
                                    className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition text-sm ${itemLoading ? 'opacity-50' : ''}`}
                                >
                                    {itemLoading ? 'Adding Item...' : 'Add Menu Item'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* OPTION 2: MULTIPLE ITEMS (BULK ADD AT A SINGLE TIME)      */}
                    {/* ═════════════════════════════════════════════════════════ */}
                    {addMode === 'multiple' && (
                        <div className="pt-4 space-y-4">
                            {bulkMsg.text && (
                                <div className={`p-3 rounded-lg text-xs font-semibold ${bulkMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                    {bulkMsg.text}
                                </div>
                            )}

                            {/* Default Category toolbar & Quick row adders */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                        Default Category:
                                    </label>
                                    <select
                                        value={bulkDefaultCategory}
                                        onChange={(e) => handleBulkDefaultCategoryChange(e.target.value)}
                                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-white outline-none focus:border-orange-500"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => addBulkRow(1)}
                                        className="px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-orange-500 text-xs font-bold text-gray-700 dark:text-gray-200 rounded transition"
                                    >
                                        + Add 1 Row
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addBulkRow(3)}
                                        className="px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-orange-500 text-xs font-bold text-gray-700 dark:text-gray-200 rounded transition"
                                    >
                                        + Add 3 Rows
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkRows([
                                            { id: `row-${Date.now()}-1`, name: '', price: '', categoryId: bulkDefaultCategory, description: '' }
                                        ])}
                                        className="px-2 py-1 text-xs font-bold text-gray-400 hover:text-red-500 transition"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Multi-item row builder */}
                            <form onSubmit={handleBulkSubmit} className="space-y-3">
                                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                    {bulkRows.map((row, idx) => (
                                        <div
                                            key={row.id}
                                            className="grid grid-cols-12 gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg items-center text-xs"
                                        >
                                            <div className="col-span-1 text-center font-bold text-gray-400">
                                                #{idx + 1}
                                            </div>
                                            <div className="col-span-4">
                                                <input
                                                    type="text"
                                                    placeholder="Item Name *"
                                                    value={row.name}
                                                    onChange={(e) => handleBulkRowChange(row.id, 'name', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                                    required={idx === 0}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Price (₹) *"
                                                    value={row.price}
                                                    onChange={(e) => handleBulkRowChange(row.id, 'price', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                                    required={idx === 0}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={row.categoryId || bulkDefaultCategory}
                                                    onChange={(e) => handleBulkRowChange(row.id, 'categoryId', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                                >
                                                    <option value="" disabled>Category</option>
                                                    {categories.map(c => (
                                                        <option key={c._id} value={c._id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={row.description}
                                                    onChange={(e) => handleBulkRowChange(row.id, 'description', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeBulkRow(row.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                                    title="Remove Row"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 flex items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() => addBulkRow(1)}
                                        className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add another row
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={bulkLoading}
                                        className={`bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-lg transition text-xs flex items-center gap-2 ${
                                            bulkLoading ? 'opacity-50' : ''
                                        }`}
                                    >
                                        <Layers size={14} />
                                        {bulkLoading
                                            ? 'Saving Items...'
                                            : `Save All Items (${bulkRows.filter(r => r.name.trim() && r.price).length} Ready)`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* ── BOTTOM SECTION: SHOW THE MENU IN THE UNDER THIS ────────────────── */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors space-y-6">
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <div className="flex items-center gap-3">
                            <Utensils className="text-orange-500" size={24} />
                            <h2 className="text-2xl font-bold font-serif text-gray-800 dark:text-white">
                                All Live Menu Items
                            </h2>
                            <span className="px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">
                                {menuItems.length} Total
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            Browse, edit, toggle availability, or delete existing dishes across all categories.
                        </p>
                    </div>

                    {/* View mode toggle (Grid vs Table) */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg border text-xs font-semibold transition ${
                                viewMode === 'grid'
                                    ? 'bg-orange-500 text-white border-orange-500'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                            }`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg border text-xs font-semibold transition ${
                                viewMode === 'table'
                                    ? 'bg-orange-500 text-white border-orange-500'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                            }`}
                            title="Table View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Search */}
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search dishes by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-800 dark:text-white outline-none focus:border-orange-500"
                        />
                    </div>

                    {/* Stock filter */}
                    <div className="md:col-span-3">
                        <select
                            value={availabilityFilter}
                            onChange={(e) => setAvailabilityFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-800 dark:text-white outline-none focus:border-orange-500"
                        >
                            <option value="all">All Availability (In & Out of Stock)</option>
                            <option value="in_stock">Available / In Stock Only</option>
                            <option value="out_of_stock">Out of Stock Only</option>
                        </select>
                    </div>

                    {/* Stats summary */}
                    <div className="md:col-span-4 text-right text-xs text-gray-400 font-medium">
                        Showing <strong className="text-gray-700 dark:text-gray-200">{filteredItems.length}</strong> of {menuItems.length} items
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                            categoryFilter === 'all'
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        All Categories ({menuItems.length})
                    </button>
                    {categories.map(cat => {
                        const count = menuItems.filter(i => (i.category?._id || i.category) === cat._id).length;
                        return (
                            <button
                                key={cat._id}
                                type="button"
                                onClick={() => setCategoryFilter(cat._id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                                    categoryFilter === cat._id
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                {cat.name} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Loading state */}
                {menuLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <Utensils className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <h3 className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-300">No menu items found</h3>
                        <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                            {searchQuery || categoryFilter !== 'all'
                                ? 'No dishes match your active filter. Try resetting search or selecting another category.'
                                : 'Add your first menu item above using Single or Multiple mode to get started!'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* ── GRID VIEW ────────────────────────────────────────────── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map(item => (
                            <div
                                key={item._id}
                                className={`rounded-xl border transition duration-200 flex flex-col justify-between overflow-hidden bg-white dark:bg-gray-800 ${
                                    item.isAvailable
                                        ? 'border-gray-200 dark:border-gray-700 hover:border-orange-500/50 shadow-xs'
                                        : 'border-red-200/50 dark:border-red-900/30 opacity-75'
                                }`}
                            >
                                {/* Image / Thumbnail */}
                                <div className="w-full h-36 bg-gray-100 dark:bg-gray-700 relative overflow-hidden flex items-center justify-center">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '';
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Utensils className="text-gray-400 dark:text-gray-500" size={32} />
                                    )}

                                    {/* Category badge */}
                                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded">
                                        {item.category?.name || 'Item'}
                                    </span>

                                    {/* Stock status badge */}
                                    <span
                                        className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded shadow-xs ${
                                            item.isAvailable
                                                ? 'bg-green-600 text-white'
                                                : 'bg-red-600 text-white'
                                        }`}
                                    >
                                        {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                                                {item.name}
                                            </h3>
                                            <span className="font-bold text-orange-500 text-sm whitespace-nowrap">
                                                ₹{item.price}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAvailability(item)}
                                            className={`text-[11px] font-bold px-2 py-1 rounded transition ${
                                                item.isAvailable
                                                    ? 'text-gray-500 hover:text-red-500'
                                                    : 'text-green-600 hover:text-green-700 font-bold'
                                            }`}
                                            title="Toggle Availability"
                                        >
                                            {item.isAvailable ? 'Mark Out' : 'Mark Available'}
                                        </button>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(item)}
                                                className="p-1.5 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded transition"
                                                title="Edit Dish"
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteItem(item._id, item.name)}
                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition"
                                                title="Delete Dish"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ── TABLE VIEW ───────────────────────────────────────────── */
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-3 px-4">Dish</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Price</th>
                                    <th className="py-3 px-4">Description</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredItems.map(item => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition">
                                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                            <div className="w-9 h-9 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden flex-none flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Utensils size={14} className="text-gray-400" />
                                                )}
                                            </div>
                                            <span>{item.name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-semibold text-[11px]">
                                                {item.category?.name || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-orange-500">
                                            ₹{item.price}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                            {item.description || '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAvailability(item)}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                                    item.isAvailable
                                                        ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                                                        : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                                                }`}
                                            >
                                                {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-gray-500 hover:text-orange-500 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item._id, item.name)}
                                                    className="p-1.5 text-gray-500 hover:text-red-500 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* ── EDIT MENU ITEM MODAL ───────────────────────────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            {editingItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden">
                        
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-bold text-base text-gray-800 dark:text-white flex items-center gap-2">
                                <Edit3 size={18} className="text-orange-500" />
                                Edit Menu Item: {editingItem.name}
                            </h3>
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {editMsg.text && (
                            <div className={`m-5 p-3 rounded-lg text-xs font-semibold ${editMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                {editMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-gray-300">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-gray-300">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        value={editFormData.price}
                                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-gray-300">
                                    Category *
                                </label>
                                <select
                                    value={editFormData.categoryId}
                                    onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                    required
                                >
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-gray-300">
                                    Description
                                </label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500 h-16 resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={editFormData.isAvailable}
                                        onChange={(e) => setEditFormData({ ...editFormData, isAvailable: e.target.checked })}
                                        className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4"
                                    />
                                    In Stock (Available for ordering)
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-gray-300">
                                    Change Image (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditFormData({ ...editFormData, image: e.target.files[0] })}
                                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className={`px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold transition ${
                                        editLoading ? 'opacity-50' : ''
                                    }`}
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddMenuSection;
