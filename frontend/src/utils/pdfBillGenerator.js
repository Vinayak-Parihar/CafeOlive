import { jsPDF } from 'jspdf';

/**
 * Generates an official, beautifully formatted Cafe Olive PDF Bill.
 */
export const generateBillPdf = ({
    customerName = 'Valued Guest',
    customerPhone = '',
    tableNumber = 'Dine-In',
    items = [],
    totalAmount = 0,
    paymentMethod = 'Cash',
    paymentStatus = 'paid',
    billSessionId = ''
}) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [30, 42, 27];   // #1e2a1b (Deep Olive)
    const goldColor = [194, 166, 119];   // #c2a677 (Gold accent)
    const darkGray = [60, 60, 60];
    const lightGray = [230, 226, 213];

    let y = 20;

    // Header Branding
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text('CAFE OLIVE', 105, y, { align: 'center' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...goldColor);
    doc.text('ATELIER & BOTANICAL DINING SANCTUARY', 105, y, { align: 'center' });

    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text('Olive Cafe, Main Avenue, City Centre • Tel: +91 98765 43210', 105, y, { align: 'center' });

    y += 4;
    // Decorative dividing line
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.6);
    doc.line(20, y, 190, y);

    y += 8;
    // Bill Metadata Box
    doc.setFillColor(250, 248, 243); // #FAF8F3
    doc.roundedRect(20, y, 170, 26, 3, 3, 'F');
    doc.setDrawColor(...lightGray);
    doc.roundedRect(20, y, 170, 26, 3, 3, 'D');

    const formattedDate = new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const invoiceNo = billSessionId
        ? `INV-${billSessionId.slice(0, 8).toUpperCase()}`
        : `INV-${Date.now().toString().slice(-8)}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text(`Invoice No: ${invoiceNo}`, 25, y + 7);
    doc.text(`Table: Table ${tableNumber}`, 115, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text(`Guest: ${customerName || 'Valued Guest'}`, 25, y + 14);
    doc.text(`Phone: ${customerPhone || 'N/A'}`, 115, y + 14);

    doc.text(`Date: ${formattedDate}`, 25, y + 21);
    doc.setFont('helvetica', 'bold');
    const isPaid = paymentStatus === 'paid';
    doc.setTextColor(isPaid ? 34 : 180, isPaid ? 139 : 80, isPaid ? 34 : 50);
    doc.text(`Payment: ${paymentMethod} (${isPaid ? 'PAID ✓' : 'PENDING'})`, 115, y + 21);

    y += 34;

    // Items Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(20, y, 170, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ITEM DESCRIPTION', 25, y + 5.5);
    doc.text('QTY', 120, y + 5.5, { align: 'center' });
    doc.text('RATE (INR)', 150, y + 5.5, { align: 'right' });
    doc.text('TOTAL (INR)', 185, y + 5.5, { align: 'right' });

    y += 8;

    // Items Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkGray);

    const safeItems = items && items.length > 0
        ? items
        : [{ name: 'Dining Service & Special Order', quantity: 1, price: totalAmount }];

    safeItems.forEach((item, index) => {
        const itemRate = Number(item.price || item.rate || 0);
        const itemQty = Number(item.quantity || 1);
        const itemTotal = itemRate * itemQty;

        // Alternate subtle row background
        if (index % 2 === 1) {
            doc.setFillColor(252, 251, 248);
            doc.rect(20, y, 170, 7.5, 'F');
        }

        doc.text(String(item.name || 'Dish Item').slice(0, 45), 25, y + 5);
        doc.text(String(itemQty), 120, y + 5, { align: 'center' });
        doc.text(`₹${itemRate.toFixed(2)}`, 150, y + 5, { align: 'right' });
        doc.text(`₹${itemTotal.toFixed(2)}`, 185, y + 5, { align: 'right' });

        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.2);
        doc.line(20, y + 7.5, 190, y + 7.5);

        y += 7.5;
    });

    y += 4;

    // Totals Section
    const subtotal = Number(totalAmount || 0);
    const cgst = subtotal * 0.025; // 2.5%
    const sgst = subtotal * 0.025; // 2.5%
    const grandTotal = subtotal;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Subtotal:', 150, y + 5, { align: 'right' });
    doc.text(`₹${subtotal.toFixed(2)}`, 185, y + 5, { align: 'right' });

    y += 5;
    doc.text('CGST (2.5%):', 150, y + 5, { align: 'right' });
    doc.text(`₹${cgst.toFixed(2)}`, 185, y + 5, { align: 'right' });

    y += 5;
    doc.text('SGST (2.5%):', 150, y + 5, { align: 'right' });
    doc.text(`₹${sgst.toFixed(2)}`, 185, y + 5, { align: 'right' });

    y += 7;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.4);
    doc.line(125, y, 190, y);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('GRAND TOTAL:', 150, y + 2, { align: 'right' });
    doc.text(`₹${grandTotal.toFixed(2)}`, 185, y + 2, { align: 'right' });

    y += 4;
    doc.setLineWidth(0.6);
    doc.line(125, y, 190, y);
    doc.line(125, y + 0.8, 190, y + 0.8);

    // Footer Gratitude Note
    y = 260;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);

    y += 6;
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...goldColor);
    doc.text('Thank you for dining at Cafe Olive! We look forward to welcoming you back.', 105, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text('This is a computer-generated tax invoice and requires no physical signature.', 105, y, { align: 'center' });

    return doc;
};

/**
 * Downloads the PDF bill directly to user's device.
 */
export const downloadBillPdf = (params) => {
    const doc = generateBillPdf(params);
    const fileName = `CafeOlive-Bill-Table-${params.tableNumber || 'DineIn'}.pdf`;
    doc.save(fileName);
    return fileName;
};

/**
 * Sends/Shares the PDF bill via WhatsApp:
 * - On Mobile: Uses Web Share API (navigator.share) to send the actual PDF file directly into WhatsApp!
 * - On Desktop / Fallback: Downloads the PDF file and opens WhatsApp with the formatted receipt summary.
 */
export const sendPdfBillToWhatsApp = async (params) => {
    const {
        customerPhone,
        customerName = 'Valued Guest',
        tableNumber = 'Dine-In',
        items = [],
        totalAmount = 0,
        paymentMethod = 'Cash',
        paymentStatus = 'paid'
    } = params;

    const cleanPhone = String(customerPhone || '').replace(/\D/g, '').slice(-10);
    const fileName = `CafeOlive-Bill-Table-${tableNumber}.pdf`;

    // 1. Generate the PDF
    const doc = generateBillPdf(params);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // 2. Prepare WhatsApp Text Summary
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

    const statusBadge = paymentStatus === 'paid' ? 'PAID & CLEARED ✓' : 'PENDING';

    const whatsappText =
`🌿 *CAFE OLIVE - OFFICIAL PDF BILL RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Guest:* ${customerName}
🪑 *Table:* Table ${tableNumber}
📅 *Date:* ${formattedDate}
💳 *Payment:* ${paymentMethod} (${statusBadge})
━━━━━━━━━━━━━━━━━━━━━━━━
*ORDER SUMMARY:*
${itemLines}
━━━━━━━━━━━━━━━━━━━━━━━━
💰 *GRAND TOTAL: ₹${totalAmount}*
━━━━━━━━━━━━━━━━━━━━━━━━
📎 *Attached:* Official PDF Tax Invoice (${fileName})
Thank you for visiting Cafe Olive! ✨`;

    // 3. Try Native Web Share API (attaches actual PDF document on mobile phones)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
            await navigator.share({
                files: [pdfFile],
                title: `Cafe Olive Bill - Table ${tableNumber}`,
                text: whatsappText
            });
            return { success: true, method: 'share' };
        } catch (err) {
            if (err.name === 'AbortError') {
                return { success: false, aborted: true };
            }
            console.warn("navigator.share failed, falling back to download + wa.me:", err);
        }
    }

    // 4. Fallback (Desktop or non-share browser): Download PDF and open WhatsApp chat
    doc.save(fileName);

    if (cleanPhone && cleanPhone.length === 10) {
        const desktopMessage = `${whatsappText}\n\n*(Your PDF invoice "${fileName}" has been downloaded. You can drop/attach it in this chat)*`;
        const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(desktopMessage)}`;
        window.open(waUrl, '_blank');
    }

    return { success: true, method: 'download_and_whatsapp' };
};
