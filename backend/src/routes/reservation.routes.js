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
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public Booking routes
router.get('/rates', getRates);
router.get('/availability', getAvailability);
router.post('/create-payment-order', createPaymentOrder);
router.post('/book', createPaymentOrder);
router.post('/verify-and-confirm', verifyAndConfirm);
router.get('/lookup', lookupReservation);

// Admin dashboard routes
router.get('/reservations/inquiry', verifyJWT, verifyAdmin, reservationInquiry);
router.get('/', verifyJWT, verifyAdmin, getAllReservations);
router.patch('/:id/status', verifyJWT, verifyAdmin, updateReservationStatus);

export default router;
