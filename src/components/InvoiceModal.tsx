import React, { useRef, useState } from 'react';
import { Invoice } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { CortexxLogo } from './CortexxLogo';
import { Download, Printer, Share2, X, Mail } from 'lucide-react';
import { downloadInvoiceAsPdf } from '../utils/pdfExport';
import { sendInvoiceEmail, getSmtpConfig } from '../services/emailService';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!invoice) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      downloadInvoiceAsPdf(invoice);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = invoice.studentPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const statusText =
      invoice.paymentStatus === 'paid'
        ? 'PAID IN FULL'
        : invoice.paymentStatus === 'partially_paid'
        ? 'PARTIALLY PAID'
        : 'PENDING';

    const message = `Hello *${invoice.studentName}*,\n\nHere is your official *Cortexx AI Institute* Invoice:\n\n📄 *Invoice No:* ${invoice.invoiceNumber}\n🎓 *Course:* ${invoice.courseName} (${invoice.courseDuration})\n💵 *Total Course Fee:* ₹${invoice.totalPayable.toLocaleString('en-IN')}\n✅ *Amount Paid:* ₹${invoice.amountPaid.toLocaleString('en-IN')}\n⏳ *Remaining Balance:* ₹${invoice.remainingBalance.toLocaleString('en-IN')}\n📌 *Status:* ${statusText}\n\n*Cortexx AI Institute* - Where Thinking Meets Technology\n📞 ${INSTITUTE_PROFILE.phone} | ✉️ ${INSTITUTE_PROFILE.email}`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmailShare = async () => {
    const studentEmail = invoice.studentEmail || '';
    if (!studentEmail) {
      setEmailStatus(`No email address recorded for student ${invoice.studentName}.`);
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }

    const smtp = getSmtpConfig();
    if (smtp.pass && smtp.user) {
      setIsSendingEmail(true);
      setEmailStatus(`Dispatching Invoice ${invoice.invoiceNumber} via SMTP...`);
      try {
        const res = await sendInvoiceEmail(invoice, studentEmail);
        setEmailStatus(res.message);
        setTimeout(() => setEmailStatus(null), 5000);
      } catch (err: any) {
        setEmailStatus(`SMTP Dispatch Failed: ${err.message}`);
        setTimeout(() => setEmailStatus(null), 5000);
      } finally {
        setIsSendingEmail(false);
      }
      return;
    }

    // Fallback to mail client if SMTP is not yet configured in Settings
    const statusText =
      invoice.paymentStatus === 'paid'
        ? 'PAID IN FULL'
        : invoice.paymentStatus === 'partially_paid'
        ? 'PARTIALLY PAID'
        : 'PENDING';
    const subject = `Official Tuition Invoice: ${invoice.invoiceNumber} - Cortexx AI Institute`;
    const body = `Dear ${invoice.studentName},

Greetings from Cortexx AI Institute ("Where Thinking Meets Technology")!

Please find below the official details of your Course Tuition Invoice:

========================================
TAX INVOICE DETAILS
========================================
Invoice Number  : ${invoice.invoiceNumber}
Date Issued     : ${invoice.invoiceDate}
Student ID      : ${invoice.studentId}
Enrollment ID   : ${invoice.enrollmentId}

COURSE ENROLLED
Course Title    : ${invoice.courseName}
Duration        : ${invoice.courseDuration}
Mode            : 100% Online Hands-on

FEE & PAYMENT BREAKDOWN
Standard Fee    : ₹${invoice.courseFee.toLocaleString('en-IN')}
Discount Applied: ₹${invoice.discount.toLocaleString('en-IN')}
Total Net Fee   : ₹${invoice.totalPayable.toLocaleString('en-IN')}
Amount Paid     : ₹${invoice.amountPaid.toLocaleString('en-IN')}
Remaining Due   : ₹${invoice.remainingBalance.toLocaleString('en-IN')}
Payment Status  : ${statusText}
Payment Method  : ${invoice.paymentMethod}
${invoice.notes ? `\nRemarks / Notes : ${invoice.notes}` : ''}

PAYMENT & SUPPORT
UPI VPA         : ${INSTITUTE_PROFILE.upiId}
Phone           : ${INSTITUTE_PROFILE.phone}
Email           : ${INSTITUTE_PROFILE.email}
Website         : ${INSTITUTE_PROFILE.website}

Thank you for choosing Cortexx AI Institute!

Warm regards,
Accounts & Admissions Office
Cortexx AI Institute
"Where Thinking Meets Technology"`;

    const mailtoUrl = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setEmailStatus(`Mail app opened for ${studentEmail}. Configure SMTP in Settings for 1-click background delivery.`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl my-auto">
        {/* Floating Action Bar (Hidden on print) */}
        <div className="sticky top-2 z-20 flex items-center justify-between p-3 mb-3 bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-xl no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-orange-400">{invoice.invoiceNumber}</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300 font-medium">{invoice.studentName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEmailShare}
              disabled={isSendingEmail}
              title={`Email Invoice directly to ${invoice.studentEmail}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSendingEmail ? 'Sending...' : 'Email'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>


            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Status Notification Banner */}
        {emailStatus && (
          <div className="mb-3 p-3 bg-neutral-900/95 border border-sky-500/30 text-sky-300 text-xs rounded-xl shadow-lg flex items-center justify-between no-print animate-fadeIn">
            <span>{emailStatus}</span>
            <button onClick={() => setEmailStatus(null)} className="text-neutral-400 hover:text-white p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* High-Fidelity A4 White Paper Canvas with 100% Solid Black Fonts */}
        <div
          ref={printRef}
          className="a4-print-container bg-white text-black rounded-lg shadow-2xl p-8 sm:p-12 font-sans select-text border-2 border-black"
          style={{ minHeight: '297mm', color: '#000000' }}
        >
          {/* Header Row: Cortexx Logo & Invoice Title */}
          <div className="flex items-start justify-between border-b-2 border-black pb-6">
            <div>
              <CortexxLogo size="md" showTagline={true} inverted={true} />
              <div className="mt-3 text-xs text-black space-y-0.5 font-medium">
                <p className="font-bold text-black">Official Training Center · AI & Advanced Tech Education</p>
                <p className="text-black">Phone: +91 {INSTITUTE_PROFILE.phone} · Email: {INSTITUTE_PROFILE.email}</p>
                <p className="text-black">Gujarat, India · {INSTITUTE_PROFILE.website}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black tracking-tight uppercase text-black font-mono">
                Tax Invoice
              </div>
              <div className="mt-2 text-xs font-mono space-y-1">
                <div>
                  <span className="text-black font-semibold">Invoice No: </span>
                  <span className="font-bold text-black">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-black font-semibold">Date: </span>
                  <span className="font-bold text-black">{invoice.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-black font-semibold">Status: </span>
                  <span className="inline-block px-2 py-0.5 border border-black rounded text-[11px] font-bold uppercase text-black">
                    {invoice.paymentStatus === 'paid'
                      ? 'Paid in Full'
                      : invoice.paymentStatus === 'partially_paid'
                      ? 'Partially Paid'
                      : 'Payment Due'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Student & Course Billing Info */}
          <div className="grid grid-cols-2 gap-8 my-6 py-4 bg-white rounded-lg p-5 border-2 border-black">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-black border-b border-black/30 pb-1">
                Billed To (Student)
              </div>
              <div className="mt-2 text-base font-bold text-black">{invoice.studentName}</div>
              <div className="text-xs text-black font-mono mt-1 space-y-0.5">
                <p><span className="font-semibold">Student ID:</span> {invoice.studentId}</p>
                <p><span className="font-semibold">Enrollment No:</span> {invoice.enrollmentId}</p>
                <p><span className="font-semibold">Mobile:</span> +91 {invoice.studentPhone}</p>
                <p><span className="font-semibold">Email:</span> {invoice.studentEmail}</p>
              </div>
            </div>

            <div className="text-right sm:text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black border-b border-black/30 pb-1">
                Course Program Details
              </div>
              <div className="mt-2 text-base font-bold text-black">{invoice.courseName}</div>
              <div className="text-xs text-black font-mono mt-1 space-y-0.5">
                <p><span className="font-semibold">Duration:</span> {invoice.courseDuration}</p>
                <p><span className="font-semibold">Training Mode:</span> 100% Online Hands-on</p>
                <p><span className="font-semibold">Certification:</span> Included upon Completion</p>
                <p><span className="font-semibold">Payment Mode:</span> {invoice.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs my-6 border-collapse border-2 border-black">
            <thead>
              <tr className="border-b-2 border-black text-black font-bold uppercase tracking-wider bg-neutral-100">
                <th className="py-2.5 px-3 border-r border-black">#</th>
                <th className="py-2.5 px-3 border-r border-black">Item Description</th>
                <th className="py-2.5 px-3 text-center border-r border-black">Duration</th>
                <th className="py-2.5 px-3 text-right">Fee (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              <tr>
                <td className="py-4 px-3 font-mono font-bold text-black border-r border-black">01</td>
                <td className="py-4 px-3 border-r border-black">
                  <div className="font-bold text-black text-sm">{invoice.courseName}</div>
                  <div className="text-black text-[11px] mt-0.5">
                    10 Practical Modules · AI Tools, Agents, Automation & Real-World Projects
                  </div>
                </td>
                <td className="py-4 px-3 text-center font-mono text-black font-medium border-r border-black">
                  {invoice.courseDuration}
                </td>
                <td className="py-4 px-3 text-right font-mono font-bold text-black text-sm">
                  ₹{invoice.courseFee.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Financial Calculation Breakdown Ledger */}
          <div className="flex justify-end my-6">
            <div className="w-80 space-y-2 text-xs font-mono border-2 border-black p-4 rounded-lg bg-white">
              <div className="flex justify-between text-black font-medium">
                <span>Standard Tuition Fee:</span>
                <span className="font-bold">₹{invoice.courseFee.toLocaleString('en-IN')}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-black font-medium">
                  <span>Special Discount:</span>
                  <span className="font-bold">- ₹{invoice.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-black pt-2 border-t border-black text-sm">
                <span>Total Net Payable:</span>
                <span className="font-extrabold">₹{invoice.totalPayable.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-black font-bold pt-1">
                <span>Amount Paid:</span>
                <span className="font-extrabold">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between font-black text-black pt-2 border-t-2 border-black text-sm bg-neutral-100 p-2 rounded">
                <span>Remaining Balance Due:</span>
                <span className="font-black">₹{invoice.remainingBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Instructions */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-black text-xs text-black">
            <div>
              <div className="font-bold uppercase tracking-wider text-black text-[11px] border-b border-black/30 pb-1">
                Payment Instructions & UPI
              </div>
              <p className="mt-2 text-black leading-relaxed font-mono text-[11px]">
                UPI VPA: <span className="font-bold text-black">{INSTITUTE_PROFILE.upiId}</span>
                <br />
                Bank Transfer: <span className="font-bold text-black">Cortexx AI Institute</span>
                <br />
                *Please quote Invoice #{invoice.invoiceNumber} in transfer remarks.
              </p>
              {invoice.notes && (
                <p className="mt-2 text-black italic font-medium">
                  Note: {invoice.notes}
                </p>
              )}
            </div>

            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-44 border-b-2 border-black mb-2"></div>
              <div className="font-bold text-black text-xs uppercase tracking-wider">Authorized Signatory</div>
              <div className="text-[11px] text-black font-semibold">Cortexx AI Institute</div>
            </div>
          </div>

          {/* Footer Official Tagline */}
          <div className="mt-12 pt-4 border-t border-black text-center text-[10px] text-black font-mono uppercase tracking-widest font-semibold">
            Where Thinking Meets Technology · cortexx.ai · +91 7984691082
          </div>
        </div>
      </div>
    </div>
  );
};
