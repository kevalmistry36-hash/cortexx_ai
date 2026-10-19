import jsPDF from 'jspdf';
import { Invoice, PaymentReceipt, InstituteProfile } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';

/**
 * Clean INR Currency Formatter
 */
function formatCurrency(amount: number): string {
  return `INR ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatInrSymbol(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
}

/**
 * Downloads an official Tax Invoice as an A4 PDF document.
 * Guaranteed 100% pure black fonts, clean tabular alignment, and professional layout.
 */
export function downloadInvoiceAsPdf(
  invoice: Invoice,
  profile: InstituteProfile = INSTITUTE_PROFILE
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Background clean white
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer framing border (black, 0.4mm)
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.6);
  pdf.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin * 2) + 4);

  // Inner margin header start
  let y = margin + 5;

  // ==========================================
  // 1. TOP HEADER: Institute Branding & Invoice Title
  // ==========================================
  // Left: Institute Details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(profile.name.toUpperCase(), margin + 2, y);

  y += 5;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`"${profile.tagline}"`, margin + 2, y);

  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Official Education & Applied AI Training Center', margin + 2, y);
  y += 4;
  pdf.text(`Phone: +91 ${profile.phone}  |  Email: ${profile.email}`, margin + 2, y);
  y += 4;
  pdf.text(`Website: ${profile.website}  |  Location: Gujarat, India`, margin + 2, y);

  // Right: TAX INVOICE headline
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TAX INVOICE', pageWidth - margin - 2, margin + 6, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - margin - 2, margin + 12, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(`Date of Issue: ${invoice.invoiceDate}`, pageWidth - margin - 2, margin + 17, { align: 'right' });

  // Status Badge box (pure black border, black text)
  const statusLabel =
    invoice.paymentStatus === 'paid'
      ? 'STATUS: PAID IN FULL'
      : invoice.paymentStatus === 'partially_paid'
      ? 'STATUS: PARTIALLY PAID'
      : 'STATUS: PAYMENT DUE';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  const statusWidth = pdf.getTextWidth(statusLabel) + 6;
  const statusX = pageWidth - margin - 2 - statusWidth;
  pdf.rect(statusX, margin + 20, statusWidth, 5.5);
  pdf.text(statusLabel, statusX + 3, margin + 24);

  // Header separator rule
  y += 6;
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);

  // ==========================================
  // 2. TWO-COLUMN DETAILS: Student Info & Course Info
  // ==========================================
  y += 4;
  const colWidth = (contentWidth - 4) / 2;
  const col2X = margin + colWidth + 4;
  const boxHeight = 36;

  // Box 1: Billed To
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, colWidth, boxHeight);
  // Header strip
  pdf.line(margin, y + 6.5, margin + colWidth, y + 6.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('BILLED TO (STUDENT DETAILS)', margin + 3, y + 4.8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(invoice.studentName, margin + 3, y + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(`Student ID: ${invoice.studentId}`, margin + 3, y + 17);
  pdf.text(`Enrollment No: ${invoice.enrollmentId}`, margin + 3, y + 22);
  pdf.text(`Mobile: +91 ${invoice.studentPhone}`, margin + 3, y + 27);
  pdf.text(`Email: ${invoice.studentEmail}`, margin + 3, y + 32);

  // Box 2: Course Enrolled
  pdf.rect(col2X, y, colWidth, boxHeight);
  pdf.line(col2X, y + 6.5, col2X + colWidth, y + 6.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('COURSE PROGRAM DETAILS', col2X + 3, y + 4.8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(invoice.courseName, col2X + 3, y + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(`Course Duration: ${invoice.courseDuration}`, col2X + 3, y + 17);
  pdf.text('Training Mode: 100% Online Hands-on', col2X + 3, y + 22);
  pdf.text('Certification: Included upon Completion', col2X + 3, y + 27);
  pdf.text(`Payment Method: ${invoice.paymentMethod}`, col2X + 3, y + 32);

  y += boxHeight + 6;

  // ==========================================
  // 3. ITEMIZED TABLE: Course & Module Breakdown
  // ==========================================
  const tableHeaderHeight = 7;
  const tableRowHeight = 22;

  // Table columns
  const colIndexW = 12;
  const colDescW = 105;
  const colDurW = 28;
  const colFeeW = contentWidth - colIndexW - colDescW - colDurW; // 37mm

  const x0 = margin;
  const x1 = x0 + colIndexW;
  const x2 = x1 + colDescW;
  const x3 = x2 + colDurW;
  const x4 = pageWidth - margin;

  // Table Header
  pdf.setLineWidth(0.4);
  pdf.rect(x0, y, contentWidth, tableHeaderHeight);
  pdf.line(x1, y, x1, y + tableHeaderHeight);
  pdf.line(x2, y, x2, y + tableHeaderHeight);
  pdf.line(x3, y, x3, y + tableHeaderHeight);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('#', x0 + colIndexW / 2, y + 4.8, { align: 'center' });
  pdf.text('ITEM DESCRIPTION & CURRICULUM HIGHLIGHTS', x1 + 3, y + 4.8);
  pdf.text('DURATION', x2 + colDurW / 2, y + 4.8, { align: 'center' });
  pdf.text('FEE (INR)', x4 - 3, y + 4.8, { align: 'right' });

  y += tableHeaderHeight;

  // Table Body Row
  pdf.rect(x0, y, contentWidth, tableRowHeight);
  pdf.line(x1, y, x1, y + tableRowHeight);
  pdf.line(x2, y, x2, y + tableRowHeight);
  pdf.line(x3, y, x3, y + tableRowHeight);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('01', x0 + colIndexW / 2, y + 7, { align: 'center' });

  pdf.text(invoice.courseName, x1 + 3, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.8);
  pdf.text(
    'Comprehensive 10-Module Hands-on Training: AI Tools & Productivity, Prompt Engineering,',
    x1 + 3,
    y + 11
  );
  pdf.text(
    'Agentic AI Workflows, Automation Pipelines, Generative Media, and Capstone Project.',
    x1 + 3,
    y + 15.5
  );
  pdf.text('Includes live mentorship, practical exercises, and official verified certificate.', x1 + 3, y + 19.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(invoice.courseDuration, x2 + colDurW / 2, y + 8, { align: 'center' });
  pdf.setFontSize(7.5);
  pdf.text('100% Online', x2 + colDurW / 2, y + 12.5, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text(formatInrSymbol(invoice.courseFee), x4 - 3, y + 8, { align: 'right' });

  y += tableRowHeight + 5;

  // ==========================================
  // 4. FINANCIAL LEDGER BREAKDOWN & PAYMENT INSTRUCTIONS
  // ==========================================
  const finWidth = 78;
  const finX = pageWidth - margin - finWidth;
  const leftTermsWidth = finX - margin - 4;

  // Left side: Payment Instructions & UPI details
  const termsY = y;
  pdf.setLineWidth(0.3);
  pdf.rect(margin, termsY, leftTermsWidth, 46);
  pdf.line(margin, termsY + 6, margin + leftTermsWidth, termsY + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYMENT INSTRUCTIONS & BANK TRANSFER', margin + 3, termsY + 4.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`UPI VPA: ${profile.upiId}`, margin + 3, termsY + 11);
  pdf.text(`Beneficiary Name: ${profile.name}`, margin + 3, termsY + 15.5);
  pdf.text(`Account Reference: ${invoice.invoiceNumber}`, margin + 3, termsY + 20);
  pdf.text('*Please quote your Invoice Number in the transfer remarks.', margin + 3, termsY + 24.5);

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.8);
  const noteText = invoice.notes
    ? `Remarks: ${invoice.notes}`
    : 'Note: Tuition fees must be settled prior to course certificate generation.';
  pdf.text(noteText, margin + 3, termsY + 31);
  pdf.text('For payment verification queries, email contact@cortexx.ai', margin + 3, termsY + 36);
  pdf.text('All payments are non-transferable and subject to institute terms.', margin + 3, termsY + 41);

  // Right side: Financial Ledger Rows
  let ledgerY = termsY;
  const rowH = 6.5;

  const renderLedgerRow = (label: string, value: string, isBold = false) => {
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(label, finX + 2, ledgerY + 4.5);
    pdf.text(value, pageWidth - margin - 2, ledgerY + 4.5, { align: 'right' });
    pdf.setLineWidth(0.2);
    pdf.line(finX, ledgerY + rowH, pageWidth - margin, ledgerY + rowH);
    ledgerY += rowH;
  };

  pdf.setLineWidth(0.3);
  pdf.rect(finX, termsY, finWidth, 46);

  renderLedgerRow('Standard Course Fee:', formatInrSymbol(invoice.courseFee));

  if (invoice.discount > 0) {
    renderLedgerRow('Special Discount Applied:', `- ${formatInrSymbol(invoice.discount)}`);
  } else {
    renderLedgerRow('Discount Applied:', 'Rs. 0');
  }

  renderLedgerRow('Total Net Fee Payable:', formatInrSymbol(invoice.totalPayable), true);
  renderLedgerRow('Total Amount Paid to Date:', formatInrSymbol(invoice.amountPaid), true);

  // Remaining Balance Box (Highlighted solid border)
  ledgerY += 1.5;
  pdf.setLineWidth(0.7);
  pdf.rect(finX + 1, ledgerY, finWidth - 2, 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text('REMAINING BALANCE DUE:', finX + 3, ledgerY + 6.5);
  pdf.setFontSize(10.5);
  pdf.text(formatInrSymbol(invoice.remainingBalance), pageWidth - margin - 3, ledgerY + 6.5, {
    align: 'right',
  });

  y = termsY + 46 + 12;

  // ==========================================
  // 5. SIGNATURE & CLEARANCE SECTION
  // ==========================================
  const sigLineW = 55;
  const sigX = pageWidth - margin - sigLineW - 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('This is an official computer-generated Tax Invoice.', margin + 2, y + 8);
  pdf.text('No physical signature required for electronic validation.', margin + 2, y + 12);
  pdf.text('Authorized by Cortexx AI Institute Administration.', margin + 2, y + 16);

  // Signatory Line RHS
  pdf.setLineWidth(0.8);
  pdf.line(sigX, y + 8, sigX + sigLineW, y + 8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('AUTHORIZED SIGNATORY', sigX + sigLineW / 2, y + 12.5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Accounts & Admissions Office', sigX + sigLineW / 2, y + 16.5, { align: 'center' });
  pdf.text(profile.name, sigX + sigLineW / 2, y + 20.5, { align: 'center' });

  // ==========================================
  // 6. OFFICIAL FOOTER
  // ==========================================
  const footerY = pageHeight - margin - 5;
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(
    `CORTEXX AI INSTITUTE  ·  WHERE THINKING MEETS TECHNOLOGY  ·  ${profile.website.toUpperCase()}  ·  +91 ${profile.phone}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(
    'Registered Office: Gujarat, India  |  Empowering Next-Generation AI Minds & Certified Engineers',
    pageWidth / 2,
    footerY + 3.8,
    { align: 'center' }
  );

  // Save the PDF file
  const cleanStudent = invoice.studentName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(`Invoice_${invoice.invoiceNumber}_${cleanStudent}.pdf`);
}

