# Admin & Staff Roles: Cafe Olive

This document details the user roles, dashboards, permissions, and administration interfaces implemented in Cafe Olive.

---

## 1. Staff Roles & Capabilities

The system defines four staff roles stored in the database `User` collection under the `role` field:

| Role | Access URL | Sidebar Navigation Items | Allowed Actions |
|---|---|---|---|
| **Admin** | `/admin/dashboard` | Dashboard, Staff, Add Items, Settings, Reviews, Inquiries, Kitchen (KDS), Service, Take Order, Reservations | Complete system oversight, staff creation/removal, menu adjustments, settings modifications, review moderations, and inquiry management. |
| **Manager** | `/admin/dashboard` | Same as Admin (excluding credentials editing) | Manage daily operations, view dashboard statistics, handle reviews, and moderate inquiries. |
| **Chef** | `/admin/kitchen` | Kitchen (KDS) | View pending kitchen orders, toggle status to `preparing` or `ready`. |
| **Waiter** | `/admin/service` | Service, Take Order, Reservations | Place orders for table guests, view service orders, update order status to `served` or `completed`, view reservation calendars. |

---

## 2. Administration Dashboards

### A. Main Admin Dashboard (`/admin/dashboard`)
- **Controller**: [`admin.controller.js`](file:///e:/CAFEOLIVE/backend/src/controllers/admin.controller.js)
- **Component**: [`AdminDashboard.jsx`](file:///e:/CAFEOLIVE/frontend/src/AdminDashboard.jsx)
- **Data Displayed**:
  - Today's Total Orders
  - Today's Revenue (INR)
  - Today's Successful Online Payments
  - Today's Order status counts breakdown (Placed, Preparing, Ready, Served, Completed, Cancelled).

### B. Kitchen KDS (`/admin/kitchen` / `ChefDashboard.jsx`)
- Displays all active orders in states `'placed'` or `'preparing'`.
- Interactive buttons to move orders between preparing and ready, allowing chefs to manage order workflow in real-time.

### C. Service / Waiter Dashboard (`/admin/service` / `WaiterDashboard.jsx`)
- Lists orders that are `'ready'` or `'served'`.
- Allows waiters to mark orders as `'served'` (delivered to guest) or `'completed'` (once payment is resolved).

---

## 3. Operations Moderation Panels

### A. Staff Management (`/admin/staff`)
- Admins can add new staff accounts with assigned roles (Chef, Waiter, Manager, Admin) and username/passwords.
- Provides a list of all active staff members with delete controls.

### B. Add Menu Items (`/admin/add-menu`)
- Create new categories (e.g. "Mocktails").
- Add new menu items, specifying name, price, description, category assignment, and uploading an image.

### C. Review Moderation (`/admin/reviews`)
- Moderates guest feedback.
- Reviews can be approved (to show on landing page), rejected (hidden), or deleted.
- **Bulk Actions**: Select multiple reviews to Approve, Reject, or Delete them at once with a selection checkbox and Select All controls.

### D. Inquiry Management (`/admin/inquiries`)
- Displays guest event planning requests.
- Track status (`new`, `in_progress`, `resolved`), add notes, call or email directly from the interface, or delete entry.
