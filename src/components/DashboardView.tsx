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
  theme?: 'light' | 'dark';
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
  theme = 'dark',
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

  const isLight = theme === 'light';

  // Shared card classes - All indicated with same Orange Colour, font black in white theme
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

  // Uniform orange badge and icon classes across all dashboard KPIs
  const kpiBadgeClass =
    'kpi-orange-badge text-[11px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-sans';

  const kpiIconBoxClass =
    'w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm shrink-0';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome & Tagline */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b ${isLight ? 'border-neutral-300' : 'border-neutral-800/80'}`}>
        <div>
          <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>
            Institute Command Center
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-black font-semibold' : 'text-neutral-400'}`}>
            Cortexx AI Institute · <span className="text-orange-500 font-bold">Where Thinking Meets Technology</span>
          </p>
        </div>

        {/* Live Date / Time Stamp */}
        <div className={`text-xs font-mono flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-lg border ${
          isLight
            ? 'bg-white border-neutral-300 text-black font-bold shadow-sm'
            : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
        }`}>
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span>Session Active</span>
          <span className={isLight ? 'text-black font-bold' : 'text-neutral-600'}>·</span>
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 4 Primary Metric Cards: All indicated with same Orange Colour, font black in white theme, uniform typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Students KPI */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500/50"></span>
              <span className={kpiTitleClass}>Total Students</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>{students.length}</span>
            <span className={kpiBadgeClass}>
              Enrolled
            </span>
          </div>
          <div className={kpiSubtextClass}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono font-black ${isLight ? 'text-black' : 'text-emerald-400'}`}>{paidCount} Paid</span>
              <span className={isLight ? 'text-black font-black' : 'text-neutral-600'}>·</span>
              <span className={`font-mono font-black ${isLight ? 'text-black' : 'text-amber-400'}`}>{partialCount} Partial</span>
              <span className={isLight ? 'text-black font-black' : 'text-neutral-600'}>·</span>
              <span className={`font-mono font-black ${isLight ? 'text-black' : 'text-rose-400'}`}>{unpaidCount} Unpaid</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Courses KPI (Indicated with SAME Orange Colour) */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500/50"></span>
              <span className={kpiTitleClass}>Active Courses</span>
            </div>
            <div className={kpiIconBoxClass}>
              <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>{courses.length}</span>
            <span className={kpiBadgeClass}>
              Live
            </span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-black' : 'text-neutral-300'}>Flagship: 1-Month Practical AI</span>
          </div>
        </div>

        {/* Metric 3: Fees Received KPI (Indicated with SAME Orange Colour) */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500/50"></span>
              <span className={kpiTitleClass}>Fees Received</span>
            </div>
            <div className={kpiIconBoxClass}>
              <IndianRupee className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>
              ₹{totalReceived.toLocaleString('en-IN')}
            </span>
            <span className={kpiBadgeClass}>
              Collected
            </span>
          </div>
          <div className={kpiSubtextClass}>
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1.5 font-black">
                <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className={isLight ? 'text-black' : 'text-neutral-200'}>{paidCount} Paid Fees</span>
              </div>
              <span className={`font-mono font-black ${isLight ? 'text-black' : 'text-neutral-400'}`}>{receipts.length} receipts</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Pending Fees KPI (Indicated with SAME Orange Colour) */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500/50"></span>
              <span className={kpiTitleClass}>Pending Balance</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={kpiNumberClass}>
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
            <span className={kpiBadgeClass}>
              Outstanding
            </span>
          </div>
          <div className={kpiSubtextClass}>
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className={`font-black ${isLight ? 'text-black' : 'text-rose-400'}`}>{unpaidCount} Unpaid Students</span>
              <span className={`font-mono font-black ${isLight ? 'text-black' : 'text-neutral-400'}`}>₹{studentTotalPending.toLocaleString('en-IN')} due</span>
            </div>
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
        <div className={`${isLight ? 'bg-white border-neutral-300 shadow-md text-black' : 'bg-neutral-900/60 border-neutral-800 text-neutral-100'} border rounded-xl p-5`}>
          <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-neutral-300' : 'border-neutral-800'}`}>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-black' : 'text-neutral-100'}`}>Recent Invoices</h2>
              <p className={`text-xs ${isLight ? 'text-neutral-600 font-medium' : 'text-neutral-400'}`}>Latest student billing and fee statuses</p>
            </div>
            <button
              onClick={() => onNavigateToView('invoices')}
              className="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`divide-y ${isLight ? 'divide-neutral-200' : 'divide-neutral-800/80'} mt-2`}>
            {invoices.slice(0, 5).map(inv => (
              <div
                key={inv.invoiceNumber}
                onClick={() => onSelectInvoice(inv)}
                className={`py-3 flex items-center justify-between ${isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800/40'} px-2 rounded-lg cursor-pointer transition-colors`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isLight ? 'text-black' : 'text-neutral-200'}`}>{inv.studentName}</span>
                    <span className={`text-xs font-mono ${isLight ? 'text-neutral-600' : 'text-neutral-500'}`}>{inv.invoiceNumber}</span>
                  </div>
                  <div className={`text-xs ${isLight ? 'text-neutral-600' : 'text-neutral-400'} mt-0.5`}>
                    <span>{inv.courseName}</span>
                    <span className={`mx-1.5 ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>·</span>
                    <span className="font-mono">{inv.invoiceDate}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-black font-mono ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                    ₹{inv.totalPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-0.5">
                    {inv.paymentStatus === 'paid' && (
                      <span className={`text-[11px] font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Paid</span>
                    )}
                    {inv.paymentStatus === 'partially_paid' && (
                      <span className={`text-[11px] font-bold font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                        Due: ₹{inv.remainingBalance.toLocaleString('en-IN')}
                      </span>
                    )}
                    {inv.paymentStatus === 'unpaid' && (
                      <span className={`text-[11px] font-bold font-mono ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>Unpaid</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Recent Admissions & Student Roster */}
        <div className={`${isLight ? 'bg-white border-neutral-300 shadow-md text-black' : 'bg-neutral-900/60 border-neutral-800 text-neutral-100'} border rounded-xl p-5`}>
          <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-neutral-300' : 'border-neutral-800'}`}>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-black' : 'text-neutral-100'}`}>Recent Admissions</h2>
              <p className={`text-xs ${isLight ? 'text-neutral-600 font-medium' : 'text-neutral-400'}`}>Newly registered students and active courses</p>
            </div>
            <button
              onClick={() => onNavigateToView('students')}
              className="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`divide-y ${isLight ? 'divide-neutral-200' : 'divide-neutral-800/80'} mt-2`}>
            {students.slice(0, 5).map(stu => (
              <div
                key={stu.id}
                onClick={() => onNavigateToView('students')}
                className={`py-3 flex items-center justify-between ${isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800/40'} px-2 rounded-lg cursor-pointer transition-colors`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isLight ? 'text-black' : 'text-neutral-200'}`}>{stu.name}</span>
                    <span className={`text-xs font-mono ${isLight ? 'text-neutral-600' : 'text-neutral-500'}`}>{stu.id}</span>
                  </div>
                  <div className={`text-xs ${isLight ? 'text-neutral-600' : 'text-neutral-400'} mt-0.5`}>
                    <span>{stu.enrolledCourseName}</span>
                    <span className={`mx-1.5 ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>·</span>
                    <span className="font-mono">+91 {stu.phone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-mono ${isLight ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    Paid: <span className={`font-bold ${isLight ? 'text-black' : 'text-neutral-200'}`}>₹{stu.totalPaid.toLocaleString('en-IN')}</span> / ₹{stu.agreedFee.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] mt-0.5 font-bold">
                    {stu.paymentStatus === 'paid' && <span className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>Full</span>}
                    {stu.paymentStatus === 'partially_paid' && <span className={isLight ? 'text-amber-700' : 'text-amber-400'}>Partial</span>}
                    {stu.paymentStatus === 'unpaid' && <span className={isLight ? 'text-rose-700' : 'text-rose-400'}>Pending</span>}
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
