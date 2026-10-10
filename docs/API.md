# Backend API Documentation: Cafe Olive

This document details every backend HTTP endpoint implemented in the Cafe Olive project.

---

## 1. Authentication Module (`/api/users`)
- **Router Path**: [`user.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/user.routes.js)
- **Controller Path**: [`user.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/user.controller.js)

### A. Register User
- **Endpoint**: `POST /api/users/register`
- **Authentication**: None (Public)
- **Body (Multipart-form)**:
  - `username` (String, required)
  - `email` (String, required)
  - `fullName` (String, required)
  - `password` (String, required)
  - `role` (String, required, enum: `admin`, `manager`, `chef`, `waiter`, `customer`)
  - `photo` (File, optional avatar)
- **Database Action**: Saves new `User` document with hashed password. Uploads avatar to Cloudinary.
- **Success Response**: `201 Created` with created user details (excluding password).

### B. Login User
- **Endpoint**: `POST /api/users/login`
- **Authentication**: None (Public)
- **Body (JSON)**:
  - `username` (String, optional) or `email` (String, optional)
  - `password` (String, required)
- **Database Action**: Queries user, checks password via bcrypt, generates access/refresh JWT tokens, saves refresh token to database.
- **Success Response**: `200 OK` with JSON user details, sets cookie `accessToken` and `refreshToken`.

### C. Logout User
- **Endpoint**: `POST /api/users/logout`
- **Authentication**: JWT Check (`verifyJWT` middleware required)
- **Database Action**: Clears `refreshToken` in `User` document.
- **Success Response**: `200 OK` with cleared cookies.

### D. Get Current User
- **Endpoint**: `GET /api/users/current-user`
- **Authentication**: JWT Check (`verifyJWT` middleware required)
- **Success Response**: `200 OK` with decrypted JWT user payload.

---

## 2. Menu Module (`/api/menu`)
- **Router Path**: [`menu.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/menu.routes.js)
- **Controller Path**: [`menu.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/menu.controller.js)

### A. Create Category
- **Endpoint**: `POST /api/menu/category`
- **Authentication**: Admin JWT Check (`verifyJWT` & `verifyAdmin` middleware required)
- **Body (JSON)**:
  - `name` (String, required)
- **Database Action**: Inserts new category.

### B. Get All Categories
- **Endpoint**: `GET /api/menu/category`
- **Authentication**: None (Public)
- **Success Response**: `200 OK` list of all categories.

### C. Add Menu Item
- **Endpoint**: `POST /api/menu/item`
- **Authentication**: Admin JWT Check (`verifyJWT` & `verifyAdmin` middleware required)
- **Body (Multipart-form)**:
  - `name` (String, required)
  - `description` (String)
  - `price` (Number, required)
  - `category` (String, category ObjectId)
  - `image` (File, uploaded to Cloudinary)
- **Database Action**: Saves new `Menu` item.

### D. Get Full Menu
- **Endpoint**: `GET /api/menu/list`
- **Authentication**: None (Public)
- **Success Response**: `200 OK` list of all categories containing populated menu items list.

---

## 3. Order Module (`/api/order`)
- **Router Path**: [`order.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/order.routes.js)
- **Controller Path**: [`order.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/order.controller.js)

### A. Place Order
- **Endpoint**: `POST /api/order/place`
- **Authentication**: None (Customer or Waiter placing for table)
- **Body (JSON)**:
  - `items`: Array of `{ _id, name, price, quantity }`
  - `tableNumber` (String, optional)
  - `customerName` (String, required if tableNumber missing)
  - `orderSource` (String, `'customer'` or `'waiter'`)
  - `waiterName` (String, optional)
  - `waiterId` (String, optional)
  - `billSessionId` (String UUID, required for customer session tracking)
- **Database Action**: Creates new `Order` object, status set to `'placed'`. Sets `billSessionId`.

### B. Get Session Bill
- **Endpoint**: `GET /api/order/bill/:billSessionId`
- **Authentication**: None (Public customer access)
- **Success Response**: List of unpaid orders in session, grandTotal, tableNumber, customerName.

