import React, { useState } from 'react';
import { Student, Course, PaymentStatus, PaymentMethod, Invoice } from '../types';
import { getNextStudentId, getNextEnrollmentId, saveStudent, deleteStudent, updateStudentFeeStatus, getInvoices, getNextInvoiceNumber, saveInvoice } from '../services/storage';
import { Search, Plus, User, Users, Phone, Mail, BookOpen, Trash2, Edit3, Receipt, IndianRupee, ArrowUpDown, FileSpreadsheet, CheckCircle2, RotateCcw, X, AlertTriangle, Download, FileDown, ShieldCheck, Check, Calendar, Clock } from 'lucide-react';
import { BulkStudentImportModal } from './BulkStudentImportModal';
import { downloadInvoiceAsPdf } from '../utils/pdfExport';
import * as XLSX from 'xlsx';

interface StudentsViewProps {
  students: Student[];
  courses: Course[];
  onGenerateInvoiceForStudent: (student: Student) => void;
  onRecordPaymentForStudent: (student: Student) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  theme?: 'light' | 'dark';
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  courses,
  onGenerateInvoiceForStudent,
  onRecordPaymentForStudent,
  isAddModalOpen = false,
  onCloseAddModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [showModal, setShowModal] = useState(isAddModalOpen);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteFinancials, setDeleteFinancials] = useState<boolean>(true);
  const [deleteNotification, setDeleteNotification] = useState<string | null>(null);
  const [lastDeletedStudent, setLastDeletedStudent] = useState<Student | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCourseId, setFormCourseId] = useState(courses[0]?.id || '');
  const [formEnrollmentDate, setFormEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formFeeStatus, setFormFeeStatus] = useState<PaymentStatus>('unpaid');
  const [formAmountPaid, setFormAmountPaid] = useState<number>(0);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('UPI');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Sync external add modal prop
  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const selectedCourse = courses.find(c => c.id === formCourseId) || courses[0];
  const courseFee = selectedCourse?.fee || 6000;

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormCourseId(courses[0]?.id || '');
    setFormEnrollmentDate(new Date().toISOString().split('T')[0]);
    setFormFeeStatus('unpaid');
    setFormAmountPaid(0);
    setFormPaymentMethod('UPI');
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormPhone(student.phone);
    setFormEmail(student.email);
    setFormCourseId(student.enrolledCourseId);
    setFormEnrollmentDate(student.enrollmentDate);
    setFormFeeStatus(student.paymentStatus);
    setFormAmountPaid(student.totalPaid);
    setFormNotes(student.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleFormFeeStatusChange = (newStatus: PaymentStatus) => {
    setFormFeeStatus(newStatus);
    if (newStatus === 'paid') {
      setFormAmountPaid(courseFee);
    } else if (newStatus === 'unpaid') {
      setFormAmountPaid(0);
    }
  };

  const handleFormAmountPaidChange = (amount: number) => {
    setFormAmountPaid(amount);
    if (amount >= courseFee && courseFee > 0) {
      setFormFeeStatus('paid');
    } else if (amount <= 0) {
      setFormFeeStatus('unpaid');
    } else {
      setFormFeeStatus('partially_paid');
    }
  };

  const handleTableFeeStatusChange = (student: Student, newStatus: PaymentStatus) => {
    updateStudentFeeStatus(student.id, newStatus);
    const fee = student.agreedFee || 5000;
    if (newStatus === 'paid') {
      setDeleteNotification(`Fee status for "${student.name}" updated to Paid (₹${fee.toLocaleString('en-IN')}). Dashboard Fees Received updated.`);
    } else if (newStatus === 'unpaid') {
      setDeleteNotification(`Fee status for "${student.name}" marked as Unpaid (₹0). Fees Received updated.`);
    } else {
      setDeleteNotification(`Fee status for "${student.name}" updated to Partial.`);
    }
    setTimeout(() => setDeleteNotification(null), 5000);
  };

  const handleDownloadStudentInvoicePdf = (student: Student) => {
    const allInvoices = getInvoices();
    let inv = allInvoices.find(
      i => i.studentId === student.id || i.enrollmentId === student.enrollmentId || i.studentName.toLowerCase() === student.name.toLowerCase()
    );

    if (!inv) {
      const course = courses.find(c => c.id === student.enrolledCourseId) || courses[0];
      const fee = student.agreedFee || course?.fee || 6000;
      const paid = student.totalPaid || 0;
      const balance = Math.max(0, fee - paid);
      
      inv = {
        invoiceNumber: getNextInvoiceNumber(),
        invoiceDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        studentEmail: student.email,
        enrollmentId: student.enrollmentId,
        courseName: student.enrolledCourseName || course?.name || 'Practical AI Course',
        courseDuration: course?.duration || '1 Month Practical',
        courseFee: fee,
        discount: 0,
        totalPayable: fee,
        amountPaid: paid,
        remainingBalance: balance,
        paymentMethod: student.paymentMethod || 'UPI',
        paymentStatus: student.paymentStatus || 'unpaid',
        notes: 'Official Tax Invoice record for Cortexx AI Student Admission',
        createdAt: new Date().toISOString(),
      };
      saveInvoice(inv);
    }

    downloadInvoiceAsPdf(inv);
    setDeleteNotification(`Downloaded Tax Invoice "${inv.invoiceNumber}" for ${student.name} as PDF!`);
    setTimeout(() => setDeleteNotification(null), 5000);
  };

  const handleExportStudentsExcel = () => {
    if (students.length === 0) {
      setDeleteNotification('No student records to export.');
      setTimeout(() => setDeleteNotification(null), 3000);
      return;
    }
    const rows = students.map((s, index) => {
      const course = courses.find(c => c.id === s.enrolledCourseId);
      const totalFee = s.agreedFee || course?.fee || 6000;
      const paid = s.totalPaid || 0;
      const balance = Math.max(0, totalFee - paid);
      return {
        'S.No': index + 1,
        'Student ID': s.id,
        'Enrollment ID': s.enrollmentId,
        'Full Name': s.name,
        'Phone Number': `+91 ${s.phone}`,
        'Email Address': s.email,
        'Enrolled Course': s.enrolledCourseName,
        'Admission Date': s.enrollmentDate,
        'Fee Status': s.paymentStatus.toUpperCase(),
        'Agreed Total Fee (INR)': totalFee,
        'Amount Paid (INR)': paid,
        'Balance Due (INR)': balance,
        'Payment Method': s.paymentMethod || 'UPI',
        'Notes': s.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `Cortexx_Admissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    setDeleteNotification(`Exported ${students.length} student records to Excel (.xlsx) successfully!`);
    setTimeout(() => setDeleteNotification(null), 4000);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Please enter the student’s full name.');
      return;
    }

    const cleanPhone = formPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const course = courses.find(c => c.id === formCourseId) || courses[0];
    const totalFee = course?.fee || 6000;
    const paid = Number(formAmountPaid) || 0;

    let paymentStatus: PaymentStatus = formFeeStatus;
    if (paid >= totalFee && totalFee > 0) {
      paymentStatus = 'paid';
    } else if (paid === 0) {
      paymentStatus = 'unpaid';
    } else if (paid > 0 && paid < totalFee) {
      paymentStatus = 'partially_paid';
    }

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        name: formName.trim(),
        phone: cleanPhone,
        email: formEmail.trim().toLowerCase(),
        enrolledCourseId: course.id,
        enrolledCourseName: course.name,
        enrollmentDate: formEnrollmentDate,
        agreedFee: totalFee,
        totalPaid: paid,
        paymentStatus,
        notes: formNotes.trim(),
      };
      saveStudent(updated);
      setDeleteNotification(`Student "${updated.name}" updated successfully.`);
    } else {
      const newStudent: Student = {
        id: getNextStudentId(),
        name: formName.trim(),
        phone: cleanPhone,
        email: formEmail.trim().toLowerCase(),
        enrolledCourseId: course.id,
        enrolledCourseName: course.name,
        enrollmentId: getNextEnrollmentId(),
        enrollmentDate: formEnrollmentDate,
        agreedFee: totalFee,
        totalPaid: paid,
        paymentStatus,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      saveStudent(newStudent);
      setDeleteNotification(`Student "${newStudent.name}" admitted successfully! Status: ${paymentStatus === 'paid' ? 'Paid (Fees Received updated)' : 'Unpaid'}.`);
    }
    setTimeout(() => setDeleteNotification(null), 6000);

    handleCloseModal();
  };

  const handleInitiateDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteFinancials(true);
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.name;
    const id = studentToDelete.id;
    setLastDeletedStudent(studentToDelete);
    deleteStudent(studentToDelete.id, deleteFinancials);
    setStudentToDelete(null);
    setDeleteNotification(`Student "${name}" (${id}) removed from admissions.`);
    setTimeout(() => {
      setDeleteNotification(null);
    }, 7000);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedStudent) return;
    saveStudent(lastDeletedStudent);
    setDeleteNotification(`Restored student "${lastDeletedStudent.name}" (${lastDeletedStudent.id}).`);
    setLastDeletedStudent(null);
    setTimeout(() => setDeleteNotification(null), 4000);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrolledCourseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Shared card classes - identical appearance to Dashboard
  const kpiCardClass = isLight
    ? 'dashboard-kpi-card bg-white border-2 border-neutral-200 border-t-4 border-t-orange-500 shadow-md hover:border-orange-500 text-black rounded-xl p-5 transition-all relative overflow-hidden'
    : 'dashboard-kpi-card bg-neutral-900/80 border border-neutral-800 border-t-4 border-t-orange-500 hover:border-neutral-700 text-neutral-100 rounded-xl p-5 transition-all relative overflow-hidden';

  const kpiTitleClass = isLight
    ? 'text-xs font-black tracking-wider uppercase text-black font-sans'
    : 'text-xs font-bold tracking-wider uppercase text-neutral-200 font-sans';

  const kpiNumberClass = isLight
    ? 'text-2xl sm:text-3xl font-black font-sans tabular-nums text-black tracking-tight'
    : 'text-2xl sm:text-3xl font-black font-sans tabular-nums text-white tracking-tight';

  const kpiSubtextClass = isLight
    ? 'mt-2.5 text-xs text-black font-extrabold font-sans'
    : 'mt-2.5 text-xs text-neutral-300 font-semibold font-sans';

  const kpiBadgeClass =
    'kpi-orange-badge text-[11px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-sans shrink-0';

  const kpiIconBoxClass =
    'w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm shrink-0';

  const paidCount = students.filter(s => s.paymentStatus === 'paid').length;
  const partialCount = students.filter(s => s.paymentStatus === 'partially_paid').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'unpaid').length;
  const totalRevenue = students.reduce((sum, s) => sum + (s.totalPaid || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Primary Action - Matches Dashboard Command Center */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b ${isLight ? 'border-neutral-300' : 'border-neutral-800/80'}`}>
        <div>
          <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>
            Student Admissions
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-black font-semibold' : 'text-neutral-400'}`}>
            Cortexx AI Institute · <span className="text-orange-500 font-bold">Registrations, Enrollment IDs & Fee Ledgers</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportStudentsExcel}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 font-bold rounded-xl border shadow-sm transition-colors shrink-0 text-sm cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-orange-50 text-black border-neutral-300 hover:border-orange-400'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80'
            }`}
            title="Export all student records to Excel (.xlsx)"
          >
            <FileDown className="w-4 h-4 text-orange-500" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 font-bold rounded-xl border shadow-sm transition-colors shrink-0 text-sm cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-emerald-50 text-black border-neutral-300 hover:border-emerald-400'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80'
            }`}
            title="Import multiple students from Excel (.xlsx, .xls) or Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition-colors shrink-0 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {importSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{importSuccessMsg}</span>
          </div>
          <button
            onClick={() => setImportSuccessMsg(null)}
            className="text-neutral-400 hover:text-neutral-200 text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Notification with Undo */}
      {deleteNotification && (
        <div className="p-3.5 bg-neutral-900 border border-rose-500/30 rounded-xl text-neutral-200 text-sm flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium text-neutral-200">{deleteNotification}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastDeletedStudent && (
              <button
                onClick={handleUndoDelete}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
            <button
              onClick={() => setDeleteNotification(null)}
              className="text-neutral-400 hover:text-neutral-200 text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 5 KPI Metric Cards - Identical Appearance to Dashboard Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Enrolled */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Enrolled">🎓</span>
              <span className={kpiTitleClass}>Total Enrolled</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{students.length}</span>
            <span className={kpiBadgeClass}>Enrolled</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-neutral-300'}>Active Academic Roster</span>
          </div>
        </div>

        {/* KPI 2: Paid Fees */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Paid Fees">✅</span>
              <span className={kpiTitleClass}>Paid Fees</span>
            </div>
            <div className={kpiIconBoxClass}>
              <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{paidCount}</span>
            <span className={kpiBadgeClass}>100% Cleared</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-emerald-400'}>Full Fees Cleared</span>
          </div>
        </div>

        {/* KPI 3: Partial Payments */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Partial Payments">⏳</span>
              <span className={kpiTitleClass}>Partial Payments</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{partialCount}</span>
            <span className={kpiBadgeClass}>Installments</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-amber-400'}>Installments Active</span>
          </div>
        </div>

        {/* KPI 4: Pending Fees */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Pending Fees">⚠️</span>
              <span className={kpiTitleClass}>Pending Fees</span>
            </div>
            <div className={kpiIconBoxClass}>
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{unpaidCount}</span>
            <span className={kpiBadgeClass}>Pending</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-rose-400'}>Awaiting First Payment</span>
          </div>
        </div>

        {/* KPI 5: Total Collection */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Collection">💰</span>
              <span className={kpiTitleClass}>Total Collection</span>
            </div>
            <div className={kpiIconBoxClass}>
              <IndianRupee className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1.5">
            <span className={`text-2xl sm:text-2xl xl:text-3xl font-black font-sans tabular-nums tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className={kpiBadgeClass}>Collected</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-neutral-300'}>Total Admissions Paid</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, phone (+91), email, or Student ID..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors border ${
              isLight
                ? 'bg-white border-neutral-300 text-black font-semibold shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          />
        </div>

        {/* Status Filter Segmented Control */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
          isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-900 border-neutral-800'
        }`}>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
              statusFilter === 'all'
                ? isLight ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-100 shadow-sm'
                : isLight ? 'text-neutral-600 hover:text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
              statusFilter === 'paid'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black'
                : isLight ? 'text-neutral-600 hover:text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Paid ({paidCount})
          </button>
          <button
            onClick={() => setStatusFilter('partially_paid')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
              statusFilter === 'partially_paid'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black'
                : isLight ? 'text-neutral-600 hover:text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Partial ({partialCount})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
              statusFilter === 'unpaid'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black'
                : isLight ? 'text-neutral-600 hover:text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pending ({unpaidCount})
          </button>
        </div>
      </div>

      {/* Students Data Grid / Table (Desktop Only) - Dashboard Card Style */}
      <div className={`hidden md:block border rounded-xl overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-neutral-200/90 text-neutral-800' : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className={`text-xs uppercase tracking-wider font-black border-b ${
              isLight ? 'bg-orange-50/70 text-black border-neutral-200' : 'bg-neutral-900 text-neutral-200 font-bold border-neutral-700/80'
            }`}>
              <tr>
                <th className="py-4 px-4 font-black">Student & Contact Details</th>
                <th className="py-4 px-4 font-black">Course & Admission Date</th>
                <th className="py-4 px-4 text-center font-black">Fee Status & Mode</th>
                <th className="py-4 px-4 text-right font-black">Fees Payment Details</th>
                <th className="py-4 px-4 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/80'}`}>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    <User className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                    <p className="text-sm font-bold">No students match your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const course = courses.find(c => c.id === student.enrolledCourseId);
                  const totalFee = student.agreedFee || course?.fee || 6000;
                  const paid = student.totalPaid || 0;
                  const balance = Math.max(0, totalFee - paid);
                  const initials = student.name
                    .trim()
                    .split(/\s+/)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'ST';

                  return (
                    <tr key={student.id} className="transition-colors">
                      {/* Column 1: Student & Contact Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center font-bold text-orange-500 text-xs shrink-0 mt-0.5 shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            {/* Line 1: Student Name - Bold Pure Black in light */}
                            <div className={`font-black text-sm tracking-tight truncate ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                              {student.name}
                            </div>
                            {/* Line 2: Phone Number */}
                            <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${isLight ? 'text-black' : 'text-neutral-300'}`}>
                              <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span>+91 {student.phone}</span>
                            </div>
                            {/* Line 3: Mail ID */}
                            <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate max-w-[190px]" title={student.email}>{student.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Course & Admission Date */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {/* Line 1: Course Name - Bold Pure Black in light */}
                          <div className={`font-black text-sm tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                            {student.enrolledCourseName}
                          </div>
                          {/* Line 2: Duration */}
                          <div className={`text-xs flex items-center gap-1.5 font-bold ${isLight ? 'text-black' : 'text-neutral-300'}`}>
                            <BookOpen className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{course?.duration || '1 Month Practical'}</span>
                          </div>
                          {/* Line 3: Duration Date / Admission Date */}
                          <div className={`text-xs font-mono flex items-center gap-1.5 font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{student.enrollmentDate}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Fee Status & Mode */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <select
                            value={student.paymentStatus}
                            onChange={e => handleTableFeeStatusChange(student, e.target.value as PaymentStatus)}
                            aria-label={`Fee Status for ${student.name}`}
                            className={`text-xs font-black px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-all shadow-sm ${
                              student.paymentStatus === 'paid'
                                ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                : student.paymentStatus === 'partially_paid'
                                ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                            }`}
                          >
                            <option value="paid" className="bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Paid
                            </option>
                            <option value="unpaid" className="bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 font-bold">
                              ✕ Unpaid
                            </option>
                            {student.paymentStatus === 'partially_paid' && (
                              <option value="partially_paid" className="bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 font-bold">
                                ⏳ Partial
                              </option>
                            )}
                          </select>
                          <span className={`text-[10px] font-mono uppercase font-black ${isLight ? 'text-black' : 'text-neutral-400'}`}>
                            {student.paymentMethod || 'UPI'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Fees Payment Details */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs">
                        {/* Total Paid with + sign */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`text-[11px] font-sans font-bold ${isLight ? 'text-black' : 'text-neutral-400'}`}>Paid:</span>
                          <span className={`font-black text-sm tracking-tight ${isLight ? 'text-emerald-700 font-mono' : 'text-emerald-400'}`}>
                            +₹{paid.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Total Due with RED colour indicator */}
                        <div className="mt-1 flex items-center justify-end">
                          {balance > 0 ? (
                            <span className="text-xs font-black text-rose-700 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/40 shadow-sm flex items-center gap-1">
                              <span className="text-[10px] uppercase font-sans font-black">Total Due:</span>
                              <span className="font-black">₹{balance.toLocaleString('en-IN')}</span>
                            </span>
                          ) : (
                            <span className={`text-[11px] font-bold flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              <span>Total Due: ₹0</span>
                              <span className="text-[10px] font-black">✓</span>
                            </span>
                          )}
                        </div>

                        {/* Total Fee Reference */}
                        <div className={`text-[10px] mt-0.5 font-bold ${isLight ? 'text-neutral-600' : 'text-neutral-500'}`}>
                          Total: ₹{totalFee.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadStudentInvoicePdf(student)}
                            title={`Download Tax Invoice (PDF) for ${student.name}`}
                            className="p-1.5 text-orange-600 hover:text-white hover:bg-orange-600 bg-orange-500/10 border border-orange-500/30 rounded-lg transition-colors cursor-pointer group flex items-center gap-1"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black">PDF</span>
                          </button>
                          <button
                            onClick={() => onGenerateInvoiceForStudent(student)}
                            title="Generate Invoice in Ledger"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800'
                            }`}
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            title="Edit Student Info"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'text-neutral-700 hover:text-blue-600 hover:bg-blue-50' : 'text-neutral-400 hover:text-blue-400 hover:bg-neutral-800'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInitiateDelete(student)}
                            title={`Delete ${student.name}'s admission record`}
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors cursor-pointer group"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Instant touch actions on phone screens) */}
      <div className="md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className={`border rounded-xl p-8 text-center text-neutral-500 ${
            isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}>
            <User className="w-8 h-8 mx-auto text-neutral-500 mb-2 opacity-50" />
            <p className="text-sm font-bold">No students match your criteria.</p>
          </div>
        ) : (
          filteredStudents.map(student => {
            const course = courses.find(c => c.id === student.enrolledCourseId);
            const totalFee = student.agreedFee || course?.fee || 6000;
            const paid = student.totalPaid || 0;
            const balance = Math.max(0, totalFee - paid);
            const initials = student.name
              .trim()
              .split(/\s+/)
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'ST';

            return (
              <div
                key={student.id}
                className={`border rounded-xl p-4 space-y-3.5 shadow-sm transition-colors ${
                  isLight ? 'bg-white border-2 border-neutral-200 text-black' : 'bg-neutral-900/90 border border-neutral-800 text-neutral-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center font-bold text-orange-500 text-xs shrink-0 mt-0.5">
                      {initials}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      {/* Line 1: Student Name */}
                      <div className={`font-black text-base leading-tight truncate ${isLight ? 'text-black' : 'text-neutral-100'}`}>{student.name}</div>
                      {/* Line 2: Phone Number */}
                      <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${isLight ? 'text-black' : 'text-neutral-300'}`}>
                        <Phone className="w-3 h-3 text-orange-500 shrink-0" />
                        <span>+91 {student.phone}</span>
                      </div>
                      {/* Line 3: Mail ID */}
                      <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[170px]" title={student.email}>{student.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Fee Status Dropdown */}
                  <select
                    value={student.paymentStatus}
                    onChange={e => handleTableFeeStatusChange(student, e.target.value as PaymentStatus)}
                    aria-label={`Fee Status for ${student.name}`}
                    className={`text-xs font-black px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all shrink-0 ${
                      student.paymentStatus === 'paid'
                        ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        : student.paymentStatus === 'partially_paid'
                        ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                    }`}
                  >
                    <option value="paid" className="bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400">✓ Paid</option>
                    <option value="unpaid" className="bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400">✕ Unpaid</option>
                    {student.paymentStatus === 'partially_paid' && (
                      <option value="partially_paid" className="bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400">⏳ Partial</option>
                    )}
                  </select>
                </div>

                {/* Course & Admission Details Block */}
                <div className={`text-xs space-y-2 p-3 rounded-lg border ${
                  isLight ? 'bg-orange-50/50 border-orange-100 text-black' : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300'
                }`}>
                  <div className="space-y-0.5">
                    {/* Line 1: Course Name */}
                    <div className={`font-black text-sm tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>{student.enrolledCourseName}</div>
                    {/* Line 2: Duration */}
                    <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-black' : 'text-neutral-300'}`}>
                      <BookOpen className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>{course?.duration || '1 Month Practical'}</span>
                    </div>
                    {/* Line 3: Duration Date / Admission Date */}
                    <div className={`font-mono flex items-center gap-1.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{student.enrollmentDate}</span>
                    </div>
                  </div>

                  {/* Fees Payment Details Block */}
                  <div className={`pt-2 border-t space-y-1 font-mono ${isLight ? 'border-orange-200' : 'border-neutral-800/80'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-xs font-bold ${isLight ? 'text-black' : 'text-neutral-400'}`}>Total Paid:</span>
                      <span className={`font-black text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>+₹{paid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-xs font-bold ${isLight ? 'text-black' : 'text-neutral-400'}`}>Total Due:</span>
                      {balance > 0 ? (
                        <span className="text-xs font-black text-rose-700 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/40">
                          ₹{balance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className={`text-xs font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>₹0 ✓</span>
                      )}
                    </div>
                    <div className={`text-[10px] text-right font-bold ${isLight ? 'text-neutral-600' : 'text-neutral-500'}`}>
                      Course Fee: ₹{totalFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Mobile Actions: PDF Download, Invoice, Edit, Delete */}
                <div className={`flex items-center justify-end gap-1.5 pt-2 border-t flex-wrap ${isLight ? 'border-neutral-200' : 'border-neutral-800/80'}`}>
                  <button
                    onClick={() => handleDownloadStudentInvoicePdf(student)}
                    className="px-2.5 py-1 text-xs text-orange-600 hover:text-white hover:bg-orange-600 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Invoice (PDF format)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="font-bold">PDF</span>
                  </button>
                  <button
                    onClick={() => onGenerateInvoiceForStudent(student)}
                    className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLight ? 'text-black bg-neutral-100 hover:bg-neutral-200' : 'text-neutral-300 hover:text-emerald-400 bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Invoice</span>
                  </button>
                  <button
                    onClick={() => openEditModal(student)}
                    className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLight ? 'text-black bg-neutral-100 hover:bg-neutral-200' : 'text-neutral-300 hover:text-blue-400 bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleInitiateDelete(student)}
                    className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admission / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-neutral-100">
                  {editingStudent ? 'Edit Student Details' : 'New Student Admission'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {editingStudent ? `Updating ${editingStudent.id}` : 'Auto-generated ID & Enrollment Number'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {!editingStudent && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Enrolling multiple students from a spreadsheet?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    setIsBulkImportOpen(true);
                  }}
                  className="text-orange-400 hover:text-orange-300 font-semibold underline shrink-0 ml-2 cursor-pointer"
                >
                  Bulk Import Excel →
                </button>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Mobile Number (+91) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9825012345"
                      className="w-full pl-12 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Course Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Select Course *
                </label>
                <select
                  value={formCourseId}
                  onChange={e => setFormCourseId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.duration} · ₹{course.fee.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>Duration: {selectedCourse?.duration}</span>
                  <span className="text-orange-400 font-bold">Standard Fee: ₹{courseFee.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Fee Status (Dropbox: Paid / Unpaid) & Amount Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Fee Status (Dropbox) *
                  </label>
                  <select
                    value={formFeeStatus}
                    onChange={e => handleFormFeeStatusChange(e.target.value as PaymentStatus)}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-semibold text-neutral-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="paid" className="bg-neutral-900 text-emerald-400 font-semibold">
                      ✓ Paid (Full Fee: ₹{courseFee.toLocaleString('en-IN')})
                    </option>
                    <option value="unpaid" className="bg-neutral-900 text-rose-400 font-semibold">
                      ✕ Unpaid (₹0 Due)
                    </option>
                    <option value="partially_paid" className="bg-neutral-900 text-amber-400 font-semibold">
                      ⏳ Partially Paid
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={courseFee}
                    value={formAmountPaid}
                    onChange={e => handleFormAmountPaidChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                  <div className="text-[10px] text-neutral-500 mt-1 flex justify-between font-mono">
                    <span>Balance: ₹{Math.max(0, courseFee - formAmountPaid).toLocaleString('en-IN')}</span>
                    <span className={formAmountPaid >= courseFee ? 'text-emerald-400 font-bold' : formAmountPaid === 0 ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                      {formAmountPaid >= courseFee ? 'Full Paid' : formAmountPaid === 0 ? 'Unpaid' : 'Partial'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enrollment Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={formEnrollmentDate}
                  onChange={e => setFormEnrollmentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as PaymentMethod[]).map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setFormPaymentMethod(method)}
                      className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                        formPaymentMethod === method
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Administrative Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Paid first installment via UPI. Batch timings confirmed."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  {editingStudent ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">Delete Student Admission</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Are you sure you want to remove this student?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStudentToDelete(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Preview Card */}
            <div className="bg-neutral-950 border border-neutral-800/90 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Student Name:</span>
                <span className="font-bold text-neutral-100 text-sm">{studentToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Student ID:</span>
                <span className="text-orange-400 font-semibold">{studentToDelete.id}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Contact:</span>
                <span className="text-neutral-300">+91 {studentToDelete.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Course:</span>
                <span className="text-neutral-300 font-medium truncate max-w-[210px]">
                  {studentToDelete.enrolledCourseName}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-800 pt-2 font-mono">
                <span className="text-neutral-400">Fee Status:</span>
                <span className="text-neutral-200">
                  ₹{studentToDelete.totalPaid.toLocaleString('en-IN')} paid of ₹{studentToDelete.agreedFee.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Cascade option */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-300 select-none bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
              <input
                type="checkbox"
                checked={deleteFinancials}
                onChange={e => setDeleteFinancials(e.target.checked)}
                className="mt-0.5 rounded border-neutral-700 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span>Also delete associated Tax Invoice and Payment Receipts for this student</span>
            </label>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Student</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Student Import from Excel / Spreadsheet Modal */}
      <BulkStudentImportModal
        isOpen={isBulkImportOpen}
        courses={courses}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={count => {
          setImportSuccessMsg(
            `Successfully imported ${count} students from Excel! Student IDs, Enrollment Numbers, and Invoices generated.`
          );
          setTimeout(() => setImportSuccessMsg(null), 8000);
        }}
      />
    </div>
  );
};
