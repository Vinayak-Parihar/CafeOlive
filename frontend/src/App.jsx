import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'motion/react';
import Layout from './Layout';
import LandingPage from './LandingPage';
import MenuPage from './MenuPage';
import GalleryPage from './GalleryPage';
import ReservationsPage from './ReservationsPage';
import VenueBookingPage from './pages/reservations/VenueBookingPage';
import ReservationConfirmationPage from './pages/reservations/ReservationConfirmationPage';
import ReservationInquiryPage from './pages/reservations/ReservationInquiryPage';
import BillPage from './pages/customer/BillPage';

import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

import StaffManagement from './pages/admin/StaffManagement';
import ChefDashboard from './pages/chef/ChefDashboard';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import AdminLayout from './layouts/AdminLayout';
import AddMenuSection from './pages/admin/AddMenuSection';
import Settings from './pages/admin/Settings';
import ReviewsManagement from './pages/admin/ReviewsManagement';
import ReservationsAdmin from './pages/admin/ReservationsAdmin';
import InquiriesAdmin from './pages/admin/InquiriesAdmin';
import CashierBillingPage from './pages/admin/CashierBillingPage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Toaster position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reservations/booking" element={<VenueBookingPage />} />
          <Route path="/reservations/confirmation/:id" element={<ReservationConfirmationPage />} />
          <Route path="/reservations/inquiry" element={<ReservationInquiryPage />} />
          <Route path="/bill" element={<BillPage />} />
        </Route>
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-menu" element={<AddMenuSection />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/reviews" element={<ReviewsManagement />} />
          <Route path="/admin/reservations" element={<ReservationsAdmin />} />
          <Route path="/admin/inquiries" element={<InquiriesAdmin />} />
          <Route path="/admin/kitchen" element={<ChefDashboard />} />
          <Route path="/admin/service" element={<WaiterDashboard />} />
          <Route path="/admin/billing" element={<CashierBillingPage />} />
          <Route path="/admin/take-order" element={<MenuPage />} />
        </Route>
      </Routes>
    </MotionConfig>
  );
}

export default App;