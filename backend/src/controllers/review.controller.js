import { Review } from "../models/review.model.js";

// Submit a new review
export const createReview = async (req, res) => {
    try {
        const { name, rating, comment } = req.body;

        if (!name || !rating) {
            return res.status(400).json({ message: 'Name and rating are required' });
        }

        const review = new Review({
            name,
            rating,
            comment,
            status: 'pending' // Default status
        });

        await review.save();

        res.status(201).json({
            message: 'Review submitted successfully',
            review
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting review', error: error.message });
    }
};

// Get all public (approved) reviews
export const getPublicReviews = async (req, res) => {
    try {
        // Fetch approved reviews, sort by newest first
        const reviews = await Review.find({ status: 'approved' }).sort({ createdAt: -1 });

        // Randomize the order for the "Masonry" feel request
        // Using Schwartzian transform for better performance if needed, but simple sort is fine for small datasets
        const shuffledReviews = reviews.sort(() => 0.5 - Math.random());

        res.status(200).json(shuffledReviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Get all reviews (Admin/Manager)
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all reviews', error: error.message });
    }
};

// Update review status (Approve/Reject)
export const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.status(200).json({
            message: `Review ${status} successfully`,
            review
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating review status', error: error.message });
    }
};

// Bulk Update review status (Approve/Reject)
export const bulkUpdateReviewStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No review IDs provided' });
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const result = await Review.updateMany(
            { _id: { $in: ids } },
            { $set: { status } }
        );

        res.status(200).json({
            message: `Successfully updated ${result.modifiedCount} reviews to ${status}`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk updating reviews', error: error.message });
    }
};

// Bulk Delete reviews
export const bulkDeleteReviews = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No review IDs provided' });
        }

        const result = await Review.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} reviews`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk deleting reviews', error: error.message });
    }
};

