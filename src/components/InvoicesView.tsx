import React, { useState } from 'react';
import { Invoice, PaymentReceipt, Student, Course, PaymentMethod, PaymentStatus } from '../types';
import { getNextInvoiceNumber, saveInvoice, recordPayment, deleteInvoice, deleteReceipt, getDeactivatedStudents, isStudentDeactivated, toggleStudentDeactivated } from '../services/storage';
import { Search, Plus, Receipt, IndianRupee, Download, Share2, Printer, CheckCircle, Clock, AlertCircle, Mail, Check, Trash2, Eye, FileText, X, UserX, UserCheck, Ban } from 'lucide-react';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { downloadInvoiceAsDoc, downloadReceiptAsDoc } from '../utils/docExport';
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
}) => {
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

  const handleDownloadInvoiceDoc = (inv: Invoice) => {
    downloadInvoiceAsDoc(inv);
    setEmailStatus(`Downloaded Invoice "${inv.invoiceNumber}" for ${inv.studentName} in Word DOC (.doc) format!`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleDownloadReceiptPdf = (rec: PaymentReceipt) => {
    downloadReceiptAsPdf(rec);
    setEmailStatus(`Downloaded Payment Receipt "${rec.receiptNumber}" for ${rec.studentName} as PDF!`);
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const handleDownloadReceiptDoc = (rec: PaymentReceipt) => {
    downloadReceiptAsDoc(rec);
    setEmailStatus(`Downloaded Receipt "${rec.receiptNumber}" for ${rec.studentName} in Word DOC (.doc) format!`);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-100">Invoices & Payment Receipts</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Vector A4 PDF invoices, partial payment ledgers, student deactive mode, and direct document dispatch
          </p>
        </div>

        <button
          onClick={openGenerateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg shadow-md transition-colors shrink-0"
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

      {/* Tabs & Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Toggle between Invoices and Receipts */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'invoices' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'receipts' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
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
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Filters Bar: Student Active/Deactive Mode & Payment Status */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
          {/* Student Active / Deactive Mode Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-neutral-400 mr-1">Student Status:</span>
            <button
              type="button"
              onClick={() => setStudentActiveFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                studentActiveFilter === 'all'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              All Students
            </button>
            <button
              type="button"
              onClick={() => setStudentActiveFilter('active')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                studentActiveFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800/50'
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
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                studentActiveFilter === 'deactivated'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/50'
              }`}
              title="Show only students in Deactive Mode"
            >
              <UserX className="w-3.5 h-3.5 text-rose-400" />
              <span>Deactive Mode</span>
              {(activeTab === 'invoices' ? deactivatedInvoicesCount : deactivatedReceiptsCount) > 0 && (
                <span className="text-[10px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded-full font-mono">
                  {activeTab === 'invoices' ? deactivatedInvoicesCount : deactivatedReceiptsCount}
                </span>
              )}
            </button>
          </div>

          {/* Payment Status Filter (when on Invoices tab) */}
          {activeTab === 'invoices' && (
            <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg shrink-0">
              <span className="text-xs font-semibold text-neutral-400 px-1.5">Fee:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 text-xs font-medium rounded ${statusFilter === 'all' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2 py-0.5 text-xs font-medium rounded ${statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400'}`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('partially_paid')}
                className={`px-2 py-0.5 text-xs font-medium rounded ${statusFilter === 'partially_paid' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400'}`}
              >
                Partial
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-2 py-0.5 text-xs font-medium rounded ${statusFilter === 'unpaid' ? 'bg-rose-500/20 text-rose-400' : 'text-neutral-400'}`}
              >
                Pending
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      {activeTab === 'invoices' ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-900/90 text-xs uppercase tracking-wider text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Student & Course</th>
                  <th className="py-3.5 px-4 text-right">Payable</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      <Receipt className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                      <p className="text-sm">No invoices found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.invoiceNumber} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-orange-400 font-bold whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400 whitespace-nowrap">
                        {inv.invoiceDate}
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const isDeact = checkIsStudentDeactivated(inv.studentId, inv.studentName);
                          return (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-semibold transition-colors ${
                                    isDeact
                                      ? 'line-through text-neutral-500 decoration-rose-500/60 opacity-80'
                                      : 'text-neutral-100'
                                  }`}
                                >
                                  {inv.studentName}
                                </span>

                                {isDeact && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                                    <UserX className="w-3 h-3 text-rose-400 shrink-0" />
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
                                      ? 'text-rose-400 bg-rose-500/15 hover:bg-emerald-500/20 hover:text-emerald-400 border border-rose-500/30'
                                      : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  {isDeact ? (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>{inv.courseName}</span>
                                <span className="text-neutral-600">·</span>
                                <span className="font-mono">+91 {inv.studentPhone}</span>
                              </div>
                            </>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-neutral-100 whitespace-nowrap">
                        ₹{inv.totalPayable.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs text-emerald-400 font-semibold whitespace-nowrap">
                        ₹{inv.amountPaid.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold whitespace-nowrap">
                        {inv.remainingBalance > 0 ? (
                          <span className="text-amber-400">₹{inv.remainingBalance.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-neutral-500">₹0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {inv.paymentStatus === 'paid' && (
                          <span className="px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded">
                            Paid
                          </span>
                        )}
                        {inv.paymentStatus === 'partially_paid' && (
                          <span className="px-2 py-0.5 text-xs font-semibold text-amber-400 bg-amber-500/10 rounded">
                            Partial
                          </span>
                        )}
                        {inv.paymentStatus === 'unpaid' && (
                          <span className="px-2 py-0.5 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded">
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
                            onClick={() => handleDownloadInvoiceDoc(inv)}
                            title="Download Invoice as Word (.doc)"
                            className="p-1.5 text-blue-400 hover:text-blue-200 hover:bg-blue-500/20 bg-blue-500/10 border border-blue-500/20 rounded-lg transition-colors cursor-pointer group"
                          >
                            <FileText className="w-3.5 h-3.5" />
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

          {/* Mobile Invoices Cards List */}
          <div className="md:hidden divide-y divide-neutral-800 bg-neutral-900/40">
            {filteredInvoices.map(inv => (
              <div key={inv.invoiceNumber} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-orange-400">{inv.invoiceNumber}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                    <div className="text-xs text-neutral-400">{inv.courseName}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                      inv.paymentStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : inv.paymentStatus === 'partially_paid'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {inv.paymentStatus === 'paid' ? 'Paid' : inv.paymentStatus === 'partially_paid' ? 'Partial' : 'Unpaid'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-neutral-300 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                  <div>Date: {inv.invoiceDate}</div>
                  <div>
                    Paid: <strong className="text-emerald-400">₹{inv.amountPaid.toLocaleString('en-IN')}</strong> / ₹{inv.totalPayable.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 flex-wrap">
                  {inv.remainingBalance > 0 && (
                    <button
                      onClick={() => openRecordPaymentModal(inv)}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-lg"
                    >
                      + Pay
                    </button>
                  )}
                  <button
                    onClick={() => onOpenInvoiceModal(inv)}
                    className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 rounded-lg flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownloadInvoicePdf(inv)}
                    className="px-2.5 py-1 text-xs font-bold text-orange-300 hover:text-white bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Download Invoice as PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadInvoiceDoc(inv)}
                    className="px-2 py-1 text-xs font-medium text-blue-300 bg-blue-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Download Word .doc"
                  >
                    <span>DOC</span>
                  </button>
                  <button
                    onClick={() => shareOnWhatsApp(inv)}
                    className="p-1.5 text-emerald-400 bg-emerald-500/10 rounded-lg"
                    title="WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => sendInvoiceEmail(inv)}
                    className="p-1.5 text-sky-400 bg-sky-500/10 rounded-lg"
                    title="Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setInvoiceToDelete(inv)}
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
      ) : (
        /* Receipts Table */
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-900/90 text-xs uppercase tracking-wider text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount Received</th>
                  <th className="py-3.5 px-4 text-right">Balance After</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      <Receipt className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                      <p className="text-sm">No payment receipts logged yet.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(rec => (
                    <tr key={rec.receiptNumber} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-emerald-400 font-bold whitespace-nowrap">
                        {rec.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400 whitespace-nowrap">
                        {rec.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400 whitespace-nowrap">
                        {rec.paymentDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const isDeact = checkIsStudentDeactivated(rec.studentId, rec.studentName);
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-semibold transition-colors ${
                                  isDeact
                                    ? 'line-through text-neutral-500 decoration-rose-500/60 opacity-80'
                                    : 'text-neutral-100'
                                }`}
                              >
                                {rec.studentName}
                              </span>

                              {isDeact && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                                  <UserX className="w-3 h-3 text-rose-400 shrink-0" />
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
                                    ? 'text-rose-400 bg-rose-500/15 hover:bg-emerald-500/20 hover:text-emerald-400 border border-rose-500/30'
                                    : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'
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
                      <td className="py-3.5 px-4 text-xs font-mono text-neutral-400">
                        {rec.paymentMethod} {rec.transactionRef ? `(${rec.transactionRef})` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-emerald-400 whitespace-nowrap">
                        ₹{rec.amountReceived.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-neutral-400 whitespace-nowrap">
                        ₹{rec.remainingBalanceAfter.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenReceiptModal(rec)}
                            title="View / Print Receipt"
                            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReceiptPdf(rec)}
                            title="Download Payment Receipt as PDF"
                            className="p-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20 bg-emerald-500/10 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer group flex items-center gap-1"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold">PDF</span>
                          </button>
                          <button
                            onClick={() => handleDownloadReceiptDoc(rec)}
                            title="Download Receipt as Word (.doc)"
                            className="p-1.5 text-blue-400 hover:text-blue-200 hover:bg-blue-500/20 bg-blue-500/10 border border-blue-500/20 rounded-lg transition-colors cursor-pointer group"
                          >
                            <FileText className="w-3.5 h-3.5" />
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
                    onClick={() => handleDownloadReceiptDoc(rec)}
                    className="px-2 py-1 text-xs font-medium text-blue-300 bg-blue-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Download Word .doc"
                  >
                    <span>DOC</span>
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
