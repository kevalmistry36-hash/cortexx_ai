import React, { useState } from 'react';
import { Invoice, PaymentReceipt, Student, Course, PaymentMethod, PaymentStatus } from '../types';
import { getNextInvoiceNumber, saveInvoice, recordPayment, deleteInvoice, deleteReceipt, getDeactivatedStudents, isStudentDeactivated, toggleStudentDeactivated } from '../services/storage';
import { Search, Plus, Receipt, IndianRupee, Download, Share2, Printer, CheckCircle, Clock, AlertCircle, Mail, Check, Trash2, Eye, FileText, X, UserX, UserCheck, Ban, Phone, BookOpen, Calendar } from 'lucide-react';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { downloadInvoiceAsPdf, downloadReceiptAsPdf } from '../utils/pdfExport';
import { sendInvoiceEmail as dispatchInvoiceEmailSmtp, sendReceiptEmail as dispatchReceiptEmailSmtp, getSmtpConfig } from '../services/emailService';

interface InvoicesViewProps {
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  students: Student[];
  courses: Course[];
  preSelectedStudent?: Student | null;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onOpenReceiptModal: (receipt: PaymentReceipt) => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  theme?: 'light' | 'dark';
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  receipts,
  students,
  courses,
  preSelectedStudent = null,
  onOpenInvoiceModal,
  onOpenReceiptModal,
  isCreateModalOpen = false,
  onCloseCreateModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [studentActiveFilter, setStudentActiveFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [deactivatedStudents, setDeactivatedStudents] = useState<string[]>(() => getDeactivatedStudents());
  const [deactivateAlert, setDeactivateAlert] = useState<{ message: string; type: 'deactivated' | 'reactivated'; studentName: string; studentId: string } | null>(null);

  React.useEffect(() => {
    const syncDeactivated = () => {
      setDeactivatedStudents(getDeactivatedStudents());
    };
    window.addEventListener('cortexx-db-change', syncDeactivated);
    return () => window.removeEventListener('cortexx-db-change', syncDeactivated);
  }, []);

  const checkIsStudentDeactivated = (studentId?: string, studentName?: string): boolean => {
    if (!studentId && !studentName) return false;
    if (studentId && deactivatedStudents.includes(studentId)) return true;
    if (studentName && deactivatedStudents.includes(studentName.trim().toLowerCase())) return true;
    return isStudentDeactivated(studentId, studentName);
  };

  const handleToggleStudentDeactivation = (studentId: string, studentName: string) => {
    const isNowDeactivated = toggleStudentDeactivated(studentId, studentName);
    setDeactivatedStudents(getDeactivatedStudents());
    if (isNowDeactivated) {
      setDeactivateAlert({
        message: `Student "${studentName}" is now in Deactive mode.`,
        type: 'deactivated',
        studentName,
        studentId,
      });
    } else {
      setDeactivateAlert({
        message: `Student "${studentName}" has been reactivated.`,
        type: 'reactivated',
        studentName,
        studentId,
      });
    }
    setTimeout(() => setDeactivateAlert(null), 5000);
  };

  // Generate Invoice Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(isCreateModalOpen);
  const [selectedStudentId, setSelectedStudentId] = useState(preSelectedStudent?.id || students[0]?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState(preSelectedStudent?.enrolledCourseId || courses[0]?.id || '');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  React.useEffect(() => {
    if (isCreateModalOpen) {
      openGenerateModal();
    }
  }, [isCreateModalOpen]);

  React.useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudentId(preSelectedStudent.id);
      setSelectedCourseId(preSelectedStudent.enrolledCourseId);
      setAmountPaidNow(preSelectedStudent.totalPaid);
      openGenerateModal();
    }
  }, [preSelectedStudent]);

  const openGenerateModal = () => {
    const student = students.find(s => s.id === selectedStudentId) || students[0];
    const course = courses.find(c => c.id === (student?.enrolledCourseId || selectedCourseId)) || courses[0];
    if (student) {
      setSelectedStudentId(student.id);
      setSelectedCourseId(student.enrolledCourseId);
      setAmountPaidNow(student.totalPaid);
    }
    setDiscountAmount(0);
    setPaymentMethod('UPI');
    setInvoiceNotes('1-Month Practical AI Course Enrollment Tuition');
    setFormError('');
    setShowGenerateModal(true);
  };

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  // Calculations for Invoice Creation
  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const baseFee = currentCourse?.fee || 6000;
  const netPayable = Math.max(0, baseFee - (Number(discountAmount) || 0));
  const calcRemainingBalance = Math.max(0, netPayable - (Number(amountPaidNow) || 0));

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentStudent) {
      setFormError('Please select a student.');
      return;
    }

    const paid = Number(amountPaidNow) || 0;
    if (paid > netPayable) {
      setFormError('Amount paid cannot exceed total payable amount.');
      return;
    }

    let status: PaymentStatus = 'unpaid';
    if (calcRemainingBalance === 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partially_paid';
    }

    const newInvoice: Invoice = {
      invoiceNumber: getNextInvoiceNumber(),
      invoiceDate: new Date().toISOString().split('T')[0],
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentPhone: currentStudent.phone,
      studentEmail: currentStudent.email,
      enrollmentId: currentStudent.enrollmentId,
      courseName: currentCourse.name,
      courseDuration: currentCourse.duration,
      courseFee: baseFee,
      discount: Number(discountAmount) || 0,
      totalPayable: netPayable,
      amountPaid: paid,
      remainingBalance: calcRemainingBalance,
      paymentMethod,
      paymentStatus: status,
      notes: invoiceNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    saveInvoice(newInvoice);
    handleCloseGenerateModal();
    onOpenInvoiceModal(newInvoice);
  };

  // Payment Recording
  const openRecordPaymentModal = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPayAmount(invoice.remainingBalance);
    setPayMethod('UPI');
    setPayRef(`UPI/${Date.now().toString().slice(-8)}/COR`);
    setPayNotes('Installment cleared');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    if (payAmount <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (payAmount > paymentInvoice.remainingBalance) {
      alert(`Amount exceeds remaining balance of ₹${paymentInvoice.remainingBalance.toLocaleString('en-IN')}`);
      return;
    }

    const { receipt } = recordPayment({
      invoiceNumber: paymentInvoice.invoiceNumber,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      transactionRef: payRef.trim(),
      notes: payNotes.trim(),
    });

    setShowPaymentModal(false);
    onOpenReceiptModal(receipt);
  };

  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<PaymentReceipt | null>(null);

  const handleConfirmDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    const num = invoiceToDelete.invoiceNumber;
    const name = invoiceToDelete.studentName;
    deleteInvoice(num);
    setInvoiceToDelete(null);
    setEmailStatus(`Invoice "${num}" for ${name} deleted successfully.`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleConfirmDeleteReceipt = () => {
    if (!receiptToDelete) return;
    const num = receiptToDelete.receiptNumber;
    const name = receiptToDelete.studentName;
    deleteReceipt(num);
    setReceiptToDelete(null);
    setEmailStatus(`Payment receipt "${num}" for ${name} deleted successfully.`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleDownloadInvoicePdf = (inv: Invoice) => {
    downloadInvoiceAsPdf(inv);
    setEmailStatus(`Downloaded Tax Invoice "${inv.invoiceNumber}" for ${inv.studentName} as PDF!`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleDownloadReceiptPdf = (rec: PaymentReceipt) => {
    downloadReceiptAsPdf(rec);
    setEmailStatus(`Downloaded Payment Receipt "${rec.receiptNumber}" for ${rec.studentName} as PDF!`);
    setTimeout(() => setEmailStatus(null), 5000);
  };


  // Realtime Email Invoice Dispatch via Direct SMTP (or mailto fallback)
  const sendInvoiceEmail = async (inv: Invoice) => {
    const studentEmail = inv.studentEmail || '';
    if (!studentEmail) {
      setEmailStatus(`No email address registered for student ${inv.studentName}.`);
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }

    const smtp = getSmtpConfig();
    if (smtp.pass && smtp.user) {
      setEmailStatus(`Dispatching Tax Invoice ${inv.invoiceNumber} via SMTP...`);
      try {
        const res = await dispatchInvoiceEmailSmtp(inv, studentEmail);
        setEmailStatus(res.message);
        setTimeout(() => setEmailStatus(null), 5000);
      } catch (err: any) {
        setEmailStatus(`SMTP Dispatch Failed: ${err.message}`);
        setTimeout(() => setEmailStatus(null), 5000);
      }
      return;
    }

    // Fallback if SMTP not configured yet
    const statusText = inv.paymentStatus === 'paid' ? 'PAID IN FULL' : inv.paymentStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'PENDING';
    const subject = `Official Tuition Invoice: ${inv.invoiceNumber} - Cortexx AI Institute`;
    const body = `Dear ${inv.studentName},

Greetings from Cortexx AI Institute ("Where Thinking Meets Technology")!

Please find below the official details of your Course Tuition Invoice:

========================================
TAX INVOICE DETAILS
========================================
Invoice Number  : ${inv.invoiceNumber}
Date Issued     : ${inv.invoiceDate}
Student ID      : ${inv.studentId}
Enrollment ID   : ${inv.enrollmentId}

COURSE ENROLLED
Course Title    : ${inv.courseName}
Duration        : ${inv.courseDuration}
Mode            : 100% Online Hands-on

FEE & PAYMENT BREAKDOWN
Standard Fee    : ₹${inv.courseFee.toLocaleString('en-IN')}
Discount Applied: ₹${inv.discount.toLocaleString('en-IN')}
Total Net Fee   : ₹${inv.totalPayable.toLocaleString('en-IN')}
Amount Paid     : ₹${inv.amountPaid.toLocaleString('en-IN')}
Remaining Due   : ₹${inv.remainingBalance.toLocaleString('en-IN')}
Payment Status  : ${statusText}
Payment Method  : ${inv.paymentMethod}
${inv.notes ? `\nRemarks / Notes : ${inv.notes}` : ''}

PAYMENT & SUPPORT
UPI VPA         : ${INSTITUTE_PROFILE.upiId}
Phone           : ${INSTITUTE_PROFILE.phone}
Email           : ${INSTITUTE_PROFILE.email}
Website         : ${INSTITUTE_PROFILE.website}

Thank you for choosing Cortexx AI Institute to advance your artificial intelligence mastery.

Warm regards,
Admissions & Accounts Office
Cortexx AI Institute
"Where Thinking Meets Technology"`;

    const mailtoUrl = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    setEmailStatus(`Mail app opened for ${studentEmail}. Configure SMTP in Settings for automatic direct delivery!`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  // Realtime Email Receipt Dispatch via Direct SMTP
  const sendReceiptEmail = async (rec: PaymentReceipt) => {
    const studentEmail = rec.studentEmail || '';
    if (!studentEmail) {
      setEmailStatus(`No email address registered for student ${rec.studentName}.`);
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }

    const smtp = getSmtpConfig();
    if (smtp.pass && smtp.user) {
      setEmailStatus(`Dispatching Receipt ${rec.receiptNumber} via SMTP...`);
      try {
        const res = await dispatchReceiptEmailSmtp(rec, studentEmail);
        setEmailStatus(res.message);
        setTimeout(() => setEmailStatus(null), 5000);
      } catch (err: any) {
        setEmailStatus(`SMTP Dispatch Failed: ${err.message}`);
        setTimeout(() => setEmailStatus(null), 5000);
      }
      return;
    }

    // Fallback if SMTP not configured yet
    const subject = `Payment Receipt: ${rec.receiptNumber} - Cortexx AI Institute`;
    const body = `Dear ${rec.studentName},

Greetings from Cortexx AI Institute!

We have successfully received your course installment payment:
Receipt Number : ${rec.receiptNumber}
Linked Invoice : ${rec.invoiceNumber}
Amount Received: INR ${rec.amountReceived.toLocaleString('en-IN')}
Payment Date   : ${rec.paymentDate}
Payment Method : ${rec.paymentMethod}
Remaining Due  : INR ${rec.remainingBalanceAfter.toLocaleString('en-IN')}

Official Support: ${INSTITUTE_PROFILE.email} | +91 ${INSTITUTE_PROFILE.phone}

Warm regards,
Accounts Office, Cortexx AI Institute`;

    window.location.href = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setEmailStatus(`Mail app opened for ${studentEmail}. Configure SMTP in Settings for automatic direct delivery!`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  // WhatsApp Share Dispatch
  const shareOnWhatsApp = (inv: Invoice) => {
    const cleanPhone = inv.studentPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const statusText = inv.paymentStatus === 'paid' ? 'PAID IN FULL' : inv.paymentStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'PENDING';

    const message = `Hello *${inv.studentName}*,\n\nGreetings from *Cortexx AI Institute*! ("Where Thinking Meets Technology")\n\nHere are your invoice details:\n📄 *Invoice No:* ${inv.invoiceNumber}\n🎓 *Course:* ${inv.courseName} (${inv.courseDuration})\n💵 *Total Course Fee:* ₹${inv.totalPayable.toLocaleString('en-IN')}\n✅ *Amount Paid:* ₹${inv.amountPaid.toLocaleString('en-IN')}\n⏳ *Remaining Balance:* ₹${inv.remainingBalance.toLocaleString('en-IN')}\n📌 *Payment Status:* ${statusText}\n\nFor any inquiries or course support, reach us at:\n📞 +91 7984691082\n✉️ info.cortexx@gmail.com\n\nThank you for choosing Cortexx AI!`;

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Counts for Student status
  const deactivatedInvoicesCount = invoices.filter(inv => checkIsStudentDeactivated(inv.studentId, inv.studentName)).length;
  const activeInvoicesCount = invoices.length - deactivatedInvoicesCount;
  const deactivatedReceiptsCount = receipts.filter(rec => checkIsStudentDeactivated(rec.studentId, rec.studentName)).length;
  const activeReceiptsCount = receipts.length - deactivatedReceiptsCount;

  // Filtered lists
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentPhone.includes(searchQuery) ||
      inv.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
    const isDeact = checkIsStudentDeactivated(inv.studentId, inv.studentName);
    const matchesActiveStatus =
      studentActiveFilter === 'all' ||
      (studentActiveFilter === 'active' && !isDeact) ||
      (studentActiveFilter === 'deactivated' && isDeact);

    return matchesSearch && matchesStatus && matchesActiveStatus;
  });

  const filteredReceipts = receipts.filter(rec => {
    const matchesSearch =
      rec.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    const isDeact = checkIsStudentDeactivated(rec.studentId, rec.studentName);
    const matchesActiveStatus =
      studentActiveFilter === 'all' ||
      (studentActiveFilter === 'active' && !isDeact) ||
      (studentActiveFilter === 'deactivated' && isDeact);

    return matchesSearch && matchesActiveStatus;
  });

  // Financial computations
  const totalBilled = invoices.reduce((sum, i) => sum + (i.totalPayable || 0), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
  const paidInvoicesCount = invoices.filter(i => i.paymentStatus === 'paid').length;
  const pendingInvoicesCount = invoices.filter(i => i.paymentStatus !== 'paid').length;

  // Shared card classes - identical appearance to Dashboard
  const kpiCardClass = isLight
    ? 'dashboard-kpi-card bg-white border-2 border-neutral-200 border-t-4 border-t-orange-500 shadow-md hover:border-orange-500 text-black rounded-xl p-5 transition-all relative overflow-hidden'
    : 'dashboard-kpi-card bg-neutral-900/80 border border-neutral-800 border-t-4 border-t-orange-500 hover:border-neutral-700 text-neutral-100 rounded-xl p-5 transition-all relative overflow-hidden';

  const kpiTitleClass = isLight
    ? 'text-xs font-black tracking-wider uppercase text-black font-sans'
    : 'text-xs font-bold tracking-wider uppercase text-neutral-200 font-sans';

  const kpiNumberClass = isLight
    ? 'text-3xl sm:text-4xl font-black font-sans tabular-nums text-black tracking-tight'
    : 'text-3xl sm:text-4xl font-black font-sans tabular-nums text-white tracking-tight';

  const kpiSubtextClass = isLight
    ? 'mt-3 text-xs text-black font-extrabold font-sans'
    : 'mt-3 text-xs text-neutral-300 font-semibold font-sans';

  const kpiBadgeClass =
    'kpi-orange-badge text-[11px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-sans';

  const kpiIconBoxClass =
    'w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm shrink-0';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header - Matches Dashboard Command Center */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b ${isLight ? 'border-neutral-300' : 'border-neutral-800/80'}`}>
        <div>
          <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>
            Invoices & Payment Receipts
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-black font-semibold' : 'text-neutral-400'}`}>
            Cortexx AI Institute · <span className="text-orange-500 font-bold">Billing Ledgers, PDF Documents & WhatsApp Receipts</span>
          </p>
        </div>

        <button
          onClick={openGenerateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition-colors shrink-0 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Realtime Email Feedback Alert */}
      {emailStatus && (
        <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-400 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-medium">{emailStatus}</span>
          </div>
          <button
            onClick={() => setEmailStatus(null)}
            className="text-sky-400 hover:text-sky-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Realtime Student Deactivation / Reactivation Feedback Alert */}
      {deactivateAlert && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-3 animate-fadeIn border ${
            deactivateAlert.type === 'deactivated'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {deactivateAlert.type === 'deactivated' ? (
              <UserX className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{deactivateAlert.message}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleStudentDeactivation(deactivateAlert.studentId, deactivateAlert.studentName)}
              className="underline hover:opacity-80 text-xs font-bold cursor-pointer"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setDeactivateAlert(null)}
              className="text-xs font-bold px-1.5 py-0.5 rounded hover:bg-neutral-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Invoice Section 5 KPI Cards - Identical Appearance to Dashboard Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Invoices */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Invoices">🧾</span>
              <span className={kpiTitleClass}>Total Invoices</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Receipt className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>{invoices.length}</span>
            <span className={kpiBadgeClass}>Ledger</span>
          </div>
          <div className={kpiSubtextClass}>
            <span>Official Billing Records</span>
          </div>
        </div>

        {/* KPI 2: Paid in Full */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Paid In Full">💚</span>
              <span className={kpiTitleClass}>Paid In Full</span>
            </div>
            <div className={kpiIconBoxClass}>
              <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>{paidInvoicesCount}</span>
            <span className={kpiBadgeClass}>100% Cleared</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black' : 'text-emerald-400'}>Zero Pending Balance</span>
          </div>
        </div>

        {/* KPI 3: Pending Fees */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Pending Fees">⏳</span>
              <span className={kpiTitleClass}>Pending Fees</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>{pendingInvoicesCount}</span>
            <span className={kpiBadgeClass}>Due</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black' : 'text-amber-400'}>Installments Outstanding</span>
          </div>
        </div>

        {/* KPI 4: Total Billed */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Billed">💰</span>
              <span className={kpiTitleClass}>Total Billed</span>
            </div>
            <div className={kpiIconBoxClass}>
              <IndianRupee className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>₹{totalBilled.toLocaleString('en-IN')}</span>
            <span className={kpiBadgeClass}>Cumulative</span>
          </div>
          <div className={kpiSubtextClass}>
            <span>All Generated Invoices</span>
          </div>
        </div>

        {/* KPI 5: Collected Fees */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Collected Fees">💳</span>
              <span className={kpiTitleClass}>Collected Fees</span>
            </div>
            <div className={kpiIconBoxClass}>
              <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>₹{totalCollected.toLocaleString('en-IN')}</span>
            <span className={kpiBadgeClass}>Received</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black' : 'text-emerald-400'}>Realized Revenue</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Toggle between Invoices and Receipts */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
            isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-900 border-neutral-800'
          }`}>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                activeTab === 'invoices'
                  ? isLight ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : isLight ? 'text-neutral-600 hover:text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                activeTab === 'receipts'
                  ? isLight ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : isLight ? 'text-neutral-600 hover:text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Payment Receipts ({receipts.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, receipt #, student name, or course..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors border ${
                isLight
                  ? 'bg-white border-neutral-300 text-black font-semibold shadow-sm'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            />
          </div>
        </div>

        {/* Filters Bar: Student Active/Deactive Mode & Payment Status */}
        <div className={`flex items-center justify-between gap-3 flex-wrap p-2.5 rounded-xl border ${
          isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-900/60 border-neutral-800/80'
        }`}>
          {/* Student Active / Deactive Mode Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-bold mr-1 ${isLight ? 'text-black' : 'text-neutral-400'}`}>Student Status:</span>
            <button
              type="button"
              onClick={() => setStudentActiveFilter('all')}
              className={`px-2.5 py-1 text-xs font-black rounded cursor-pointer transition-colors ${
                studentActiveFilter === 'all'
                  ? isLight ? 'bg-neutral-200 text-black font-black' : 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : isLight ? 'text-neutral-600 hover:text-black' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Students
            </button>
            <button
              type="button"
              onClick={() => setStudentActiveFilter('active')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-black rounded cursor-pointer transition-colors ${
                studentActiveFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : isLight ? 'text-neutral-600 hover:text-emerald-700' : 'text-neutral-400 hover:text-emerald-400'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Active</span>
              <span className="text-[10px] opacity-80 font-mono">
                ({activeTab === 'invoices' ? activeInvoicesCount : activeReceiptsCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStudentActiveFilter('deactivated')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-black rounded cursor-pointer transition-colors ${
                studentActiveFilter === 'deactivated'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                  : isLight ? 'text-neutral-600 hover:text-rose-700' : 'text-neutral-400 hover:text-rose-400'
              }`}
              title="Show only students in Deactive Mode"
            >
              <UserX className="w-3.5 h-3.5 text-rose-500" />
              <span>Deactive Mode</span>
              {(activeTab === 'invoices' ? deactivatedInvoicesCount : deactivatedReceiptsCount) > 0 && (
                <span className="text-[10px] bg-rose-500/30 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-mono">
                  {activeTab === 'invoices' ? deactivatedInvoicesCount : deactivatedReceiptsCount}
                </span>
              )}
            </button>
          </div>

          {/* Payment Status Filter (when on Invoices tab) */}
          {activeTab === 'invoices' && (
            <div className={`flex items-center gap-1 p-1 rounded-lg border shrink-0 ${
              isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-900 border-neutral-800'
            }`}>
              <span className={`text-xs font-bold px-1.5 ${isLight ? 'text-black' : 'text-neutral-400'}`}>Fee:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 text-xs font-black rounded ${
                  statusFilter === 'all'
                    ? isLight ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-100'
                    : isLight ? 'text-neutral-600 hover:text-black' : 'text-neutral-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2 py-0.5 text-xs font-black rounded ${
                  statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('partially_paid')}
                className={`px-2 py-0.5 text-xs font-black rounded ${
                  statusFilter === 'partially_paid' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Partial
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-2 py-0.5 text-xs font-black rounded ${
                  statusFilter === 'unpaid' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400' : isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Pending
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      {activeTab === 'invoices' ? (
        <div className={`border rounded-xl overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-neutral-200/90 text-neutral-800' : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
        }`}>
          {/* Desktop Invoices Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className={`text-xs uppercase tracking-wider font-black border-b ${
                isLight ? 'bg-orange-50/70 text-black border-neutral-200' : 'bg-neutral-900/90 text-neutral-200 font-bold border-neutral-800'
              }`}>
                <tr>
                  <th className="py-3.5 px-4 font-black">Invoice #</th>
                  <th className="py-3.5 px-4 font-black">Date</th>
                  <th className="py-3.5 px-4 font-black">Student & Course</th>
                  <th className="py-3.5 px-4 text-right font-black">Payable</th>
                  <th className="py-3.5 px-4 text-right font-black">Paid</th>
                  <th className="py-3.5 px-4 text-right font-black">Balance</th>
                  <th className="py-3.5 px-4 text-right font-black">Status</th>
                  <th className="py-3.5 px-4 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/80'}`}>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      <Receipt className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                      <p className="text-sm font-bold">No invoices found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.invoiceNumber} className="transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-orange-600 dark:text-orange-400 font-black whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      <td className={`py-3.5 px-4 font-mono text-xs font-semibold whitespace-nowrap ${isLight ? 'text-black' : 'text-neutral-400'}`}>
                        {inv.invoiceDate}
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const isDeact = checkIsStudentDeactivated(inv.studentId, inv.studentName);
                          return (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-black text-sm tracking-tight transition-colors ${
                                    isDeact
                                      ? 'line-through text-neutral-400 decoration-rose-500/60 opacity-80'
                                      : isLight ? 'text-black' : 'text-neutral-100'
                                  }`}
                                >
                                  {inv.studentName}
                                </span>

                                {isDeact && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-500 border border-rose-500/30 uppercase tracking-wider">
                                    <UserX className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span>Deactivated</span>
                                  </span>
                                )}

                                {/* Deactive Mode Toggle Icon */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentDeactivation(inv.studentId, inv.studentName)}
                                  title={
                                    isDeact
                                      ? `Student "${inv.studentName}" is in Deactive mode. Click to Reactivate.`
                                      : `Click Deactive icon to put "${inv.studentName}" in Deactive mode.`
                                  }
                                  className={`p-1 rounded-md transition-all cursor-pointer ${
                                    isDeact
                                      ? 'text-rose-500 bg-rose-500/15 hover:bg-emerald-500/20 hover:text-emerald-500 border border-rose-500/30'
                                      : isLight ? 'text-neutral-400 hover:text-rose-500 hover:bg-neutral-100' : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  {isDeact ? (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span className={`font-black ${isLight ? 'text-black' : 'text-neutral-100'}`}>{inv.courseName}</span>
                                <span className={isLight ? 'text-neutral-400' : 'text-neutral-600'}>·</span>
                                <span className={`font-mono font-bold ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>+91 {inv.studentPhone}</span>
                              </div>
                            </>
                          );
                        })()}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-mono text-sm font-black whitespace-nowrap ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                        ₹{inv.totalPayable.toLocaleString('en-IN')}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-mono text-sm font-black whitespace-nowrap ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        ₹{inv.amountPaid.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold whitespace-nowrap">
                        {inv.remainingBalance > 0 ? (
                          <span className={`font-black ${isLight ? 'text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300' : 'text-amber-400'}`}>₹{inv.remainingBalance.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className={`font-semibold ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>₹0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {inv.paymentStatus === 'paid' && (
                          <span className={`px-2 py-0.5 text-xs font-black rounded ${isLight ? 'text-emerald-800 bg-emerald-50 border border-emerald-300' : 'text-emerald-400 bg-emerald-500/10'}`}>
                            Paid
                          </span>
                        )}
                        {inv.paymentStatus === 'partially_paid' && (
                          <span className={`px-2 py-0.5 text-xs font-black rounded ${isLight ? 'text-amber-800 bg-amber-50 border border-amber-300' : 'text-amber-400 bg-amber-500/10'}`}>
                            Partial
                          </span>
                        )}
                        {inv.paymentStatus === 'unpaid' && (
                          <span className={`px-2 py-0.5 text-xs font-black rounded ${isLight ? 'text-rose-800 bg-rose-50 border border-rose-300' : 'text-rose-400 bg-rose-500/10'}`}>
                            Unpaid
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.remainingBalance > 0 && (
                            <button
                              onClick={() => openRecordPaymentModal(inv)}
                              title="Record payment"
                              className="px-2 py-1 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded transition-colors"
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            onClick={() => onOpenInvoiceModal(inv)}
                            title="View / Print A4 Invoice"
                            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadInvoicePdf(inv)}
                            title="Download Invoice as PDF"
                            className="p-1.5 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20 bg-orange-500/10 border border-orange-500/30 rounded-lg transition-colors cursor-pointer group flex items-center gap-1"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold">PDF</span>
                          </button>
                          <button
                            onClick={() => shareOnWhatsApp(inv)}
                            title="Share Invoice on WhatsApp"
                            className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => sendInvoiceEmail(inv)}
                            title={`Email Invoice to ${inv.studentEmail}`}
                            className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            title={`Delete Invoice ${inv.invoiceNumber}`}
                            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors cursor-pointer group"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Invoices Cards List (Vertical Layout) */}
          <div className="md:hidden divide-y divide-neutral-800 bg-neutral-900/40">
            {filteredInvoices.map(inv => (
              <div key={inv.invoiceNumber} className="p-4 space-y-3 hover:bg-neutral-900/60 transition-colors">
                {/* Vertical Header: Invoice #, Date, Status */}
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      {inv.invoiceDate}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                      inv.paymentStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : inv.paymentStatus === 'partially_paid'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {inv.paymentStatus === 'paid' ? '✓ Paid' : inv.paymentStatus === 'partially_paid' ? '⏳ Partial' : '✕ Unpaid'}
                  </span>
                </div>

                {/* Vertical Student & Contact Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-bold text-base ${
                        checkIsStudentDeactivated(inv.studentId, inv.studentName)
                          ? 'line-through text-neutral-500 decoration-rose-500/60 opacity-80'
                          : 'text-neutral-100'
                      }`}
                    >
                      {inv.studentName}
                    </span>
                    {checkIsStudentDeactivated(inv.studentId, inv.studentName) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                        <UserX className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Deactivated</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleStudentDeactivation(inv.studentId, inv.studentName)}
                      title={
                        checkIsStudentDeactivated(inv.studentId, inv.studentName)
                          ? `Reactivate "${inv.studentName}"`
                          : `Put "${inv.studentName}" into Deactive mode`
                      }
                      className={`p-1 rounded cursor-pointer ${
                        checkIsStudentDeactivated(inv.studentId, inv.studentName)
                          ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                          : 'text-neutral-400 hover:text-rose-400'
                      }`}
                    >
                      {checkIsStudentDeactivated(inv.studentId, inv.studentName) ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {inv.studentPhone && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300">
                      <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>+91 {inv.studentPhone}</span>
                    </div>
                  )}
                  {inv.studentEmail && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                      <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span className="truncate max-w-[240px]">{inv.studentEmail}</span>
                    </div>
                  )}
                </div>

                {/* Vertical Course Curriculum */}
                <div className="p-2.5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 space-y-1">
                  <div className="text-xs font-semibold text-neutral-200">{inv.courseName}</div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-orange-400" />
                    <span>{inv.courseDuration || 'Practical AI Course'}</span>
                  </div>
                </div>

                {/* Vertical Financial Details Breakdown */}
                <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-sans">Total Fee Payable:</span>
                    <span className="text-neutral-200 font-bold">₹{inv.totalPayable.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-sans">Total Amount Paid:</span>
                    <span className="font-extrabold text-emerald-400">+₹{inv.amountPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                    <span className="text-neutral-400 font-sans">Total Due / Balance:</span>
                    {inv.remainingBalance > 0 ? (
                      <span className="font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/40">
                        ₹{inv.remainingBalance.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">₹0 ✓ Cleared</span>
                    )}
                  </div>
                </div>

                {/* Vertical Action Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-neutral-800/80 flex-wrap">
                  {inv.remainingBalance > 0 && (
                    <button
                      onClick={() => openRecordPaymentModal(inv)}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg cursor-pointer"
                    >
                      + Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => onOpenInvoiceModal(inv)}
                    className="px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownloadInvoicePdf(inv)}
                    className="px-2.5 py-1.5 text-xs font-bold text-orange-300 hover:text-white bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Download Invoice as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => shareOnWhatsApp(inv)}
                    className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => sendInvoiceEmail(inv)}
                    className="p-1.5 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg cursor-pointer"
                    title="Email Invoice"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setInvoiceToDelete(inv)}
                    className="p-1.5 text-rose-400 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg cursor-pointer"
                    title="Delete Invoice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Receipts Table */
        <div className={`border rounded-xl overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-neutral-200/90 text-neutral-800' : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className={`text-xs uppercase tracking-wider font-black border-b ${
                isLight ? 'bg-orange-50/70 text-black border-neutral-200' : 'bg-neutral-900/90 text-neutral-200 font-bold border-neutral-800'
              }`}>
                <tr>
                  <th className="py-3.5 px-4 font-black">Receipt #</th>
                  <th className="py-3.5 px-4 font-black">Invoice #</th>
                  <th className="py-3.5 px-4 font-black">Date</th>
                  <th className="py-3.5 px-4 font-black">Student</th>
                  <th className="py-3.5 px-4 font-black">Payment Method</th>
                  <th className="py-3.5 px-4 text-right font-black">Amount Received</th>
                  <th className="py-3.5 px-4 text-right font-black">Balance After</th>
                  <th className="py-3.5 px-4 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/80'}`}>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      <Receipt className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                      <p className="text-sm font-bold">No payment receipts logged yet.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(rec => (
                    <tr key={rec.receiptNumber} className="transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-black whitespace-nowrap">
                        {rec.receiptNumber}
                      </td>
                      <td className={`py-3.5 px-4 font-mono text-xs font-bold whitespace-nowrap ${isLight ? 'text-orange-700' : 'text-neutral-400'}`}>
                        {rec.invoiceNumber}
                      </td>
                      <td className={`py-3.5 px-4 font-mono text-xs font-semibold whitespace-nowrap ${isLight ? 'text-black' : 'text-neutral-400'}`}>
                        {rec.paymentDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const isDeact = checkIsStudentDeactivated(rec.studentId, rec.studentName);
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-black text-sm tracking-tight transition-colors ${
                                  isDeact
                                    ? 'line-through text-neutral-400 decoration-rose-500/60 opacity-80'
                                    : isLight ? 'text-black' : 'text-neutral-100'
                                }`}
                              >
                                {rec.studentName}
                              </span>

                              {isDeact && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-500 border border-rose-500/30 uppercase tracking-wider">
                                  <UserX className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>Deactivated</span>
                                </span>
                              )}

                              {/* Deactive Mode Toggle Icon */}
                              <button
                                type="button"
                                onClick={() => handleToggleStudentDeactivation(rec.studentId, rec.studentName)}
                                title={
                                  isDeact
                                    ? `Student "${rec.studentName}" is in Deactive mode. Click to Reactivate.`
                                    : `Click Deactive icon to put "${rec.studentName}" in Deactive mode.`
                                }
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  isDeact
                                    ? 'text-rose-500 bg-rose-500/15 hover:bg-emerald-500/20 hover:text-emerald-500 border border-rose-500/30'
                                    : isLight ? 'text-neutral-400 hover:text-rose-500 hover:bg-neutral-100' : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'
                                }`}
                              >
                                {isDeact ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`py-3.5 px-4 text-xs font-mono font-bold ${isLight ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        {rec.paymentMethod} {rec.transactionRef ? `(${rec.transactionRef})` : ''}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono text-sm font-black whitespace-nowrap ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        ₹{rec.amountReceived.toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono text-xs font-bold whitespace-nowrap ${isLight ? 'text-black' : 'text-neutral-400'}`}>
                        ₹{rec.remainingBalanceAfter.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenReceiptModal(rec)}
                            title="View / Print Receipt"
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isLight ? 'text-neutral-700 hover:text-black hover:bg-neutral-100' : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReceiptPdf(rec)}
                            title="Download Payment Receipt as PDF"
                            className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer group flex items-center gap-1"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black">PDF</span>
                          </button>
                          <button
                            onClick={() => sendReceiptEmail(rec)}
                            title={`Email Receipt to ${rec.studentEmail || rec.studentName}`}
                            className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReceiptToDelete(rec)}
                            title={`Delete Receipt ${rec.receiptNumber}`}
                            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors cursor-pointer group"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Receipts Cards List */}
          <div className="md:hidden divide-y divide-neutral-800 bg-neutral-900/40">
            {filteredReceipts.map(rec => (
              <div key={rec.receiptNumber} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">{rec.receiptNumber}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`font-bold text-base ${
                          checkIsStudentDeactivated(rec.studentId, rec.studentName)
                            ? 'line-through text-neutral-500 decoration-rose-500/60 opacity-80'
                            : 'text-neutral-100'
                        }`}
                      >
                        {rec.studentName}
                      </span>
                      {checkIsStudentDeactivated(rec.studentId, rec.studentName) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                          <UserX className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Deactivated</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleStudentDeactivation(rec.studentId, rec.studentName)}
                        title={
                          checkIsStudentDeactivated(rec.studentId, rec.studentName)
                            ? `Reactivate "${rec.studentName}"`
                            : `Put "${rec.studentName}" into Deactive mode`
                        }
                        className={`p-1 rounded cursor-pointer ${
                          checkIsStudentDeactivated(rec.studentId, rec.studentName)
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                            : 'text-neutral-400 hover:text-rose-400'
                        }`}
                      >
                        {checkIsStudentDeactivated(rec.studentId, rec.studentName) ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-mono text-neutral-400">Invoice: {rec.invoiceNumber}</div>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-400">
                    ₹{rec.amountReceived.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-neutral-300 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                  <div>Date: {rec.paymentDate}</div>
                  <div>Mode: {rec.paymentMethod}</div>
                  <div>Bal: ₹{rec.remainingBalanceAfter.toLocaleString('en-IN')}</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => onOpenReceiptModal(rec)}
                    className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 rounded-lg flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownloadReceiptPdf(rec)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Download Receipt as PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => sendReceiptEmail(rec)}
                    className="px-2 py-1 text-xs font-medium text-sky-300 bg-sky-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Email Receipt to Student"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                  <button
                    onClick={() => setReceiptToDelete(rec)}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-neutral-100">Generate Student Invoice</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Creates formal A4 invoice with live arithmetic</p>
              </div>
              <button onClick={handleCloseGenerateModal} className="text-neutral-400 hover:text-neutral-200 p-1">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={e => {
                    setSelectedStudentId(e.target.value);
                    const stu = students.find(s => s.id === e.target.value);
                    if (stu) {
                      setSelectedCourseId(stu.enrolledCourseId);
                      setAmountPaidNow(stu.totalPaid);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id} · +91 {s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.duration} · ₹{c.fee.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Amount & Amount Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Special Discount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={baseFee}
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Amount Paid Today (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={netPayable}
                    value={amountPaidNow}
                    onChange={e => setAmountPaidNow(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Live Arithmetic Breakdown Summary */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Course Standard Fee:</span>
                  <span>₹{baseFee.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount Applied:</span>
                    <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-200 pt-1 border-t border-neutral-800">
                  <span>Net Payable Amount:</span>
                  <span>₹{netPayable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Payment Recorded:</span>
                  <span>₹{amountPaidNow.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-neutral-800">
                  <span>Remaining Due Balance:</span>
                  <span>₹{calcRemainingBalance.toLocaleString('en-IN')}</span>
                </div>
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
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                        paymentMethod === method
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
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
                  Invoice Notes / Terms
                </label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                  placeholder="Tuition fee for 1-Month Practical AI Course"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleCloseGenerateModal}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Generate & Preview</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Installment Modal */}
      {showPaymentModal && paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-neutral-100">Record Fee Payment</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {paymentInvoice.invoiceNumber} · {paymentInvoice.studentName}
                </p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-neutral-200 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Total Payable:</span>
                  <span>₹{paymentInvoice.totalPayable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Previously Paid:</span>
                  <span>₹{paymentInvoice.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-neutral-800">
                  <span>Current Outstanding Balance:</span>
                  <span>₹{paymentInvoice.remainingBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Payment Amount to Collect (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentInvoice.remainingBalance}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as PaymentMethod[]).map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPayMethod(method)}
                      className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                        payMethod === method
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Transaction / UPI Reference Number
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="e.g. UPI/260314092144/COR"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Issue Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">Delete Tax Invoice</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Are you sure you want to remove this invoice record?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Summary Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Invoice Number:</span>
                <span className="font-bold text-orange-400">{invoiceToDelete.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Student Name:</span>
                <span className="font-bold text-neutral-100">{invoiceToDelete.studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Course:</span>
                <span className="text-neutral-300 font-medium truncate max-w-[210px]">{invoiceToDelete.courseName}</span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-800 pt-2 font-mono">
                <span className="text-neutral-400">Total Payable:</span>
                <span className="font-bold text-neutral-100">₹{invoiceToDelete.totalPayable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{invoiceToDelete.amountPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInvoice}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Receipt Confirmation Modal */}
      {receiptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">Delete Payment Receipt</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Are you sure you want to remove this payment receipt record?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiptToDelete(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Receipt Number:</span>
                <span className="font-bold text-emerald-400">{receiptToDelete.receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Linked Invoice:</span>
                <span className="text-neutral-300">{receiptToDelete.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Student Name:</span>
                <span className="font-bold text-neutral-100">{receiptToDelete.studentName}</span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-800 pt-2 font-mono">
                <span className="text-neutral-400">Amount Received:</span>
                <span className="font-bold text-emerald-400">₹{receiptToDelete.amountReceived.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setReceiptToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReceipt}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
