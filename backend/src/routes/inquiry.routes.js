import express from "express";
import {
    createInquiry,
    getAllInquiries,
    updateInquiryStatus,
    deleteInquiry,
} from "../controllers/inquiry.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public — submit inquiry
router.post("/", createInquiry);

// Admin — fetch all inquiries (with optional ?status= filter)
router.get("/", verifyJWT, verifyAdmin, getAllInquiries);

// Admin — update inquiry status
router.patch("/:id/status", verifyJWT, verifyAdmin, updateInquiryStatus);

// Admin — delete inquiry
router.delete("/:id", verifyJWT, verifyAdmin, deleteInquiry);

export default router;
