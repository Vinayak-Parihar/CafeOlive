# Project Context: Cafe Olive

Welcome to **Cafe Olive**, a premium digital ordering, billing, and reservation ecosystem designed for a modern café experience.

---

## 1. Project Purpose & Product Description

Cafe Olive bridges the gap between traditional premium hospitality and modern contactless convenience. The primary goal is to provide a seamless, session-based customer experience where guests can:
- Sit at a table or walk in.
- Place an initial order and continue adding items to their tab throughout their visit.
- Pay once at the very end of their stay using a single, unified bill.
- Make venue reservations (Private Mini Theatre or Party Halls) with real-time slot checking and pre-payments.
- File booking inquiries for events.
- Submit feedback and review the establishment.

---

## 2. Target Users

1. **Customers**: Access ordering via QR codes on tables or directly on the web app; view consolidated bills; pay online; book sanctuaries; submit inquiries and reviews.
2. **Waiters / Service Staff**: Place orders on behalf of tables; track orders ready to be served; view and update orders in real-time.
3. **Chefs / Kitchen Staff**: View incoming orders sorted by oldest first; update order states (Preparing → Ready).
4. **Admin / Managers**: Oversee full cafe statistics; manage menu categories and items; configure restaurant settings (including QR upload); manage staff roles; moderate reviews individually or in bulk; manage inquiries.

---

## 3. Technology Stack

- **Frontend**:
  - Core: React 18, Vite 7
  - Styling: TailwindCSS (configured in `tailwind.config.js`), Vanilla CSS (`src/index.css`)
  - Icons: `lucide-react`
  - HTTP Client: `axios`
  - Feedback/Toasts: `react-hot-toast`
  - Routing: `react-router-dom`
- **Backend**:
  - Runtime: Node.js
  - Framework: Express
  - Database: MongoDB via Mongoose
  - Payment Processing: Razorpay SDK
  - Authentication: JSON Web Tokens (JWT), Cookies, `bcrypt`
  - File Uploads: Multer + Cloudinary (for QR codes and images)

---

## 4. Main Features

- **Session-Based Ordering**: Keeps track of table sessions using a client-side cookie/UUID (`billSessionId`). Guests can place multiple orders which are grouped under one active unpaid bill.
- **Venue Sanctuaries Reservation**: Real-time reservation scheduler for:
  - Mini Theatre (cinema-style private screens)
  - Party Hall 1 (large events, up to 35 guests)
  - Party Hall 2 (medium events, up to 15 guests)
- **Interactive Time Slot Selector**: Standard hours (08:00 AM - 11:00 PM) filtered dynamically by an AM/PM toggle, supporting custom booking durations and real-time availability checks.
- **Admin Dashboard**:
  - Live order tracking and role assignment.
  - Review Moderation: individual and bulk approval/rejection/deletion controls.
  - Inquiries Management: view, update, call/email, or delete event planning forms.

---

## 5. Important Implementation & Business Rules

- **Do Not Trust the Frontend**: Always calculate order and payment amounts on the backend using the database models as the single source of truth.
- **Double Booking Prevention**: Check slot availability on the backend before creating a Razorpay order for venue reservations.
- **Session Billing**: Customers cannot order on a session that has already been marked `paid`. Payment marks all unpaid orders under that session as `completed` and `paid` at once.
