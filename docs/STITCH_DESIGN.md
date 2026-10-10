# Stitch Design System Reference: Cafe Olive

This document maps the Stitch layout guides and static screen references to the actual dynamic components and router routes in the Cafe Olive codebase.

---

## 1. Project Reference Link

- **Stitch Design Board**: [Stitch Project: Cafe Olive](https://stitch.withgoogle.com/projects/6667201788942662994)
- **Palette Style**: "Organic Sophistication" (Forest Green, Warm Cream, Soft Gold)
- **Font Styling**: Playfair Display (Serif) + Montserrat (Sans-serif)

---

## 2. Page & Screen Implementation Mapping

| Stitch Mockup Screen | Frontend Component | Route Path | Implementation State | Dynamic Integration |
|---|---|---|---|---|
| **Landing Page** | [`LandingPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/LandingPage.jsx) | `/` | Complete | Pulls approved reviews dynamically from `/api/reviews/public`. Includes reservation redirection and interactive reviews form. |
| **Menu Page** | [`MenuPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/MenuPage.jsx) | `/menu` | Complete | Fetches categories and menu items dynamically from `/api/menu/list`. Evaluates table search parameters, houses the shopping cart, and saves session-based orders to `/api/order/place`. |
| **Gallery Page** | [`GalleryPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/GalleryPage.jsx) | `/gallery` | Complete | Renders categories, image grids, and overlays. |
| **Sanctuaries Portal** | [`ReservationsPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/ReservationsPage.jsx) | `/reservations` | Complete | Renders visual cards for Mini Theatre, Party Hall 1, and Party Hall 2. Directs users to book slots or submit custom inquiries. |
| **Venue Booking** | [`VenueBookingPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/reservations/VenueBookingPage.jsx) | `/reservations/booking` | Complete | Real-time scheduler querying availability slots. Updates duration pricing and checks booking limits dynamically. Initiates Razorpay payment orders. |
| **Inquiry Page** | [`ReservationInquiryPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/reservations/ReservationInquiryPage.jsx) | `/reservations/inquiry` | Complete | Pre-booking contact sheet storing inquiries directly in MongoDB via `/api/inquiries`. |
| **Confirmation Screen** | [`ReservationConfirmationPage.jsx`](file:///e:/CAFEOLIVE/frontend/src/pages/reservations/ReservationConfirmationPage.jsx) | `/reservations/confirmation/:id` | Complete | Displays booking success, transaction invoice IDs, venue instructions, and booking details. |

---

## 3. Important Integration Rules

- **Maintain Dynamic Binding**: Stitch mockups are static references for visual layout, margin, padding, border-radius, and typography. The actual pages must **never** hardcode sample names, descriptions, or prices. Always load these variables from the database APIs.
- **Form Controls**: Checkboxes, selection inputs, date cards, and time slot toggles must dynamically validate user parameters.
