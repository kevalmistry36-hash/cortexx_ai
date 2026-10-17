import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Student, Course } from '../types';
import { QrCode, Download, Copy, Check, Printer, X, User, Phone, Mail, BookOpen, Calendar, IndianRupee, ShieldCheck, FileText } from 'lucide-react';
import { CortexxLogo } from './CortexxLogo';
import { downloadStudentQRPdf } from '../utils/studentQRPdf';

interface StudentQRModalProps {
  student: Student | null;
  course?: Course;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({
  student,
  course,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const totalFee = student.agreedFee || course?.fee || 6000;
  const paid = student.totalPaid || 0;
  const balance = Math.max(0, totalFee - paid);
  const courseDuration = course?.duration || '1 Month Practical AI';

  // Construct comprehensive student QR payload containing all details
  const qrPayload = [
    `=== CORTEXX AI ACADEMY - STUDENT CREDENTIAL ===`,
    `STUDENT NAME: ${student.name}`,
    `STUDENT ID: ${student.id}`,
    `ENROLLMENT ID: ${student.enrollmentId}`,
    `COURSE: ${student.enrolledCourseName || course?.name || 'Practical AI Course'}`,
    `DURATION: ${courseDuration}`,
    `ADMISSION DATE: ${student.enrollmentDate}`,
    `PHONE: +91 ${student.phone}`,
    `EMAIL: ${student.email}`,
    `FEE STATUS: ${student.paymentStatus.toUpperCase()}`,
    `TOTAL AGREED FEE: INR ${totalFee.toLocaleString('en-IN')}`,
    `AMOUNT PAID: INR ${paid.toLocaleString('en-IN')}`,
    `BALANCE DUE: INR ${balance.toLocaleString('en-IN')}`,
    `PAYMENT MODE: ${student.paymentMethod || 'UPI'}`,
    student.notes ? `NOTES: ${student.notes}` : null,
    `ACADEMY: Cortexx AI Education Institute`,
    `STATUS: VERIFIED ADMISSION RECORD`,
    `VERIFICATION TIME: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      qrPayload,
      {
        width: 380,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && isMounted) {
          setQrDataUrl(url);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [qrPayload]);

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${student.id}_${student.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadStudentQRPdf(student, course);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Unable to generate PDF directly. You can use the Print button to Save as PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 text-neutral-200 p-5 sm:p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-neutral-100 flex items-center gap-2">
                <span>Student Digital QR Pass</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                  Verified
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Official encrypted QR code containing complete admission & fee credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Digital Admission Card Container */}
        <div
          ref={printRef}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-inner space-y-5 print:bg-white print:text-black print:border-black"
        >
          {/* Card Top Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800/80">
            <CortexxLogo size="sm" showTagline={false} />
            <div className="text-left sm:text-right font-mono text-xs">
              <div className="text-orange-400 font-bold">{student.id}</div>
              <div className="text-neutral-400 text-[11px]">{student.enrollmentId}</div>
            </div>
          </div>

          {/* Main Content: Left Details, Right QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Student Details Column (7 cols) */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Student Name</div>
                <div className="text-lg font-bold text-neutral-100 mt-0.5">{student.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800">
                  <div className="text-[10px] uppercase text-neutral-400 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-orange-400" />
                    <span>Course</span>
                  </div>
                  <div className="font-semibold text-neutral-200 mt-1 truncate" title={student.enrolledCourseName}>
                    {student.enrolledCourseName}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{courseDuration}</div>
                </div>

                <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800">
                  <div className="text-[10px] uppercase text-neutral-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <span>Admission Date</span>
                  </div>
                  <div className="font-semibold text-neutral-200 mt-1 font-mono">{student.enrollmentDate}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Academic Session</div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs space-y-1.5 font-mono">
                <div className="flex items-center gap-2 text-neutral-300">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>+91 {student.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-300">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Payment Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      student.paymentStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : student.paymentStatus === 'partially_paid'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {student.paymentStatus === 'paid' ? '✓ FULLY PAID' : student.paymentStatus === 'partially_paid' ? '⏳ PARTIALLY PAID' : '✕ UNPAID'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 font-mono text-[11px]">
                  <div>
                    <div className="text-[10px] text-neutral-500">Agreed Fee</div>
                    <div className="font-bold text-neutral-200">₹{totalFee.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500">Amount Paid</div>
                    <div className="font-bold text-emerald-400">₹{paid.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500">Balance</div>
                    <div className={`font-bold ${balance > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
                      ₹{balance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Column (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-md border border-neutral-200 text-neutral-900 text-center">
              {qrDataUrl ? (
                <div className="relative group">
                  <img
                    src={qrDataUrl}
                    alt={`Student QR Code for ${student.name}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <span className="text-white text-xs font-semibold px-2 py-1 bg-black/60 rounded backdrop-blur-sm">
                      Scan with any Phone
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-neutral-400">
                  <div className="animate-pulse">Generating QR...</div>
                </div>
              )}

              <div className="mt-2 text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scan for Complete Student Profile</span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                ID: {student.id}
              </div>
            </div>
          </div>

          {/* Footer note in card */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>Cortexx AI Education Platform · Valid for Academic Year 2026</span>
            <span>Auth Code: {student.enrollmentId}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <button
            onClick={handleCopyPayload}
            className="flex items-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Copy structured text from QR code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied QR Data!' : 'Copy QR Text'}</span>
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Pass</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
              title="Download raw QR Code image (PNG)"
            >
              <Download className="w-4 h-4" />
              <span>PNG</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              title="Download complete Student QR Pass as PDF document"
            >
              <FileText className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Pass (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
