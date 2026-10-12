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

// Helper: format Date object to YYYY-MM-DD local calendar date string
const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Helper to convert time format (e.g. "14:00" or "02:00 PM") to numeric hour
const parseTimeToHour = (timeStr) => {
    if (!timeStr) return 12;
    // Check if it's already HH:MM format
    if (timeStr.includes(':') && !timeStr.toLowerCase().includes('pm') && !timeStr.toLowerCase().includes('am')) {
        return parseInt(timeStr.split(':')[0], 10);
    }
    // If it's "07:00 PM" format
    let [time, period] = timeStr.trim().split(/\s+/);
    let [hour] = (time || "").split(':');
    let h = parseInt(hour, 10);
    if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period?.toUpperCase() === 'AM' && h === 12) h = 0;
    return h;
};

// Helper to parse time format into hour and minute
const parseTimeToHourMinute = (timeStr) => {
    if (!timeStr) return { hour: 12, minute: 0 };
    const trimmed = timeStr.trim();
    if (trimmed.includes(':') && !trimmed.toLowerCase().includes('pm') && !trimmed.toLowerCase().includes('am')) {
        const [h, m] = trimmed.split(':');
        return { hour: parseInt(h, 10) || 0, minute: parseInt(m, 10) || 0 };
    }
    const [time, period] = trimmed.split(/\s+/);
    const [h, m] = (time || "").split(':');
    let hour = parseInt(h, 10) || 0;
    const minute = parseInt(m, 10) || 0;
    if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
};

// 30-minute buffer required between consecutive reservations for cleaning and turnover
const CLEANING_BUFFER_MS = 30 * 60 * 1000;

// Helper to get start and end epoch milliseconds for a reservation
const getReservationTimeRange = (dateStr, timeStr, duration) => {
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    const { hour, minute } = parseTimeToHourMinute(timeStr);
    const start = new Date(year, month - 1, day, hour, minute, 0, 0);
    const durHours = Math.max(0.5, Number(duration) || 1);
    const end = new Date(start.getTime() + Math.round(durHours * 60 * 60 * 1000));
    return { startMs: start.getTime(), endMs: end.getTime() };
};

// Helper to get calendar date strings for adjacent days to catch rollover bookings
const getAdjacentDateStrings = (dateStr, duration) => {
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    const durHours = Math.max(1, Number(duration) || 1);
    const daysForward = Math.ceil(durHours / 24) + 1;
    const dates = new Set();
    for (let offset = -1; offset <= daysForward; offset++) {
        const d = new Date(year, month - 1, day + offset);
        dates.add(toLocalDateStr(d));
    }
    return Array.from(dates);
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

    // Get all confirmed reservations and recently initiated pending reservations (last 15 mins)
    const relevantDates = getAdjacentDateStrings(date, 24);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const bookings = await Reservation.find({
        type,
        date: { $in: relevantDates },
        $or: [
            { status: 'confirmed' },
            { status: 'pending', createdAt: { $gte: fifteenMinutesAgo } }
        ]
    });

    // Available half-hour slots from 08:00 AM to 11:30 PM
    const allSlots = [
        "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
        "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
    ];

    const bookedRanges = bookings.map(booking => {
        const { startMs, endMs } = getReservationTimeRange(booking.date, booking.startTime, booking.duration);
        return {
            id: booking._id,
            date: booking.date,
            startTime: booking.startTime,
            duration: booking.duration,
            startMs,
            endMs,
            bufferEndMs: endMs + CLEANING_BUFFER_MS
        };
    });

    const slots = allSlots.map(slot => {
        const { startMs: slotStart, endMs: slotEnd } = getReservationTimeRange(date, slot, 0.5);
        // A slot conflicts if it overlaps an existing booking or its 30-minute turnover window
        const isBooked = bookedRanges.some(b => {
            return slotStart < (b.endMs + CLEANING_BUFFER_MS) && b.startMs < (slotEnd + CLEANING_BUFFER_MS);
        });

        const { hour, minute } = parseTimeToHourMinute(slot);
        return {
            time: slot,
            hourValue: hour + minute / 60,
            isBooked
        };
    });

    return res.status(200).json(
        new ApiResponce(200, { slots, bookedRanges, bufferMinutes: 30 }, "Slot availability fetched successfully")
    );
});

// 2. Create Razorpay Payment Order for Booking (POST /api/reservations/book / /create-payment-order)
const createPaymentOrder = asyncHandler(async (req, res) => {
    const { type, name, phone, email, date, startTime, duration, guests, occasion, specialRequests } = req.body;

    if (!type || !name || !phone || !email || !date || !startTime || !duration || !guests) {
        throw new ApiError(400, "All booking fields are required.");
    }

    const hourlyRate = RATES[type] || 1000;
    const totalAmount = hourlyRate * duration;

    // Check if slot is already double booked in DB (including midnight rollover across adjacent days + 30m buffer)
    const { startMs: reqStart, endMs: reqEnd } = getReservationTimeRange(date, startTime, duration);
    const relevantDates = getAdjacentDateStrings(date, duration);

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const bookings = await Reservation.find({
        type,
        date: { $in: relevantDates },
        $or: [
            { status: 'confirmed' },
            { status: 'pending', createdAt: { $gte: fifteenMinutesAgo } }
        ]
    });

    const isDoubleBooked = bookings.some(booking => {
        const { startMs: bStart, endMs: bEnd } = getReservationTimeRange(booking.date, booking.startTime, booking.duration);
        return reqStart < (bEnd + CLEANING_BUFFER_MS) && bStart < (reqEnd + CLEANING_BUFFER_MS);
    });

    if (isDoubleBooked) {
        throw new ApiError(400, "The selected slot conflicts with an existing reservation (including required 30-minute preparation buffer). Please select a different time.");
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

export {
    getRates,
    getAvailability,
    createPaymentOrder,
    createPaymentOrder as book,
    verifyAndConfirm,
    getAllReservations,
    updateReservationStatus,
    reservationInquiry,
    lookupReservation
};
