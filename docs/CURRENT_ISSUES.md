# Current Issues & Pending Work: Cafe Olive

This document details verified bugs, security gaps, placeholders, and planned features within the Cafe Olive codebase.

---

## 1. Confirmed Issues & Security Gaps

### A. Missing JWT Route Guarding on Admin Routes
Several admin/staff backend routes do not enforce authentication (`verifyJWT`) or admin checking (`verifyAdmin`), exposing sensitive operations to the public internet:
1. **Reviews Module (`review.routes.js`)**:
   - `GET /api/reviews/admin` (fetches all pending/approved/rejected reviews).
   - `PATCH /api/reviews/:id/status` (accepts/rejects individual reviews).
   - `PATCH /api/reviews/bulk-status` (accepts/rejects reviews in bulk).
   - `POST /api/reviews/bulk-delete` (deletes reviews).
2. **Reservations Module (`reservation.routes.js`)**:
   - `GET /api/reservations` (fetches all customer reservations).
   - `PATCH /api/reservations/:id/status` (updates reservation status).
3. **Inquiries Module (`inquiry.routes.js`)**:
   - `GET /api/inquiries` (fetches all custom event planning inquiries).
   - `PATCH /api/inquiries/:id/status` (modifies inquiry status).
   - `DELETE /api/inquiries/:id` (deletes inquiries).

*Recommendation*: Apply `verifyJWT` (and `verifyAdmin` where appropriate) before declaring these routes.

### B. Hardcoded Razorpay Mock Fallback
- **Path**: [`order.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/order.controller.js) and [`reservation.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/reservation.controller.js)
- **Detail**: The Razorpay instance defaults to a hardcoded test key ID if the env variable is missing:
  `process.env.RAZORPAY_KEY_ID || "rzp_test_5pB8m5NfR0Z1G6"`
- **Risk**: Test keys or secrets might be checked into the codebase or exposed if not set properly in production.

---

## 2. Suspected Issues & Refactoring Tasks

### A. Non-Uniform Typo (`ApiResponce`)
- **Detail**: The response helper class is named `ApiResponce.js` (spelled with a **c**) instead of `ApiResponse`. Several controllers import it as `ApiResponce`.
- **Action**: Correcting this across the codebase requires updating all import links in controllers.

### B. Incomplete Frontend Polling for Admin Views
- **Detail**: Dashboards (KDS, Waiter dashboard, Inquiries) fetch data on mount. Only `ReviewsManagement.jsx` has a `setInterval` poll (every 10 seconds).
- **Impact**: Waiters and Chefs must reload or switch tabs to see newly placed orders in real-time unless the component is refreshed manually.

---

## 3. Pending Features

- **RBAC API Interceptor**: Set up role-based route parameters so a Chef cannot call `/api/order/waiter` or update order status to `served` / `completed`.
- **Payment Gateway Live Mode Transition**: Standardize environment config checks to swap Razorpay configurations from `rzp_test_*` to `rzp_live_*` without server edits.
