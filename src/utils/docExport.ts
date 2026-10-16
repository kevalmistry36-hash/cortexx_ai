import { Invoice, PaymentReceipt, InstituteProfile } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';

/**
 * Downloads a student Tax Invoice as a genuine Microsoft Word (.doc) document.
 * Compatible with MS Word, Google Docs, Apple Pages, and LibreOffice.
 */
export function downloadInvoiceAsDoc(invoice: Invoice, profile: InstituteProfile = INSTITUTE_PROFILE): void {
  const statusColor =
    invoice.paymentStatus === 'paid'
      ? '#059669'
      : invoice.paymentStatus === 'partially_paid'
      ? '#d97706'
      : '#dc2626';

  const statusBg =
    invoice.paymentStatus === 'paid'
      ? '#d1fae5'
      : invoice.paymentStatus === 'partially_paid'
      ? '#fef3c7'
      : '#fee2e2';

  const statusLabel =
    invoice.paymentStatus === 'paid'
      ? 'PAID IN FULL'
      : invoice.paymentStatus === 'partially_paid'
      ? 'PARTIALLY PAID'
      : 'UNPAID / PENDING';

  const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <meta charset="utf-8">
  <title>Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 36pt 36pt 36pt 36pt;
      mso-header-margin: 20pt;
      mso-footer-margin: 20pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      color: #1f2937;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    td, th {
      padding: 6px 8px;
      vertical-align: top;
    }
    .brand-name {
      font-size: 24pt;
      font-weight: bold;
      color: #ea580c;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .brand-tagline {
      font-size: 11pt;
      color: #4b5563;
      font-style: italic;
      margin-bottom: 6px;
    }
    .invoice-title {
      font-size: 20pt;
      font-weight: bold;
      color: #111827;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 10pt;
      background-color: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor};
    }
    .card-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 10px 14px;
    }
    .table-bordered th {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      font-size: 10pt;
      font-weight: bold;
      color: #374151;
      text-transform: uppercase;
    }
    .table-bordered td {
      border: 1px solid #e5e7eb;
      font-size: 10pt;
    }
    .total-title {
      font-size: 12pt;
      font-weight: bold;
      color: #111827;
    }
    .total-value {
      font-size: 12pt;
      font-weight: bold;
      color: #ea580c;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <!-- Header with Institute Info and Document Title -->
    <table style="border-bottom: 3px solid #ea580c; padding-bottom: 12px; margin-bottom: 16px;">
      <tr>
        <td style="width: 60%;">
          <div class="brand-name">${profile.name}</div>
          <div class="brand-tagline">${profile.tagline}</div>
          <div style="font-size: 9.5pt; color: #4b5563; line-height: 1.45;">
            📍 ${profile.address}<br>
            📞 Phone: ${profile.phone} | ✉️ Email: ${profile.email}<br>
            🌐 Website: ${profile.website} | 💳 UPI: ${profile.upiId}
          </div>
        </td>
        <td style="width: 40%; text-align: right;">
          <div class="invoice-title">TAX INVOICE</div>
          <div style="margin-top: 6px;">
            <span class="status-badge">${statusLabel}</span>
          </div>
          <div style="margin-top: 10px; font-size: 10pt; color: #374151; line-height: 1.5;">
            <strong>Invoice No:</strong> <span style="font-family: 'Courier New', monospace; font-weight: bold; color: #ea580c;">${invoice.invoiceNumber}</span><br>
            <strong>Invoice Date:</strong> ${invoice.invoiceDate}<br>
            <strong>Enrollment ID:</strong> ${invoice.enrollmentId}
          </div>
        </td>
      </tr>
    </table>

    <!-- Student & Course Information -->
    <table style="margin-bottom: 16px;">
      <tr>
        <td style="width: 50%; padding-right: 8px;">
          <div class="card-box">
            <div style="font-size: 9pt; font-weight: bold; color: #6b7280; text-transform: uppercase;">BILLED TO (STUDENT):</div>
            <div style="font-size: 13pt; font-weight: bold; color: #111827; margin-top: 3px;">${invoice.studentName}</div>
            <div style="font-size: 9.5pt; color: #374151; margin-top: 4px; line-height: 1.4;">
              <strong>Student ID:</strong> ${invoice.studentId}<br>
              <strong>Contact:</strong> +91 ${invoice.studentPhone}<br>
              <strong>Email:</strong> ${invoice.studentEmail}
            </div>
          </div>
        </td>
        <td style="width: 50%; padding-left: 8px;">
          <div class="card-box">
            <div style="font-size: 9pt; font-weight: bold; color: #6b7280; text-transform: uppercase;">COURSE ENROLLED:</div>
            <div style="font-size: 12pt; font-weight: bold; color: #111827; margin-top: 3px;">${invoice.courseName}</div>
            <div style="font-size: 9.5pt; color: #374151; margin-top: 4px; line-height: 1.4;">
              <strong>Duration:</strong> ${invoice.courseDuration}<br>
              <strong>Training Mode:</strong> 100% Online Hands-on Practical<br>
              <strong>Payment Method:</strong> ${invoice.paymentMethod}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Course & Line Items Table -->
    <table class="table-bordered" style="margin-bottom: 16px;">
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">Sr</th>
          <th style="width: 52%;">Course / Training Item Description</th>
          <th style="width: 20%; text-align: right;">Standard Fee</th>
          <th style="width: 20%; text-align: right;">Net Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: top;">1</td>
          <td>
            <strong>${invoice.courseName}</strong><br>
            <span style="font-size: 9pt; color: #4b5563;">
              Full comprehensive practical training curriculum including AI Tools & Productivity, Prompt Engineering, Generative Image & Video, Voice & Audio Synthesis, Content Creation, AI Automation, AI for Business & Marketing, and Real-World Projects with Digital Certification.
            </span>
            ${invoice.notes ? `<div style="margin-top: 6px; font-size: 8.5pt; color: #ea580c;"><em>Note: ${invoice.notes}</em></div>` : ''}
          </td>
          <td style="text-align: right; vertical-align: top; font-family: 'Courier New', monospace;">₹${invoice.courseFee.toLocaleString('en-IN')}</td>
          <td style="text-align: right; vertical-align: top; font-family: 'Courier New', monospace; font-weight: bold;">₹${invoice.courseFee.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <!-- Financial Calculation & Payment Summary -->
    <table style="margin-bottom: 16px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 8px;">
          <div style="border: 1px solid #e5e7eb; background-color: #f9fafb; padding: 12px; font-size: 9.5pt; line-height: 1.5;">
            <strong style="color: #111827;">Official Remittance Details:</strong><br>
            • Primary UPI ID: <strong style="color: #ea580c; font-family: 'Courier New', monospace;">${profile.upiId}</strong><br>
            • Student Support: <strong>${profile.phone}</strong><br>
            • Direct Accounts Email: <strong>${profile.email}</strong><br>
            <div style="margin-top: 6px; font-size: 8.5pt; color: #6b7280;">
              Please include Student ID <strong style="color: #111827;">${invoice.studentId}</strong> in transaction remarks for instantaneous payment reconciliation.
            </div>
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 8px;">
          <table style="width: 100%; border: 1px solid #e5e7eb;">
            <tr style="background-color: #f9fafb;">
              <td style="text-align: right; color: #4b5563; font-size: 9.5pt;">Course Gross Fee:</td>
              <td style="text-align: right; font-weight: bold; width: 45%; font-family: 'Courier New', monospace;">₹${invoice.courseFee.toLocaleString('en-IN')}</td>
            </tr>
            ${
              invoice.discount > 0
                ? `<tr style="background-color: #f9fafb;">
                    <td style="text-align: right; color: #059669; font-size: 9.5pt;">Scholarship / Discount:</td>
                    <td style="text-align: right; font-weight: bold; color: #059669; font-family: 'Courier New', monospace;">- ₹${invoice.discount.toLocaleString('en-IN')}</td>
                  </tr>`
                : ''
            }
            <tr style="border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb; background-color: #f3f4f6;">
              <td style="text-align: right;" class="total-title">Total Payable:</td>
              <td style="text-align: right;" class="total-value" style="font-family: 'Courier New', monospace;">₹${invoice.totalPayable.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #ffffff;">
              <td style="text-align: right; color: #059669; font-weight: bold; font-size: 10pt;">Amount Paid:</td>
              <td style="text-align: right; font-weight: bold; color: #059669; font-family: 'Courier New', monospace;">₹${invoice.amountPaid.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #ffffff;">
              <td style="text-align: right; color: ${invoice.remainingBalance > 0 ? '#d97706' : '#6b7280'}; font-weight: bold; font-size: 10pt;">Remaining Balance:</td>
              <td style="text-align: right; font-weight: bold; color: ${invoice.remainingBalance > 0 ? '#d97706' : '#6b7280'}; font-family: 'Courier New', monospace;">₹${invoice.remainingBalance.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Signature and Seal -->
    <table style="margin-top: 24px; margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: bottom;">
          <div style="font-size: 9pt; color: #6b7280; line-height: 1.4;">
            Generated electronically by Cortexx AI Institute Accounts Engine<br>
            Timestamp: ${new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </td>
        <td style="width: 50%; vertical-align: bottom; text-align: right;">
          <div style="display: inline-block; text-align: center;">
            <div style="font-size: 11pt; font-weight: bold; color: #ea580c; font-family: 'Courier New', monospace;">CORTEXX AI INSTITUTE</div>
            <div style="border-top: 1px dashed #9ca3af; width: 180px; margin-top: 8px; padding-top: 4px; font-size: 9pt; color: #4b5563;">
              Authorized Signature & Seal
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Terms -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 8.5pt; color: #6b7280; line-height: 1.45;">
      <strong>Terms & Conditions:</strong><br>
      1. This tax invoice is an official digital record issued by Cortexx AI Institute.<br>
      2. Fees once paid are non-refundable and non-transferable under all circumstances.<br>
      3. Practical batch allocation and completion certificates are subject to 100% course milestone completion.
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff', docContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (invoice.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${invoice.invoiceNumber}_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a student Payment Receipt as a genuine Microsoft Word (.doc) document.
 */
export function downloadReceiptAsDoc(receipt: PaymentReceipt, profile: InstituteProfile = INSTITUTE_PROFILE): void {
  const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <meta charset="utf-8">
  <title>Payment Receipt - ${receipt.receiptNumber}</title>
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 36pt 36pt 36pt 36pt;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      color: #1f2937;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 11pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    td, th {
      padding: 6px 8px;
      vertical-align: top;
    }
    .brand-name {
      font-size: 24pt;
      font-weight: bold;
      color: #ea580c;
    }
    .receipt-title {
      font-size: 20pt;
      font-weight: bold;
      color: #059669;
      text-align: right;
    }
    .badge-success {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 10pt;
      background-color: #d1fae5;
      color: #059669;
      border: 1px solid #059669;
    }
    .card-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 10px 14px;
    }
    .table-bordered th {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      font-size: 10pt;
      font-weight: bold;
      color: #374151;
    }
    .table-bordered td {
      border: 1px solid #e5e7eb;
      font-size: 10.5pt;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <!-- Header -->
    <table style="border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 16px;">
      <tr>
        <td style="width: 60%;">
          <div class="brand-name">${profile.name}</div>
          <div style="font-size: 11pt; color: #4b5563; font-style: italic;">${profile.tagline}</div>
          <div style="font-size: 9.5pt; color: #4b5563; margin-top: 4px;">
            📍 ${profile.address} | 📞 ${profile.phone} | ✉️ ${profile.email}
          </div>
        </td>
        <td style="width: 40%; text-align: right;">
          <div class="receipt-title">PAYMENT RECEIPT</div>
          <div style="margin-top: 6px;">
            <span class="badge-success">PAYMENT ACKNOWLEDGED</span>
          </div>
          <div style="margin-top: 10px; font-size: 10pt; color: #374151;">
            <strong>Receipt No:</strong> <span style="font-family: 'Courier New', monospace; font-weight: bold; color: #059669;">${receipt.receiptNumber}</span><br>
            <strong>Payment Date:</strong> ${receipt.paymentDate}<br>
            <strong>Linked Invoice:</strong> ${receipt.invoiceNumber}
          </div>
        </td>
      </tr>
    </table>

    <!-- Student Info -->
    <div class="card-box" style="margin-bottom: 16px;">
      <div style="font-size: 9pt; font-weight: bold; color: #6b7280; text-transform: uppercase;">RECEIVED FROM:</div>
      <div style="font-size: 14pt; font-weight: bold; color: #111827; margin-top: 2px;">${receipt.studentName}</div>
      <div style="font-size: 10pt; color: #4b5563; margin-top: 2px;">
        Student ID: <strong>${receipt.studentId}</strong>
      </div>
    </div>

    <!-- Payment Detail Table -->
    <table class="table-bordered" style="margin-bottom: 16px;">
      <thead>
        <tr>
          <th>Description</th>
          <th>Payment Mode</th>
          <th>Transaction Reference</th>
          <th style="text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            Tuition Fee Payment towards Invoice #${receipt.invoiceNumber}<br>
            ${receipt.notes ? `<span style="font-size: 9pt; color: #6b7280;"><em>${receipt.notes}</em></span>` : ''}
          </td>
          <td><strong>${receipt.paymentMethod}</strong></td>
          <td style="font-family: 'Courier New', monospace;">${receipt.transactionRef || 'N/A'}</td>
          <td style="text-align: right; font-size: 13pt; font-weight: bold; color: #059669; font-family: 'Courier New', monospace;">
            ₹${receipt.amountReceived.toLocaleString('en-IN')}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Balance Status -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; margin-bottom: 24px;">
      <table style="margin: 0;">
        <tr>
          <td>
            <div style="font-size: 10pt; color: #166534; font-weight: bold;">
              Total Amount Received: ₹${receipt.amountReceived.toLocaleString('en-IN')}
            </div>
            <div style="font-size: 9.5pt; color: #15803d; margin-top: 2px;">
              Remaining Balance Due After This Payment: <strong>₹${receipt.remainingBalanceAfter.toLocaleString('en-IN')}</strong>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Signatures -->
    <table style="margin-top: 30px;">
      <tr>
        <td style="width: 50%;">
          <div style="font-size: 9pt; color: #6b7280;">
            Electronic System Receipt<br>
            Cortexx AI Institute Admissions Office
          </div>
        </td>
        <td style="width: 50%; text-align: right;">
          <div style="display: inline-block; text-align: center;">
            <div style="font-size: 11pt; font-weight: bold; color: #059669; font-family: 'Courier New', monospace;">ACCOUNTS DESK</div>
            <div style="border-top: 1px dashed #9ca3af; width: 180px; margin-top: 8px; padding-top: 4px; font-size: 9pt; color: #4b5563;">
              Authorized Cashier Signature
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff', docContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (receipt.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${receipt.receiptNumber}_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
