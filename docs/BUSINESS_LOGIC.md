# Business Logic & Core Workflows: Cafe Olive

This document details the core rules and workflows governing Cafe Olive's operations, including order sessions, booking validation, and payment checks.

---

## 1. Customer Ordering & Bill Session Lifecycle

Cafe Olive supports a realistic session-based restaurant experience. Instead of forcing immediate payment on every order, orders are placed continuously and paid for collectively at the end.

### A. Session Token (`billSessionId`)
- When a customer first opens the menu and submits an order, they enter their name.
- The frontend checks for an existing `billSessionId` in the browser's cookies.
- If no active session cookie is found:
  1. A new unique UUID is generated.
  2. The UUID is saved as a cookie.
  3. The customer's name is tied to this session.
- Any subsequent orders placed by the same browser use this same `billSessionId` cookie, automatically grouping the orders together.

### B. Table Numbers vs. Walk-Ins
- If table QR codes are scanned, the URL specifies a table parameter (e.g. `/menu?table=T4`), which pre-selects the table number.
- For walk-ins (no table number present), the customer **must** provide a Name before submitting their first order.

### C. Unpaid vs. Paid Segregation
- Orders exist in the database with status `placed` and `paymentStatus: 'pending'`.
- When fetching the current bill (`GET /api/order/bill/:billSessionId`), the server returns only orders where `paymentStatus` is **not** `'paid'`.
- This ensures that if a customer completes a session payment, their cookie is deleted from the browser. The next order they place will generate a new UUID session, separating their previous bill from the new one.

---

## 2. Payments & Verification

Cafe Olive integrates Razorpay for online transactions.

### A. Amount Validation
- **Source of Truth**: When initiating a payment for a session or venue reservation, the payment amount is calculated by querying the database records.
- The server aggregates the price of all unpaid order items or retrieves reservation durations from MongoDB. It never trusts the price payload sent by the client.

### B. Payment Verification
- The client completes the transaction in the Razorpay Checkout widget, which returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
- The server validates these parameters by computing an HMAC-SHA256 signature using the server's `RAZORPAY_KEY_SECRET`.
- **Mock Bypass**: In development environments where the secret key is set to `"MOCK_SECRET_KEY_FOR_LOCAL_TEST"` or the payment ID begins with `"pay_mock"`, the signature check is skipped, allowing staff/developers to test the checkout flow locally.

---

## 3. Sanctuary Reservations

Sanctuary bookings cover three venues: Private Mini Theatre, Party Hall 1, and Party Hall 2.

### A. Overlap Prevention (Double Booking Check)
- A reservation consists of a local date string (`YYYY-MM-DD`), a starting time string (e.g., `"02:00 PM"`), and a duration in hours.
- When validating a slot:
  1. The server checks all reservation documents for that date, venue type, and matching confirmed status.
  2. For each reservation, it computes the occupied hours based on its start time and duration.
  3. It generates a Set of booked hours (expressed as 24-hour integers, e.g., 14 for 2 PM).
  4. Before creating a booking payment order, the server verifies that none of the requested hours overlap with this booked set.

### B. Timezone-Safe Date Storage
- Standard Javascript date operations (`new Date().toISOString()`) convert dates to UTC time. Because India Standard Time (IST) is UTC+5:30, generating a date string at night shifts the date back by one day, resulting in a mismatch between user selection and database writes.
- To prevent this, the client constructs date strings explicitly using local date getters (`getFullYear()`, `getMonth()`, `getDate()`) to ensure that the date string sent to the server represents the exact local calendar date.

---

## 4. Kitchen & Service Workflows

```
Order Placed (placed)
      ↓
Kitchen Dashboard (placed/preparing)
      ↓  [Chef accepts -> Status: preparing]
      ↓  [Chef completes -> Status: ready]
Service Dashboard (ready/served)
      ↓  [Waiter serves -> Status: served]
      ↓  [Bill paid -> Status: completed]
```

1. **Kitchen (KDS)**:
   - Displays orders with status `'placed'` or `'preparing'`.
   - Chefs can move an order to `'preparing'` to claim it, and then mark it `'ready'` when cooked.
2. **Service (Waiter)**:
   - Displays orders with status `'ready'` or `'served'`.
   - Waiters can mark orders as `'served'` once delivered to the table.
   - When a session bill is paid, all associated orders transition to `'completed'`.
