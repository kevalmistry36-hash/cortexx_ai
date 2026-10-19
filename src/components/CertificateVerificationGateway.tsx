import React, { useState, useEffect } from 'react';
import { CertificateRecord, Student } from '../types';
import { getCertificates, getStudents, isAdminAuthenticated, setAdminAuthenticated } from '../services/storage';
import { verifyCertificateFromCloud, subscribeToCertificatesRealtime } from '../services/firebase';
import { CortexxOfficialSeal } from './CortexxOfficialSeal';
import { CortexxLogo } from './CortexxLogo';
import { AdminLockModal } from './AdminLockModal';
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
  AlertCircle,
  RefreshCw,
  Cloud,
  Lock,
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
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Cloud & Realtime verification lookup
  useEffect(() => {
    if (!activeCode.trim()) {
      setCertificate(null);
      setStudent(null);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    verifyCertificateFromCloud(activeCode)
      .then(found => {
        if (!isMounted) return;

        if (found) {
          setCertificate(found);
          const students = getStudents();
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
            .then(url => {
              if (isMounted) setQrDataUrl(url);
            })
            .catch(() => {});
        } else {
          setCertificate(null);
          setStudent(null);
        }
      })
      .catch(err => {
        console.error('Verification query failed:', err);
        if (isMounted) {
          setCertificate(null);
          setStudent(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsSearching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCode]);

  // Subscribe to realtime certificate updates
  useEffect(() => {
    const unsubscribe = subscribeToCertificatesRealtime(newCert => {
      if (
        activeCode &&
        (newCert.verificationCode.toLowerCase() === activeCode.toLowerCase() ||
          newCert.id.toLowerCase() === activeCode.toLowerCase() ||
          (newCert.certificateNumber && newCert.certificateNumber.toLowerCase() === activeCode.toLowerCase()))
      ) {
        setCertificate(newCert);
      }
    });

    return () => unsubscribe();
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
    const verifyUrl = `https://cortexxai-app.vercel.app/?verify=${certificate.verificationCode}`;
    downloadCertificateAsDoc(
      fallbackStudent,
      certificate,
      {
        startDate: certificate.startDate,
        endDate: certificate.endDate,
        courseName: certificate.courseName,
        qrDataUrl,
        verificationUrl: verifyUrl,
      },
      INSTITUTE_PROFILE
    );
    setNotification('Certificate exported as Word (.doc) document!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  // Protected navigation to the Institute Portal: Require PIN
  const handleRequestPortalAccess = () => {
    if (isAdminAuthenticated()) {
      if (onGoToPortal) onGoToPortal();
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinUnlock = () => {
    setAdminAuthenticated(true);
    setIsPinModalOpen(false);
    if (onGoToPortal) onGoToPortal();
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
                onClick={handleRequestPortalAccess}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                title="Admin PIN Required"
              >
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span>Admin Portal</span>
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
            Official cloud validation system for credentials issued by{' '}
            <strong className="text-neutral-200">Cortexx AI Institute</strong>. Real-time verification across any device or browser.
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
            disabled={isSearching}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isSearching ? 'Verifying...' : 'Verify Credential'}</span>
          </button>
        </form>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between max-w-xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-neutral-200 text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* RESULTS SECTION */}
        {isSearching ? (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-12 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm text-neutral-300 font-medium">
              Querying Realtime Verification Database...
            </p>
          </div>
        ) : certificate ? (
          /* AUTHENTIC VERIFIED CERTIFICATE CARD */
          <div className="bg-neutral-900/90 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-fadeIn">
            {/* Top Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Authentic Credential Verified
                    </span>
                    <span className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      Synced
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-neutral-100 mt-1">
                    Cortexx AI Certified Completion
                  </h2>
                </div>
              </div>

              {/* Certificate Number Stamp */}
              <div className="text-left sm:text-right font-mono bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Certificate ID</div>
                <div className="text-amber-400 font-bold text-sm">{certificate.certificateNumber || certificate.id}</div>
              </div>
            </div>

            {/* Recipient Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80 space-y-1">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Certified Recipient</span>
                </span>
                <p className="text-lg font-bold text-neutral-100">{certificate.studentName}</p>
                <p className="text-xs text-neutral-400 font-mono">
                  Verified Student ID: {certificate.studentId}
                </p>
              </div>

              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80 space-y-1">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Program Completed</span>
                </span>
                <p className="text-lg font-bold text-neutral-100">{certificate.courseName}</p>
                <p className="text-xs text-neutral-400 font-mono">
                  Mode: {certificate.courseMode || '100% Online'} · Duration: {certificate.courseDuration || '1 Month'}
                </p>
              </div>

              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80 space-y-1">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Training Timeline</span>
                </span>
                <p className="text-sm font-semibold text-neutral-200">
                  {certificate.startDate} to {certificate.endDate}
                </p>
                <p className="text-xs text-neutral-400 font-mono">
                  Issued on: {certificate.issueDate}
                </p>
              </div>

              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80 space-y-1">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cryptographic Verification Code</span>
                </span>
                <p className="text-sm font-bold font-mono text-amber-400 break-all">
                  {certificate.verificationCode}
                </p>
                <p className="text-xs text-emerald-400/90 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Signature Record Validated
                </p>
              </div>
            </div>

            {/* Official Signatories & Seal Section */}
            <div className="p-4 bg-neutral-950/90 rounded-xl border border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Authorized Signatories */}
              <div className="space-y-2 flex-1">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono font-bold">
                  Authorized Signatories:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(certificate.signatories && certificate.signatories.length > 0
                    ? certificate.signatories
                    : [
                        { name: 'Keval Gajjar', role: 'Founder & Director', organization: 'Cortexx AI' },
                        { name: 'Hiren Raval', role: 'Head of AI Curriculum', organization: 'Cortexx AI' },
                        { name: 'Shweta Malaviya', role: 'Chief Technical Lead', organization: 'Cortexx AI' },
                      ]
                  ).map((sig: { name: string; role: string; organization?: string }, i: number) => (
                    <div key={i} className="border-l-2 border-amber-500/40 pl-2">
                      <div className="text-xs font-bold text-neutral-200">{sig.name}</div>
                      <div className="text-[10px] text-neutral-400">{sig.role}</div>
                      <div className="text-[9px] text-neutral-500 font-mono">{sig.organization || 'Cortexx AI'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Centered Seal */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <CortexxOfficialSeal size={80} className="w-20 h-20 drop-shadow-lg" />
                <span className="text-[10px] font-mono text-amber-400/90 font-bold mt-1">Official Seal</span>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="flex flex-col items-center justify-center shrink-0 bg-white p-2 rounded-xl shadow-md">
                  <img src={qrDataUrl} alt="Verify QR Code" className="w-20 h-20" />
                  <span className="text-[9px] font-mono text-neutral-900 font-bold mt-0.5">Scan to Verify</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Download PDF, Word, and Print */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Verified PDF'}</span>
                </button>

                <button
                  onClick={handleDownloadDoc}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Download Word (.doc)</span>
                </button>

                <button
                  onClick={handlePrintCertificate}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-neutral-400" />
                  <span>Print Certificate</span>
                </button>
              </div>

              <div className="text-xs text-neutral-400 font-mono">
                Official Issuer: <strong className="text-neutral-200">Cortexx AI Institute</strong>
              </div>
            </div>
          </div>
        ) : (
          /* NOT FOUND / SEARCH PROMPT STATE */
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-200">
                {activeCode ? 'Certificate Record Not Found' : 'Ready to Verify Credential'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                {activeCode
                  ? `No verified credential matching "${activeCode}" could be located in the cloud registry. Please verify the Certificate ID, verification code, or QR URL.`
                  : 'Enter a Certificate ID (e.g. COR-CERT-2026-0001) or verification code to validate credential authenticity, recipient, completion dates, and official signatures.'}
              </p>
            </div>

            {/* Quick Sample Credentials */}
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
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 transition-colors text-left cursor-pointer"
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

      {/* Admin Passcode Gatekeeper Modal to access the dashboard */}
      <AdminLockModal
        isOpen={isPinModalOpen}
        onUnlock={handlePinUnlock}
        onBack={() => setIsPinModalOpen(false)}
        isMandatoryGate={false}
        title="Admin Authentication Required"
        description="Enter Admin PIN to access student databases, certificates manager, and financials"
      />
    </div>
  );
};
