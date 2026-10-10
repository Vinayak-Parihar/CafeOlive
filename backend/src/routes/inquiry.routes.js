import express from "express";
import {
    createInquiry,
    getAllInquiries,
    updateInquiryStatus,
    deleteInquiry,
} from "../controllers/inquiry.controller.js";

const router = express.Router();

// Public — submit inquiry
router.post("/", createInquiry);

// Admin — fetch all inquiries (with optional ?status= filter)
router.get("/", getAllInquiries);

// Admin — update inquiry status
router.patch("/:id/status", updateInquiryStatus);

// Admin — delete inquiry
router.delete("/:id", deleteInquiry);

export default router;
