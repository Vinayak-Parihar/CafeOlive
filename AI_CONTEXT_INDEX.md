# AI Context Index: Cafe Olive

This directory maps Cafe Olive's functional modules to their corresponding files and documentation files, acting as a quick index for developer context.

---

## 1. Directory Roadmap

For general context on the project's layout, design guidelines, or setup:
- **Local Setup**: [`docs/DEVELOPMENT.md`](file:///e:/CAFEOLIVE/docs/DEVELOPMENT.md)
- **Design System & Typography**: [`docs/UI_GUIDELINES.md`](file:///e:/CAFEOLIVE/docs/UI_GUIDELINES.md)
- **Stitch Mockup Reference**: [`docs/STITCH_DESIGN.md`](file:///e:/CAFEOLIVE/docs/STITCH_DESIGN.md)
- **Feature Status Board**: [`docs/FEATURES.md`](file:///e:/CAFEOLIVE/docs/FEATURES.md)

---

## 2. Module Index Mapping

### A. Ordering & Bill Sessions
- **Documentation**: [`docs/BUSINESS_LOGIC.md`](file:///e:/CAFEOLIVE/docs/BUSINESS_LOGIC.md)
- **Database Model**: [`order.model.js`](file:///e:/CAFEOLIVE/backend/src/models/order.model.js)
- **Backend Route**: [`order.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/order.routes.js)
- **Backend Controller**: [`order.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/order.controller.js)
- **Frontend Page**: [`MenuPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/MenuPage.jsx) (adding items / table scans)
- **Frontend Bill**: [`BillPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/customer/BillPage.jsx) (consolidation page)

### B. Venue Reservations
- **Documentation**: [`docs/BUSINESS_LOGIC.md`](file:///e:/CAFEOLIVE/docs/BUSINESS_LOGIC.md)
- **Database Model**: [`reservation.model.js`](file:///e:/CAFEOLIVE/backend/src/models/reservation.model.js)
- **Backend Route**: [`reservation.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/reservation.routes.js)
- **Backend Controller**: [`reservation.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/reservation.controller.js)
- **Frontend Portal**: [`ReservationsPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/ReservationsPage.jsx)
- **Frontend Booking**: [`VenueBookingPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/reservations/VenueBookingPage.jsx)
- **Frontend Admin**: [`ReservationsAdmin.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/admin/ReservationsAdmin.jsx)

### C. Booking Inquiries
- **Database Model**: [`inquiry.model.js`](file:///e:/CAFEOLIVE/backend/src/models/inquiry.model.js)
- **Backend Route**: [`inquiry.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/inquiry.routes.js)
- **Backend Controller**: [`inquiry.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/inquiry.controller.js)
- **Frontend Form**: [`ReservationInquiryPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/reservations/ReservationInquiryPage.jsx)
- **Frontend Admin**: [`InquiriesAdmin.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/admin/InquiriesAdmin.jsx)

### D. Customer Reviews
- **Database Model**: [`review.model.js`](file:///e:/CAFEOLIVE/backend/src/models/review.model.js)
- **Backend Route**: [`review.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/review.routes.js)
- **Backend Controller**: [`review.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/review.controller.js)
- **Frontend Submission**: [`LandingPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/LandingPage.jsx)
- **Frontend Moderation**: [`ReviewsManagement.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/admin/ReviewsManagement.jsx)

### E. Staff & Role Management
- **Documentation**: [`docs/ADMIN_AND_ROLES.md`](file:///e:/CAFEOLIVE/docs/ADMIN_AND_ROLES.md)
- **Database Model**: [`user.model.js`](file:///e:/CAFEOLIVE/backend/src/models/user.model.js)
- **Backend Route**: [`staff.routes.js`](file:///e:/CAFEOLIVE/backend/src/routes/staff.routes.js)
- **Backend Controller**: [`staff.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/staff.controller.js)
- **Frontend Layout**: [`AdminLayout.jsx`](file:///e:/CAFEOLIVE/frontend/src/layouts/AdminLayout.jsx)
- **Frontend Panel**: [`StaffManagement.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/admin/StaffManagement.jsx)

### F. Security & Middleware
- **Documentation**: [`docs/SECURITY.md`](file:///e:/CAFEOLIVE/docs/SECURITY.md)
- **Middlewares**: [`auth.middleware.js`](file:///e:/CAFEOLIVE/backend/src/middlewares/auth.middleware.js) & [`admin.middleware.js`](file:///e:/CAFEOLIVE/backend/src/middlewares/admin.middleware.js)
