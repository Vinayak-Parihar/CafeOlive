# Security Overview: Cafe Olive

This document details the security protocols, encryption methods, token verification systems, and data protection strategies implemented in Cafe Olive.

---

## 1. Authentication & Session Security

- **Hashing Algorithm**: User passwords are encrypted using **BCrypt** with 10 salt rounds before being persisted. Hashing is triggered automatically via a Mongoose pre-save hook in [`user.model.js`](file:///e:/CAFEOLIVE/backend/src/models/user.model.js) whenever the password field is modified.
- **JWT Verification**:
  - Access Token and Refresh Token generation uses the `jsonwebtoken` package.
  - Configuration variables: `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`.
  - [`auth.middleware.js`](file:///e:/CAFEOLIVE/backend/src/middlewares/auth.middleware.js) intercepts requests and parses tokens from:
    1. HTTP cookies (`req.cookies.accessToken`)
    2. HTTP Authorization header (`Bearer <token>`)

---

## 2. API Authorization & RBAC

- **Role Attribute**: Permissions are determined based on the user's role field stored in MongoDB: `['admin', 'manager', 'chef', 'waiter', 'customer']`.
- **Role Verification**:
  - The [`admin.middleware.js`](file:///e:/CAFEOLIVE/backend/src/middlewares/admin.middleware.js) checks if `req.user.role === 'admin'`. If false, it throws a `403 Forbidden` error.
  - Staff permissions (Chef, Waiter) are currently enforced on the client-side UI navigation layouts, and verified on KDS/Service routes by requiring authentication.

---

## 3. Payments Integrity & Signature Verification

- **HMAC Signatures**: To prevent spoofing and verify that payments were successfully resolved by Razorpay, the backend performs server-side signature checking.
- **Algorithm**:
  1. The server reads the transaction response parameters (`razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`).
  2. It generates a SHA-256 HMAC payload from the concatenation: `razorpay_order_id + "|" + razorpay_payment_id` using `process.env.RAZORPAY_KEY_SECRET`.
  3. If the generated hash matches the `razorpay_signature` sent by the client, the transaction is marked as valid and the order/reservation is confirmed.
- **Bypass Rule**: If the secret key is set to `"MOCK_SECRET_KEY_FOR_LOCAL_TEST"`, signature verification is skipped to facilitate local testing without online key validations.

---

## 4. File Upload Security

- **Storage Provider**: Uploaded files (category images, website media, and profile avatars) are parsed using `multer` and uploaded directly to Cloudinary.
- **Validation**:
  - [`multer..middeleware.js`](file:///e:/CAFEOLIVE/backend/src/middlewares/multer..middeleware.js) (named with two periods in the filename) caches files locally to a temporary `public/temp` directory before cloud uploading.
  - Image URLs are stored as strings in the database, avoiding raw blob storage in MongoDB.
