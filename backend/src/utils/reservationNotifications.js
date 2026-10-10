import nodemailer from "nodemailer";
import twilio from "twilio";

// Space labels + time math kept in sync with the frontend confirmation page
// (ReservationConfirmationPage.jsx) so notification content always matches
// what the customer sees on screen.
const SPACE_LABELS = {
    theatre: "Private Mini Theatre",
    partyHall1: "Bespoke Party Hall 1",
    partyHall2: "Bespoke Party Hall 2"
};

const getSpaceLabel = (type) => SPACE_LABELS[type] || "Premium Sanctuary Zone";

const getEndTime = (start, duration) => {
    if (!start) return "";
    let [time, period] = start.split(" ");
    let [hour] = time.split(":");
    let h = parseInt(hour, 10);

    if (period?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period?.toUpperCase() === "AM" && h === 12) h = 0;

    let newH = h + duration;
    let newPeriod = newH >= 12 ? "PM" : "AM";
    if (newH > 12) newH -= 12;
    if (newH === 0) newH = 12;

    return `${String(newH).padStart(2, "0")}:00 ${newPeriod}`;
};

const buildReservationSummary = (reservation) => ({
    spaceLabel: getSpaceLabel(reservation.type),
    endTime: getEndTime(reservation.startTime, reservation.duration)
});

// ─── Email (Nodemailer / SMTP) ──────────────────────────────────────────────
// Provider-agnostic: any SMTP account (Gmail, Zoho, SES SMTP, etc.) works by
// setting SMTP_HOST/PORT/USER/PASS in .env.
let cachedTransporter = null;

const getEmailTransporter = () => {
    if (cachedTransporter) return cachedTransporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }
    cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    return cachedTransporter;
};

const sendReservationEmail = async (reservation) => {
    const transporter = getEmailTransporter();
    if (!transporter) {
        console.warn("[notifications] Skipped reservation email: SMTP_HOST/SMTP_USER/SMTP_PASS not configured.");
        return;
    }

    const { spaceLabel, endTime } = buildReservationSummary(reservation);

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: reservation.email,
        subject: "Your Olive Café Reservation is Confirmed",
        html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1e1b18;">
                <h2 style="color: #004435;">Your Sanctuary Awaits, ${reservation.name}!</h2>
                <p>Your reservation at Olive Café is confirmed. Here are your details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 6px 0; color: #6f7975;">Reservation Code</td><td style="padding: 6px 0; font-weight: bold;">${reservation._id}</td></tr>
                    <tr><td style="padding: 6px 0; color: #6f7975;">Venue</td><td style="padding: 6px 0; font-weight: bold;">${spaceLabel}</td></tr>
                    <tr><td style="padding: 6px 0; color: #6f7975;">Date</td><td style="padding: 6px 0; font-weight: bold;">${reservation.date}</td></tr>
                    <tr><td style="padding: 6px 0; color: #6f7975;">Time</td><td style="padding: 6px 0; font-weight: bold;">${reservation.startTime} - ${endTime} (${reservation.duration} hr${reservation.duration > 1 ? "s" : ""})</td></tr>
                    <tr><td style="padding: 6px 0; color: #6f7975;">Party Size</td><td style="padding: 6px 0; font-weight: bold;">${reservation.guests} Guests</td></tr>
                    <tr><td style="padding: 6px 0; color: #6f7975;">Amount Paid</td><td style="padding: 6px 0; font-weight: bold;">₹${reservation.totalAmount}</td></tr>
                </table>
                <p style="color: #6f7975; font-size: 13px;">We look forward to welcoming you. If any of these details look incorrect, please contact us right away.</p>
            </div>
        `
    });
};

// ─── WhatsApp (Twilio WhatsApp API) ─────────────────────────────────────────
// Chosen over the raw Meta Cloud API for this project because Twilio wraps
// WhatsApp Business messaging behind a plain REST/SDK call with no separate
// Meta Business/App-review step, and its sandbox lets this feature be tested
// immediately with TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN + a sandbox "from"
// number. Swapping providers later only means rewriting this one function.
let cachedTwilioClient = null;

const getTwilioClient = () => {
    if (cachedTwilioClient) return cachedTwilioClient;
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return null;
    }
    cachedTwilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return cachedTwilioClient;
};

// Reservation phone numbers are captured as plain local numbers; default to
// India (+91) since the site prices exclusively in ₹.
const toWhatsAppAddress = (phone) => {
    const digitsAndPlus = String(phone).replace(/[^\d+]/g, "");
    const withCountryCode = digitsAndPlus.startsWith("+")
        ? digitsAndPlus
        : `+91${digitsAndPlus.replace(/^0+/, "")}`;
    return `whatsapp:${withCountryCode}`;
};

const sendReservationWhatsApp = async (reservation) => {
    const client = getTwilioClient();
    if (!client) {
        console.warn("[notifications] Skipped reservation WhatsApp message: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not configured.");
        return;
    }

    const { spaceLabel, endTime } = buildReservationSummary(reservation);

    const body = [
        `*Olive Café - Reservation Confirmed* ✅`,
        ``,
        `Hi ${reservation.name}, your reservation is confirmed!`,
        `Code: ${reservation._id}`,
        `Venue: ${spaceLabel}`,
        `Date: ${reservation.date}`,
        `Time: ${reservation.startTime} - ${endTime} (${reservation.duration} hr${reservation.duration > 1 ? "s" : ""})`,
        `Party Size: ${reservation.guests} Guests`,
        `Amount Paid: ₹${reservation.totalAmount}`,
        ``,
        `We look forward to welcoming you!`
    ].join("\n");

    await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
        to: toWhatsAppAddress(reservation.phone),
        body
    });
};

// ─── Combined trigger ────────────────────────────────────────────────────────
// Best-effort: a notification failure must never fail the reservation
// confirmation itself, so both sends are isolated and only logged on error.
export const sendReservationConfirmationNotifications = async (reservation) => {
    const [emailResult, whatsappResult] = await Promise.allSettled([
        sendReservationEmail(reservation),
        sendReservationWhatsApp(reservation)
    ]);

    if (emailResult.status === "rejected") {
        console.error("[notifications] Reservation confirmation email failed:", emailResult.reason);
    }
    if (whatsappResult.status === "rejected") {
        console.error("[notifications] Reservation confirmation WhatsApp message failed:", whatsappResult.reason);
    }
};
