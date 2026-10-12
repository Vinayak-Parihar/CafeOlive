import express from "express";
import { createReview, getPublicReviews, getAllReviews, updateReviewStatus, bulkUpdateReviewStatus, bulkDeleteReviews } from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public Routes
router.post('/', createReview);
router.get('/public', getPublicReviews);

// Protected Routes
router.get('/admin', verifyJWT, verifyAdmin, getAllReviews);
router.patch('/bulk-status', verifyJWT, verifyAdmin, bulkUpdateReviewStatus);
router.post('/bulk-delete', verifyJWT, verifyAdmin, bulkDeleteReviews);
router.patch('/:id/status', verifyJWT, verifyAdmin, updateReviewStatus);

export default router;
