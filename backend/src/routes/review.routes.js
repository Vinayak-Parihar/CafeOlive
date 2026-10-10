import express from "express";
import { createReview, getPublicReviews, getAllReviews, updateReviewStatus, bulkUpdateReviewStatus, bulkDeleteReviews } from "../controllers/review.controller.js";

const router = express.Router();

// Public Routes
router.post('/', createReview);
router.get('/public', getPublicReviews);

// Protected Routes
router.get('/admin', getAllReviews); // Todo: Add Middleware
router.patch('/bulk-status', bulkUpdateReviewStatus);
router.post('/bulk-delete', bulkDeleteReviews);
router.patch('/:id/status', updateReviewStatus); // Todo: Add Middleware

export default router;
