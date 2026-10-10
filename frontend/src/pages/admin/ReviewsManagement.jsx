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
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-serif text-oliv-green dark:text-soft-gold">Reviews Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Approve, reject, or delete customer reviews in bulk or individually.</p>
                </div>
                <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f
                                ? 'bg-oliv-green text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-oliv-gold/15 dark:hover:bg-gray-700'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Selection and Toolbar */}
            {filteredReviews.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                    {/* Select All Checkbox */}
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                        <label className="flex items-center gap-3 cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                disabled={bulkActionLoading}
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                            />
                            Select All {filteredReviews.length} {filter === 'all' ? 'Reviews' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Reviews`}
                        </label>
                    </div>

                    {/* Bulk Action Toolbar */}
                    {selectedIds.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl shadow-xs animate-slide-down">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                                    {selectedIds.length} {selectedIds.length === 1 ? 'Review' : 'Reviews'} Selected
                                </span>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    disabled={bulkActionLoading}
                                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                                >
                                    Clear Selection
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={handleBulkApprove}
                                    disabled={bulkActionLoading}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors disabled:cursor-not-allowed"
                                >
                                    <Check size={14} /> Approve
                                </button>
                                <button
                                    onClick={handleBulkReject}
                                    disabled={bulkActionLoading}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors disabled:cursor-not-allowed"
                                >
                                    <X size={14} /> Reject
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={bulkActionLoading}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2 animate-pulse" />
                            <p className="text-gray-500 dark:text-gray-400">No reviews found in this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredReviews.map((review) => {
                                const isSelected = selectedIds.includes(review._id);
                                return (
                                    <div
                                        key={review._id}
                                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 p-6 flex flex-col h-full relative ${
                                            isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        {/* Individual Checkbox */}
                                        <div className="absolute top-4 right-4 z-10">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectReview(review._id)}
                                                disabled={bulkActionLoading}
                                                className="w-4.5 h-4.5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg">
                                                    {review.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white pr-6">{review.name}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(review.status)}`}>
                                                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="flex mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 flex-grow italic">
                                            "{review.comment || 'No comment provided'}"
                                        </p>

                                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(review._id, 'approved')}
                                                    disabled={bulkActionLoading}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={16} /> Accept
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(review._id, 'rejected')}
                                                    disabled={bulkActionLoading}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                                                >
                                                    <X size={16} /> Reject
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
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-100 dark:border-gray-700 animate-scale-up">
                        <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-2">Delete Reviews</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                            Are you sure you want to permanently delete <strong className="text-red-600 dark:text-red-400">{selectedIds.length}</strong> selected {selectedIds.length === 1 ? 'review' : 'reviews'}? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={bulkActionLoading}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkDelete}
                                disabled={bulkActionLoading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {bulkActionLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsManagement;
