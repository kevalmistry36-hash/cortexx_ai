import React, { useRef, useState } from 'react';
import { Invoice } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { CortexxLogo } from './CortexxLogo';
import { Download, Printer, Share2, X, CheckCircle, Clock, Mail, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadInvoiceAsDoc } from '../utils/docExport';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!invoice) return null;

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}_${invoice.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Unable to generate PDF directly. You can use the Print button to Save as PDF.');
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
    const statusText = invoice.paymentStatus === 'paid' ? 'PAID IN FULL' : invoice.paymentStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'PENDING';

    const message = `Hello *${invoice.studentName}*,\n\nHere is your official *Cortexx AI Institute* Invoice:\n\n📄 *Invoice No:* ${invoice.invoiceNumber}\n🎓 *Course:* ${invoice.courseName} (${invoice.courseDuration})\n💵 *Total Course Fee:* ₹${invoice.totalPayable.toLocaleString('en-IN')}\n✅ *Amount Paid:* ₹${invoice.amountPaid.toLocaleString('en-IN')}\n⏳ *Remaining Balance:* ₹${invoice.remainingBalance.toLocaleString('en-IN')}\n📌 *Status:* ${statusText}\n\n*Cortexx AI Institute* - Where Thinking Meets Technology\n📞 ${INSTITUTE_PROFILE.phone} | ✉️ ${INSTITUTE_PROFILE.email}`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmailShare = () => {
    const studentEmail = invoice.studentEmail || '';
    if (!studentEmail) {
      alert(`No email address registered for student ${invoice.studentName}.`);
      return;
    }

    const statusText = invoice.paymentStatus === 'paid' ? 'PAID IN FULL' : invoice.paymentStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'PENDING';
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

    const mailtoUrl = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
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
              title={`Email Invoice directly to ${invoice.studentEmail}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email PDF</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => downloadInvoiceAsDoc(invoice)}
              title="Download Invoice as Word Document (.doc)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download DOC</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-Fidelity A4 White Paper Canvas */}
        <div
          ref={printRef}
          className="a4-print-container bg-white text-neutral-900 rounded-lg shadow-2xl p-8 sm:p-12 font-sans select-text border border-neutral-200"
          style={{ minHeight: '297mm', color: '#111827' }}
        >
          {/* Header Row: Cortexx Logo & Invoice Title */}
          <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-6">
            <div>
              <CortexxLogo size="md" showTagline={true} inverted={true} />
              <div className="mt-3 text-xs text-neutral-600 space-y-0.5 font-medium">
                <p>Official Training Center · AI & Advanced Tech Education</p>
                <p>Phone: {INSTITUTE_PROFILE.phone} · Email: {INSTITUTE_PROFILE.email}</p>
                <p>Gujarat, India · {INSTITUTE_PROFILE.website}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-extrabold tracking-tight uppercase text-neutral-950 font-mono">
                Tax Invoice
              </div>
              <div className="mt-2 text-xs font-mono space-y-1">
                <div>
                  <span className="text-neutral-500">Invoice No: </span>
                  <span className="font-bold text-neutral-900">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Date: </span>
                  <span className="font-semibold text-neutral-800">{invoice.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Status: </span>
                  <span
                    className={`font-bold uppercase ${
                      invoice.paymentStatus === 'paid'
                        ? 'text-emerald-700'
                        : invoice.paymentStatus === 'partially_paid'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {invoice.paymentStatus === 'paid' ? 'Paid in Full' : invoice.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Payment Due'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Student & Course Billing Info */}
          <div className="grid grid-cols-2 gap-8 my-6 py-4 bg-neutral-50 rounded-lg p-5 border border-neutral-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Billed To (Student)
              </div>
              <div className="mt-1 text-base font-bold text-neutral-950">{invoice.studentName}</div>
              <div className="text-xs text-neutral-700 font-mono mt-1 space-y-0.5">
                <p>Student ID: {invoice.studentId}</p>
                <p>Enrollment No: {invoice.enrollmentId}</p>
                <p>Mobile: +91 {invoice.studentPhone}</p>
                <p>Email: {invoice.studentEmail}</p>
              </div>
            </div>

            <div className="text-right sm:text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Course Program Details
              </div>
              <div className="mt-1 text-base font-bold text-neutral-950">{invoice.courseName}</div>
              <div className="text-xs text-neutral-700 font-mono mt-1 space-y-0.5">
                <p>Duration: {invoice.courseDuration}</p>
                <p>Training Mode: 100% Online Hands-on</p>
                <p>Certification: Included upon Completion</p>
                <p>Payment Mode: {invoice.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs my-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-900 text-neutral-900 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">Duration</th>
                <th className="py-2.5 px-3 text-right">Fee (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <td className="py-4 px-3 font-mono font-medium text-neutral-600">01</td>
                <td className="py-4 px-3">
                  <div className="font-bold text-neutral-950 text-sm">{invoice.courseName}</div>
                  <div className="text-neutral-600 text-[11px] mt-0.5">
                    10 Practical Modules · AI Tools, Agents, Automation & Real-World Projects
                  </div>
                </td>
                <td className="py-4 px-3 text-center font-mono text-neutral-700">{invoice.courseDuration}</td>
                <td className="py-4 px-3 text-right font-mono font-bold text-neutral-950 text-sm">
                  ₹{invoice.courseFee.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Financial Calculation Breakdown Ledger */}
          <div className="flex justify-end my-6">
            <div className="w-72 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-600">
                <span>Standard Tuition Fee:</span>
                <span>₹{invoice.courseFee.toLocaleString('en-IN')}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Special Discount:</span>
                  <span>- ₹{invoice.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-neutral-950 pt-2 border-t border-neutral-300 text-sm">
                <span>Total Net Payable:</span>
                <span>₹{invoice.totalPayable.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Amount Paid:</span>
                <span>₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between font-extrabold text-neutral-950 pt-2 border-t-2 border-neutral-900 text-sm bg-neutral-100 p-2 rounded">
                <span>Remaining Balance:</span>
                <span>₹{invoice.remainingBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Instructions */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-200 text-xs">
            <div>
              <div className="font-bold uppercase tracking-wider text-neutral-800 text-[11px]">
                Payment Instructions & UPI
              </div>
              <p className="mt-1 text-neutral-600 leading-relaxed font-mono text-[11px]">
                UPI VPA: <span className="font-bold text-neutral-900">{INSTITUTE_PROFILE.upiId}</span>
                <br />
                Bank Transfer: Cortexx AI Institute
                <br />
                *Please quote Invoice #{invoice.invoiceNumber} in transfer remarks.
              </p>
              {invoice.notes && (
                <p className="mt-2 text-neutral-600 italic">
                  Note: {invoice.notes}
                </p>
              )}
            </div>

            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-40 border-b border-neutral-900 mb-2"></div>
              <div className="font-bold text-neutral-950 text-xs">Authorized Signatory</div>
              <div className="text-[11px] text-neutral-500 font-medium">Cortexx AI Institute</div>
            </div>
          </div>

          {/* Footer Official Tagline */}
          <div className="mt-12 pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
            Where Thinking Meets Technology · cortexx.ai · +91 7984691082
          </div>
        </div>
      </div>
    </div>
  );
};
