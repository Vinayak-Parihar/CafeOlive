import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const orderSchema = new Schema(
    {
        tableNumber: {
            type: String, // Changed to String for flexibility ("T1", "A-2")
            required: false
        },
        items: [
            {
                menuItem: { // Changed to camelCase to match controller
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'menu',
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                price: { // Store price at time of order
                    type: Number,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1
                },
                specialInstructions: {
                    type: String
                }
            }
        ],
        guestDetails: {
            name: { type: String },
            phone: { type: String }
        },
        placedBy: { // Added field
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending_payment', 'placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
            default: 'pending_payment'
        },
        estimatedPreparationTime: {
            type: Number,
            default: 0
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentMethod: {
            type: String
        },
        paymentTimestamp: {
            type: Date
        },
        razorpayOrderId: {
            type: String
        },
        razorpayPaymentId: {
            type: String
        },
        razorpaySignature: {
            type: String
        },
        kitchenNote: {
            type: String
        },
        // Order source tracking
        orderSource: {
            type: String,
            enum: ['customer', 'waiter'],
            default: 'customer'
        },
        waiterName: {
            type: String  // Stores waiter's name when order is placed by waiter
        },
        customerName: {
            type: String  // Stores customer's name
        },
        customerPhone: {
            type: String  // Stores customer's phone number
        },
        customerEmail: {
            type: String  // Optional customer email
        },
        billSessionId: {
            type: String,
            index: true   // Fast lookups for fetching all orders in a session
        },
        available: {
            type: Boolean
        },

    },
    {
        timestamps: true
    }
);


// Verification found pre-save hook issues. Relied on schema validation and controller logic instead.

export const Order = mongoose.model("Order", orderSchema);