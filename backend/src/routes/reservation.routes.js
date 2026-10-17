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
import { verifyAdmin, verifyStaff } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public Booking routes
router.get('/rates', getRates);
router.get('/availability', getAvailability);
router.post('/create-payment-order', createPaymentOrder);
router.post('/book', createPaymentOrder);
router.post('/verify-and-confirm', verifyAndConfirm);
router.get('/lookup', lookupReservation);

// Staff dashboard routes - Hall permissions for all staff members (Admin, Manager, Cashier, Chef, Waiter)
router.get('/reservations/inquiry', verifyJWT, verifyStaff, reservationInquiry);
router.get('/', verifyJWT, verifyStaff, getAllReservations);
router.patch('/:id/status', verifyJWT, verifyStaff, updateReservationStatus);

export default router;
