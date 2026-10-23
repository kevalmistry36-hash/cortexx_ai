import React from 'react';
import { Student, Course, Invoice, PaymentReceipt } from '../types';
import { Users, BookOpen, CheckCircle, Clock, Plus, Receipt, Sparkles, ArrowRight, IndianRupee, Layers } from 'lucide-react';
import { getPhaseForStudent } from '../services/storage';

interface DashboardViewProps {
  students: Student[];
  courses: Course[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  onOpenAddStudent: () => void;
  onOpenAddCourse: () => void;
  onOpenGenerateInvoice: () => void;
  onNavigateToView: (view: 'students' | 'courses' | 'invoices' | 'certificates' | 'phase' | 'ad-studio' | 'youtube') => void;
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

  const totalBilled = totalReceived + totalPending;
  const collectionRate = totalBilled > 0 ? Math.min(100, Math.round((totalReceived / totalBilled) * 100)) : 100;

  // Real-time Phase Workflow Counts (Phase 1 Keval, Phase 2 Hiren, Phase 3 Shweta)
  const phaseCounts = students.reduce(
    (acc, s) => {
      const info = getPhaseForStudent(s);
      if (info.phase === 2) acc.phase2++;
      else if (info.phase === 3) acc.phase3++;
      else acc.phase1++;
      return acc;
    },
    { phase1: 0, phase2: 0, phase3: 0 }
  );

  const isLight = theme === 'light';

  // Shared card classes - Olive & Beige Palette (Olive #587731 & Beige #F5EFDF) with proper responsive typography
  const kpiCardClass = isLight
    ? 'dashboard-kpi-card bg-[#FAF6EE] border-2 border-[#E5DCBE] border-t-4 border-t-[#587731] shadow-sm hover:shadow-xl hover:border-[#587731] hover:-translate-y-0.5 text-[#243315] rounded-xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between'
    : 'dashboard-kpi-card bg-[#182214]/90 border border-[#2C3D21] border-t-4 border-t-[#587731] hover:border-[#587731]/70 hover:shadow-xl hover:shadow-[#587731]/10 hover:-translate-y-0.5 text-neutral-100 rounded-xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between';

  const kpiTitleClass = isLight
    ? 'text-[11px] sm:text-xs font-black tracking-wider uppercase text-[#243315] font-sans truncate'
    : 'text-[11px] sm:text-xs font-bold tracking-wider uppercase text-neutral-200 font-sans truncate';

  const kpiNumberClass = isLight
    ? 'text-2xl sm:text-3xl xl:text-4xl font-black font-sans tabular-nums text-[#19240E] tracking-tight'
    : 'text-2xl sm:text-3xl xl:text-4xl font-black font-sans tabular-nums text-white tracking-tight';

  const kpiSubtextClass = isLight
    ? 'mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-[#243315] font-extrabold font-sans'
    : 'mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-neutral-300 font-semibold font-sans';

  // Uniform olive badge and icon classes across all dashboard KPIs
  const kpiBadgeClass =
    'kpi-orange-badge text-[10px] sm:text-[11px] uppercase font-black tracking-wider px-2 sm:px-2.5 py-0.5 rounded-md bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 font-sans shrink-0';

  const kpiIconBoxClass =
    'w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#587731]/15 border border-[#587731]/35 flex items-center justify-center text-[#587731] dark:text-[#8CB752] shadow-sm shrink-0';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome & Tagline */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800/80'}`}>
        <div>
          <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
            Institute Command Center
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'}`}>
            Cortexx AI Institute · <span className="text-[#587731] font-bold">Where Thinking Meets Technology</span>
          </p>
        </div>

        {/* Live Date / Time Stamp */}
        <div className={`text-xs font-mono flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-lg border ${
          isLight
            ? 'bg-[#FAF6EE] border-[#E5DCBE] text-[#243315] font-bold shadow-sm'
            : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
        }`}>
          <span className="w-2 h-2 rounded-full bg-[#587731] animate-pulse"></span>
          <span>Session Active</span>
          <span className={isLight ? 'text-[#243315] font-bold' : 'text-neutral-600'}>·</span>
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 4 Primary Metric Cards: Properly arranged typography, responsive numbers, zero overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Students KPI */}
        <div className={kpiCardClass}>
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-orange-500/10 blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between gap-2 relative z-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Students">🎓</span>
              <span className={kpiTitleClass}>Total Students</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Users className="w-4 h-4 text-[#587731] dark:text-[#8CB752]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1.5 flex-wrap relative z-1">
            <span className={kpiNumberClass}>{students.length}</span>
            <span className={kpiBadgeClass}>
              Enrolled
            </span>
          </div>
          <div className={`${kpiSubtextClass} relative z-1`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{paidCount} Paid</span>
              <span className={isLight ? 'text-[#587731] font-black' : 'text-neutral-600'}>·</span>
              <span className={`font-mono font-black ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{partialCount} Partial</span>
              <span className={isLight ? 'text-[#587731] font-black' : 'text-neutral-600'}>·</span>
              <span className={`font-mono font-black ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{unpaidCount} Unpaid</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Courses KPI */}
        <div className={kpiCardClass}>
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-orange-500/10 blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between gap-2 relative z-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Active Courses">📚</span>
              <span className={kpiTitleClass}>Active Courses</span>
            </div>
            <div className={kpiIconBoxClass}>
              <BookOpen className="w-4 h-4 text-[#587731] dark:text-[#8CB752]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1.5 flex-wrap relative z-1">
            <span className={kpiNumberClass}>{courses.length}</span>
            <span className={kpiBadgeClass}>
              Live
            </span>
          </div>
          <div className={`${kpiSubtextClass} relative z-1`}>
            <span className={isLight ? 'text-[#243315] font-extrabold' : 'text-neutral-300'}>Flagship: 1-Month Practical AI</span>
          </div>
        </div>

        {/* Metric 3: Fees Received KPI */}
        <div className={kpiCardClass}>
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-[#587731]/15 blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between gap-2 relative z-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Fees Received">💰</span>
              <span className={kpiTitleClass}>Fees Received</span>
            </div>
            <div className={kpiIconBoxClass}>
              <IndianRupee className="w-4 h-4 text-[#587731] dark:text-[#8CB752]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1.5 flex-wrap relative z-1">
            <span className={kpiNumberClass}>
              ₹{totalReceived.toLocaleString('en-IN')}
            </span>
            <span className={kpiBadgeClass}>
              Collected
            </span>
          </div>
          <div className={`${kpiSubtextClass} relative z-1`}>
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1.5 font-black">
                <CheckCircle className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                <span className={isLight ? 'text-[#243315]' : 'text-neutral-200'}>{paidCount} Paid Fees</span>
              </div>
              <span className={`font-mono font-black ${isLight ? 'text-[#3E5422]' : 'text-neutral-400'}`}>{receipts.length} receipts</span>
            </div>
            {/* Dynamic Collection Rate indicator */}
            <div className="mt-2.5 pt-2 border-t border-[#587731]/20">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                <span className={isLight ? 'text-[#243315] font-extrabold' : 'text-neutral-300'}>Collection Rate</span>
                <span className="text-[#587731] dark:text-[#8CB752] font-black">{collectionRate}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-[#E5DCBE]' : 'bg-neutral-800'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-[#587731] to-[#8CB752] rounded-full transition-all duration-500" 
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Pending Fees KPI */}
        <div className={kpiCardClass}>
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-[#587731]/15 blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between gap-2 relative z-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Pending Balance">⏳</span>
              <span className={kpiTitleClass}>Pending Balance</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Clock className="w-4 h-4 text-[#587731] dark:text-[#8CB752]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1.5 flex-wrap relative z-1">
            <span className={kpiNumberClass}>
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
            <span className={kpiBadgeClass}>
              Outstanding
            </span>
          </div>
          <div className={`${kpiSubtextClass} relative z-1`}>
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className={`font-black ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{unpaidCount} Unpaid Students</span>
              <span className={`font-mono font-black ${isLight ? 'text-[#3E5422]' : 'text-neutral-400'}`}>₹{studentTotalPending.toLocaleString('en-IN')} due</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Prominent Action Buttons with Olive & Beige styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={onOpenAddStudent}
          className="flex items-center justify-between p-4 bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] rounded-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-[#FAF6EE]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black leading-tight text-[#FAF6EE]">Add Student</div>
              <div className="text-xs text-[#E5DCBE] font-bold mt-0.5">Quick registration</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 opacity-90 group-hover:translate-x-1 transition-transform text-[#FAF6EE]" />
        </button>

        <button
          onClick={onOpenAddCourse}
          className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all duration-200 group cursor-pointer border hover:-translate-y-0.5 active:translate-y-0 ${
            isLight
              ? 'bg-[#FAF6EE] hover:bg-[#F5EFDF] border-[#E5DCBE] hover:border-[#587731] text-[#243315] shadow-sm hover:shadow-xl'
              : 'bg-neutral-900/90 hover:bg-neutral-850 hover:border-orange-500/50 border-neutral-800 text-neutral-100 shadow-sm hover:shadow-xl'
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
          className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all duration-200 group cursor-pointer border hover:-translate-y-0.5 active:translate-y-0 ${
            isLight
              ? 'bg-white hover:bg-emerald-50/80 border-neutral-300 hover:border-emerald-500 text-black shadow-sm hover:shadow-xl'
              : 'bg-neutral-900/90 hover:bg-neutral-850 hover:border-emerald-500/50 border-neutral-800 text-neutral-100 shadow-sm hover:shadow-xl'
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
          onClick={() => onNavigateToView('phase')}
          className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all duration-200 group cursor-pointer border hover:-translate-y-0.5 active:translate-y-0 ${
            isLight
              ? 'bg-[#FAF6EE] hover:bg-[#F5EFDF] border-[#E5DCBE] hover:border-[#587731] text-[#243315] shadow-sm hover:shadow-xl'
              : 'bg-neutral-900/90 hover:bg-neutral-850 hover:border-[#587731]/50 border-neutral-800 text-neutral-100 shadow-sm hover:shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isLight
                ? 'bg-[#587731]/15 text-[#587731]'
                : 'bg-[#587731]/20 border border-[#587731]/30 text-[#8CB752]'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`text-sm font-black leading-tight transition-colors ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                Phase Management
              </div>
              <div className={`text-xs font-bold mt-0.5 transition-colors ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Keval · Hiren · Shweta ({students.length} students)
              </div>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isLight ? 'text-[#587731]' : 'text-[#8CB752]'}`} />
        </button>
      </div>

      {/* Phase Workflow & Actual Student Counts (Phase 1, Phase 2, Phase 3) */}
      <div className={`p-5 rounded-2xl border-2 transition-all ${
        isLight
          ? 'bg-[#FAF6EE] border-[#E5DCBE] text-[#243315]'
          : 'bg-[#182214]/90 border-[#2C3D21] text-neutral-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5DCBE] dark:border-[#2C3D21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#587731]/15 border border-[#587731]/30 flex items-center justify-center text-[#587731] dark:text-[#8CB752]">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`font-black text-base tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                Phase Workflow &amp; Student Counts
              </h3>
              <p className={`text-xs ${isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'}`}>
                Live student allocation across Phase 1 (Keval), Phase 2 (Hiren), and Phase 3 (Shweta)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToView('phase')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer self-start sm:self-auto ${
              isLight
                ? 'bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] shadow-sm'
                : 'bg-[#587731] hover:bg-[#6D933D] text-[#FAF6EE] shadow-sm'
            }`}
          >
            <span>Open Phase Tab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Interactive Phase Cards Showing Actual Live Counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
          {/* Phase 1 Card */}
          <div
            onClick={() => onNavigateToView('phase')}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 shadow-xs ${
              isLight
                ? 'bg-white hover:bg-[#F5EFDF] border-[#E5DCBE] hover:border-[#587731]'
                : 'bg-neutral-950/60 hover:bg-neutral-900 border-neutral-800 hover:border-[#587731]'
            }`}
          >
            <div className="flex items-center justify-between text-xs pb-1 font-bold">
              <span className="flex items-center gap-1.5 text-[#587731] dark:text-[#8CB752] font-black uppercase text-[11px] tracking-wider">
                <span className="w-5 h-5 rounded-md bg-[#587731]/15 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Phase 1 — Keval</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-black">
                Intake
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className={`text-3xl font-black font-sans tabular-nums tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                {phaseCounts.phase1}
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Students Active
              </span>
            </div>
            <div className={`mt-2 pt-2 border-t text-[11px] font-semibold flex items-center justify-between ${
              isLight ? 'border-[#E5DCBE] text-[#243315]' : 'border-neutral-800 text-neutral-400'
            }`}>
              <span>Unassigned &amp; New Admissions</span>
              <span className="text-[#587731] dark:text-[#8CB752] font-bold">Manage →</span>
            </div>
          </div>

          {/* Phase 2 Card */}
          <div
            onClick={() => onNavigateToView('phase')}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 shadow-xs ${
              isLight
                ? 'bg-white hover:bg-[#F5EFDF] border-[#E5DCBE] hover:border-[#587731]'
                : 'bg-neutral-950/60 hover:bg-neutral-900 border-neutral-800 hover:border-[#587731]'
            }`}
          >
            <div className="flex items-center justify-between text-xs pb-1 font-bold">
              <span className="flex items-center gap-1.5 text-[#587731] dark:text-[#8CB752] font-black uppercase text-[11px] tracking-wider">
                <span className="w-5 h-5 rounded-md bg-[#587731]/15 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Phase 2 — Hiren</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-black">
                Ongoing
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className={`text-3xl font-black font-sans tabular-nums tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                {phaseCounts.phase2}
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Students Active
              </span>
            </div>
            <div className={`mt-2 pt-2 border-t text-[11px] font-semibold flex items-center justify-between ${
              isLight ? 'border-[#E5DCBE] text-[#243315]' : 'border-neutral-800 text-neutral-400'
            }`}>
              <span>Intermediate Cohort</span>
              <span className="text-[#587731] dark:text-[#8CB752] font-bold">Manage →</span>
            </div>
          </div>

          {/* Phase 3 Card */}
          <div
            onClick={() => onNavigateToView('phase')}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 shadow-xs ${
              isLight
                ? 'bg-white hover:bg-[#F5EFDF] border-[#E5DCBE] hover:border-[#587731]'
                : 'bg-neutral-950/60 hover:bg-neutral-900 border-neutral-800 hover:border-[#587731]'
            }`}
          >
            <div className="flex items-center justify-between text-xs pb-1 font-bold">
              <span className="flex items-center gap-1.5 text-[#587731] dark:text-[#8CB752] font-black uppercase text-[11px] tracking-wider">
                <span className="w-5 h-5 rounded-md bg-[#587731]/15 flex items-center justify-center text-[10px] font-black">3</span>
                <span>Phase 3 — Shweta</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-black">
                Placement
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className={`text-3xl font-black font-sans tabular-nums tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                {phaseCounts.phase3}
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Students Active
              </span>
            </div>
            <div className={`mt-2 pt-2 border-t text-[11px] font-semibold flex items-center justify-between ${
              isLight ? 'border-[#E5DCBE] text-[#243315]' : 'border-neutral-800 text-neutral-400'
            }`}>
              <span>Capstones &amp; Final Review</span>
              <span className="text-[#587731] dark:text-[#8CB752] font-bold">Manage →</span>
            </div>
          </div>
        </div>
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
                className={`py-3 px-2.5 rounded-xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-transparent transition-colors ${
                  isLight ? 'hover:bg-[#F5EFDF]/60 text-[#243315]' : 'hover:bg-neutral-800/50 text-neutral-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${isLight ? 'text-[#19240E]' : 'text-white'}`}>
                      {inv.studentName}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isLight ? 'bg-[#587731]/15 text-[#587731] border border-[#587731]/30' : 'bg-neutral-800 text-neutral-200 border border-neutral-700'}`}>
                      {inv.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1.5">
                    <span className={`font-black ${isLight ? 'text-[#243315]' : 'text-neutral-100'}`}>
                      {inv.courseName}
                    </span>
                    <span className={isLight ? 'text-[#3E5422] font-bold' : 'text-neutral-600'}>·</span>
                    <span className={`font-mono font-semibold ${isLight ? 'text-[#3E5422]' : 'text-neutral-400'}`}>{inv.invoiceDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#E5DCBE]/60 dark:border-neutral-800/60">
                  <div className={`text-sm font-black font-mono ${isLight ? 'text-[#19240E]' : 'text-white'}`}>
                    ₹{inv.totalPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="font-bold">
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
              className="text-xs text-[#587731] hover:text-[#486228] font-extrabold flex items-center gap-1 cursor-pointer hover:underline"
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
                className={`py-3 px-2.5 rounded-xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-transparent transition-colors ${
                  isLight ? 'hover:bg-[#F5EFDF]/60 text-[#243315]' : 'hover:bg-neutral-800/50 text-neutral-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${isLight ? 'text-[#19240E]' : 'text-white'}`}>
                      {stu.name}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isLight ? 'bg-[#587731]/15 text-[#587731] border border-[#587731]/30' : 'bg-neutral-800 text-neutral-200 border border-neutral-700'}`}>
                      {stu.id}
                    </span>
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1.5">
                    <span className={`font-black ${isLight ? 'text-[#243315]' : 'text-neutral-100'}`}>
                      {stu.enrolledCourseName}
                    </span>
                    <span className={isLight ? 'text-[#3E5422] font-bold' : 'text-neutral-600'}>·</span>
                    <span className={`font-mono font-semibold ${isLight ? 'text-[#3E5422]' : 'text-neutral-400'}`}>+91 {stu.phone}</span>
                  </div>
                </div>

                {/* Recent Admissions: Paid font and full paid amount visibly bold */}
                <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#E5DCBE]/60 dark:border-neutral-800/60">
                  <div className="text-sm font-black font-mono tracking-tight">
                    <span className={`text-xs uppercase tracking-wider font-bold mr-1 ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>Paid:</span>
                    <span className={`font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>₹{stu.totalPaid.toLocaleString('en-IN')}</span>
                    <span className={`font-normal mx-1 ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>/</span>
                    <span className={`font-black ${isLight ? 'text-[#19240E]' : 'text-white'}`}>₹{stu.agreedFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="font-bold">
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