### C. Create Session Payment Order
- **Endpoint**: `POST /api/order/bill/:billSessionId/pay`
- **Authentication**: None (Public customer access)
- **Database Action**: Calculates sum of unpaid session orders from database. Generates Razorpay Order. Updates session orders with `razorpayOrderId`.
- **Success Response**: Razorpay order configuration payload.

### D. Verify Session Payment
- **Endpoint**: `POST /api/order/bill/:billSessionId/verify`
- **Authentication**: None (Public customer access)
- **Body (JSON)**:
  - `razorpayOrderId` (String)
  - `razorpayPaymentId` (String)
  - `razorpaySignature` (String, optional for mock)
- **Database Action**: Validates HMAC signature. Fetches payment method. Updates all unpaid session orders: `paymentStatus = 'paid'`, `isPaid = true`, `status = 'completed'`.

### E. Get Kitchen Orders
- **Endpoint**: `GET /api/order/kitchen`
- **Authentication**: Staff JWT Check (`verifyJWT` required)
- **Success Response**: List of orders where `status` is `'placed'` or `'preparing'`, sorted oldest first.

### F. Get Waiter Service Orders
- **Endpoint**: `GET /api/order/waiter`
- **Authentication**: Staff JWT Check (`verifyJWT` required)
- **Success Response**: List of orders where `status` is `'ready'` or `'served'`, sorted newest first.

### G. Update Order Status
- **Endpoint**: `PATCH /api/order/status/:orderId`
- **Authentication**: Staff JWT Check (`verifyJWT` required)
- **Body (JSON)**:
  - `status` (String, `'placed'`, `'preparing'`, `'ready'`, `'served'`, `'completed'`, `'cancelled'`)
  - `paymentMethod` (String, optional)
- **Database Action**: Updates order status. If set to `'completed'`, marks as paid.

---

## 4. Reservations Module (`/api/reservations`)
- **Router Path**: [`reservation.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/reservation.routes.js)
- **Controller Path**: [`reservation.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/reservation.controller.js)

### A. Get Availability
- **Endpoint**: `GET /api/reservations/availability?type=theatre&date=2026-08-24`
- **Database Action**: Queries all confirmed/pending bookings for the specific venue type and date string. Matches hour slots (08:00 AM - 11:00 PM) to find overlapping hours.
- **Success Response**: Array of `{ time: "08:00 AM", hourValue: 8, isBooked: boolean }` for every slot.

### B. Create Payment Order
- **Endpoint**: `POST /api/reservations/create-payment-order`
- **Body (JSON)**:
  - `type` (String, `'theatre'`, `'partyHall1'`, `'partyHall2'`)
  - `name`, `phone`, `email` (Strings)
  - `date` (String `YYYY-MM-DD`)
  - `startTime` (String e.g. "02:00 PM")
  - `duration` (Number, hours)
  - `guests` (Number)
  - `occasion`, `specialRequests` (Strings, optional)
- **Database Action**: Pre-validates availability (checks that no booked hours overlap with duration). Generates a Razorpay Order for calculated price (`duration * hourlyRate`). Saves a `Reservation` document with status `'pending'`.

### C. Verify and Confirm
- **Endpoint**: `POST /api/reservations/verify-and-confirm`
- **Body (JSON)**:
  - `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature` (Strings)
  - `reservationId` (String)
- **Database Action**: Verifies signature. Marks `Reservation` document `paymentStatus = 'paid'` and `status = 'confirmed'`.

### D. Get All Reservations (Admin)
- **Endpoint**: `GET /api/reservations`
- **Authentication**: Staff JWT Check (`verifyJWT` required)
- **Success Response**: List of all reservations.

### E. Update Reservation Status (Admin)
- **Endpoint**: `PATCH /api/reservations/:id/status`
- **Authentication**: Staff JWT Check (`verifyJWT` required)
- **Body**: `{ status: 'confirmed' | 'cancelled' }`

---

