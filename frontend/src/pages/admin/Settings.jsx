import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { CalendarDays, CheckCircle, Image as ImageIcon, Images, LayoutGrid, Loader2, Plus, RotateCcw, Trash2, Upload, Users, X } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MENU_ITEMS_PER_ROW_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const Settings = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeKey, setActiveKey] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [previews, setPreviews] = useState({});
    const previewsRef = useRef({});
    const [activeTab, setActiveTab] = useState('reservations');

    // Add Hall state
    const [showAddHallModal, setShowAddHallModal] = useState(false);
    const [hallName, setHallName] = useState('');
    const [hallCapacity, setHallCapacity] = useState('');
    const [hallDescription, setHallDescription] = useState('');
    const [hallFile, setHallFile] = useState(null);
    const [hallPreview, setHallPreview] = useState('');
    const [restoringDefaults, setRestoringDefaults] = useState(false);

    const [menuItemsPerRow, setMenuItemsPerRow] = useState(4);
    const [layoutLoading, setLayoutLoading] = useState(true);
    const [savingLayout, setSavingLayout] = useState(false);

    const fetchSiteSettings = async () => {
        setLayoutLoading(true);
        try {
            const response = await axios.get('/api/admin/settings');
            setMenuItemsPerRow(response.data.data.menuItemsPerRow ?? 4);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load layout settings.' });
        } finally {
            setLayoutLoading(false);
        }
    };

    const saveMenuItemsPerRow = async (value) => {
        setSavingLayout(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await axios.put('/api/admin/settings', { menuItemsPerRow: value });
            setMenuItemsPerRow(response.data.data.menuItemsPerRow);
            setMessage({ type: 'success', text: 'Menu layout updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update menu layout.' });
        } finally {
            setSavingLayout(false);
        }
    };

    const mediaBySection = useMemo(() => media.reduce((groups, item) => {
        groups[item.section] = groups[item.section] || [];
        groups[item.section].push(item);
        return groups;
    }, {}), [media]);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/home-media');
            setMedia(response.data.data.media || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load website images.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
        fetchSiteSettings();
        return () => Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const validateFile = (file) => {
        if (!file) return 'Please choose an image file.';
        if (!file.type.startsWith('image/')) return 'Please choose an image file.';
        if (file.size > MAX_FILE_SIZE) return 'Images must be 5MB or smaller.';
        return '';
    };

    const setLocalPreview = (imageKey, file) => {
        const previewUrl = URL.createObjectURL(file);
        setPreviews((current) => {
            if (current[imageKey]) URL.revokeObjectURL(current[imageKey]);
            const next = { ...current, [imageKey]: previewUrl };
            previewsRef.current = next;
            return next;
        });
    };

    const uploadImage = async (imageKey, file) => {
        if (activeKey) return;
        setActiveKey(imageKey);
        setUploadProgress(0);
        setMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(`/api/admin/home-media/${imageKey}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                    if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
                }
            });
            setMedia(response.data.data.media || []);
            setMessage({ type: 'success', text: 'Image updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload image.' });
        } finally {
            setActiveKey(null);
            setUploadProgress(0);
        }
    };

    const handleReplace = (imageKey, event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        const validationMessage = validateFile(file);
        if (validationMessage) {
            setMessage({ type: 'error', text: validationMessage });
            return;
        }
        setLocalPreview(imageKey, file);
        uploadImage(imageKey, file);
    };

    const handleAddGallery = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        const validationMessage = validateFile(file);
        if (validationMessage) {
            setMessage({ type: 'error', text: validationMessage });
            return;
        }
        if (activeKey) return;
        setActiveKey('new-gallery');
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('label', `Gallery image ${media.filter((item) => item.section === 'gallery').length + 1}`);
        try {
            const response = await axios.post('/api/admin/home-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            });
            setMedia(response.data.data.media || []);
            setMessage({ type: 'success', text: 'Gallery image added successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add Gallery image.' });
        } finally {
            setActiveKey(null);
            setUploadProgress(0);
        }
    };

    const handleHallFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validationMessage = validateFile(file);
        if (validationMessage) {
            setMessage({ type: 'error', text: validationMessage });
            return;
        }
        setHallFile(file);
        const previewUrl = URL.createObjectURL(file);
        setHallPreview(previewUrl);
    };

    const handleAddHall = async (e) => {
        e?.preventDefault();
        const trimmed = hallName.trim();
        if (!trimmed) {
            setMessage({ type: 'error', text: 'Please enter a hall name.' });
            return;
        }
        if (activeKey) return;
        setActiveKey('new-hall');
        setUploadProgress(0);
        const formData = new FormData();
        if (hallFile) {
            formData.append('image', hallFile);
        }
        const formattedLabel = trimmed.toLowerCase().startsWith('reservation:')
            ? trimmed
            : `Reservation: ${trimmed}`;
        formData.append('label', formattedLabel);
        formData.append('section', 'reservations');
        if (hallCapacity.trim()) {
            formData.append('capacity', hallCapacity.trim());
        }
        if (hallDescription.trim()) {
            formData.append('description', hallDescription.trim());
        }

        try {
            const response = await axios.post('/api/admin/home-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            });
            setMedia(response.data.data.media || []);
            setMessage({ type: 'success', text: `Hall "${trimmed}" added successfully.` });
            setShowAddHallModal(false);
            setHallName('');
            setHallCapacity('');
            setHallDescription('');
            setHallFile(null);
            setHallPreview('');
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add Hall.' });
        } finally {
            setActiveKey(null);
            setUploadProgress(0);
        }
    };

    const handleRemove = async (item) => {
        if (activeKey) return;
        const isHall = item.section === 'reservations';
        const confirmMsg = isHall
            ? `Are you sure you want to delete "${item.label}"?`
            : `Are you sure you want to remove the image for "${item.label}"?`;
        if (!window.confirm(confirmMsg)) return;

        setActiveKey(item.imageKey);
        try {
            const response = await axios.delete(`/api/admin/home-media/${item.imageKey}`);
            setMedia(response.data.data.media || []);
            setMessage({ type: 'success', text: isHall ? `"${item.label}" deleted successfully.` : 'Image removed successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove item.' });
        } finally {
            setActiveKey(null);
        }
    };

    const handleRestoreDefaults = async () => {
        if (!window.confirm('Restore default venue slots? This will bring back any default reservation cards.')) return;
        setRestoringDefaults(true);
        try {
            const response = await axios.post('/api/admin/home-media/restore-defaults', { section: 'reservations' });
            setMedia(response.data.data.media || []);
            setMessage({ type: 'success', text: 'Default venue halls restored successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to restore default venues.' });
        } finally {
            setRestoringDefaults(false);
        }
    };

    const tabs = [
        { key: 'reservations', label: 'Reservations', icon: CalendarDays, sections: ['reservations'], title: 'Reservation Page Images', description: 'Venue cards, booking banners, and confirmation imagery.' },
        { key: 'gallery', label: 'Gallery', icon: Images, sections: ['gallery'], title: 'Gallery Page Images', description: 'Manage the public gallery collection and its individual images.' },
        { key: 'layout', label: 'Layout', icon: LayoutGrid, sections: [], title: 'Menu Page Layout', description: 'Control how the menu grid is arranged for customers.' }
    ];
    const selectedTab = tabs.find((tab) => tab.key === activeTab) || tabs[0];
    const selectedSections = selectedTab.sections.map((section) => ({
        key: section,
        items: mediaBySection[section] || [],
        title: selectedTab.title
    })).filter((section) => section.items.length > 0);

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Content & Media Atelier</span>
                <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight">Website Settings</h1>
                <p className="text-sm text-stone-500 mt-0.5 max-w-2xl">Manage photography, venue spaces, and menu layout published across the live cafe portal.</p>
            </div>

            {message.text && (
                <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
                    message.type === 'success' 
                        ? 'bg-[#eaf3e8] border-[#cbe4c7] text-[#245220]' 
                        : 'bg-[#fdeeed] border-[#f7cdcd] text-[#9a2c2c]'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}{message.text}
                </div>
            )}

            <div className="space-y-6">
                <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-[#e8e2d5] w-fit shadow-xs" role="tablist" aria-label="Website settings sections">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.key === activeTab;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.key)}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wider uppercase transition duration-200 ${
                                    isActive 
                                        ? 'bg-[#1e2a1b] text-white shadow-xs' 
                                        : 'text-stone-600 hover:text-[#1e2a1b] hover:bg-black/5'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-[#c2a677]' : ''} /> <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-6" role="tabpanel">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-5 bg-white rounded-2xl border border-[#e8e2d5] shadow-xs">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-[#1e2a1b]">{selectedTab.title}</h3>
                            <p className="text-xs text-stone-500 mt-1">{selectedTab.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTab === 'reservations' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddHallModal(true)}
                                        disabled={Boolean(activeKey)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e2a1b] hover:bg-[#2d3e29] text-white px-4 py-2.5 text-xs uppercase tracking-wider font-semibold transition duration-200 shadow-xs"
                                    >
                                        <Plus size={14} /> Add Venue
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRestoreDefaults}
                                        disabled={Boolean(activeKey) || restoringDefaults}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e8e2d5] bg-[#FAF8F3] text-stone-700 px-3.5 py-2.5 text-xs font-medium hover:bg-stone-100 transition disabled:opacity-50"
                                        title="Restore default venue slots"
                                    >
                                        <RotateCcw size={13} className={restoringDefaults ? 'animate-spin' : ''} /> Defaults
                                    </button>
                                </>
                            )}
                            {activeTab === 'gallery' && (
                                <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2a1b] hover:bg-[#2d3e29] text-white px-4 py-2.5 text-xs uppercase tracking-wider font-semibold cursor-pointer transition duration-200 shadow-xs">
                                    <Upload size={14} /> Add Gallery Image
                                    <input type="file" accept="image/*" onChange={handleAddGallery} disabled={Boolean(activeKey)} className="sr-only" />
                                </label>
                            )}
                        </div>
                    </div>

            {activeTab === 'layout' ? (
                layoutLoading ? (
                    <div className="flex justify-center py-20 bg-white rounded-2xl border border-[#e8e2d5]"><Loader2 className="animate-spin text-[#1e2a1b]" size={32} /></div>
                ) : (
                    <div className="max-w-md bg-white border border-[#e8e2d5] rounded-2xl p-6 space-y-4 shadow-xs">
                        <div>
                            <label htmlFor="menu-items-per-row" className="block text-sm font-serif font-bold text-[#1e2a1b] mb-1">
                                Menu Items Per Row
                            </label>
                            <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                                Sets how many menu cards appear per row on the patron menu page (desktop view).
                            </p>
                            <select
                                id="menu-items-per-row"
                                value={menuItemsPerRow}
                                disabled={savingLayout}
                                onChange={(event) => saveMenuItemsPerRow(Number(event.target.value))}
                                className="w-full sm:w-52 px-3.5 py-2.5 rounded-xl border border-[#e8e2d5] bg-[#FAF8F3] text-[#1e2a1b] text-xs font-medium focus:outline-none focus:border-[#c2a677] disabled:opacity-60"
                            >
                                {MENU_ITEMS_PER_ROW_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option} items per row</option>
                                ))}
                            </select>
                        </div>
                        {savingLayout && (
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <Loader2 className="animate-spin" size={14} /> Saving layout configuration...
                            </div>
                        )}
                    </div>
                )
            ) : loading ? (
                <div className="flex justify-center py-20 bg-white rounded-2xl border border-[#e8e2d5]"><Loader2 className="animate-spin text-[#1e2a1b]" size={32} /></div>
            ) : selectedSections.length ? selectedSections.map(({ key, items, title }) => (
                    <section key={key} className="space-y-4">
                        {selectedSections.length > 1 && <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c2a677]">{title}</h4>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {items.map((item) => {
                                const preview = previews[item.imageKey] || item.imageUrl;
                                const isUploading = activeKey === item.imageKey;
                                return (
                                    <article key={item.imageKey} className="bg-white border border-[#e8e2d5] rounded-2xl overflow-hidden shadow-xs flex flex-col">
                                        <div className="aspect-[4/3] bg-[#FAF8F3] relative border-b border-[#ece7dc]">
                                            {preview ? (
                                                <img
                                                    src={preview}
                                                    alt={item.label}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        if (e.currentTarget.nextElementSibling) {
                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={`w-full h-full flex flex-col items-center justify-center text-stone-400 gap-2 ${preview ? 'hidden' : ''}`}
                                            >
                                                <ImageIcon size={32} className="opacity-40" />
                                                <span className="text-xs">No image configured</span>
                                            </div>
                                            {isUploading && <div className="absolute inset-0 bg-[#1e2a1b]/80 text-white flex flex-col items-center justify-center gap-3 backdrop-blur-xs"><Loader2 className="animate-spin" size={28} /><span className="text-xs font-semibold">Uploading {uploadProgress}%</span></div>}
                                        </div>
                                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-serif font-bold text-[#1e2a1b] leading-snug">{item.label}</h3>
                                                    {item.capacity && (
                                                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-[#935a16] bg-[#fef7ea] px-2.5 py-0.5 rounded-full border border-[#f5dfb8]">
                                                            <Users size={11} /> {item.capacity}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mt-2 font-light">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <p className="text-[10px] font-mono text-stone-400 mt-2 truncate">{item.imageKey}</p>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t border-[#ece7dc]">
                                                <label className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e2a1b] hover:bg-[#2d3e29] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold cursor-pointer transition shadow-xs"><Upload size={13} /> Replace<input type="file" accept="image/*" onChange={(event) => handleReplace(item.imageKey, event)} disabled={Boolean(activeKey)} className="sr-only" /></label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(item)}
                                                    disabled={Boolean(activeKey)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-[#f7cdcd] text-[#9a2c2c] px-3 py-2 hover:bg-[#fdeeed] disabled:opacity-40 transition"
                                                    aria-label={`Remove ${item.label}`}
                                                    title={`Delete ${item.label}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )) : <div className="py-16 text-center text-sm font-serif text-stone-400 bg-white rounded-2xl border border-[#e8e2d5]">No media assets configured in this section yet.</div>}
                </div>
            </div>

            {/* Add Hall Modal */}
            {showAddHallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white border border-[#e8e2d5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-[#ece7dc]">
                            <div className="flex items-center gap-2 text-[#1e2a1b]">
                                <Plus size={18} className="text-[#c2a677]" />
                                <h3 className="font-serif font-bold text-xl">Add New Venue Space</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setShowAddHallModal(false); setHallName(''); setHallCapacity(''); setHallDescription(''); setHallFile(null); setHallPreview(''); }}
                                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddHall} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Hall / Space Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Olive Glasshouse or Royal Atrium"
                                    value={hallName}
                                    onChange={(e) => setHallName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e2d5] bg-[#FAF8F3] text-[#1e2a1b] text-xs focus:outline-none focus:border-[#c2a677]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Capacity of the Space
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Up to 40 guests"
                                    value={hallCapacity}
                                    onChange={(e) => setHallCapacity(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e2d5] bg-[#FAF8F3] text-[#1e2a1b] text-xs focus:outline-none focus:border-[#c2a677]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Space Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Bespoke sanctuary surrounded by natural Mediterranean foliage, tailored for banquets and celebrations..."
                                    value={hallDescription}
                                    onChange={(e) => setHallDescription(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e2d5] bg-[#FAF8F3] text-[#1e2a1b] text-xs focus:outline-none focus:border-[#c2a677] resize-none leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Space Photograph
                                </label>
                                <div className="relative aspect-video rounded-2xl border-2 border-dashed border-[#e8e2d5] bg-[#FAF8F3] flex flex-col items-center justify-center overflow-hidden group">
                                    {hallPreview ? (
                                        <>
                                            <img src={hallPreview} alt="Hall Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-white bg-black/60 px-3 py-1.5 rounded-full">Change image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                                            <ImageIcon size={28} className="mb-1 text-[#c2a677]" />
                                            <span className="text-xs font-medium text-stone-600">Click to upload hall photo</span>
                                            <span className="text-[10px] text-stone-400">JPG, PNG, WebP up to 5MB</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleHallFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ece7dc]">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddHallModal(false); setHallName(''); setHallCapacity(''); setHallDescription(''); setHallFile(null); setHallPreview(''); }}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border border-[#e8e2d5] text-stone-600 hover:bg-stone-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={activeKey === 'new-hall' || !hallName.trim()}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e2a1b] hover:bg-[#2d3e29] text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50 shadow-xs"
                                >
                                    {activeKey === 'new-hall' ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={14} /> Add Venue
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
