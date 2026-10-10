import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['theatre', 'partyHall1', 'partyHall2']
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String, // Storing as YYYY-MM-DD string
        required: true
    },
    startTime: {
        type: String, // e.g. "14:00" or "02:00 PM"
        required: true
    },
    duration: {
        type: Number, // Number of hours
        required: true,
        default: 1
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    occasion: {
        type: String,
        trim: true
    },
    specialRequests: {
        type: String,
        trim: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

export const Reservation = mongoose.model('Reservation', reservationSchema);
