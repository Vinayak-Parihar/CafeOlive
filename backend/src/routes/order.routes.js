import { Router } from "express";
import {
    placeOrder,
    getKitchenOrders,
    getWaiterOrders,
    updateOrderStatus,
    verifyPayment,
    getSessionBill,
    createBillPayment,
    verifyBillPayment
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Debug middleware - log all order API requests
router.use((req, res, next) => {
    console.log('🔔 [Order Router] Request received:', req.method, req.path);
    console.log('🔔 [Order Router] Request body:', JSON.stringify(req.body, null, 2));
    next();
});

// ─── Public / Customer Routes ──────────────────────────────────────────────
// Place a single order (customer or waiter pre-auth)
router.route("/place").post(placeOrder);

// Legacy single-order payment verification (kept for backward compat)
router.route("/verify-payment").post(verifyPayment);

// Session Bill Routes (public — identified by billSessionId UUID)
router.route("/bill/:billSessionId").get(getSessionBill);
router.route("/bill/:billSessionId/pay").post(createBillPayment);
router.route("/bill/:billSessionId/verify").post(verifyBillPayment);

// ─── Protected Routes (Chef / Waiter / Admin) ─────────────────────────────
router.use(verifyJWT);

// Kitchen (Chef & Admin)
router.route("/kitchen").get(getKitchenOrders);

// Service (Waiter & Admin)
router.route("/waiter").get(getWaiterOrders);

// Update Status (All staff)
router.route("/status/:orderId").patch(updateOrderStatus);

export default router;
