import express from "express";
import {
    getRates,
    getAvailability,
    createPaymentOrder,
    verifyAndConfirm,
    getAllReservations,
    updateReservationStatus,
    reservationInquiry,
    lookupReservation
} from "../controllers/reservation.controller.js";

const router = express.Router();

// Public Booking routes
router.get('/rates', getRates);
router.get('/availability', getAvailability);
router.post('/create-payment-order', createPaymentOrder);
router.post('/verify-and-confirm', verifyAndConfirm);
router.get('/lookup', lookupReservation);
router.get('/reservations/inquiry', reservationInquiry); // Todo: Add Middleware

// Admin dashboard routes
router.get('/', getAllReservations);
router.patch('/:id/status', updateReservationStatus);

export default router;
