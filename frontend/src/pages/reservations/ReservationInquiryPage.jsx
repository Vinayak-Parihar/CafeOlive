import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ReservationInquiryPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    inquiryType: '',
    preferredDate: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await axios.post('/api/inquiries', formData);
      setSuccessMessage('Thank you for your inquiry! Our events team will review your request and contact you shortly. You can expect a response within 24 hours.');
      setFormData({
        name: '',
        phone: '',
        email: '',
        inquiryType: '',
        preferredDate: '',
        message: ''
      });
    } catch (error) {
      setErrorMessage('Failed to send inquiry. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 font-[Montserrat]">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/reservations" className="inline-flex items-center text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reservations
        </Link>

        {/* Hero Banner */}
        <div className="bg-white border border-surface-border rounded-xl p-10 soft-shadow text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/5 p-4 rounded-full text-primary">
              <HelpCircle className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-[Playfair_Display] font-bold text-primary mb-4">Reservation Inquiry</h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto mb-6 leading-relaxed">
            Have a question before booking? Whether it's about our Private Mini Theatre, Party Halls, or special event packages — we're here to help. Submit your inquiry and our events team will get back to you promptly.
          </p>
          <div className="text-xs text-soft-gold font-semibold tracking-wide flex flex-wrap justify-center gap-2">
            <span>Private Mini Theatre</span> &middot; 
            <span>Party Halls</span> &middot; 
            <span>Birthday</span> &middot; 
            <span>Corporate</span> &middot; 
            <span>Special Occasions</span> &middot; 
            <span>Pricing</span>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white border border-surface-border rounded-xl p-10 soft-shadow">
          <h2 className="text-2xl font-[Playfair_Display] font-semibold text-primary mb-6">Inquiry Form</h2>
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Inquiry Type *
                </label>
                <select
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                >
                  <option value="" disabled>Select inquiry type...</option>
                  <option value="Private Mini Theatre">Private Mini Theatre</option>
                  <option value="Party Hall 1">Party Hall 1</option>
                  <option value="Party Hall 2">Party Hall 2</option>
                  <option value="Birthday Celebrations">Birthday Celebrations</option>
                  <option value="Corporate Events">Corporate Events</option>
                  <option value="Special Occasions">Special Occasions</option>
                  <option value="Booking Availability">Booking Availability</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Custom Decorations">Custom Decorations</option>
                  <option value="General Questions">General Questions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Preferred Event Date (Optional)
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="w-full md:w-[calc(50%-12px)] px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Tell us about your event requirements, questions about availability, pricing, or any special requests..."
                className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition h-36 resize-y"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-stitch-primary py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Sending Inquiry...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Inquiry
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationInquiryPage;
