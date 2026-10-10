import Inquiry from "../models/inquiry.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";

/**
 * POST /api/inquiries
 * Public — submit a new reservation inquiry
 */
const createInquiry = asyncHandler(async (req, res) => {
    const { name, phone, email, inquiryType, preferredDate, message } = req.body;

    if (!name || !phone || !inquiryType || !message) {
        throw new ApiError(400, "Name, phone, inquiry type and message are required.");
    }

    const inquiry = await Inquiry.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || "",
        inquiryType,
        preferredDate: preferredDate || "",
        message: message.trim(),
    });

    return res.status(201).json(
        new ApiResponce(201, inquiry, "Inquiry submitted successfully.")
    );
});

/**
 * GET /api/inquiries
 * Admin — fetch all inquiries (newest first)
 */
const getAllInquiries = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : {};
    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponce(200, inquiries, "Inquiries fetched successfully.")
    );
});

/**
 * PATCH /api/inquiries/:id/status
 * Admin — update inquiry status (new | in_progress | resolved)
 */
const updateInquiryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["new", "in_progress", "resolved"];
    if (!allowed.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${allowed.join(", ")}`);
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found.");
    }

    return res.status(200).json(
        new ApiResponce(200, inquiry, "Inquiry status updated.")
    );
});

/**
 * DELETE /api/inquiries/:id
 * Admin — delete an inquiry
 */
const deleteInquiry = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found.");
    }

    return res.status(200).json(
        new ApiResponce(200, null, "Inquiry deleted successfully.")
    );
});

export { createInquiry, getAllInquiries, updateInquiryStatus, deleteInquiry };