## 5. Reviews Module (`/api/reviews`)
- **Router Path**: [`review.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/review.routes.js)
- **Controller Path**: [`review.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/review.controller.js)

### A. Submit Review
- **Endpoint**: `POST /api/reviews`
- **Body**: `{ name, rating, comment }`
- **Database Action**: Creates a pending review.

### B. Get Public Reviews
- **Endpoint**: `GET /api/reviews/public`
- **Success Response**: Array of approved reviews, shuffled randomly.

### C. Get All Reviews (Admin)
- **Endpoint**: `GET /api/reviews/admin`
- **Authentication**: Staff JWT Check (`verifyJWT` required)

### D. Update Review Status (Admin)
- **Endpoint**: `PATCH /api/reviews/:id/status`
- **Body**: `{ status: 'approved' | 'rejected' | 'pending' }`

### E. Bulk Status Update (Admin)
- **Endpoint**: `PATCH /api/reviews/bulk-status`
- **Body**: `{ ids: [...], status: 'approved' | 'rejected' }`
- **Database Action**: Performs `updateMany` for selected IDs.

### F. Bulk Delete (Admin)
- **Endpoint**: `POST /api/reviews/bulk-delete`
- **Body**: `{ ids: [...] }`
- **Database Action**: Performs `deleteMany` for selected IDs.

---

## 6. Inquiries Module (`/api/inquiries`)
- **Router Path**: [`inquiry.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/inquiry.routes.js)
- **Controller Path**: [`inquiry.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/inquiry.controller.js)

### A. Submit Inquiry
- **Endpoint**: `POST /api/inquiries`
- **Body**: `{ name, phone, email, inquiryType, preferredDate, message }`

### B. Get All Inquiries (Admin)
- **Endpoint**: `GET /api/inquiries`
- **Authentication**: Staff JWT Check (`verifyJWT` required)

### C. Update Status (Admin)
- **Endpoint**: `PATCH /api/inquiries/:id/status`
- **Body**: `{ status: 'new' | 'in_progress' | 'resolved' }`

### D. Delete Inquiry (Admin)
- **Endpoint**: `DELETE /api/inquiries/:id`

---

## 7. Staff Management Module (`/api/staff`)
- **Router Path**: [`staff.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/staff.routes.js)
- **Controller Path**: [`staff.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/staff.controller.js)

### A. Add Staff Member
- **Endpoint**: `POST /api/staff/add`
- **Authentication**: Admin JWT Check (`verifyJWT` & `verifyAdmin` required)
- **Body**: `{ fullName, email, username, password, role }`
- **Database Action**: Creates a staff `User`.

### B. List All Staff
- **Endpoint**: `GET /api/staff/list`
- **Authentication**: Admin JWT Check

### C. Remove Staff Member
- **Endpoint**: `DELETE /api/staff/remove/:staffId`
- **Authentication**: Admin JWT Check

---

## 8. Admin Settings Module (`/api/admin`)
- **Router Path**: [`admin.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/admin.routes.js)
- **Controller Path**: [`admin.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/admin.controller.js)

### A. Get Stats
- **Endpoint**: `GET /api/admin/stats`
- **Authentication**: Admin JWT Check (`verifyJWT` & `verifyAdmin` required)
- **Success Response**: `{ totalOrders, todayOrders, todayOnlinePayments, todayRevenue, statusBreakdown }`

### B. Get Pending Orders
- **Endpoint**: `GET /api/admin/pending-orders`
- **Authentication**: Admin JWT Check
- **Success Response**: Active orders with status matching `['placed', 'preparing', 'ready', 'served']`.

### C. Upload QR Code
- **Endpoint**: `POST /api/admin/upload-qr`
- **Authentication**: Admin JWT Check
- **Body (Multipart-form)**: `{ qrImage: file }`
- **Database Action**: Uploads to Cloudinary, updates `Restaurant` collection settings.

### D. Get Settings
- **Endpoint**: `GET /api/admin/settings`
- **Success Response**: `{ paymentQrCodeUrl }` (Publicly visible for manual UPI transfer falls)
