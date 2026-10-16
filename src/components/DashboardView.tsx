import React from 'react';
import { Student, Course, Invoice, PaymentReceipt } from '../types';
import { Users, BookOpen, CheckCircle, Clock, Plus, Receipt, Sparkles, ArrowRight, IndianRupee } from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  courses: Course[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  onOpenAddStudent: () => void;
  onOpenAddCourse: () => void;
  onOpenGenerateInvoice: () => void;
  onNavigateToView: (view: 'students' | 'courses' | 'invoices' | 'ad-studio') => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  courses,
  invoices,
  receipts,
  onOpenAddStudent,
  onOpenAddCourse,
  onOpenGenerateInvoice,
  onNavigateToView,
  onSelectInvoice,
}) => {
  // Financial computations - calculating total received from students and invoices
  const studentTotalPaid = students.reduce((acc, s) => {
    if (s.paymentStatus === 'paid') {
      return acc + (s.totalPaid > 0 ? s.totalPaid : (s.agreedFee || 5000));
    }
    return acc + (s.totalPaid || 0);
  }, 0);
  const invoiceTotalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const totalReceived = Math.max(studentTotalPaid, invoiceTotalPaid);

  const studentTotalPending = students.reduce((acc, s) => {
    if (s.paymentStatus === 'paid') return acc;
    const fee = s.agreedFee || 5000;
    const paid = s.totalPaid || 0;
    return acc + Math.max(0, fee - paid);
  }, 0);
  const invoiceTotalPending = invoices.reduce((acc, inv) => acc + (inv.remainingBalance || 0), 0);
  const totalPending = Math.max(studentTotalPending, invoiceTotalPending);

  const paidCount = students.filter(s => s.paymentStatus === 'paid').length;
  const partialCount = students.filter(s => s.paymentStatus === 'partially_paid').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'unpaid').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome & Tagline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-100">
            Institute Command Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Cortexx AI Institute · <span className="text-orange-400 font-medium">Where Thinking Meets Technology</span>
          </p>
        </div>

        {/* Live Date / Time Stamp */}
        <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 self-start md:self-auto bg-neutral-900/60 px-3 py-1.5 rounded-lg border border-neutral-800">
          <span>Session Active</span>
          <span className="text-neutral-600">·</span>
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Students */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 tracking-wide uppercase">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono tabular-nums text-neutral-100">{students.length}</span>
          </div>
          <div className="mt-3 text-xs text-neutral-400 flex items-center gap-2">
            <span className="text-emerald-400 font-mono font-medium">{paidCount} Paid</span>
            <span className="text-neutral-600">·</span>
            <span className="text-amber-400 font-mono font-medium">{partialCount} Partial</span>
            <span className="text-neutral-600">·</span>
            <span className="text-rose-400 font-mono font-medium">{unpaidCount} Unpaid</span>
          </div>
        </div>

        {/* Metric 2: Active Courses */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 tracking-wide uppercase">Active Courses</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono tabular-nums text-neutral-100">{courses.length}</span>
          </div>
          <div className="mt-3 text-xs text-neutral-400">
            <span>Flagship: 1-Month Practical AI</span>
          </div>
        </div>

        {/* Metric 3: Total Received */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 tracking-wide uppercase">Fees Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              ₹{totalReceived.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 text-xs text-neutral-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{paidCount} Paid Fees</span>
            </div>
            <span className="text-neutral-400 font-mono">{receipts.length} receipts</span>
          </div>
        </div>

        {/* Metric 4: Pending Fees */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 tracking-wide uppercase">Pending Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono tabular-nums text-amber-400">
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 text-xs text-neutral-400 flex items-center justify-between">
            <span className="text-rose-400 font-medium">{unpaidCount} Unpaid Students</span>
            <span className="text-neutral-500 font-mono">₹{studentTotalPending.toLocaleString('en-IN')} due</span>
          </div>
        </div>
      </div>

      {/* 4 Prominent Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={onOpenAddStudent}
          className="flex items-center justify-between p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-950/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold leading-tight">Add Student</div>
              <div className="text-xs text-orange-100 font-normal mt-0.5">Quick registration</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onOpenAddCourse}
          className="flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-800 rounded-xl font-semibold transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <BookOpen className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold leading-tight">Add Course</div>
              <div className="text-xs text-neutral-400 font-normal mt-0.5">Catalog curriculum</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onOpenGenerateInvoice}
          className="flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-800 rounded-xl font-semibold transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold leading-tight">Generate Invoice</div>
              <div className="text-xs text-neutral-400 font-normal mt-0.5">PDF & WhatsApp</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateToView('ad-studio')}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-900 to-orange-950/40 hover:to-orange-950/60 text-neutral-100 border border-orange-500/30 rounded-xl font-semibold transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold leading-tight">Banner Studio</div>
              <div className="text-xs text-neutral-400 font-normal mt-0.5">IAB & Social Ads</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Two Column Grid: Recent Invoices & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Column 1: Recent Invoices */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-neutral-100">Recent Invoices</h2>
              <p className="text-xs text-neutral-400">Latest student billing and fee statuses</p>
            </div>
            <button
              onClick={() => onNavigateToView('invoices')}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-800/80 mt-2">
            {invoices.slice(0, 5).map(inv => (
              <div
                key={inv.invoiceNumber}
                onClick={() => onSelectInvoice(inv)}
                className="py-3 flex items-center justify-between hover:bg-neutral-800/40 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-200">{inv.studentName}</span>
                    <span className="text-xs font-mono text-neutral-500">{inv.invoiceNumber}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    <span>{inv.courseName}</span>
                    <span className="mx-1.5 text-neutral-600">·</span>
                    <span className="font-mono">{inv.invoiceDate}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-neutral-100">
                    ₹{inv.totalPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-0.5">
                    {inv.paymentStatus === 'paid' && (
                      <span className="text-[11px] font-semibold text-emerald-400 font-mono">Paid</span>
                    )}
                    {inv.paymentStatus === 'partially_paid' && (
                      <span className="text-[11px] font-semibold text-amber-400 font-mono">
                        Due: ₹{inv.remainingBalance.toLocaleString('en-IN')}
                      </span>
                    )}
                    {inv.paymentStatus === 'unpaid' && (
                      <span className="text-[11px] font-semibold text-rose-400 font-mono">Unpaid</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Recent Admissions & Student Roster */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-neutral-100">Recent Admissions</h2>
              <p className="text-xs text-neutral-400">Newly registered students and active courses</p>
            </div>
            <button
              onClick={() => onNavigateToView('students')}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-800/80 mt-2">
            {students.slice(0, 5).map(stu => (
              <div
                key={stu.id}
                onClick={() => onNavigateToView('students')}
                className="py-3 flex items-center justify-between hover:bg-neutral-800/40 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-200">{stu.name}</span>
                    <span className="text-xs font-mono text-neutral-500">{stu.id}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    <span>{stu.enrolledCourseName}</span>
                    <span className="mx-1.5 text-neutral-600">·</span>
                    <span className="font-mono">+91 {stu.phone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-neutral-400">
                    Paid: <span className="font-bold text-neutral-200">₹{stu.totalPaid.toLocaleString('en-IN')}</span> / ₹{stu.agreedFee.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] mt-0.5 font-medium">
                    {stu.paymentStatus === 'paid' && <span className="text-emerald-400">Full</span>}
                    {stu.paymentStatus === 'partially_paid' && <span className="text-amber-400">Partial</span>}
                    {stu.paymentStatus === 'unpaid' && <span className="text-rose-400">Pending</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
