import React, { useState, useEffect, useRef } from 'react';
import { Student, Course, CertificateRecord } from '../types';
import { getCertificates, saveCertificate, deleteCertificate, getNextCertificateNumber } from '../services/storage';
import {
  downloadCertificateAsPdf,
  downloadCertificateDirectlyAsPdf,
  downloadBulkCertificatesAsPdf,
} from '../utils/certificateExport';
import { CortexxLogo } from './CortexxLogo';
import { CortexxOfficialSeal } from './CortexxOfficialSeal';
import QRCode from 'qrcode';
import {
  fetchAndSyncAllCertificatesFromFirebase,
  subscribeToCertificatesRealtime,
  pushAllLocalCertificatesToFirebase,
} from '../services/firebase';
import {
  Award,
  CheckCircle2,
  Download,
  FileDown,
  Printer,
  Eye,
  Search,
  Calendar,
  BookOpen,
  ShieldCheck,
  User,
  X,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Sparkles,
  FileText,
  Loader2,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { INSTITUTE_PROFILE } from '../constants/initialData';

interface CertificatesViewProps {
  students: Student[];
  courses: Course[];
  onOpenVerificationGateway?: (code: string) => void;
  theme?: 'light' | 'dark';
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  students,
  courses,
  onOpenVerificationGateway,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Wizard Form State
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || 'other');
  const [customCourseName, setCustomCourseName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [notification, setNotification] = useState<string | null>(null);
  const [previewCert, setPreviewCert] = useState<{ cert: CertificateRecord; student: Student; qrUrl: string } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCertificates(getCertificates());

    // Fetch latest from Firebase Firestore across all devices
    fetchAndSyncAllCertificatesFromFirebase()
      .then(latest => {
        if (latest && latest.length > 0) {
          setCertificates(latest);
        }
      })
      .catch(() => {});

    // Subscribe to realtime changes
    const unsubscribe = subscribeToCertificatesRealtime(() => {
      setCertificates(getCertificates());
    });

    return () => unsubscribe();
  }, []);

  const activeCourseName =
    selectedCourseId === 'other'
      ? customCourseName.trim() || 'Professional AI Curriculum'
      : courses.find(c => c.id === selectedCourseId)?.name || 'Practical AI Master Course';

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleGenerateCertificates = async () => {
    if (selectedStudentIds.length === 0) {
      setNotification('Please select at least one student in Step 2.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const newCerts: CertificateRecord[] = [];
    const issueDate = new Date().toISOString().split('T')[0];

    for (const studentId of selectedStudentIds) {
      const student = students.find(s => s.id === studentId);
      if (!student) continue;

      const certId = getNextCertificateNumber();
      const verificationCode = `COR-VERIFY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newCert: CertificateRecord = {
        id: certId,
        studentId: student.id,
        studentName: student.name,
        courseName: activeCourseName,
        startDate,
        endDate,
        issueDate,
        verificationCode,
        createdAt: new Date().toISOString(),
      };

      saveCertificate(newCert);
      newCerts.push(newCert);
    }

    setCertificates(getCertificates());
    setWizardStep(1);
    setSelectedStudentIds([]);
    setNotification(`Successfully generated ${newCerts.length} Course Completion Certificate(s)!`);
    setTimeout(() => setNotification(null), 5000);
  };


  // Direct PDF Download from Table Actions
  const handleDownloadDirectPdf = async (cert: CertificateRecord) => {
    const student = students.find(s => s.id === cert.studentId);
    setDownloadingCertId(cert.id);
    try {
      await downloadCertificateDirectlyAsPdf(cert, student);
      setNotification(`Downloaded PDF Certificate for ${cert.studentName}!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Failed to generate PDF. Please try again.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setDownloadingCertId(null);
    }
  };

  // Download PDF from Preview Modal
  const handleDownloadPreviewPdf = async () => {
    if (!previewCert) return;
    setIsExportingPdf(true);
    try {
      await downloadCertificateDirectlyAsPdf(previewCert.cert, previewCert.student);
      setNotification(`Downloaded PDF Certificate for ${previewCert.student.name}!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Failed to generate PDF. Please try again.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Bulk PDF Download for all issued certificates
  const handleBulkPdfDownload = async () => {
    if (certificates.length === 0) {
      setNotification('No certificates available to export.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsBulkDownloading(true);
    setBulkProgress({ current: 0, total: certificates.length });
    try {
      await downloadBulkCertificatesAsPdf(certificates, students, (current, total) => {
        setBulkProgress({ current, total });
      });
      setNotification(`Successfully exported all ${certificates.length} certificates to PDF!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error(err);
      setNotification('Error during bulk PDF export.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleOpenPreview = async (cert: CertificateRecord) => {
    const student = students.find(s => s.id === cert.studentId) || {
      id: cert.studentId,
      name: cert.studentName,
      phone: '9876543210',
      email: 'student@cortexx.ai',
      enrolledCourseId: 'course-1',
      enrolledCourseName: cert.courseName,
      enrollmentId: 'COR-ENR-2026-0001',
      enrollmentDate: cert.startDate,
      agreedFee: 6000,
      totalPaid: 6000,
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
    };

    const verifyUrl = `https://cortexxai-app.vercel.app/?verify=${cert.verificationCode}`;
    let qrUrl = '';
    try {
      qrUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 });
    } catch {
      // fallback
    }

    setPreviewCert({ cert, student, qrUrl });
  };

  const filteredCertificates = certificates.filter(
    c =>
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.verificationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Shared card classes - identical appearance to Dashboard
  const kpiCardClass = isLight
    ? 'dashboard-kpi-card bg-white border-2 border-neutral-200 border-t-4 border-t-orange-500 shadow-md hover:border-orange-500 text-black rounded-xl p-5 transition-all'
    : 'dashboard-kpi-card bg-neutral-900 border border-neutral-800 border-t-4 border-t-orange-500 hover:border-neutral-700 text-neutral-100 rounded-xl p-5 transition-all';
  const kpiTitleClass = isLight
    ? 'text-xs uppercase tracking-wider font-black text-black flex items-center gap-1.5'
    : 'text-xs uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-1.5';
  const kpiNumberClass = isLight
    ? 'text-2xl font-black text-black tracking-tight mt-1'
    : 'text-2xl font-black text-neutral-100 tracking-tight mt-1';
  const kpiSubtextClass = isLight
    ? 'text-[11px] font-black text-black mt-1'
    : 'text-[11px] font-medium text-neutral-500 mt-1';
  const kpiBadgeClass = isLight
    ? 'text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-black border border-orange-300'
    : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Metrics - Command Center Vibe matching Dashboard */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight
            ? 'bg-gradient-to-r from-orange-50 via-white to-amber-50 border-neutral-200 shadow-sm'
            : 'bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-neutral-800'
        } flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xl sm:text-2xl shrink-0">
            📜
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                Course Completion Certificates
              </h1>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                }`}
              >
                Verifiable Credentials
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-0.5 font-bold ${isLight ? 'text-black' : 'text-neutral-100'}`}>
              Generate verifiable graduation credentials with QR validation, official institute seal, and instant PDF downloads
            </p>
          </div>
        </div>

        {/* Top Action Buttons: Bulk PDF Download & Counter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {certificates.length > 0 && (
            <button
              onClick={handleBulkPdfDownload}
              disabled={isBulkDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isBulkDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Exporting ({bulkProgress.current}/{bulkProgress.total})...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-neutral-950" />
                  <span>Bulk PDF Download</span>
                </>
              )}
            </button>
          )}

          <div
            className={`px-4 py-2 rounded-xl text-xs font-mono border ${
              isLight ? 'bg-white border-neutral-300 text-black shadow-xs' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>Issued: </span>
            <span className="text-orange-600 dark:text-orange-400 font-black text-sm">{certificates.length}</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-bold">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* Certificate Section KPI Cards with Emojis - Dashboard Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* KPI 1: Issued Certificates */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className={kpiTitleClass}>
              <span role="img" aria-label="Certificates" className="select-none text-base">📜</span>
              <span>Issued Certificates</span>
            </div>
            <span className={kpiBadgeClass}>Active</span>
          </div>
          <div className={kpiNumberClass}>{certificates.length}</div>
          <div className={kpiSubtextClass}>Official Credentials</div>
        </div>

        {/* KPI 2: Eligible Candidates */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className={kpiTitleClass}>
              <span role="img" aria-label="Students" className="select-none text-base">🎓</span>
              <span>Eligible Candidates</span>
            </div>
            <span className={kpiBadgeClass}>Graduates</span>
          </div>
          <div className={kpiNumberClass}>{students.length}</div>
          <div className={kpiSubtextClass}>Enrolled Roster</div>
        </div>

        {/* KPI 3: Certified Courses */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className={kpiTitleClass}>
              <span role="img" aria-label="Programs" className="select-none text-base">📚</span>
              <span>Certified Courses</span>
            </div>
            <span className={kpiBadgeClass}>Accredited</span>
          </div>
          <div className={kpiNumberClass}>
            {courses.filter(c => c.certificateIncluded).length}
          </div>
          <div className={kpiSubtextClass}>Curriculum Aligned</div>
        </div>

        {/* KPI 4: Tamper-Proof QR */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className={kpiTitleClass}>
              <span role="img" aria-label="Security" className="select-none text-base">🛡️</span>
              <span>Tamper-Proof QR</span>
            </div>
            <span className={kpiBadgeClass}>Verified</span>
          </div>
          <div className={kpiNumberClass}>100%</div>
          <div className={kpiSubtextClass}>Instant Scan & Authenticate</div>
        </div>
      </div>

      {/* CERTIFICATE WIZARD CONTAINER */}
      <div
        className={`border rounded-2xl p-5 sm:p-6 shadow-md space-y-6 ${
          isLight ? 'bg-white border-2 border-neutral-200 text-black' : 'bg-neutral-900/80 border border-neutral-800 text-neutral-100'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
          isLight ? 'border-neutral-200' : 'border-neutral-800'
        }`}>
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-orange-500/25 transition-all">
              <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:text-orange-500 transition-colors" />
            </div>
            <h2 className={`text-base sm:text-lg font-black tracking-tight transition-colors ${
              isLight
                ? 'text-orange-700 hover:text-orange-500'
                : 'text-orange-400 hover:text-orange-300'
            }`}>
              Certificate Generation Wizard
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 text-xs font-mono">
            <span
              className={`px-2.5 py-1.5 rounded-lg font-bold text-center sm:text-left ${
                wizardStep === 1
                  ? 'bg-orange-500 text-white'
                  : isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Step 1: Course & Dates
            </span>
            <span className={`hidden sm:inline ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>→</span>
            <span
              className={`px-2.5 py-1.5 rounded-lg font-bold text-center sm:text-left ${
                wizardStep === 2
                  ? 'bg-orange-500 text-white'
                  : isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Step 2: Select Students ({selectedStudentIds.length})
            </span>
            <span className={`hidden sm:inline ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>→</span>
            <span
              className={`px-2.5 py-1.5 rounded-lg font-bold text-center sm:text-left ${
                wizardStep === 3
                  ? 'bg-orange-500 text-white'
                  : isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Step 3: Generate
            </span>
          </div>
        </div>

        {/* STEP 1 */}
        {wizardStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold transition-colors ${isLight ? 'text-orange-950 hover:text-orange-700' : 'text-orange-300 hover:text-orange-200'}`}>
                  Select Curriculum Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  aria-label="Select Curriculum Course"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-500 cursor-pointer transition-colors ${
                    isLight ? 'bg-neutral-50 border-neutral-300 text-neutral-900 hover:border-orange-400' : 'bg-neutral-950 border-neutral-800 text-neutral-100 hover:border-neutral-700'
                  }`}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.duration})
                    </option>
                  ))}
                  <option value="other">+ Other Custom Course Name...</option>
                </select>
              </div>

              {selectedCourseId === 'other' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-orange-600 dark:text-orange-400">Custom Course Title</label>
                  <input
                    type="text"
                    value={customCourseName}
                    onChange={e => setCustomCourseName(e.target.value)}
                    placeholder="e.g. Advanced Generative AI & LLM Engineering"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-500 ${
                      isLight ? 'bg-neutral-50 border-orange-400 text-neutral-900' : 'bg-neutral-950 border-orange-500/50 text-neutral-100'
                    }`}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold transition-colors ${isLight ? 'text-orange-950 hover:text-orange-700' : 'text-orange-300 hover:text-orange-200'}`}>Course Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:border-orange-500 cursor-pointer transition-colors ${
                    isLight ? 'bg-neutral-50 border-neutral-300 text-neutral-900 hover:border-orange-400' : 'bg-neutral-950 border-neutral-800 text-neutral-100 hover:border-neutral-700'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-bold transition-colors ${isLight ? 'text-orange-950 hover:text-orange-700' : 'text-orange-300 hover:text-orange-200'}`}>Course End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:border-orange-500 cursor-pointer transition-colors ${
                    isLight ? 'bg-neutral-50 border-neutral-300 text-neutral-900 hover:border-orange-400' : 'bg-neutral-950 border-neutral-800 text-neutral-100 hover:border-neutral-700'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end pt-3">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <span>Next: Select Students</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {wizardStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className={`text-xs font-medium ${isLight ? 'text-[#243315]' : 'text-neutral-300'}`}>
                Select students to issue certificates for <strong className="text-[#587731] dark:text-[#8CB752] font-black">"{activeCourseName}"</strong>:
              </div>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer text-center bg-[#587731]/15 hover:bg-[#587731] text-[#587731] dark:text-[#8CB752] hover:text-[#FAF6EE] border border-[#587731]/40 hover:border-[#587731] shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <span>{selectedStudentIds.length === students.length ? '✕ Deselect All' : '✓ Select All Students'}</span>
              </button>
            </div>

            <div className={`max-h-80 overflow-y-auto space-y-2.5 pr-1 p-3 rounded-xl border ${
              isLight ? 'bg-neutral-50/70 border-neutral-300' : 'bg-neutral-950/60 border-neutral-800'
            }`}>
              {students.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs font-bold">No students available in admission roster.</div>
              ) : (
                students.map(student => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleSelectStudent(student.id)}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer gap-2.5 border-2 ${
                        isSelected
                          ? isLight
                            ? 'bg-orange-100/90 border-orange-500 shadow-sm ring-1 ring-orange-500/30'
                            : 'bg-orange-500/20 border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                          : isLight
                          ? 'bg-white border-neutral-200/90 hover:bg-orange-50/90 hover:border-orange-400 hover:shadow-xs'
                          : 'bg-neutral-900/80 border-neutral-800 hover:bg-neutral-800/90 hover:border-orange-500/50 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 transition-all ${
                            isSelected
                              ? 'bg-orange-600 border-orange-600 text-white font-black text-xs shadow-xs'
                              : isLight
                              ? 'border-neutral-400 bg-white group-hover:border-orange-500'
                              : 'border-neutral-600 bg-neutral-950 group-hover:border-orange-400'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                        <div className="min-w-0">
                          {/* Student Name with High-Visibility Color & Hover Highlight */}
                          <div
                            className={`font-black text-base tracking-tight truncate transition-colors ${
                              isSelected
                                ? isLight ? 'text-orange-800' : 'text-orange-300'
                                : isLight
                                ? 'text-orange-600 group-hover:text-amber-600'
                                : 'text-orange-400 group-hover:text-amber-300'
                            }`}
                          >
                            {student.name}
                          </div>
                          <div className="text-xs font-mono truncate font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                            <span className="text-orange-600 dark:text-orange-400 font-black group-hover:text-orange-500">{student.id}</span> · <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">{student.enrolledCourseName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold sm:text-right pl-8 sm:pl-0 text-neutral-700 dark:text-neutral-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        +91 {student.phone}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 font-black text-xs rounded-xl transition-all cursor-pointer bg-[#587731]/15 hover:bg-[#587731] text-[#587731] dark:text-[#8CB752] hover:text-[#FAF6EE] border border-[#587731]/40 hover:border-[#587731] shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedStudentIds.length === 0) {
                    setNotification('Please select at least one student.');
                    setTimeout(() => setNotification(null), 3000);
                    return;
                  }
                  setWizardStep(3);
                }}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <span>Review & Generate ({selectedStudentIds.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {wizardStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className={`p-4 border rounded-xl space-y-2.5 text-xs font-mono ${
              isLight ? 'bg-neutral-50 border-neutral-300 text-black' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
            }`}>
              <div className="font-sans font-black text-sm mb-2 text-orange-700 dark:text-orange-400">
                Review Certificate Batch:
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>Course Curriculum:</span>
                <span className="text-orange-600 dark:text-orange-400 font-black text-sm">{activeCourseName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>Duration Period:</span>
                <span className={`font-bold ${isLight ? 'text-orange-950' : 'text-neutral-100'}`}>
                  {startDate} to {endDate}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>Selected Recipients:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black">{selectedStudentIds.length} Student(s)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>Signatories:</span>
                <span className={`font-semibold ${isLight ? 'text-neutral-800' : 'text-neutral-300'}`}>
                  Keval Gajjar (Founder & CEO), Hiren Raval, Shweta Malaviya
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 font-black text-xs rounded-xl transition-all cursor-pointer bg-orange-500/15 hover:bg-orange-600 text-orange-700 dark:text-orange-300 hover:text-white border border-orange-500/40 hover:border-orange-600 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateCertificates}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Generate Certificates</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE VIEW OF ISSUED CERTIFICATES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-black' : 'text-neutral-100'}`}>
            <span>Issued Certificates Roster</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
              isLight ? 'bg-orange-100 text-orange-900 border border-orange-300' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {filteredCertificates.length}
            </span>
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search issued certificates..."
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-colors ${
                isLight ? 'bg-white border-neutral-300 text-black placeholder-neutral-500 shadow-xs' : 'bg-neutral-900 border-neutral-800 text-neutral-200 placeholder-neutral-500'
              }`}
            />
          </div>
        </div>

        {/* Desktop Table View of Issued Certificates */}
        <div className={`hidden md:block border rounded-xl overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-neutral-200/90 text-neutral-800' : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className={`text-xs uppercase tracking-wider font-black border-b ${
                isLight ? 'bg-orange-50/70 text-black border-neutral-200' : 'bg-neutral-900/90 text-neutral-200 font-bold border-neutral-800'
              }`}>
                <tr>
                  <th className="py-4 px-4 font-black">Cert ID & Code</th>
                  <th className="py-4 px-4 font-black">Student Name</th>
                  <th className="py-4 px-4 font-black">Course Curriculum</th>
                  <th className="py-4 px-4 font-black">Issue Date</th>
                  <th className="py-4 px-4 text-center font-black">QR Verify Link</th>
                  <th className="py-4 px-4 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/80'}`}>
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <Award className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                      <p className="text-sm font-bold">No certificates generated yet. Use the Wizard above to create batch certificates.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map(cert => (
                    <tr key={cert.id} className="transition-colors hover:bg-orange-50/40 dark:hover:bg-neutral-850/60">
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="font-black text-orange-600 dark:text-orange-400">{cert.id}</span>
                        <div className={`text-[10px] font-mono font-semibold ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {cert.verificationCode}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-sm text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors">
                        {cert.studentName}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className={`text-xs font-black ${isLight ? 'text-black' : 'text-neutral-200'}`}>
                          {cert.courseName}
                        </div>
                        <div className={`text-[10px] font-mono font-bold mt-0.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          {cert.startDate} to {cert.endDate}
                        </div>
                      </td>

                      <td className={`py-3.5 px-4 font-mono text-xs font-semibold ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
                        {cert.issueDate}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={`https://cortexxai-app.vercel.app/?verify=${cert.verificationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                            isLight
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Open public verification gateway"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Verify Link</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Action */}
                          <button
                            onClick={() => handleOpenPreview(cert)}
                            title="Preview Certificate"
                            className="p-1.5 text-orange-600 dark:text-orange-400 hover:text-white bg-orange-500/15 hover:bg-orange-600 border border-orange-500/40 hover:border-orange-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-4 h-4 stroke-[2.2]" />
                          </button>

                          {/* PDF Export Action Button */}
                          <button
                            onClick={() => handleDownloadDirectPdf(cert)}
                            disabled={downloadingCertId === cert.id}
                            title="Download PDF Certificate"
                            className="p-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            {downloadingCertId === cert.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete / Revoke Action */}
                          <button
                            onClick={() => {
                              deleteCertificate(cert.id);
                              setCertificates(getCertificates());
                              setNotification(`Deleted certificate ${cert.id}`);
                              setTimeout(() => setNotification(null), 3000);
                            }}
                            title="Revoke / Delete Certificate"
                            className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Issued Certificates Cards (Vertical Layout for Phone Screens) */}
        <div className="md:hidden space-y-3">
          {filteredCertificates.length === 0 ? (
            <div className={`border rounded-2xl p-8 text-center text-neutral-500 ${
              isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-900/60 border-neutral-800'
            }`}>
              <Award className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
              <p className="text-sm font-bold">No certificates generated yet. Use the Wizard above to create batch certificates.</p>
            </div>
          ) : (
            filteredCertificates.map(cert => (
              <div
                key={cert.id}
                className={`border rounded-xl p-4 space-y-3 transition-colors ${
                  isLight ? 'bg-white border-2 border-neutral-200 shadow-sm' : 'bg-neutral-900/90 border border-neutral-800'
                }`}
              >
                {/* Vertical Header: Cert ID & Date */}
                <div className={`flex items-start justify-between gap-2 border-b pb-2 ${
                  isLight ? 'border-neutral-200' : 'border-neutral-800'
                }`}>
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs font-black text-orange-600 dark:text-orange-400">{cert.id}</div>
                    <div className={`text-[11px] font-mono font-semibold ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      Code: {cert.verificationCode}
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-1 rounded border shrink-0 font-bold ${
                    isLight ? 'bg-neutral-100 text-black border-neutral-300' : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                  }`}>
                    {cert.issueDate}
                  </span>
                </div>

                {/* Vertical Student Information Block */}
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950/70 border-neutral-800/80'
                }`}>
                  <div className={`text-[10px] uppercase font-black tracking-wider ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Student Recipient
                  </div>
                  <div className="text-base font-black text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors">
                    {cert.studentName}
                  </div>
                  <div className={`text-xs font-mono font-semibold ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    Student ID: {cert.studentId}
                  </div>
                </div>

                {/* Vertical Course Curriculum Block */}
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950/70 border-neutral-800/80'
                }`}>
                  <div className={`text-[10px] uppercase font-black tracking-wider ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Course Curriculum
                  </div>
                  <div className={`text-sm font-black ${isLight ? 'text-black' : 'text-neutral-200'}`}>
                    {cert.courseName}
                  </div>
                  <div className={`text-xs font-mono flex items-center gap-1.5 pt-0.5 font-bold ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>{cert.startDate} to {cert.endDate}</span>
                  </div>
                </div>

                {/* Online QR Verification Link */}
                <div>
                  <a
                    href={`https://cortexxai-app.vercel.app/?verify=${cert.verificationCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Verify Credential Online</span>
                  </a>
                </div>

                {/* Vertical Action Buttons */}
                <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
                  isLight ? 'border-neutral-200' : 'border-neutral-800/80'
                }`}>
                  <button
                    onClick={() => handleOpenPreview(cert)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black text-[#587731] dark:text-[#8CB752] hover:text-[#FAF6EE] bg-[#587731]/15 hover:bg-[#587731] border border-[#587731]/40 hover:border-[#587731] rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    <Eye className="w-4 h-4 stroke-[2.2]" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDirectPdf(cert)}
                    disabled={downloadingCertId === cert.id}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#FAF6EE] bg-[#587731] hover:bg-[#486228] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {downloadingCertId === cert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#FAF6EE]" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      deleteCertificate(cert.id);
                      setCertificates(getCertificates());
                      setNotification(`Deleted certificate ${cert.id}`);
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    className="p-2 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                    title="Revoke / Delete Certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Certificate Preview Modal with Attached Seal & PDF/DOC Downloads */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[96vh] overflow-y-auto shadow-2xl space-y-5 text-neutral-200 p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-100">Certificate Preview & Export</h3>
                  <p className="text-xs text-neutral-400">
                    ID: {previewCert.cert.id} · Verification Code: {previewCert.cert.verificationCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewCert(null)}
                className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Render Element for HTML & PDF generation */}
            <div
              ref={certificateRef}
              className="bg-[#fdfbf7] border-8 border-double border-amber-800 rounded-xl p-6 sm:p-8 text-neutral-900 shadow-2xl relative space-y-4 text-center select-none"
            >
              {/* Top Bar: Left Corner Heading in Dark Black Bold & Right Side QR Code */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 shrink-0 scale-95 origin-left">
                  <CortexxLogo size="sm" showTagline={true} inverted={true} mode="light" showIcon={false} />
                </div>
                <div className="flex flex-col items-center">
                  {previewCert.qrUrl && (
                    <img
                      src={previewCert.qrUrl}
                      alt="Verification QR"
                      className="w-16 h-16 sm:w-18 sm:h-18 border-2 border-amber-700 bg-white p-1 shadow-sm"
                    />
                  )}
                  <span className="text-[8px] font-black text-amber-900 mt-1 uppercase font-sans tracking-wider">
                    Scan to Verify
                  </span>
                </div>
              </div>

              {/* Institute Title: Fixed to CORTEXX AI INSTITUTE (no duplicate INSTITUTE) */}
              <div className="pt-1">
                <div className="text-xl sm:text-2xl font-black tracking-widest text-slate-900 uppercase font-sans">
                  {INSTITUTE_PROFILE.name}
                </div>
                <div className="text-xs font-bold text-amber-800 tracking-[0.2em] uppercase mt-1 font-sans">
                  Where Thinking Meets Technology
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1 pt-1">
                <div className="text-2xl sm:text-4xl font-black tracking-wider text-amber-900 uppercase font-serif">
                  Certificate of Completion
                </div>
                <div className="text-xs sm:text-sm font-semibold tracking-widest text-slate-600 uppercase font-sans">
                  This is proudly presented to
                </div>
              </div>

              {/* Student Name with Generous Clearance */}
              <div className="py-2">
                <span className="text-3xl sm:text-5xl font-bold font-serif text-slate-900 border-b-2 border-amber-700 pb-2.5 px-8 inline-block tracking-tight">
                  {previewCert.student.name}
                </span>
              </div>

              {/* Body */}
              <div className="max-w-2xl mx-auto text-sm sm:text-base text-slate-700 leading-relaxed font-serif">
                has successfully completed the professional curriculum for the
                <div className="text-xl sm:text-2xl font-black text-orange-700 my-1.5">
                  {previewCert.cert.courseName}
                </div>
                <div className="text-xs font-mono font-bold text-slate-500 mb-2">
                  Duration: {previewCert.cert.startDate} to {previewCert.cert.endDate}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  at {INSTITUTE_PROFILE.name}, demonstrating exceptional understanding of core concepts, practical skills, and successful project application in Artificial Intelligence & Technology.
                </p>
              </div>

              {/* Footer: Date LHS, 3 Signatories, and Centered Attached Official Seal */}
              <div className="grid grid-cols-2 sm:grid-cols-5 items-end pt-5 mt-4 border-t border-amber-900/20 text-xs font-sans gap-3">
                {/* Date & Cert ID */}
                <div className="text-left">
                  <div className="font-mono font-black text-neutral-950 mb-2 text-sm">{previewCert.cert.issueDate}</div>
                  <div className="border-t-2 border-neutral-900 pt-1.5 font-black text-neutral-950 text-xs uppercase tracking-wider">
                    Date of Issue
                  </div>
                  <div className="text-[11px] text-neutral-950 font-mono font-bold mt-1">ID: {previewCert.cert.id}</div>
                </div>

                {/* 1st Signatory: Keval Gajjar */}
                <div className="text-center">
                  <div className="font-['Brush_Script_MT',cursive] text-lg sm:text-xl text-neutral-950 font-bold mb-2">
                    Keval Gajjar
                  </div>
                  <div className="border-t-2 border-neutral-900 pt-1.5 font-extrabold text-neutral-950">Keval Gajjar</div>
                  <div className="text-[10px] text-neutral-800 font-semibold mt-0.5">Founder & CEO</div>
                </div>

                {/* Centered Attached Official Seal Stamp */}
                <div className="flex justify-center items-center">
                  <CortexxOfficialSeal size={96} className="w-22 h-22 sm:w-24 sm:h-24 drop-shadow-md mx-auto" />
                </div>

                {/* 2nd Signatory: Hiren Raval */}
                <div className="text-center">
                  <div className="font-['Brush_Script_MT',cursive] text-lg sm:text-xl text-neutral-950 font-bold mb-2">
                    Hiren Raval
                  </div>
                  <div className="border-t-2 border-neutral-900 pt-1.5 font-extrabold text-neutral-950">Hiren Raval</div>
                  <div className="text-[10px] text-neutral-800 font-semibold mt-0.5">Head of AI Engineering</div>
                </div>

                {/* 3rd Signatory: Shweta Malaviya */}
                <div className="text-center">
                  <div className="font-['Brush_Script_MT',cursive] text-lg sm:text-xl text-neutral-950 font-bold mb-2">
                    Shweta Malaviya
                  </div>
                  <div className="border-t-2 border-neutral-900 pt-1.5 font-extrabold text-neutral-950">Shweta Malaviya</div>
                  <div className="text-[10px] text-neutral-800 font-semibold mt-0.5">Academic Director</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
              <button
                onClick={() => setPreviewCert(null)}
                className="px-4 py-2 text-xs font-black text-orange-400 hover:text-white bg-orange-500/15 hover:bg-orange-600 border border-orange-500/35 hover:border-orange-600 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Close Preview</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDownloadPreviewPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 rounded-xl text-xs font-black shadow-lg transition-colors cursor-pointer"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-neutral-950" />
                      <span>Download PDF Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
