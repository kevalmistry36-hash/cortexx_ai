import React, { useState, useEffect, useRef } from 'react';
import { Student, Course, CertificateRecord } from '../types';
import { getCertificates, saveCertificate, deleteCertificate, getNextCertificateNumber } from '../services/storage';
import {
  downloadCertificateAsDoc,
  downloadCertificateAsPdf,
  downloadCertificateDirectlyAsPdf,
  downloadBulkCertificatesAsPdf,
} from '../utils/certificateExport';
import { CortexxLogo } from './CortexxLogo';
import { CortexxOfficialSeal } from './CortexxOfficialSeal';
import QRCode from 'qrcode';
import {
  fetchAndSyncAllCertificatesFromSupabase,
  subscribeToCertificatesRealtime,
  pushAllLocalCertificatesToSupabase,
  syncCertificateToSupabase,
  isSupabaseConfigured,
} from '../services/supabase';
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
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  students,
  courses,
  onOpenVerificationGateway,
}) => {
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

    // Fetch latest from Supabase Realtime DB across all devices
    fetchAndSyncAllCertificatesFromSupabase()
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

  const handleDownloadDoc = async (cert: CertificateRecord) => {
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
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });
    } catch {
      // fallback
    }

    downloadCertificateAsDoc(
      student,
      cert,
      {
        startDate: cert.startDate,
        endDate: cert.endDate,
        courseName: cert.courseName,
        qrDataUrl,
        verificationUrl: verifyUrl,
      },
      INSTITUTE_PROFILE
    );

    setNotification(`Downloaded Word (.doc) Certificate for ${cert.studentName}!`);
    setTimeout(() => setNotification(null), 4000);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Metrics with Bulk PDF Download Button on Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-100 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-400" />
            <span>Course Completion Certificates</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Generate verifiable graduation credentials with QR validation, official institute seal, and instant PDF/DOCX downloads
          </p>
        </div>

        {/* Top Action Buttons: Bulk PDF Download & Counter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {certificates.length > 0 && (
            <button
              onClick={handleBulkPdfDownload}
              disabled={isBulkDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
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

          <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono">
            <span className="text-neutral-400">Issued Certificates: </span>
            <span className="text-amber-400 font-bold text-sm">{certificates.length}</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-neutral-200 text-xs px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* CERTIFICATE WIZARD CONTAINER */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-neutral-100">Certificate Generation Wizard</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`px-2.5 py-1 rounded-lg font-bold ${
                wizardStep === 1 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Step 1: Course & Dates
            </span>
            <span className="text-neutral-600">→</span>
            <span
              className={`px-2.5 py-1 rounded-lg font-bold ${
                wizardStep === 2 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Step 2: Select Students ({selectedStudentIds.length})
            </span>
            <span className="text-neutral-600">→</span>
            <span
              className={`px-2.5 py-1 rounded-lg font-bold ${
                wizardStep === 3 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
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
                <label className="text-xs font-semibold text-neutral-300">Select Curriculum Course</label>
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  aria-label="Select Curriculum Course"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-medium text-neutral-100 focus:outline-none focus:border-amber-500 cursor-pointer"
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
                  <label className="text-xs font-semibold text-amber-400">Custom Course Title</label>
                  <input
                    type="text"
                    value={customCourseName}
                    onChange={e => setCustomCourseName(e.target.value)}
                    placeholder="e.g. Advanced Generative AI & LLM Engineering"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-amber-500/50 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Course Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-neutral-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Course End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-neutral-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
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
              <div className="text-xs text-neutral-300 font-medium">
                Select students to issue certificates for <strong className="text-amber-400">"{activeCourseName}"</strong>:
              </div>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All Students'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-800/80 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
              {students.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">No students available in admission roster.</div>
              ) : (
                students.map(student => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleSelectStudent(student.id)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-neutral-950 font-bold text-xs'
                              : 'border-neutral-700 bg-neutral-900'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-100 text-sm">{student.name}</div>
                          <div className="text-xs font-mono text-neutral-400">
                            {student.id} · {student.enrolledCourseName}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-neutral-400">+91 {student.phone}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
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
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
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
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="text-neutral-400 font-sans font-bold text-sm mb-2">Review Certificate Batch:</div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Course Curriculum:</span>
                <span className="text-amber-400 font-bold text-sm">{activeCourseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Duration Period:</span>
                <span className="text-neutral-200">
                  {startDate} to {endDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Selected Recipients:</span>
                <span className="text-emerald-400 font-bold">{selectedStudentIds.length} Student(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Signatories:</span>
                <span className="text-neutral-300">Keval Gajjar (Founder & CEO), Hiren Raval, Shweta Malaviya</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateCertificates}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-neutral-950 font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Generate Certificates</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE VIEW OF ISSUED CERTIFICATES */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <span>Issued Certificates Roster</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {filteredCertificates.length}
            </span>
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search issued certificates..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300 border-collapse">
              <thead className="bg-neutral-900 text-xs uppercase tracking-wider text-neutral-300 font-bold border-b border-neutral-700/80">
                <tr>
                  <th className="py-4 px-4 font-bold text-neutral-200">Cert ID & Code</th>
                  <th className="py-4 px-4 font-bold text-neutral-200">Student Name</th>
                  <th className="py-4 px-4 font-bold text-neutral-200">Course Curriculum</th>
                  <th className="py-4 px-4 font-bold text-neutral-200">Issue Date</th>
                  <th className="py-4 px-4 text-center font-bold text-neutral-200">QR Verify Link</th>
                  <th className="py-4 px-4 text-right font-bold text-neutral-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <Award className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                      <p className="text-sm">No certificates generated yet. Use the Wizard above to create batch certificates.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map(cert => (
                    <tr key={cert.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="font-bold text-amber-400">{cert.id}</span>
                        <div className="text-[10px] text-neutral-500">{cert.verificationCode}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-neutral-100 text-sm">{cert.studentName}</td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-neutral-200">
                        {cert.courseName}
                        <div className="text-[10px] text-neutral-400 font-mono font-normal">
                          {cert.startDate} to {cert.endDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">{cert.issueDate}</td>

                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={`https://cortexxai-app.vercel.app/?verify=${cert.verificationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono transition-colors"
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
                            className="p-1.5 text-neutral-300 hover:text-amber-400 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* PDF Export Action Button */}
                          <button
                            onClick={() => handleDownloadDirectPdf(cert)}
                            disabled={downloadingCertId === cert.id}
                            title="Download PDF Certificate"
                            className="p-1.5 text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            {downloadingCertId === cert.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                          </button>

                          {/* Word .doc Export Action Button */}
                          <button
                            onClick={() => handleDownloadDoc(cert)}
                            title="Download Word (.doc) Certificate"
                            className="p-1.5 text-blue-400 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
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
                            className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
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
                  <CortexxLogo size="sm" showTagline={true} inverted={true} mode="light" />
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
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleDownloadDoc(previewCert.cert)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Word (.doc)</span>
                </button>

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
