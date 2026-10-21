import React from 'react';
import { Student, Course, Invoice, PaymentReceipt } from '../types';
import { Users, BookOpen, CheckCircle, Clock, Plus, Receipt, Sparkles, ArrowRight, IndianRupee, Youtube } from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  courses: Course[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  onOpenAddStudent: () => void;
  onOpenAddCourse: () => void;
  onOpenGenerateInvoice: () => void;
  onNavigateToView: (view: 'students' | 'courses' | 'invoices' | 'ad-studio' | 'youtube') => void;
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

      {/* 4 Primary Metric Cards: Emojis according to block details, orange indicators, uniform typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Students KPI */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Students">🎓</span>
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

        {/* Metric 2: Active Courses KPI */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Active Courses">📚</span>
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

        {/* Metric 3: Fees Received KPI */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Fees Received">💰</span>
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

        {/* Metric 4: Pending Fees KPI */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Pending Balance">⏳</span>
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

      {/* 4 Prominent Action Buttons with High-Contrast Hover States */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={onOpenAddStudent}
          className="flex items-center justify-between p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-950/40 hover:shadow-orange-500/30 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black leading-tight text-white">Add Student</div>
              <div className="text-xs text-orange-100 font-bold mt-0.5">Quick registration</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 opacity-90 group-hover:translate-x-1 transition-transform text-white" />
        </button>

        <button
          onClick={onOpenAddCourse}
          className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all group cursor-pointer border ${
            isLight
              ? 'bg-white hover:bg-orange-100/90 border-neutral-300 hover:border-orange-500 text-black shadow-sm hover:shadow-md'
              : 'bg-neutral-900/90 hover:bg-neutral-850 hover:border-orange-500/50 border-neutral-800 text-neutral-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isLight
                ? 'bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white'
                : 'bg-neutral-800 border border-neutral-700 text-neutral-200 group-hover:bg-orange-500/20 group-hover:text-orange-400'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`text-sm font-black leading-tight transition-colors ${isLight ? 'text-black group-hover:text-black' : 'text-neutral-100 group-hover:text-white'}`}>
                Add Course
              </div>
              <div className={`text-xs font-bold mt-0.5 transition-colors ${isLight ? 'text-neutral-700 group-hover:text-black' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                Catalog curriculum
              </div>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isLight ? 'text-neutral-700 group-hover:text-black' : 'text-neutral-400 group-hover:text-orange-400'}`} />
        </button>

        <button
          onClick={onOpenGenerateInvoice}
          className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all group cursor-pointer border ${
            isLight
              ? 'bg-white hover:bg-emerald-50/90 border-neutral-300 hover:border-emerald-500 text-black shadow-sm hover:shadow-md'
              : 'bg-neutral-900/90 hover:bg-neutral-850 hover:border-emerald-500/50 border-neutral-800 text-neutral-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isLight
                ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white'
                : 'bg-neutral-800 border border-neutral-700 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300'
            }`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`text-sm font-black leading-tight transition-colors ${isLight ? 'text-black group-hover:text-black' : 'text-neutral-100 group-hover:text-white'}`}>
                Generate Invoice
              </div>
              <div className={`text-xs font-bold mt-0.5 transition-colors ${isLight ? 'text-neutral-700 group-hover:text-black' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                PDF &amp; WhatsApp
              </div>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isLight ? 'text-neutral-700 group-hover:text-black' : 'text-neutral-400 group-hover:text-emerald-400'}`} />
        </button>

        <button
          onClick={() => onNavigateToView('youtube')}
          className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all group cursor-pointer border ${
            isLight
              ? 'bg-white hover:bg-red-50/90 border-neutral-300 hover:border-red-500 text-black shadow-sm hover:shadow-md'
              : 'bg-gradient-to-r from-neutral-900 to-red-950/30 hover:to-red-950/60 border-red-500/30 hover:border-red-500/60 text-neutral-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isLight
                ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                : 'bg-red-500/20 border border-red-500/30 text-red-400 group-hover:bg-red-500/30'
            }`}>
              <Youtube className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`text-sm font-black leading-tight transition-colors ${isLight ? 'text-black group-hover:text-black' : 'text-neutral-100 group-hover:text-white'}`}>
                YouTube Videos
              </div>
              <div className={`text-xs font-bold mt-0.5 transition-colors ${isLight ? 'text-neutral-700 group-hover:text-black' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                @CortexxWorld · 13 Videos
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-red-500 group-hover:text-red-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Two Column Grid: Recent Invoices & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Column 1: Recent Invoices */}
        <div className={`${isLight ? 'bg-white border-neutral-200/90 shadow-sm text-neutral-800' : 'bg-neutral-850/80 border-neutral-800 text-neutral-100'} border rounded-xl p-5`}>
          <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base select-none shrink-0" role="img" aria-label="Invoices">🧾</span>
                <h2 className={`text-base font-bold ${isLight ? 'text-black' : 'text-white'}`}>Recent Invoices</h2>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Latest student billing and fee statuses</p>
            </div>
            <button
              onClick={() => onNavigateToView('invoices')}
              className="text-xs text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/80'} mt-2`}>
            {invoices.slice(0, 5).map(inv => (
              <div
                key={inv.invoiceNumber}
                onClick={() => onSelectInvoice(inv)}
                className="py-3 px-2.5 rounded-xl cursor-pointer flex items-center justify-between border border-transparent"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {/* Student Name: Bold and pure black (or white in dark theme) */}
                    <span className={`text-sm font-black ${isLight ? 'text-black' : 'text-white'}`}>
                      {inv.studentName}
                    </span>
                    {/* Invoice Number: High contrast badge */}
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isLight ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-neutral-800 text-neutral-200 border border-neutral-700'}`}>
                      {inv.invoiceNumber}
                    </span>
                  </div>
                  {/* Course Name: Bold and pure black */}
                  <div className="text-xs mt-1 flex items-center gap-1.5">
                    <span className={`font-black ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                      {inv.courseName}
                    </span>
                    <span className={isLight ? 'text-neutral-400 font-bold' : 'text-neutral-600'}>·</span>
                    <span className={`font-mono font-semibold ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>{inv.invoiceDate}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-sm font-black font-mono ${isLight ? 'text-black' : 'text-white'}`}>
                    ₹{inv.totalPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-0.5 font-bold">
                    {inv.paymentStatus === 'paid' && (
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-extrabold ${isLight ? 'text-emerald-800 bg-emerald-50 border border-emerald-300' : 'text-emerald-400 bg-emerald-500/15'}`}>
                        Paid
                      </span>
                    )}
                    {inv.paymentStatus === 'partially_paid' && (
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-extrabold ${isLight ? 'text-amber-800 bg-amber-50 border border-amber-300' : 'text-amber-400 bg-amber-500/15'}`}>
                        Due: ₹{inv.remainingBalance.toLocaleString('en-IN')}
                      </span>
                    )}
                    {inv.paymentStatus === 'unpaid' && (
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-extrabold ${isLight ? 'text-rose-800 bg-rose-50 border border-rose-300' : 'text-rose-400 bg-rose-500/15'}`}>
                        Unpaid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Recent Admissions & Student Roster */}
        <div className={`${isLight ? 'bg-white border-neutral-200/90 shadow-sm text-neutral-800' : 'bg-neutral-850/80 border-neutral-800 text-neutral-100'} border rounded-xl p-5`}>
          <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base select-none shrink-0" role="img" aria-label="Admissions">🎓</span>
                <h2 className={`text-base font-bold ${isLight ? 'text-black' : 'text-white'}`}>Recent Admissions</h2>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Newly registered students and active courses</p>
            </div>
            <button
              onClick={() => onNavigateToView('students')}
              className="text-xs text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/80'} mt-2`}>
            {students.slice(0, 5).map(stu => (
              <div
                key={stu.id}
                onClick={() => onNavigateToView('students')}
                className="py-3 px-2.5 rounded-xl cursor-pointer flex items-center justify-between border border-transparent"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${isLight ? 'text-black' : 'text-white'}`}>
                      {stu.name}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isLight ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-neutral-800 text-neutral-200 border border-neutral-700'}`}>
                      {stu.id}
                    </span>
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1.5">
                    <span className={`font-black ${isLight ? 'text-black' : 'text-neutral-100'}`}>
                      {stu.enrolledCourseName}
                    </span>
                    <span className={isLight ? 'text-neutral-400 font-bold' : 'text-neutral-600'}>·</span>
                    <span className={`font-mono font-semibold ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>+91 {stu.phone}</span>
                  </div>
                </div>

                {/* Recent Admissions: Paid font and full paid amount visibly bold */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono tracking-tight">
                    <span className={`text-xs uppercase tracking-wider font-bold mr-1 ${isLight ? 'text-neutral-700' : 'text-neutral-400'}`}>Paid:</span>
                    <span className={`font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>₹{stu.totalPaid.toLocaleString('en-IN')}</span>
                    <span className={`font-normal mx-1 ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>/</span>
                    <span className={`font-black ${isLight ? 'text-black' : 'text-white'}`}>₹{stu.agreedFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-end font-bold">
                    {stu.paymentStatus === 'paid' && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded font-black ${isLight ? 'text-emerald-800 bg-emerald-50 border border-emerald-300' : 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'}`}>
                        Full Paid
                      </span>
                    )}
                    {stu.paymentStatus === 'partially_paid' && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded font-black ${isLight ? 'text-amber-800 bg-amber-50 border border-amber-300' : 'text-amber-400 bg-amber-500/20 border border-amber-500/40'}`}>
                        Due: ₹{(stu.agreedFee - stu.totalPaid).toLocaleString('en-IN')}
                      </span>
                    )}
                    {stu.paymentStatus === 'unpaid' && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded font-black ${isLight ? 'text-rose-800 bg-rose-50 border border-rose-300' : 'text-rose-400 bg-rose-500/20 border border-rose-500/40'}`}>
                        Pending
                      </span>
                    )}
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
