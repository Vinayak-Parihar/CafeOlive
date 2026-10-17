import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Star, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReviewsManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchReviews();
        const interval = setInterval(() => {
            fetchReviews(true); // invalidating loading state for background updates
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Clear selection when filter changes to avoid unintended bulk actions on hidden reviews
    useEffect(() => {
        setSelectedIds([]);
    }, [filter]);

    const fetchReviews = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await axios.get('/api/reviews/admin');
            setReviews(response.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            if (!silent) toast.error('Failed to load reviews');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.patch(`/api/reviews/${id}/status`, { status: newStatus });
            toast.success(`Review ${newStatus} successfully`);

            // Optimistic update
            setReviews(reviews.map(review =>
                review._id === id ? { ...review, status: newStatus } : review
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    // Bulk Actions Backend Integration
    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        setBulkActionLoading(true);
        try {
            const response = await axios.patch('/api/reviews/bulk-status', {
                ids: selectedIds,
                status: 'approved'
            });
            toast.success(response.data.message || 'Reviews approved successfully');

            // Optimistic update of local status
            setReviews(prev =>
                prev.map(r => selectedIds.includes(r._id) ? { ...r, status: 'approved' } : r)
            );
            setSelectedIds([]);
        } catch (error) {
            console.error('Error bulk approving reviews:', error);
            toast.error(error.response?.data?.message || 'Failed to bulk approve reviews');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.length === 0) return;
        setBulkActionLoading(true);
        try {
            const response = await axios.patch('/api/reviews/bulk-status', {
                ids: selectedIds,
                status: 'rejected'
            });
            toast.success(response.data.message || 'Reviews rejected successfully');

            // Optimistic update of local status
            setReviews(prev =>
                prev.map(r => selectedIds.includes(r._id) ? { ...r, status: 'rejected' } : r)
            );
            setSelectedIds([]);
        } catch (error) {
            console.error('Error bulk rejecting reviews:', error);
            toast.error(error.response?.data?.message || 'Failed to bulk reject reviews');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const confirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setBulkActionLoading(true);
        try {
            const response = await axios.post('/api/reviews/bulk-delete', {
                ids: selectedIds
            });
            toast.success(response.data.message || 'Reviews deleted successfully');

            // Remove reviews from state
            setReviews(prev => prev.filter(r => !selectedIds.includes(r._id)));
            setSelectedIds([]);
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error bulk deleting reviews:', error);
            toast.error(error.response?.data?.message || 'Failed to bulk delete reviews');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (filter === 'all') return true;
        return review.status === filter;
    });

    const allFilteredIds = filteredReviews.map(r => r._id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const next = [...prev];
                allFilteredIds.forEach(id => {
                    if (!next.includes(id)) next.push(id);
                });
                return next;
            });
        }
    };

    const handleSelectReview = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-[#eaf3e8] text-[#245220] border border-[#cbe4c7]';
            case 'rejected': return 'bg-[#fdeeed] text-[#9a2c2c] border border-[#f7cdcd]';
            case 'pending': return 'bg-[#fef7ea] text-[#935a16] border border-[#f5dfb8]';
            default: return 'bg-[#FAF8F3] text-stone-700 border border-[#e8e2d5]';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Patron Feedback</span>
                    <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight">Reviews Management</h1>
                    <p className="text-stone-500 text-sm mt-0.5">Approve, reject, or curate patron dining experiences and ratings.</p>
                </div>
                <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border border-[#e8e2d5] shadow-xs">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition duration-200 ${
                                filter === f
                                    ? 'bg-[#1e2a1b] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-[#1e2a1b] hover:bg-black/5'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Selection and Toolbar */}
            {filteredReviews.length > 0 && (
                <div className="flex flex-col gap-3">
                    {/* Select All Checkbox */}
                    <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl border border-[#e8e2d5] shadow-xs">
                        <label className="flex items-center gap-3 cursor-pointer select-none text-xs font-semibold text-stone-700 uppercase tracking-wider">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                disabled={bulkActionLoading}
                                className="w-4 h-4 rounded border-[#e8e2d5] text-[#1e2a1b] focus:ring-[#c2a677] cursor-pointer disabled:opacity-50"
                            />
                            Select All {filteredReviews.length} {filter === 'all' ? 'Reviews' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Reviews`}
                        </label>
                    </div>

                    {/* Bulk Action Toolbar */}
                    {selectedIds.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#f6f4ee] border border-[#e8e2d5] rounded-2xl shadow-xs">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-[#1e2a1b] uppercase tracking-wider">
                                    {selectedIds.length} {selectedIds.length === 1 ? 'Review' : 'Reviews'} Selected
                                </span>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    disabled={bulkActionLoading}
                                    className="text-xs font-medium text-stone-500 hover:text-[#1e2a1b] underline disabled:opacity-50"
                                >
                                    Clear Selection
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={handleBulkApprove}
                                    disabled={bulkActionLoading}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2d5a27] hover:bg-[#23471f] disabled:opacity-50 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors"
                                >
                                    <Check size={14} /> Approve
                                </button>
                                <button
                                    onClick={handleBulkReject}
                                    disabled={bulkActionLoading}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#935a16] hover:bg-[#784912] disabled:opacity-50 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors"
                                >
                                    <X size={14} /> Reject
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={bulkActionLoading}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#9a2c2c] hover:bg-[#7e2323] disabled:opacity-50 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-[#e8e2d5]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1e2a1b]"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e2d5] text-stone-500">
                            <AlertCircle className="mx-auto h-10 w-10 text-stone-300 mb-3" />
                            <p className="text-base font-serif">No reviews found in this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredReviews.map((review) => {
                                const isSelected = selectedIds.includes(review._id);
                                return (
                                    <div
                                        key={review._id}
                                        className={`bg-white rounded-2xl border transition-all duration-200 p-6 flex flex-col h-full relative shadow-xs ${
                                            isSelected ? 'border-[#1e2a1b] ring-2 ring-[#1e2a1b]/15' : 'border-[#e8e2d5]'
                                        }`}
                                    >
                                        {/* Individual Checkbox */}
                                        <div className="absolute top-5 right-5 z-10">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectReview(review._id)}
                                                disabled={bulkActionLoading}
                                                className="w-4 h-4 rounded border-[#e8e2d5] text-[#1e2a1b] focus:ring-[#c2a677] cursor-pointer disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-[#FAF8F3] border border-[#e8e2d5] text-[#1e2a1b] rounded-full flex items-center justify-center font-serif font-bold text-base">
                                                    {review.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-serif font-bold text-stone-900 pr-6">{review.name}</h3>
                                                    <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                                        <Clock size={11} />
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-3">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(review.status)}`}>
                                                {review.status}
                                            </span>
                                        </div>

                                        <div className="flex mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={15}
                                                    className={i < review.rating ? "text-[#c2a677] fill-current" : "text-stone-200"}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-stone-600 text-xs mb-6 flex-grow italic leading-relaxed">
                                            "{review.comment || 'No comment provided'}"
                                        </p>

                                        <div className="flex gap-2.5 pt-4 border-t border-[#ece7dc] mt-auto">
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(review._id, 'approved')}
                                                    disabled={bulkActionLoading}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#eaf3e8] hover:bg-[#d8edd4] text-[#245220] border border-[#cbe4c7] py-2 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={14} /> Accept
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(review._id, 'rejected')}
                                                    disabled={bulkActionLoading}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#fdeeed] hover:bg-[#fad8d8] text-[#9a2c2c] border border-[#f7cdcd] py-2 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#e8e2d5]">
                        <h3 className="text-2xl font-bold font-serif text-[#1e2a1b] mb-2">Delete Reviews</h3>
                        <p className="text-stone-600 text-xs leading-relaxed mb-6">
                            Are you sure you want to permanently delete <strong className="text-[#9a2c2c]">{selectedIds.length}</strong> selected {selectedIds.length === 1 ? 'review' : 'reviews'}? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={bulkActionLoading}
                                className="px-5 py-2.5 border border-[#e8e2d5] text-stone-700 rounded-xl hover:bg-stone-50 transition font-semibold text-xs uppercase tracking-wider disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkDelete}
                                disabled={bulkActionLoading}
                                className="px-5 py-2.5 bg-[#9a2c2c] hover:bg-[#7e2323] text-white rounded-xl transition font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {bulkActionLoading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsManagement;
