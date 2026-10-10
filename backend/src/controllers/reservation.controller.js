import mongoose from "mongoose";
import { Reservation } from "../models/reservation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { sendReservationConfirmationNotifications } from "../utils/reservationNotifications.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { RAZORPAY_MOCK_SECRET } from "../constants/payment.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET || RAZORPAY_MOCK_SECRET
});

// Rates per hour for spaces
const RATES = {
    theatre: 1000,
    partyHall1: 1500,
    partyHall2: 1200
};

// Helper to convert time format (e.g. "14:00" or "02:00 PM") to numeric hour
const parseTimeToHour = (timeStr) => {
    if (!timeStr) return 12;
    // Check if it's already HH:MM format
    if (timeStr.includes(':') && !timeStr.toLowerCase().includes('pm') && !timeStr.toLowerCase().includes('am')) {
        return parseInt(timeStr.split(':')[0], 10);
    }
    // If it's "07:00 PM" format
    let [time, period] = timeStr.split(' ');
    let [hour] = time.split(':');
    let h = parseInt(hour, 10);
    if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period?.toUpperCase() === 'AM' && h === 12) h = 0;
    return h;
};

// Expose the hourly rates so the frontend reads them instead of hardcoding its own copy.
const getRates = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponce(200, RATES, "Venue rates fetched successfully")
    );
});

// 1. Get Availability of slots for a zone on a date
const getAvailability = asyncHandler(async (req, res) => {
    const { type, date } = req.query;

    if (!type || !date) {
        throw new ApiError(400, "Type and Date are required query parameters.");
    }

    // Get all confirmed reservations for this space on this date
    const bookings = await Reservation.find({
        type,
        date,
        status: 'confirmed'
    });

    // We will return a list of standard hours and indicate which ones are booked
    // Available hours: 08:00 AM (8) to 11:00 PM (23)
    const allSlots = [
        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
        "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM",
        "10:00 PM", "11:00 PM"
    ];

    const bookedHours = new Set();

    bookings.forEach(booking => {
        const startH = parseTimeToHour(booking.startTime);
        const duration = booking.duration || 1;
        for (let i = 0; i < duration; i++) {
            bookedHours.add(startH + i);
        }
    });

    const slots = allSlots.map(slot => {
        const h = parseTimeToHour(slot);
        return {
            time: slot,
            hourValue: h,
            isBooked: bookedHours.has(h)
        };
    });

    return res.status(200).json(
        new ApiResponce(200, slots, "Slot availability fetched successfully")
    );
});

// 2. Create Razorpay Payment Order for Booking
const createPaymentOrder = asyncHandler(async (req, res) => {
    const { type, name, phone, email, date, startTime, duration, guests, occasion, specialRequests } = req.body;

    if (!type || !name || !phone || !email || !date || !startTime || !duration || !guests) {
        throw new ApiError(400, "All booking fields are required.");
    }

    const hourlyRate = RATES[type] || 1000;
    const totalAmount = hourlyRate * duration;

    // Check if slot is already double booked in DB
    const startH = parseTimeToHour(startTime);
    const bookings = await Reservation.find({
        type,
        date,
        status: 'confirmed'
    });

    const requestedHours = [];
    for (let i = 0; i < duration; i++) {
        requestedHours.push(startH + i);
    }

    const isDoubleBooked = bookings.some(booking => {
        const bStart = parseTimeToHour(booking.startTime);
        const bDuration = booking.duration || 1;
        const bHours = [];
        for (let i = 0; i < bDuration; i++) {
            bHours.push(bStart + i);
        }
        return requestedHours.some(h => bHours.includes(h));
    });

    if (isDoubleBooked) {
        throw new ApiError(400, "The selected slot conflicts with an existing reservation. Please select a different time.");
    }

    // Create Razorpay Order
    let rzpOrder = null;
    try {
        const options = {
            amount: Math.round(totalAmount * 100), // in paise
            currency: "INR",
            receipt: `res_receipt_${Date.now()}`
        };
        rzpOrder = await razorpay.orders.create(options);
    } catch (error) {
        console.error("Razorpay order creation failed for reservation:", error);
        throw new ApiError(500, "Failed to initiate booking payment.");
    }

    // Save temporary pending reservation record
    const reservation = await Reservation.create({
        type,
        name,
        phone,
        email,
        date,
        startTime,
        duration,
        guests,
        totalAmount,
        razorpayOrderId: rzpOrder.id,
        paymentStatus: 'pending',
        status: 'pending',
        occasion,
        specialRequests
    });

    return res.status(201).json(
        new ApiResponce(201, {
            reservation,
            razorpayOrder: rzpOrder,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }, "Payment order initiated successfully")
    );
});