/**
 * Downloads an official Payment Receipt as an A4 PDF document.
 * Guaranteed 100% pure black fonts, clean tabular alignment, and professional layout.
 */
export function downloadReceiptAsPdf(
  receipt: PaymentReceipt,
  profile: InstituteProfile = INSTITUTE_PROFILE
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Background clean white
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer framing border (black, 0.6mm)
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.6);
  pdf.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin * 2) + 4);

  let y = margin + 5;

  // ==========================================
  // 1. TOP HEADER: Institute Branding & Receipt Title
  // ==========================================
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(profile.name.toUpperCase(), margin + 2, y);

  y += 5;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`"${profile.tagline}"`, margin + 2, y);

  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Official Education & Applied AI Training Center', margin + 2, y);
  y += 4;
  pdf.text(`Phone: +91 ${profile.phone}  |  Email: ${profile.email}`, margin + 2, y);
  y += 4;
  pdf.text(`Website: ${profile.website}  |  Location: Gujarat, India`, margin + 2, y);

  // Right: PAYMENT RECEIPT headline
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYMENT RECEIPT', pageWidth - margin - 2, margin + 6, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Receipt No: ${receipt.receiptNumber}`, pageWidth - margin - 2, margin + 12, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(`Payment Date: ${receipt.paymentDate}`, pageWidth - margin - 2, margin + 17, { align: 'right' });
  pdf.text(`Invoice Ref: ${receipt.invoiceNumber}`, pageWidth - margin - 2, margin + 22, { align: 'right' });

  // Verified Badge
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  const badgeText = 'PAYMENT VERIFIED & CLEARED';
  const badgeW = pdf.getTextWidth(badgeText) + 6;
  const badgeX = pageWidth - margin - 2 - badgeW;
  pdf.rect(badgeX, margin + 25, badgeW, 5.5);
  pdf.text(badgeText, badgeX + 3, margin + 29);

  // Header separator rule
  y += 7;
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);

  // ==========================================
  // 2. ACKNOWLEDGED TO (STUDENT & INVOICE DETAILS)
  // ==========================================
  y += 5;
  const ackHeight = 26;
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, contentWidth, ackHeight);
  pdf.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RECEIVED WITH THANKS FROM (STUDENT DETAILS)', margin + 3, y + 4.8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(receipt.studentName, margin + 3, y + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(`Student ID: ${receipt.studentId}`, margin + 3, y + 19);
  pdf.text(`Linked Tax Invoice: ${receipt.invoiceNumber}`, margin + 70, y + 19);
  pdf.text(`Payment Voucher ID: ${receipt.receiptNumber}`, margin + 130, y + 19);

  y += ackHeight + 7;

  // ==========================================
  // 3. PAYMENT TRANSACTION BREAKDOWN TABLE
  // ==========================================
  const tableH = 7;
  const rowH = 14;

  const c1W = 75;
  const c2W = 35;
  const c3W = 40;
  const c4W = contentWidth - c1W - c2W - c3W; // 32mm

  const tx0 = margin;
  const tx1 = tx0 + c1W;
  const tx2 = tx1 + c2W;
  const tx3 = tx2 + c3W;
  const tx4 = pageWidth - margin;

  // Table Header
  pdf.setLineWidth(0.4);
  pdf.rect(tx0, y, contentWidth, tableH);
  pdf.line(tx1, y, tx1, y + tableH);
  pdf.line(tx2, y, tx2, y + tableH);
  pdf.line(tx3, y, tx3, y + tableH);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYMENT DESCRIPTION', tx0 + 3, y + 4.8);
  pdf.text('METHOD', tx1 + 3, y + 4.8);
  pdf.text('TRANSACTION REF', tx2 + 3, y + 4.8);
  pdf.text('AMOUNT RECEIVED', tx4 - 3, y + 4.8, { align: 'right' });

  y += tableH;

  // Table Body Row
  pdf.rect(tx0, y, contentWidth, rowH);
  pdf.line(tx1, y, tx1, y + rowH);
  pdf.line(tx2, y, tx2, y + rowH);
  pdf.line(tx3, y, tx3, y + rowH);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Tuition Fee Installment Payment', tx0 + 3, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text('Credited towards course enrollment & certification clearance', tx0 + 3, y + 10.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(receipt.paymentMethod, tx1 + 3, y + 7.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(receipt.transactionRef || 'Direct Transfer / Cash', tx2 + 3, y + 7.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(formatInrSymbol(receipt.amountReceived), tx4 - 3, y + 8, { align: 'right' });

  y += rowH + 6;

  // ==========================================
  // 4. SUMMARY BOX: Total Amount Received & Remaining Balance
  // ==========================================
  const sumBoxH = 20;
  pdf.setLineWidth(0.7);
  pdf.rect(margin, y, contentWidth, sumBoxH);
  pdf.line(margin + contentWidth / 2, y, margin + contentWidth / 2, y + sumBoxH);

  // Left side: Total Received
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('AMOUNT RECEIVED IN THIS TRANSACTION:', margin + 4, y + 6.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(formatInrSymbol(receipt.amountReceived), margin + 4, y + 14.5);

  // Right side: Remaining Balance
  const midX = margin + contentWidth / 2;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('REMAINING COURSE FEE BALANCE AFTER THIS PAYMENT:', midX + 4, y + 6.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(formatInrSymbol(receipt.remainingBalanceAfter), midX + 4, y + 14.5);

  y += sumBoxH + 6;

  // ==========================================
  // 5. OFFICIAL TERMS & NOTES
  // ==========================================
  const noteBoxH = 26;
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, contentWidth, noteBoxH);
  pdf.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RECEIPT CONFIRMATION & CLEARANCE POLICY', margin + 3, y + 4.8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(
    '1. This receipt confirms official receipt of funds into Cortexx AI Institute institutional accounts.',
    margin + 3,
    y + 11.5
  );
  pdf.text(
    '2. Retain this voucher safely for course milestone tracking and final certificate clearance.',
    margin + 3,
    y + 16
  );
  const userNote = receipt.notes
    ? `3. Remarks: ${receipt.notes}`
    : `3. Balance status: ${
        receipt.remainingBalanceAfter === 0
          ? 'Full tuition cleared. Student eligible for final certificate upon course completion.'
          : 'Balance to be cleared in accordance with institute installment schedule.'
      }`;
  pdf.text(userNote, margin + 3, y + 20.5);

  y += noteBoxH + 14;

  // ==========================================
  // 6. SIGNATURE & VERIFICATION
  // ==========================================
  const sigLineW = 55;
  const sigX = pageWidth - margin - sigLineW - 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Official Electronic Payment Voucher', margin + 2, y + 6);
  pdf.text('Verified and registered in Cortexx AI Cloud Database.', margin + 2, y + 10.5);
  pdf.text('UPI Reference: Kevalmistry36@okhdfcbank', margin + 2, y + 15);

  // Signatory Line RHS
  pdf.setLineWidth(0.8);
  pdf.line(sigX, y + 6, sigX + sigLineW, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('ACCOUNTS DEPARTMENT', sigX + sigLineW / 2, y + 10.5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Finance & Treasury Office', sigX + sigLineW / 2, y + 14.5, { align: 'center' });
  pdf.text(profile.name, sigX + sigLineW / 2, y + 18.5, { align: 'center' });

  // ==========================================
  // 7. OFFICIAL FOOTER
  // ==========================================
  const footerY = pageHeight - margin - 5;
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text(
    `CORTEXX AI INSTITUTE  ·  WHERE THINKING MEETS TECHNOLOGY  ·  ${profile.website.toUpperCase()}  ·  +91 ${profile.phone}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(
    'Registered Office: Gujarat, India  |  Official Tuition Receipt Voucher for Verified Students',
    pageWidth / 2,
    footerY + 3.8,
    { align: 'center' }
  );

  // Save the PDF file
  const cleanStudent = receipt.studentName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(`Receipt_${receipt.receiptNumber}_${cleanStudent}.pdf`);
}
