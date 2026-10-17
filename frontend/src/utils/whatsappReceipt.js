/**
 * WhatsApp Receipt Generator for Cafe Olive
 * Generates and opens an official digital WhatsApp receipt without requiring API keys.
 */
export const sendWhatsAppReceipt = ({
    customerPhone,
    customerName,
    tableNumber,
    items = [],
    totalAmount = 0,
    paymentMethod = 'Cash',
    paymentStatus = 'paid'
}) => {
    if (!customerPhone) return false;
    const cleanPhone = String(customerPhone).replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) return false;

    const formattedDate = new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const itemLines = items && items.length > 0
        ? items.map(it => `• ${it.name} (x${it.quantity}) — ₹${(it.price || it.rate || 0) * it.quantity}`).join('\n')
        : '• Dining Service';

    const statusBadge = paymentStatus === 'paid' ? 'PAID & CLEARED ✓' : 'PENDING SETTLEMENT';

    const message =
`🌿 *CAFE OLIVE - OFFICIAL BILL RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Guest:* ${customerName || 'Valued Guest'}
🪑 *Table:* Table ${tableNumber || 'Dine-In'}
📅 *Date:* ${formattedDate}
💳 *Payment:* ${paymentMethod} (${statusBadge})
━━━━━━━━━━━━━━━━━━━━━━━━
*ORDER SUMMARY:*
${itemLines}
━━━━━━━━━━━━━━━━━━━━━━━━
💰 *GRAND TOTAL: ₹${totalAmount}*
━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for visiting Olive Café! ✨
We look forward to welcoming you back.`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    return true;
};

/**
 * WhatsApp Venue Reservation Receipt & Confirmation Generator
 */
export const sendReservationWhatsAppReceipt = (reservation) => {
    if (!reservation?.phone) return false;
    const cleanPhone = String(reservation.phone).replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) return false;

    const spaceLabel = reservation.type === 'theatre'
        ? 'Private Mini Theatre'
        : reservation.type === 'partyHall1'
            ? 'Bespoke Party Hall 1'
            : 'Grand Celebration Hall 2';

    const decorationText = reservation.hasDecoration
        ? '✨ Premium Hall Decoration Included (+₹1,500) [1-Hour Early Setup Confirmed]'
        : 'None';

    const mealsText = reservation.mealPlan && reservation.mealPlan.length > 0
        ? reservation.mealPlan.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')
        : 'None Selected';

    const paymentPlanText = reservation.paymentPlan === 'half'
        ? 'Half Payment (50% Advance)'
        : 'Full Payment (100%)';

    const message =
`🏛️ *CAFÉ OLIVE - SANCTUARY BOOKING RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Guest:* ${reservation.name || 'Valued Guest'}
📞 *Phone:* ${reservation.phone}
📧 *Email:* ${reservation.email}
${reservation.occasion ? `✨ *Occasion:* ${reservation.occasion}\n` : ''}
📍 *Sanctuary:* ${spaceLabel}
📅 *Date:* ${reservation.date}
⏰ *Time:* ${reservation.startTime} (${reservation.duration} Hour${reservation.duration > 1 ? 's' : ''})
👥 *Guest Count:* ${reservation.guests} Guests
━━━━━━━━━━━━━━━━━━━━━━━━
🎨 *Decoration:* ${decorationText}
🍽️ *Catering Plan:* ${mealsText}
${reservation.specialRequests ? `📝 *Special Note:* "${reservation.specialRequests}"\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━
💳 *Payment Mode:* ${reservation.paymentMethod === 'cash' ? '💵 Cash at Venue' : '💳 Online Payment'}
📑 *Payment Plan:* ${paymentPlanText}
💰 *Total Package Price:* ₹${reservation.totalAmount}
💵 *Advance Amount:* ₹${reservation.advanceAmount || 0}
🏦 *Balance Remaining:* ₹${reservation.balanceDue || 0}
📌 *Status:* ${String(reservation.status).toUpperCase()} (${String(reservation.paymentStatus).toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for booking with Café Olive!
We are excited to host your memorable event. ✨`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    return true;
};