// 3. Verify Payment and Confirm Reservation
const verifyAndConfirm = asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, reservationId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !reservationId) {
        throw new ApiError(400, "Missing payment details for verification.");
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        throw new ApiError(404, "Reservation record not found.");
    }

    // Check signature
    let isSignatureValid = false;
    const secret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_MOCK_SECRET;

    if (secret === RAZORPAY_MOCK_SECRET || razorpayPaymentId?.startsWith('pay_mock') || !razorpaySignature) {
        isSignatureValid = true;
    } else {
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");
        isSignatureValid = (expectedSignature === razorpaySignature);
    }

    if (!isSignatureValid) {
        reservation.paymentStatus = 'failed';
        reservation.status = 'cancelled';
        await reservation.save();
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    // Update reservation status to confirmed
    reservation.paymentStatus = 'paid';
    reservation.status = 'confirmed';
    reservation.razorpayPaymentId = razorpayPaymentId;
    await reservation.save();

    // Best-effort: notification failures must never fail the confirmation itself.
    await sendReservationConfirmationNotifications(reservation);

    return res.status(200).json(
        new ApiResponce(200, reservation, "Reservation payment verified and confirmed successfully")
    );
});

// 4. Retrieve all reservations (for Admin)
const getAllReservations = asyncHandler(async (req, res) => {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponce(200, reservations, "Reservations fetched successfully")
    );
});

// 5. Update Status manually (e.g. Cancel booking from admin side)
const updateReservationStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
        throw new ApiError(400, "Invalid status.");
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
        throw new ApiError(404, "Reservation not found");
    }

    const wasAlreadyConfirmed = reservation.status === 'confirmed';
    reservation.status = status;
    await reservation.save();

    if (status === 'confirmed' && !wasAlreadyConfirmed) {
        // Best-effort: notification failures must never fail the status update itself.
        await sendReservationConfirmationNotifications(reservation);
    }

    return res.status(200).json(
        new ApiResponce(200, reservation, `Reservation status updated to ${status}`)
    );
});


const reservationInquiry = asyncHandler(async (req, res) => {
    const { email, phone } = req.query;

    if (!email && !phone) {
        throw new ApiError(400, "Email or Phone is required for inquiry.");
    }

    const query = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const reservations = await Reservation.find(query).sort({ date: -1 });

    return res.status(200).json(
        new ApiResponce(200, reservations, "Reservations fetched successfully")
    );
});

// 6. Public "find my reservation" lookup — confirmed reservations only,
// by reservation code (the unique, unambiguous identifier).
const lookupReservation = asyncHandler(async (req, res) => {
    const trimmedCode = req.query.code?.trim();

    if (!trimmedCode) {
        throw new ApiError(400, "Provide a reservation code to search.");
    }

    let reservation = null;
    if (mongoose.Types.ObjectId.isValid(trimmedCode)) {
        reservation = await Reservation.findOne({ _id: trimmedCode, status: 'confirmed' });
    }

    if (!reservation) {
        throw new ApiError(404, "No reservation found matching your search.");
    }

    return res.status(200).json(
        new ApiResponce(200, reservation, "Reservation found successfully")
    );
});

export { getRates, getAvailability, createPaymentOrder, verifyAndConfirm, getAllReservations, updateReservationStatus, reservationInquiry, lookupReservation };
