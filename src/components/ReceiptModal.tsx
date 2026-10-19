import React, { useRef, useState } from 'react';
import { PaymentReceipt } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { CortexxLogo } from './CortexxLogo';
import { Download, Printer, Share2, X, CheckCircle, FileText, Mail } from 'lucide-react';
import { downloadReceiptAsDoc } from '../utils/docExport';
import { downloadReceiptAsPdf } from '../utils/pdfExport';
import { sendReceiptEmail, getSmtpConfig } from '../services/emailService';

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!receipt) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      downloadReceiptAsPdf(receipt);
    } catch (err) {
      console.error('Receipt PDF Generation Error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailShare = async () => {
    const studentEmail = receipt.studentEmail || '';
    if (!studentEmail) {
      setEmailStatus(`No email address recorded for student ${receipt.studentName}.`);
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }

    const smtp = getSmtpConfig();
    if (smtp.pass && smtp.user) {
      setIsSendingEmail(true);
      setEmailStatus(`Dispatching Receipt ${receipt.receiptNumber} via SMTP...`);
      try {
        const res = await sendReceiptEmail(receipt, studentEmail);
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

    // Fallback to mailto if SMTP not configured
    const subject = `Payment Receipt: ${receipt.receiptNumber} - Cortexx AI Institute`;
    const body = `Dear ${receipt.studentName},

Greetings from Cortexx AI Institute ("Where Thinking Meets Technology")!

We confirm receipt of your fee installment:
Receipt No     : ${receipt.receiptNumber}
Linked Invoice : ${receipt.invoiceNumber}
Amount Paid    : INR ${receipt.amountReceived.toLocaleString('en-IN')}
Payment Date   : ${receipt.paymentDate}
Method         : ${receipt.paymentMethod}
Remaining Due  : INR ${receipt.remainingBalanceAfter.toLocaleString('en-IN')}

Support: ${INSTITUTE_PROFILE.email} | +91 ${INSTITUTE_PROFILE.phone}

Warm regards,
Accounts Office, Cortexx AI Institute`;

    window.location.href = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setEmailStatus(`Mail app opened for ${studentEmail}. Configure SMTP in Settings for 1-click background delivery.`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleWhatsAppShare = () => {
    const message = `Hello *${receipt.studentName}*,\n\nWe have received your payment at *Cortexx AI Institute*!\n\n🧾 *Receipt No:* ${receipt.receiptNumber}\n📄 *Linked Invoice:* ${receipt.invoiceNumber}\n💵 *Amount Received:* ₹${receipt.amountReceived.toLocaleString('en-IN')}\n📅 *Date:* ${receipt.paymentDate}\n💳 *Method:* ${receipt.paymentMethod}\n⏳ *Remaining Balance:* ₹${receipt.remainingBalanceAfter.toLocaleString('en-IN')}\n\n*Cortexx AI Institute* - Where Thinking Meets Technology\n📞 ${INSTITUTE_PROFILE.phone} | ✉️ ${INSTITUTE_PROFILE.email}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-auto">
        {/* Floating Action Bar */}
        <div className="sticky top-2 z-20 flex items-center justify-between p-3 mb-3 bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-xl no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400">{receipt.receiptNumber}</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300 font-medium">Payment Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEmailShare}
              disabled={isSendingEmail}
              title={`Email Receipt to ${receipt.studentEmail || 'student'}`}
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
              onClick={() => downloadReceiptAsDoc(receipt)}
              title="Download Receipt as Word Document (.doc)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>DOC</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md"
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

        {/* High-Fidelity A4 Receipt Paper Canvas with Pure Black Fonts */}
        <div
          ref={printRef}
          className="a4-print-container bg-white text-black rounded-lg shadow-2xl p-8 sm:p-10 font-sans select-text border-2 border-black"
          style={{ color: '#000000' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-5">
            <div>
              <CortexxLogo size="sm" showTagline={true} inverted={true} />
              <div className="mt-2 text-xs text-black font-medium space-y-0.5">
                <p className="font-semibold text-black">Official Education & Training Center · Gujarat, India</p>
                <p className="text-black">Phone: +91 {INSTITUTE_PROFILE.phone} · Email: {INSTITUTE_PROFILE.email}</p>
                <p className="text-black">Website: {INSTITUTE_PROFILE.website}</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xl font-black uppercase text-black tracking-tight">
                Payment Receipt
              </div>
              <div className="mt-1 text-xs space-y-0.5">
                <p>
                  <span className="text-black font-semibold">Receipt No: </span>
                  <span className="font-bold text-black">{receipt.receiptNumber}</span>
                </p>
                <p>
                  <span className="text-black font-semibold">Date: </span>
                  <span className="font-bold text-black">{receipt.paymentDate}</span>
                </p>
                <p>
                  <span className="text-black font-semibold">Invoice Ref: </span>
                  <span className="font-bold text-black">{receipt.invoiceNumber}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Received From Box */}
          <div className="my-6 p-4 bg-white border-2 border-black rounded-lg">
            <div className="text-[11px] font-bold uppercase tracking-wider text-black border-b border-black/30 pb-1">
              Acknowledged Payment For (Student)
            </div>
            <div className="mt-2 text-lg font-bold text-black">{receipt.studentName}</div>
            <div className="text-xs text-black font-mono mt-1 space-x-2">
              <span><span className="font-semibold">Student ID:</span> {receipt.studentId}</span>
              <span>·</span>
              <span><span className="font-semibold">Linked Invoice:</span> {receipt.invoiceNumber}</span>
            </div>
          </div>

          {/* Receipt Breakdown Table */}
          <div className="my-6 border-2 border-black rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-100 border-b-2 border-black text-black uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-4 border-r border-black">Description</th>
                  <th className="py-2.5 px-4 border-r border-black">Payment Method</th>
                  <th className="py-2.5 px-4 border-r border-black">Transaction Ref</th>
                  <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                <tr>
                  <td className="py-3 px-4 font-sans font-bold text-black border-r border-black">
                    Tuition Fee Installment
                  </td>
                  <td className="py-3 px-4 text-black font-semibold border-r border-black">{receipt.paymentMethod}</td>
                  <td className="py-3 px-4 text-black border-r border-black">{receipt.transactionRef || 'N/A'}</td>
                  <td className="py-3 px-4 text-right font-black text-black text-base">
                    ₹{receipt.amountReceived.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Summary Strip */}
          <div className="flex justify-between items-center p-4 bg-white border-2 border-black rounded-lg font-mono text-xs my-6">
            <div>
              <span className="text-black font-bold">Remaining Fee Balance: </span>
              <span className="font-black text-black text-base ml-1">
                ₹{receipt.remainingBalanceAfter.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-black rounded text-black font-bold text-xs uppercase tracking-wide">
              <CheckCircle className="w-4 h-4 text-black" />
              <span>Payment Verified & Cleared</span>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-black text-xs text-black">
            <div className="text-black text-[11px] font-mono leading-relaxed">
              This receipt confirms official receipt of funds into Cortexx AI accounts.
              Please retain this voucher for course credential clearance.
              <br />
              UPI ID: {INSTITUTE_PROFILE.upiId}
            </div>

            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-40 border-b-2 border-black mb-2"></div>
              <div className="font-bold text-black text-xs uppercase tracking-wider">Accounts Department</div>
              <div className="text-[11px] text-black font-semibold">Cortexx AI Institute</div>
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-black text-center text-[10px] text-black font-mono uppercase tracking-widest font-semibold">
            Where Thinking Meets Technology · cortexx.ai · +91 7984691082
          </div>
        </div>
      </div>
    </div>
  );
};
