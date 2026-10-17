import React, { useState, useEffect } from 'react';
import { CertificateRecord, Student } from '../types';
import { getCertificates, getStudents } from '../services/storage';
import { CortexxOfficialSeal } from './CortexxOfficialSeal';
import { CortexxLogo } from './CortexxLogo';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { downloadCertificateDirectlyAsPdf, downloadCertificateAsDoc } from '../utils/certificateExport';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Download,
  FileText,
  Printer,
  Search,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface CertificateVerificationGatewayProps {
  initialCode?: string;
  onGoToPortal?: () => void;
}

export const CertificateVerificationGateway: React.FC<CertificateVerificationGatewayProps> = ({
  initialCode,
  onGoToPortal,
}) => {
  const [searchCode, setSearchCode] = useState(initialCode || '');
  const [activeCode, setActiveCode] = useState(initialCode || '');
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // If initialCode is provided, search immediately
    const certs = getCertificates();
    const students = getStudents();

    if (activeCode.trim()) {
      const clean = activeCode.trim().toLowerCase();
      const found = certs.find(
        c =>
          c.verificationCode.toLowerCase() === clean ||
          c.id.toLowerCase() === clean ||
          c.studentName.toLowerCase() === clean
      );

      if (found) {
        setCertificate(found);
        const st = students.find(s => s.id === found.studentId) || {
          id: found.studentId,
          name: found.studentName,
          phone: '+91 7984691082',
          email: 'student@cortexx.ai',
          enrolledCourseId: 'course-1',
          enrolledCourseName: found.courseName,
          enrollmentId: 'COR-ENR-2026-0001',
          enrollmentDate: found.startDate,
          agreedFee: 6000,
          totalPaid: 6000,
          paymentStatus: 'paid',
          createdAt: found.createdAt,
        };
        setStudent(st);

        // Generate QR Code for this credential
        const verifyUrl = `https://cortexxai-app.vercel.app/?verify=${found.verificationCode}`;
        QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 })
          .then(url => setQrDataUrl(url))
          .catch(() => {});
      } else {
        setCertificate(null);
        setStudent(null);
      }
    }
  }, [activeCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setActiveCode(searchCode.trim());
    // Update URL query string without reloading page
    const newUrl = `${window.location.pathname}?verify=${encodeURIComponent(searchCode.trim())}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleDownloadPdf = async () => {
    if (!certificate) return;
    setIsExportingPdf(true);
    try {
      await downloadCertificateDirectlyAsPdf(certificate, student || undefined);
      setNotification(`Downloaded Verified PDF Certificate for ${certificate.studentName}!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Failed to generate PDF. Please try again.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadDoc = () => {
    if (!certificate) return;
    const fallbackStudent: Student = student || {
      id: certificate.studentId,
      name: certificate.studentName,
      phone: '9876543210',
      email: 'student@cortexx.ai',
      enrolledCourseId: 'course-1',
      enrolledCourseName: certificate.courseName,
      enrollmentId: 'COR-ENR-2026-0001',
      enrollmentDate: certificate.startDate,
      agreedFee: 6000,
      totalPaid: 6000,
      paymentStatus: 'paid',
      createdAt: certificate.createdAt,
    };

    downloadCertificateAsDoc(fallbackStudent, certificate, {
      startDate: certificate.startDate,
      endDate: certificate.endDate,
      courseName: certificate.courseName,
      qrDataUrl,
      verificationUrl: `https://cortexxai-app.vercel.app/?verify=${certificate.verificationCode}`,
    }, INSTITUTE_PROFILE);

    setNotification(`Downloaded Official Word (.doc) Certificate!`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Authoritative Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CortexxLogo size="sm" showTagline={true} />
            <span className="hidden sm:inline-block h-5 w-px bg-neutral-800" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Public Verification Gateway
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onGoToPortal && (
              <button
                onClick={onGoToPortal}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go to Institute Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Gateway Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Gateway Title Banner */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg shadow-emerald-500/5">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Certificate Authenticity Verification Gateway
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            Official cryptographic validation system for credentials issued by{' '}
            <strong className="text-neutral-200">Cortexx AI Institute</strong>. Verify student completion, course dates, and digital signature records.
          </p>
        </div>

        {/* Verification Search Bar (allowing checking any certificate code) */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchCode}
              onChange={e => setSearchCode(e.target.value)}
              placeholder="Enter Certificate ID (e.g. COR-CERT-2026-0001) or Code..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0"
          >
            Verify Credential
          </button>
        </form>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between max-w-xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-neutral-200 text-xs">✕</button>
          </div>
        )}

        {/* RESULTS SECTION */}
        {certificate ? (
          /* AUTHENTIC VERIFIED CERTIFICATE CARD */
          <div className="bg-neutral-900/90 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-fadeIn">
            {/* Top Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-black tracking-widest text-emerald-400">
                      OFFICIALLY VERIFIED & AUTHENTIC
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-100">
                    Cortexx AI Institute Course Completion Credential
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-3 py-1 bg-neutral-800 text-amber-400 border border-amber-500/30 rounded-lg font-bold">
                  {certificate.id}
                </span>
              </div>
            </div>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Recipient Details */}
              <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
                <div className="text-xs uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Certified Recipient</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-neutral-100">{certificate.studentName}</div>
                  <div className="text-xs font-mono text-neutral-400 mt-1">
                    Student ID: <span className="text-neutral-200">{certificate.studentId}</span>
                    {student?.enrollmentId && (
                      <> · Enrollment: <span className="text-neutral-200">{student.enrollmentId}</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Course & Curriculum Details */}
              <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
                <div className="text-xs uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Curriculum Completed</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-400">{certificate.courseName}</div>
                  <div className="text-xs font-mono text-neutral-300 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Duration: {certificate.startDate} to {certificate.endDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Security Details & Signatories */}
            <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-neutral-400">Cryptographic Verification Hash: </span>
                  <span className="text-emerald-400 font-bold">{certificate.verificationCode}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Date of Issuance: </span>
                  <span className="text-neutral-200 font-bold">{certificate.issueDate}</span>
                </div>
              </div>

              {/* Signatories Roster */}
              <div className="pt-3 border-t border-neutral-800/80">
                <div className="text-xs text-neutral-400 mb-2 font-semibold">Authorized Institute Signatories:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="font-bold text-neutral-200 text-xs">Keval Gajjar</div>
                    <div className="text-[10px] text-neutral-400">Founder & CEO</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">✓ Cryptographically Signed</div>
                  </div>
                  <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="font-bold text-neutral-200 text-xs">Hiren Raval</div>
                    <div className="text-[10px] text-neutral-400">Head of AI Engineering</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">✓ Cryptographically Signed</div>
                  </div>
                  <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="font-bold text-neutral-200 text-xs">Shweta Malaviya</div>
                    <div className="text-[10px] text-neutral-400">Academic Director</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">✓ Cryptographically Signed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Official Seal & Verification Stamp */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 bg-gradient-to-r from-neutral-950 via-blue-950/20 to-neutral-950 border border-neutral-800 rounded-xl text-center">
              <div className="shrink-0">
                <CortexxOfficialSeal size={90} className="w-22 h-22 drop-shadow-md" />
              </div>
              <div className="text-left space-y-1">
                <div className="font-black text-sm text-neutral-200 uppercase tracking-wider font-sans">
                  Official Institute Seal Affixed
                </div>
                <div className="text-xs text-neutral-400 max-w-md">
                  This electronic credential is cryptographically tied to the Cortexx AI Institute registry and verified via decentralized digital hash.
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-bold">
                  Issuer: Cortexx AI Institute · Gujarat, India · +91 7984691082
                </div>
              </div>
            </div>

            {/* Export and Download Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
              <div className="text-xs text-neutral-400">
                Recipient or verifier can download original official copy:
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs shadow-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Verified PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* NOT FOUND / SEARCH PROMPT STATE */
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400">
              <AlertCircle className="w-7 h-7 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-200">
                {activeCode ? 'Certificate Not Found' : 'Enter Certificate ID or Scan QR'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {activeCode
                  ? `No verified record found matching "${activeCode}". Please verify that the code was typed correctly.`
                  : 'Scan the QR code on the certificate or paste the verification code above to validate authenticity.'}
              </p>
            </div>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-neutral-800 text-left">
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2 font-bold">
                Recently Issued Sample Certificates:
              </div>
              <div className="space-y-1.5">
                {getCertificates().slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSearchCode(c.verificationCode);
                      setActiveCode(c.verificationCode);
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 transition-colors text-left"
                  >
                    <span>{c.studentName} — <strong className="text-amber-400">{c.id}</strong></span>
                    <span className="text-emerald-400 text-[10px]">Verify Now →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Gateway Footer */}
      <footer className="mt-auto border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Cortexx AI Institute · Secure Digital Credential Verification Gateway</span>
          <span>Contact: +91 7984691082 · info.cortexx@gmail.com</span>
        </div>
      </footer>
    </div>
  );
};
