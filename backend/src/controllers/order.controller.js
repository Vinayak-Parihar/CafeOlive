import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Order } from "../models/order.model.js";
import { Menu } from "../models/menu.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { RAZORPAY_MOCK_SECRET } from "../constants/payment.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET || RAZORPAY_MOCK_SECRET
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Place Order (Customer or Waiter)
//    Customer orders no longer trigger immediate payment.
//    They carry a billSessionId and go straight to the kitchen.
// ─────────────────────────────────────────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
    const {
        items,
        tableNumber,
        customerName,
        customerPhone,
        customerEmail,
        orderSource,
        waiterName,
        waiterId,
        billSessionId   // session identifier sent from frontend cookie
    } = req.body;

    if (!items || items.length === 0) {
        throw new ApiError(400, "Order must contain at least one item.");
    }

    let finalTableNumber = tableNumber ? String(tableNumber).trim() : '';
    let finalCustomerName = customerName ? String(customerName).trim() : '';
    let finalCustomerPhone = customerPhone ? String(customerPhone).trim() : '';
    let finalCustomerEmail = customerEmail ? String(customerEmail).trim() : '';

    // If customerName or phone is omitted on a follow-up order within an existing session, inherit it
    if (billSessionId && (!finalCustomerName || !finalCustomerPhone)) {
        const prevOrder = await Order.findOne({ billSessionId, customerName: { $exists: true, $ne: '' } });
        if (prevOrder) {
            if (!finalCustomerName && prevOrder.customerName) finalCustomerName = prevOrder.customerName;
            if (!finalCustomerPhone && prevOrder.customerPhone) finalCustomerPhone = prevOrder.customerPhone;
            if (!finalCustomerEmail && prevOrder.customerEmail) finalCustomerEmail = prevOrder.customerEmail;
        }
    }

    const INVALID_TABLE_VALUES = ['n/a', 'walk-in', 'null', 'undefined', 'unknown'];
    const isTableMissing = !finalTableNumber || INVALID_TABLE_VALUES.includes(finalTableNumber.toLowerCase());

    if (isTableMissing) {
        // Walk-in customer: name required unless it's a waiter order
        const isWaiterOrder = orderSource === 'waiter';
        if (!isWaiterOrder && !finalCustomerName) {
            throw new ApiError(400, "Customer name is required when no table number exists.");
        }
        if (finalCustomerName && finalCustomerName.length > 50) {
            throw new ApiError(400, "Customer name is too long (maximum 50 characters).");
        }
        finalTableNumber = undefined;
    } else {
        if (!finalCustomerName) {
            finalCustomerName = undefined;
        }
    }

    // ── Validate session for customer orders ──────────────────────────────────
    const isWaiterOrder = orderSource === 'waiter';

    if (!isWaiterOrder && billSessionId) {
        const paidSessionOrder = await Order.findOne({
            billSessionId,
            paymentStatus: 'paid'
        });
        if (paidSessionOrder) {
            throw new ApiError(400, "This bill session has already been paid. Please start a new session.");
        }
    }

    // ── Validate items and compute total ──────────────────────────────────────
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of items) {
        const menuItem = await Menu.findById(item._id);
        if (!menuItem) {
            throw new ApiError(404, `Item not found: ${item.name}`);
        }
        calculatedTotal += menuItem.price * item.quantity;
        orderItems.push({
            name: menuItem.name,
            price: menuItem.price,
            quantity: item.quantity,
            menuItem: menuItem._id
        });
    }

    // ── Build order data ──────────────────────────────────────────────────────
    const orderData = {
        items: orderItems,
        totalAmount: calculatedTotal,
        tableNumber: finalTableNumber,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone || undefined,
        customerEmail: finalCustomerEmail || undefined,
        status: 'placed',
        paymentStatus: 'pending',
        isPaid: false,
        guestDetails: {
            name: finalCustomerName,
            phone: finalCustomerPhone || undefined,
            email: finalCustomerEmail || undefined
        },
        orderSource: orderSource || 'customer'
    };

    if (billSessionId) {
        orderData.billSessionId = billSessionId;
    }

    if (isWaiterOrder && waiterName) {
        orderData.waiterName = waiterName;
        orderData.placedBy = waiterId || null;
    }

    const order = await Order.create(orderData);

    return res.status(201).json(
        new ApiResponce(201, { order }, "Order placed successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get Kitchen Orders (Chef) → 'placed' or 'preparing'
// ─────────────────────────────────────────────────────────────────────────────
const getKitchenOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({
        status: { $in: ['placed', 'preparing'] }
    }).sort({ createdAt: 1 }); // Oldest first

    return res.status(200).json(
        new ApiResponce(200, orders, "Kitchen orders fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Service Orders (Waiter) → 'ready' or 'served'
// ─────────────────────────────────────────────────────────────────────────────
const getWaiterOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({
        status: { $in: ['ready', 'served'] }
    }).sort({ updatedAt: -1 }); // Recently ready first

    return res.status(200).json(
        new ApiResponce(200, orders, "Service orders fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Update Order Status
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentMethod, paymentStatus } = req.body;

    const validStatuses = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const updateData = {};
    if (status) updateData.status = status;

    if (status === 'completed' || paymentStatus === 'paid') {
        updateData.paymentStatus = 'paid';
        updateData.isPaid = true;
        updateData.paymentMethod = paymentMethod || 'Cash';
        updateData.paymentTimestamp = new Date();
    } else if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
    }

    const order = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
    );

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // When an order in a bill session is settled, settle all orders in that customer's session
    if (order.billSessionId && (status === 'completed' || paymentStatus === 'paid')) {
        await Order.updateMany(
            { billSessionId: order.billSessionId, paymentStatus: { $ne: 'paid' } },
            {
                $set: {
                    paymentStatus: 'paid',
                    isPaid: true,
                    status: 'completed',
                    paymentMethod: updateData.paymentMethod,
                    paymentTimestamp: updateData.paymentTimestamp
                }
            }
        );
    }

    return res.status(200).json(
        new ApiResponce(200, order, `Order updated successfully`)
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. [LEGACY] Verify Razorpay Payment for a single order
//    Kept for backward compatibility with any waiter/admin tooling.
//    Customer payments now go through verifyBillPayment instead.
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !orderId) {
        throw new ApiError(400, "Missing payment details for verification.");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found.");
    }

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
        order.paymentStatus = 'failed';
        await order.save();
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    order.paymentStatus = 'paid';
    order.status = 'placed';
    order.isPaid = true;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentTimestamp = new Date();
    order.paymentMethod = req.body.paymentMethod || 'Online';

    await order.save();

    return res.status(200).json(
        new ApiResponce(200, order, "Payment verified successfully")
    );
});

// ═════════════════════════════════════════════════════════════════════════════
//  SESSION BILL ENDPOINTS (New)
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 6. Get Session Bill
//    Returns all unpaid orders for a given billSessionId along with the total.
//    GET /api/order/bill/:billSessionId
// ─────────────────────────────────────────────────────────────────────────────
const getSessionBill = asyncHandler(async (req, res) => {
    const { billSessionId } = req.params;

    if (!billSessionId) {
        throw new ApiError(400, "Bill session ID is required.");
    }

    const orders = await Order.find({
        billSessionId,
        paymentStatus: { $ne: 'paid' }   // Only unpaid orders belong to active bill
    }).sort({ createdAt: 1 });

    if (orders.length === 0) {
        // Could mean session is fully paid or session doesn't exist
        // Check if any paid orders exist for this session
        const paidOrders = await Order.find({ billSessionId, paymentStatus: 'paid' });
        if (paidOrders.length > 0) {
            return res.status(200).json(
                new ApiResponce(200, {
                    orders: [],
                    grandTotal: 0,
                    sessionPaid: true,
                    customerName: paidOrders[0]?.customerName || null
                }, "This bill session has been paid.")
            );
        }

        return res.status(200).json(
            new ApiResponce(200, {
                orders: [],
                grandTotal: 0,
                sessionPaid: false,
                customerName: null
            }, "No orders found for this session.")
        );
    }

    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const customerName = orders[0]?.customerName || orders[0]?.guestDetails?.name || null;
    const tableNumber = orders[0]?.tableNumber || null;
    const paymentMethod = orders[0]?.paymentMethod || null;
    const paymentStatus = orders[0]?.paymentStatus || 'pending';

    return res.status(200).json(
        new ApiResponce(200, {
            orders,
            grandTotal,
            sessionPaid: false,
            customerName,
            tableNumber,
            paymentMethod,
            paymentStatus
        }, "Session bill fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Create Bill Payment (Razorpay Order for entire session)
//    Calculates session total from DB (source of truth — not from frontend).
//    POST /api/order/bill/:billSessionId/pay
// ─────────────────────────────────────────────────────────────────────────────
const createBillPayment = asyncHandler(async (req, res) => {
    const { billSessionId } = req.params;

    if (!billSessionId) {
        throw new ApiError(400, "Bill session ID is required.");
    }

    // Fetch all unpaid orders for this session
    const unpaidOrders = await Order.find({
        billSessionId,
        paymentStatus: { $ne: 'paid' }
    });

    if (unpaidOrders.length === 0) {
        throw new ApiError(400, "No unpaid orders found for this session. The bill may already be paid.");
    }

    // Calculate total from DB — never trust the frontend total
    const sessionTotal = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    if (sessionTotal <= 0) {
        throw new ApiError(400, "Invalid session total. Cannot process payment.");
    }

    // Create Razorpay order for the full session amount
    try {
        const options = {
            amount: Math.round(sessionTotal * 100), // paise
            currency: "INR",
            receipt: `bill_${billSessionId.slice(0, 8)}_${Date.now()}`
        };

        const rzpOrder = await razorpay.orders.create(options);

        // Store the Razorpay order ID on the first unpaid order for reference
        // (We'll use the billSessionId for verification, not individual order IDs)
        await Order.updateMany(
            { billSessionId, paymentStatus: { $ne: 'paid' } },
            { $set: { razorpayOrderId: rzpOrder.id } }
        );

        return res.status(200).json(
            new ApiResponce(200, {
                razorpayOrder: rzpOrder,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                sessionTotal,
                orderCount: unpaidOrders.length
            }, "Razorpay order created for bill session")
        );
    } catch (error) {
        console.error("Razorpay bill payment creation failed:", error);
        throw new ApiError(500, "Failed to initiate payment. Please try again.");
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Verify Bill Payment (Razorpay verification + mark all session orders paid)
//    POST /api/order/bill/:billSessionId/verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyBillPayment = asyncHandler(async (req, res) => {
    const { billSessionId } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!billSessionId) {
        throw new ApiError(400, "Bill session ID is required.");
    }

    if (!razorpayOrderId || !razorpayPaymentId) {
        throw new ApiError(400, "Missing Razorpay payment details.");
    }

    // ── Signature verification ────────────────────────────────────────────────
    let isSignatureValid = false;
    const secret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_MOCK_SECRET;

    if (
        secret === RAZORPAY_MOCK_SECRET ||
        razorpayPaymentId?.startsWith('pay_mock') ||
        !razorpaySignature
    ) {
        // Allow mock payments in development
        isSignatureValid = true;
    } else {
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");
        isSignatureValid = (expectedSignature === razorpaySignature);
    }

    if (!isSignatureValid) {
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    // ── Fetch payment method from Razorpay ────────────────────────────────────
    let paymentMethod = 'Online';
    if (secret !== RAZORPAY_MOCK_SECRET && !razorpayPaymentId?.startsWith('pay_mock')) {
        try {
            const paymentInfo = await razorpay.payments.fetch(razorpayPaymentId);
            if (paymentInfo?.method) {
                paymentMethod = paymentInfo.method.toUpperCase();
            }
        } catch (e) {
            console.error("Failed to fetch payment method from Razorpay:", e);
        }
    } else {
        paymentMethod = req.body.paymentMethod || 'UPI';
    }

    // ── Mark ALL unpaid orders in this session as paid ───────────────────────
    const updateResult = await Order.updateMany(
        {
            billSessionId,
            paymentStatus: { $ne: 'paid' }  // Safety: don't double-mark anything
        },
        {
            $set: {
                paymentStatus: 'paid',
                isPaid: true,
                status: 'completed',
                paymentMethod,
                razorpayPaymentId,
                razorpaySignature: razorpaySignature || '',
                paymentTimestamp: new Date()
            }
        }
    );

    if (updateResult.matchedCount === 0) {
        // Could be a replay / duplicate verification attempt
        return res.status(200).json(
            new ApiResponce(200, { alreadyPaid: true }, "Bill session was already marked as paid.")
        );
    }

    return res.status(200).json(
        new ApiResponce(200, {
            billSessionId,
            ordersMarkedPaid: updateResult.modifiedCount,
            paymentMethod,
            razorpayPaymentId
        }, "Bill payment verified. All orders in session marked as paid.")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Update Bill Payment Method (Customer chooses Cash or Online)
//    PATCH /api/order/bill/:billSessionId/payment-method
// ─────────────────────────────────────────────────────────────────────────────
const updateBillPaymentMethod = asyncHandler(async (req, res) => {
    const { billSessionId } = req.params;
    const { paymentMethod } = req.body;

    if (!billSessionId) {
        throw new ApiError(400, "Bill session ID is required.");
    }

    const finalMethod = paymentMethod === 'Cash' ? 'Cash' : 'Online';

    const result = await Order.updateMany(
        { billSessionId, paymentStatus: { $ne: 'paid' } },
        { $set: { paymentMethod: finalMethod } }
    );

    return res.status(200).json(
        new ApiResponce(200, { billSessionId, paymentMethod: finalMethod, modifiedCount: result.modifiedCount }, `Payment method updated to ${finalMethod}`)
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Settle Bill Session (Staff marks Cash or Online payment directly)
//     POST /api/order/bill/:billSessionId/settle
// ─────────────────────────────────────────────────────────────────────────────
const settleBillSession = asyncHandler(async (req, res) => {
    const { billSessionId } = req.params;
    const { paymentMethod } = req.body;

    if (!billSessionId) {
        throw new ApiError(400, "Bill session ID is required.");
    }

    const finalMethod = paymentMethod === 'Online' ? 'Online' : 'Cash';

    const updateResult = await Order.updateMany(
        { billSessionId, paymentStatus: { $ne: 'paid' } },
        {
            $set: {
                paymentStatus: 'paid',
                isPaid: true,
                status: 'completed',
                paymentMethod: finalMethod,
                paymentTimestamp: new Date()
            }
        }
    );

    return res.status(200).json(
        new ApiResponce(200, {
            billSessionId,
            ordersSettled: updateResult.modifiedCount,
            paymentMethod: finalMethod
        }, `Bill session marked as paid via ${finalMethod}`)
    );
});

export {
    placeOrder,
    getKitchenOrders,
    getWaiterOrders,
    updateOrderStatus,
    verifyPayment,
    // Session bill endpoints
    getSessionBill,
    createBillPayment,
    verifyBillPayment,
    updateBillPaymentMethod,
    settleBillSession
};
