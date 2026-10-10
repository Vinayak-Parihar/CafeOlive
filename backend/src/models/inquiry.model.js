import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },
        inquiryType: {
            type: String,
            required: true,
            enum: [
                "Private Mini Theatre",
                "Party Hall 1",
                "Party Hall 2",
                "Birthday Celebrations",
                "Corporate Events",
                "Special Occasions",
                "Booking Availability",
                "Pricing",
                "Custom Decorations",
                "General Questions",
            ],
        },
        preferredDate: {
            type: String, // stored as "YYYY-MM-DD"
            default: "",
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["new", "in_progress", "resolved"],
            default: "new",
        },
        adminNotes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);

export default Inquiry;
