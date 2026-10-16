import React, { useRef, useState } from 'react';
import { PaymentReceipt } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { CortexxLogo } from './CortexxLogo';
import { Download, Printer, Share2, X, CheckCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadReceiptAsDoc } from '../utils/docExport';

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!receipt) return null;

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
      pdf.save(`${receipt.receiptNumber}_${receipt.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Receipt PDF Generation Error:', err);
      alert('Unable to generate PDF directly. You can use the Print button to Save as PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
              onClick={() => downloadReceiptAsDoc(receipt)}
              title="Download Receipt as Word Document (.doc)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download DOC</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
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

        {/* High-Fidelity A4 Receipt Paper Canvas */}
        <div
          ref={printRef}
          className="a4-print-container bg-white text-neutral-900 rounded-lg shadow-2xl p-8 sm:p-10 font-sans select-text border border-neutral-200"
          style={{ color: '#111827' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-5">
            <div>
              <CortexxLogo size="sm" showTagline={true} inverted={true} />
              <div className="mt-2 text-xs text-neutral-600 font-medium space-y-0.5">
                <p>Phone: {INSTITUTE_PROFILE.phone} · Email: {INSTITUTE_PROFILE.email}</p>
                <p>Official Education & Training Center · Gujarat, India</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xl font-extrabold uppercase text-emerald-800 tracking-tight">
                Payment Receipt
              </div>
              <div className="mt-1 text-xs space-y-0.5">
                <p>
                  <span className="text-neutral-500">Receipt No: </span>
                  <span className="font-bold text-neutral-900">{receipt.receiptNumber}</span>
                </p>
                <p>
                  <span className="text-neutral-500">Date: </span>
                  <span className="font-semibold text-neutral-800">{receipt.paymentDate}</span>
                </p>
                <p>
                  <span className="text-neutral-500">Invoice Ref: </span>
                  <span className="font-semibold text-neutral-800">{receipt.invoiceNumber}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Received From Box */}
          <div className="my-6 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Acknowledged Payment For
            </div>
            <div className="mt-1 text-lg font-bold text-neutral-950">{receipt.studentName}</div>
            <div className="text-xs text-neutral-600 font-mono mt-0.5">
              <span>Student ID: {receipt.studentId}</span>
              <span className="mx-2">·</span>
              <span>Invoice: {receipt.invoiceNumber}</span>
            </div>
          </div>

          {/* Receipt Breakdown Table */}
          <div className="my-6 border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Transaction Ref</th>
                  <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-neutral-900">
                    Tuition Fee Installment
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{receipt.paymentMethod}</td>
                  <td className="py-3 px-4 text-neutral-600">{receipt.transactionRef || 'N/A'}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                    ₹{receipt.amountReceived.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Summary Strip */}
          <div className="flex justify-between items-center p-4 bg-neutral-100 rounded-lg font-mono text-xs my-6">
            <div>
              <span className="text-neutral-600">Remaining Fee Balance: </span>
              <span className="font-bold text-neutral-900 text-sm">
                ₹{receipt.remainingBalanceAfter.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Payment Verified</span>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-200 text-xs">
            <div className="text-neutral-500 text-[11px] font-mono">
              This receipt confirms official receipt of funds into Cortexx AI accounts.
              Keep this voucher for course credential clearance.
            </div>

            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-36 border-b border-neutral-900 mb-2"></div>
              <div className="font-bold text-neutral-950 text-xs">Accounts Department</div>
              <div className="text-[11px] text-neutral-500">Cortexx AI Institute</div>
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-neutral-200 text-center text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
            Where Thinking Meets Technology · cortexx.ai · +91 7984691082
          </div>
        </div>
      </div>
    </div>
  );
};
