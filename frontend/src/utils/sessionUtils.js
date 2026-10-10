/**
 * sessionUtils.js
 *
 * Cookie-based bill session management for CafeOlive.
 * A "bill session" is one active unpaid visit — it groups multiple orders
 * placed by the same customer until they pay.
 *
 * Uses document.cookie (client-readable) with a 5-hour expiry.
 * The backend is always the source of truth for order data and totals.
 */

const SESSION_COOKIE_NAME = 'cafeolive_bill_session';
const SESSION_NAME_KEY = 'cafeolive_customer_name';
const SESSION_DURATION_HOURS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Read a specific cookie by name from document.cookie
// ─────────────────────────────────────────────────────────────────────────────
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Set a cookie with the given name, value, and expiry in hours
// ─────────────────────────────────────────────────────────────────────────────
function setCookie(name, value, hours) {
    const expires = new Date();
    expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete a cookie by setting its expiry to the past
// ─────────────────────────────────────────────────────────────────────────────
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate a UUID v4 (used as billSessionId)
// Uses crypto.randomUUID() when available, falls back to Math.random().
// ─────────────────────────────────────────────────────────────────────────────
export function generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get the active bill session (returns null if no active session exists)
// ─────────────────────────────────────────────────────────────────────────────
export function getBillSession() {
    const sessionId = getCookie(SESSION_COOKIE_NAME);
    if (!sessionId) return null;

    const customerName = localStorage.getItem(SESSION_NAME_KEY) || null;

    return {
        billSessionId: sessionId,
        customerName
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create and store a new bill session
// Stores the session ID in a cookie (5h expiry) and name in localStorage.
// ─────────────────────────────────────────────────────────────────────────────
export function setBillSession(billSessionId, customerName) {
    setCookie(SESSION_COOKIE_NAME, billSessionId, SESSION_DURATION_HOURS);
    if (customerName) {
        localStorage.setItem(SESSION_NAME_KEY, customerName);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clear the active bill session (called after successful payment)
// ─────────────────────────────────────────────────────────────────────────────
export function clearBillSession() {
    deleteCookie(SESSION_COOKIE_NAME);
    localStorage.removeItem(SESSION_NAME_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Check if an active (unexpired) session exists
// ─────────────────────────────────────────────────────────────────────────────
export function hasActiveBillSession() {
    return !!getCookie(SESSION_COOKIE_NAME);
}
