import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  RotateCcw,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  X,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Eye,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  UserCheck,
  User,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Course, PhaseNumber, PhasePerson } from '../types';
import {
  getPhaseForStudent,
  getPhasePerson,
  savePhaseAssignments,
  getPhaseAuditLogs,
} from '../services/storage';
import { fetchAndSyncAllDataFromFirebase } from '../services/firebase';

interface PhaseManagementViewProps {
  students: Student[];
  courses: Course[];
  theme?: 'light' | 'dark';
}

interface PendingTransfer {
  studentId: string;
  studentName: string;
  fromPhase: PhaseNumber;
  toPhase: PhaseNumber;
  timestamp: string;
}

export const PhaseManagementView: React.FC<PhaseManagementViewProps> = ({
  students,
  courses,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Global & In-table Search / Filter states
  const [globalSearch, setGlobalSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('date_desc');

  // Search within each phase
  const [phase1Search, setPhase1Search] = useState('');
  const [phase2Search, setPhase2Search] = useState('');
  const [phase3Search, setPhase3Search] = useState('');

  // Pagination per phase (items per page: 10)
  const [phase1Page, setPhase1Page] = useState(1);
  const [phase2Page, setPhase2Page] = useState(1);
  const [phase3Page, setPhase3Page] = useState(1);
  const pageSize = 10;

  // Multi-Student Selector Dropdown State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectorSearch, setSelectorSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Staged / Pending Phase Assignments per Phase (keyed by studentId)
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingTransfer>>({});

  // Saving states
  const [isSavingPhase1, setIsSavingPhase1] = useState(false);
  const [isSavingPhase2, setIsSavingPhase2] = useState(false);
  const [isSavingPhase3, setIsSavingPhase3] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User feedback / alert
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Confirmation Modal State before staging transfers
  const [confirmModalData, setConfirmModalData] = useState<{
    targetPhase: PhaseNumber;
    targetPerson: PhasePerson;
    studentsToMove: { id: string; name: string; currentPhase: PhaseNumber }[];
  } | null>(null);

  // Student Details Modal
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Table section scroll refs
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const phase3Ref = useRef<HTMLDivElement>(null);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Process and categorize every student into their effective phase
  const allCategorizedStudents = useMemo(() => {
    return students.map(student => {
      const phaseInfo = getPhaseForStudent(student);
      const pending = pendingChanges[student.id];
      const effectivePhase = pending ? pending.toPhase : phaseInfo.phase;
      const effectivePerson = getPhasePerson(effectivePhase);

      return {
        ...student,
        currentPhase: phaseInfo.phase,
        currentPerson: phaseInfo.assignedPerson,
        assignedDate: phaseInfo.assignedAt,
        effectivePhase,
        effectivePerson,
        isPending: !!pending,
        pendingTargetPhase: pending?.toPhase,
      };
    });
  }, [students, pendingChanges]);

  // Actual Phase Counts from current database state (instantly reactive when student moves)
  const dbCounts = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    students.forEach(s => {
      const info = getPhaseForStudent(s);
      if (info.phase === 2) p2++;
      else if (info.phase === 3) p3++;
      else p1++;
    });
    return { p1, p2, p3, total: students.length };
  }, [students]);

  // Pending counts per phase
  const pendingByPhase = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    Object.values(pendingChanges).forEach(p => {
      if (p.toPhase === 1) p1++;
      if (p.toPhase === 2) p2++;
      if (p.toPhase === 3) p3++;
    });
    return { p1, p2, p3, total: Object.keys(pendingChanges).length };
  }, [pendingChanges]);

  // Filtering & Sorting function for each phase table
  const filterAndSort = (phaseNum: PhaseNumber, tableSearch: string) => {
    return allCategorizedStudents
      .filter(s => s.effectivePhase === phaseNum)
      .filter(s => {
        if (courseFilter !== 'all' && s.enrolledCourseId !== courseFilter) return false;

        const term = (globalSearch || tableSearch).trim().toLowerCase();
        if (!term) return true;

        const matchName = s.name.toLowerCase().includes(term);
        const matchId = s.id.toLowerCase().includes(term);
        const matchEnroll = s.enrollmentId ? s.enrollmentId.toLowerCase().includes(term) : false;
        const matchPhone = s.phone ? s.phone.includes(term) : false;
        const matchEmail = s.email ? s.email.toLowerCase().includes(term) : false;
        const matchCourse = s.enrolledCourseName ? s.enrolledCourseName.toLowerCase().includes(term) : false;

        return matchName || matchId || matchEnroll || matchPhone || matchEmail || matchCourse;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'date_asc') return (a.assignedDate || '').localeCompare(b.assignedDate || '');
        return (b.assignedDate || '').localeCompare(a.assignedDate || '');
      });
  };

  const phase1Students = useMemo(() => filterAndSort(1, phase1Search), [allCategorizedStudents, globalSearch, phase1Search, courseFilter, sortBy]);
  const phase2Students = useMemo(() => filterAndSort(2, phase2Search), [allCategorizedStudents, globalSearch, phase2Search, courseFilter, sortBy]);
  const phase3Students = useMemo(() => filterAndSort(3, phase3Search), [allCategorizedStudents, globalSearch, phase3Search, courseFilter, sortBy]);

  // Students available for multi-select dropdown
  const filteredSelectorStudents = useMemo(() => {
    const q = selectorSearch.trim().toLowerCase();
    return students.filter(s => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.enrollmentId && s.enrollmentId.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    });
  }, [students, selectorSearch]);

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllInDropdown = () => {
    const matchingIds = filteredSelectorStudents.map(s => s.id);
    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...matchingIds])));
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Initiate Transfer Action with Confirmation
  const handleInitiateTransfer = (targetPhase: PhaseNumber) => {
    if (selectedStudentIds.length === 0) {
      showFeedback('error', 'Please select at least one student from the dropdown first.');
      return;
    }

    const studentsToMove = selectedStudentIds
      .map(id => {
        const student = students.find(s => s.id === id);
        if (!student) return null;
        const phaseInfo = getPhaseForStudent(student);
        return {
          id: student.id,
          name: student.name,
          currentPhase: phaseInfo.phase,
        };
      })
      .filter(Boolean) as { id: string; name: string; currentPhase: PhaseNumber }[];

    if (studentsToMove.length === 0) return;

    setConfirmModalData({
      targetPhase,
      targetPerson: getPhasePerson(targetPhase),
      studentsToMove,
    });
  };

  // Stage changes after confirmation
  const handleConfirmTransfer = () => {
    if (!confirmModalData) return;

    const { targetPhase, studentsToMove } = confirmModalData;
    const now = new Date().toISOString();

    setPendingChanges(prev => {
      const updated = { ...prev };
      studentsToMove.forEach(s => {
        updated[s.id] = {
          studentId: s.id,
          studentName: s.name,
          fromPhase: s.currentPhase,
          toPhase: targetPhase,
          timestamp: now,
        };
      });
      return updated;
    });

    showFeedback(
      'info',
      `Staged ${studentsToMove.length} student(s) for Phase ${targetPhase} (${confirmModalData.targetPerson}). Click "Phase ${targetPhase} — Save Changes" to commit.`
    );

    setConfirmModalData(null);
    setSelectedStudentIds([]);
    setIsSelectorOpen(false);
  };

  // Quick single-student transfer action directly from row
  const handleQuickRowTransfer = (student: Student, targetPhase: PhaseNumber) => {
    const currentPhaseInfo = getPhaseForStudent(student);
    if (currentPhaseInfo.phase === targetPhase) {
      showFeedback('info', `${student.name} is already in Phase ${targetPhase}.`);
      return;
    }

    setConfirmModalData({
      targetPhase,
      targetPerson: getPhasePerson(targetPhase),
      studentsToMove: [
        {
          id: student.id,
          name: student.name,
          currentPhase: currentPhaseInfo.phase,
        },
      ],
    });
  };

  // Save changes for an individual phase
  const handleSavePhase = async (phaseNum: PhaseNumber) => {
    const targets = Object.values(pendingChanges).filter(p => p.toPhase === phaseNum);

    if (targets.length === 0) {
      showFeedback('info', `No pending changes for Phase ${phaseNum} (${getPhasePerson(phaseNum)}).`);
      return;
    }

    if (phaseNum === 1) setIsSavingPhase1(true);
    if (phaseNum === 2) setIsSavingPhase2(true);
    if (phaseNum === 3) setIsSavingPhase3(true);

    try {
      const itemsToSave = targets.map(t => ({
        studentId: t.studentId,
        phase: t.toPhase,
      }));

      const res = await savePhaseAssignments(itemsToSave, 'Kevalmistry36@gmail.com');

      if (res.success) {
        setPendingChanges(prev => {
          const next = { ...prev };
          targets.forEach(t => delete next[t.studentId]);
          return next;
        });

        showFeedback(
          'success',
          `✓ Successfully saved ${res.count} student(s) to Phase ${phaseNum} (${getPhasePerson(phaseNum)})!`
        );
      } else {
        showFeedback('error', `Failed to save changes: ${res.error || 'Database error'}`);
      }
    } catch (err: any) {
      showFeedback('error', `Save error: ${err?.message || 'Unable to connect to database'}`);
    } finally {
      setIsSavingPhase1(false);
      setIsSavingPhase2(false);
      setIsSavingPhase3(false);
    }
  };

  // Cancel pending changes for an individual phase
  const handleCancelPhasePending = (phaseNum: PhaseNumber) => {
    setPendingChanges(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].toPhase === phaseNum) {
          delete next[id];
        }
      });
      return next;
    });
    showFeedback('info', `Cancelled pending changes for Phase ${phaseNum}.`);
  };

  // Refresh from Firestore
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await fetchAndSyncAllDataFromFirebase();
      showFeedback('success', 'Synchronized live phase assignments with Firebase Firestore.');
    } catch (err: any) {
      showFeedback('error', 'Sync note: ' + (err?.message || 'Using local cache'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export individual phase to Excel (.xlsx)
  const handleExportPhaseExcel = (phaseNum: PhaseNumber) => {
    const person = getPhasePerson(phaseNum);
    const list =
      phaseNum === 1 ? phase1Students : phaseNum === 2 ? phase2Students : phase3Students;

    if (list.length === 0) {
      showFeedback('info', `No student records in Phase ${phaseNum} to export.`);
      return;
    }

    const rows = list.map((s, idx) => ({
      'No.': idx + 1,
      'Student ID': s.id,
      'Student Name': s.name,
      'Contact Number': s.phone ? `+91 ${s.phone}` : '-',
      'Email Address': s.email || '-',
      'Course Name': s.enrolledCourseName || '-',
      'Assigned Phase': `Phase ${phaseNum} — ${person}`,
      'Assigned Person': person,
      'Assigned Date': s.assignedDate || '-',
      'Enrollment ID': s.enrollmentId || '-',
      'Fee Status': (s.paymentStatus || 'unpaid').toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Phase_${phaseNum}_${person}`);
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Cortexx_Phase_${phaseNum}_${person}_${dateStr}.xlsx`);
    showFeedback('success', `Exported Phase ${phaseNum} (${list.length} students) to Excel successfully.`);
  };

  const scrollToPhase = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Unified Olive & Beige Theme Classes matching Dashboard, Students & Invoices
  const kpiCardClass = isLight
    ? 'bg-[#FAF6EE] border-2 border-[#E5DCBE] border-t-4 border-t-[#587731] shadow-sm hover:shadow-xl hover:border-[#587731] hover:-translate-y-0.5 text-[#243315] rounded-xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between cursor-pointer'
    : 'bg-[#182214]/90 border border-[#2C3D21] border-t-4 border-t-[#587731] hover:border-[#587731]/70 hover:shadow-xl hover:shadow-[#587731]/10 hover:-translate-y-0.5 text-neutral-100 rounded-xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between cursor-pointer';

  const kpiTitleClass = isLight
    ? 'text-[11px] sm:text-xs font-black tracking-wider uppercase text-[#243315] font-sans truncate'
    : 'text-[11px] sm:text-xs font-bold tracking-wider uppercase text-neutral-200 font-sans truncate';

  const kpiNumberClass = isLight
    ? 'text-2xl sm:text-3xl xl:text-4xl font-black font-sans tabular-nums text-[#19240E] tracking-tight'
    : 'text-2xl sm:text-3xl xl:text-4xl font-black font-sans tabular-nums text-white tracking-tight';

  const kpiSubtextClass = isLight
    ? 'mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-[#243315] font-extrabold font-sans'
    : 'mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-neutral-300 font-semibold font-sans';

  const kpiBadgeClass =
    'text-[10px] sm:text-[11px] uppercase font-black tracking-wider px-2 sm:px-2.5 py-0.5 rounded-md bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 font-sans shrink-0';

  const kpiIconBoxClass =
    'w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#587731]/15 border border-[#587731]/35 flex items-center justify-center text-[#587731] dark:text-[#8CB752] shadow-sm shrink-0';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Command Bar matching Olive & Beige Combination */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
          isLight ? 'border-[#E5DCBE]' : 'border-[#2C3D21]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={kpiIconBoxClass}>
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isLight ? 'text-[#19240E]' : 'text-neutral-100'
              }`}
            >
              Phase Management System
            </h1>
            <span className={kpiBadgeClass}>
              Workflow Routing
            </span>
          </div>
          <p
            className={`text-xs sm:text-sm mt-1.5 ${
              isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'
            }`}
          >
            Cortexx AI Institute ·{' '}
            <span className="text-[#587731] dark:text-[#8CB752] font-bold">
              Keval (Phase 1) · Hiren (Phase 2) · Shweta (Phase 3)
            </span>{' '}
            Student Routing &amp; Counselor Allocation
          </p>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-[#FAF6EE] hover:bg-[#F5EFDF] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 hover:border-[#587731]'
            }`}
            title="Sync latest records from Firebase Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#587731]' : 'text-[#587731] dark:text-[#8CB752]'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleExportPhaseExcel(1);
              handleExportPhaseExcel(2);
              handleExportPhaseExcel(3);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-[#FAF6EE] hover:bg-[#F5EFDF] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 hover:border-[#587731]'
            }`}
            title="Download Excel reports for all three phases"
          >
            <Download className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
            <span>Export All Phases</span>
          </button>
        </div>
      </div>

      {/* Realtime Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md border animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
              : 'bg-[#587731]/15 border-[#587731]/40 text-[#243315] dark:text-[#8CB752]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#587731] shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-black px-2 py-0.5 rounded hover:opacity-70 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Summary Cards (Actual Student Counts in Phase 1, Phase 2, and Phase 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Summary Card 1: Phase 1 — Keval */}
        <div onClick={() => scrollToPhase(phase1Ref)} className={kpiCardClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={kpiIconBoxClass}>
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className={`font-black text-base tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                  Phase 1 — Keval
                </h3>
                <p className={`text-[11px] font-semibold mt-0.5 ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                  Unassigned &amp; New Admissions
                </p>
              </div>
            </div>
            <span className={kpiBadgeClass}>
              Phase 1
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div>
              <span className={kpiNumberClass}>
                {dbCounts.p1}
              </span>
              <span className={`text-xs ml-2 font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Students Active
              </span>
            </div>
            {pendingByPhase.p1 > 0 && (
              <span className="text-xs font-black text-[#587731] dark:text-[#8CB752] bg-[#587731]/20 border border-[#587731]/40 px-2 py-0.5 rounded-md animate-pulse">
                +{pendingByPhase.p1} pending
              </span>
            )}
          </div>

          <div className={`${kpiSubtextClass} border-t pt-2.5 flex items-center justify-between ${isLight ? 'border-[#E5DCBE]' : 'border-[#2C3D21]'}`}>
            <span>Auto-intake for all new students</span>
            <span className="text-[#587731] dark:text-[#8CB752] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              View table <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Summary Card 2: Phase 2 — Hiren */}
        <div onClick={() => scrollToPhase(phase2Ref)} className={kpiCardClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={kpiIconBoxClass}>
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className={`font-black text-base tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                  Phase 2 — Hiren
                </h3>
                <p className={`text-[11px] font-semibold mt-0.5 ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                  Intermediate / Ongoing Cohort
                </p>
              </div>
            </div>
            <span className={kpiBadgeClass}>
              Phase 2
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div>
              <span className={kpiNumberClass}>
                {dbCounts.p2}
              </span>
              <span className={`text-xs ml-2 font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Students Active
              </span>
            </div>
            {pendingByPhase.p2 > 0 && (
              <span className="text-xs font-black text-[#587731] dark:text-[#8CB752] bg-[#587731]/20 border border-[#587731]/40 px-2 py-0.5 rounded-md animate-pulse">
                +{pendingByPhase.p2} pending
              </span>
            )}
          </div>

          <div className={`${kpiSubtextClass} border-t pt-2.5 flex items-center justify-between ${isLight ? 'border-[#E5DCBE]' : 'border-[#2C3D21]'}`}>
            <span>Exclusively moved from Phase 1</span>
            <span className="text-[#587731] dark:text-[#8CB752] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              View table <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Summary Card 3: Phase 3 — Shweta */}
        <div onClick={() => scrollToPhase(phase3Ref)} className={kpiCardClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={kpiIconBoxClass}>
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className={`font-black text-base tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                  Phase 3 — Shweta
                </h3>
                <p className={`text-[11px] font-semibold mt-0.5 ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                  Placement &amp; Capstone Review
                </p>
              </div>
            </div>
            <span className={kpiBadgeClass}>
              Phase 3
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div>
              <span className={kpiNumberClass}>
                {dbCounts.p3}
              </span>
              <span className={`text-xs ml-2 font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-400'}`}>
                Students Active
              </span>
            </div>
            {pendingByPhase.p3 > 0 && (
              <span className="text-xs font-black text-[#587731] dark:text-[#8CB752] bg-[#587731]/20 border border-[#587731]/40 px-2 py-0.5 rounded-md animate-pulse">
                +{pendingByPhase.p3} pending
              </span>
            )}
          </div>

          <div className={`${kpiSubtextClass} border-t pt-2.5 flex items-center justify-between ${isLight ? 'border-[#E5DCBE]' : 'border-[#2C3D21]'}`}>
            <span>Final phase; removed from 1 &amp; 2</span>
            <span className="text-[#587731] dark:text-[#8CB752] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              View table <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div
        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-[#F5EFDF] border-[#E5DCBE] text-[#243315]' : 'bg-[#182214]/60 border-[#2C3D21] text-neutral-300'
        }`}
      >
        <div className="flex items-center gap-4 flex-wrap font-bold">
          <span className="flex items-center gap-1.5">
            <span className="text-[#587731] dark:text-[#8CB752] font-black">● Total Enrolled:</span>
            <span>{dbCounts.total} students</span>
          </span>
          <span className="hidden sm:inline text-neutral-400">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#587731] dark:text-[#8CB752] font-black">● Default Placement:</span>
            <span>Phase 1 — Keval (0 Unassigned)</span>
          </span>
          <span className="hidden sm:inline text-neutral-400">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-600 dark:text-amber-400 font-black">● Staged Transfers:</span>
            <span>{pendingByPhase.total} changes awaiting save</span>
          </span>
        </div>

        {pendingByPhase.total > 0 && (
          <button
            type="button"
            onClick={() => setPendingChanges({})}
            className="text-xs font-black text-rose-500 hover:text-rose-600 underline cursor-pointer"
          >
            Cancel All Staged Transfers
          </button>
        )}
      </div>

      {/* 3. Student Selection & Phase Transfer Station with Olive & Beige Styling */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border-2 space-y-4 shadow-sm ${
          isLight
            ? 'bg-[#FAF6EE] border-[#E5DCBE] text-[#243315]'
            : 'bg-[#182214]/90 border-[#2C3D21] text-neutral-100'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${isLight ? 'border-[#E5DCBE]' : 'border-[#2C3D21]'}`}>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#587731] dark:text-[#8CB752]" />
              <span>Student Phase Transfer Station</span>
            </h2>
            <p
              className={`text-xs mt-0.5 ${
                isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'
              }`}
            >
              Select one or multiple students from the database to reassign their exclusive phase.
            </p>
          </div>

          {selectedStudentIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-black text-neutral-500 hover:text-neutral-300 self-start sm:self-auto cursor-pointer"
            >
              Clear Selection ({selectedStudentIds.length})
            </button>
          )}
        </div>

        {/* Dropdown Trigger & Search Input */}
        <div className="space-y-3 relative" ref={dropdownRef}>
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Custom Multi-Select Dropdown Container */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsSelectorOpen(prev => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-[#E5DCBE] text-[#19240E] hover:border-[#587731]'
                    : 'bg-neutral-950 border-[#2C3D21] text-neutral-100 hover:border-[#587731]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 text-[#587731] dark:text-[#8CB752] shrink-0" />
                  <span className="truncate">
                    {selectedStudentIds.length === 0
                      ? 'Search & Select Students from Database...'
                      : `${selectedStudentIds.length} student(s) selected`}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    isSelectorOpen ? 'rotate-180 text-[#587731]' : ''
                  }`}
                />
              </button>

              {/* Floating Multi-Select Menu */}
              {isSelectorOpen && (
                <div
                  className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl p-2.5 space-y-2 max-h-80 overflow-y-auto animate-fadeIn ${
                    isLight
                      ? 'bg-white border-[#E5DCBE] text-[#243315]'
                      : 'bg-neutral-950 border-[#2C3D21] text-neutral-100'
                  }`}
                >
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Type name, ID (COR-STU-...), phone..."
                      value={selectorSearch}
                      onChange={e => setSelectorSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-[#587731] ${
                        isLight
                          ? 'bg-[#FAF6EE] border-[#E5DCBE] text-[#19240E]'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] px-1 font-bold">
                    <button
                      type="button"
                      onClick={handleSelectAllInDropdown}
                      className="text-[#587731] dark:text-[#8CB752] hover:underline cursor-pointer"
                    >
                      Select All Matching ({filteredSelectorStudents.length})
                    </button>
                    <span className="text-neutral-500">{selectedStudentIds.length} checked</span>
                  </div>

                  <div className="space-y-1 max-h-52 overflow-y-auto divide-y divide-neutral-800/40">
                    {filteredSelectorStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-500">
                        No students match "{selectorSearch}"
                      </div>
                    ) : (
                      filteredSelectorStudents.map(s => {
                        const isSelected = selectedStudentIds.includes(s.id);
                        const phaseInfo = getPhaseForStudent(s);
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleToggleSelectStudent(s.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? isLight
                                  ? 'bg-[#F5EFDF] text-[#19240E] font-bold'
                                  : 'bg-[#587731]/20 text-neutral-100 font-bold'
                                : isLight
                                ? 'hover:bg-[#FAF6EE]'
                                : 'hover:bg-neutral-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#587731] dark:text-[#8CB752] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-neutral-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-bold truncate">{s.name}</div>
                                <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
                                  <span>{s.id}</span>
                                  {s.phone && <span>· +91 {s.phone}</span>}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30`}
                            >
                              Phase {phaseInfo.phase} ({phaseInfo.assignedPerson})
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Three Assignment Target Buttons with Olive Theme */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleInitiateTransfer(1)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black rounded-xl bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#FAF6EE]" />
                <span>Assign to Phase 1 — Keval</span>
              </button>

              <button
                type="button"
                onClick={() => handleInitiateTransfer(2)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-white hover:bg-[#F5EFDF] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 hover:border-[#587731]'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
                <span>Assign to Phase 2 — Hiren</span>
              </button>

              <button
                type="button"
                onClick={() => handleInitiateTransfer(3)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-white hover:bg-[#F5EFDF] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 hover:border-[#587731]'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
                <span>Assign to Phase 3 — Shweta</span>
              </button>
            </div>
          </div>

          {/* Selected Students Chips Preview */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs font-bold text-neutral-400 mr-1">Selected:</span>
              {selectedStudentIds.map(id => {
                const s = students.find(x => x.id === id);
                if (!s) return null;
                const info = getPhaseForStudent(s);
                return (
                  <span
                    key={id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      isLight
                        ? 'bg-white border-[#E5DCBE] text-[#19240E]'
                        : 'bg-neutral-950 border-[#2C3D21] text-neutral-200'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] font-mono text-neutral-400">({id})</span>
                    <span className="text-[10px] text-[#587731] dark:text-[#8CB752] font-mono font-black">P{info.phase}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectStudent(id)}
                      className="ml-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Global Filter & Search Bar for Tables */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          isLight ? 'bg-white border-[#E5DCBE]' : 'bg-[#182214]/60 border-[#2C3D21]'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search across all 3 Phase tables (Name, Student ID, Phone, Course)..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:border-[#587731] ${
                isLight
                  ? 'bg-[#FAF6EE] border-[#E5DCBE] text-[#19240E]'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-200'
              }`}
            />
          </div>
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="text-xs font-bold text-neutral-400 hover:text-neutral-200 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Course Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:border-[#587731] cursor-pointer ${
                isLight
                  ? 'bg-white border-[#E5DCBE] text-[#243315]'
                  : 'bg-neutral-950 border-[#2C3D21] text-neutral-200'
              }`}
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:border-[#587731] cursor-pointer ${
                isLight
                  ? 'bg-white border-[#E5DCBE] text-[#243315]'
                  : 'bg-neutral-950 border-[#2C3D21] text-neutral-200'
              }`}
            >
              <option value="date_desc">Assigned Date (Newest first)</option>
              <option value="date_asc">Assigned Date (Oldest first)</option>
              <option value="name_asc">Student Name (A → Z)</option>
              <option value="name_desc">Student Name (Z → A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. THREE INDIVIDUAL PHASE TABLES WITH INDIVIDUAL SAVE BUTTONS (Olive & Beige Theme) */}

      {/* ========================================================
          TABLE 1: PHASE 1 — KEVAL
          ======================================================== */}
      <section
        ref={phase1Ref}
        className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
          isLight ? 'bg-white border-[#E5DCBE]' : 'bg-[#182214]/90 border-[#2C3D21]'
        }`}
      >
        <div
          className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? 'bg-[#F5EFDF] border-[#E5DCBE]' : 'bg-neutral-950/80 border-[#2C3D21]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-7 h-7 rounded-lg bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] font-black text-xs flex items-center justify-center">
                1
              </span>
              <h2
                className={`text-lg sm:text-xl font-black tracking-tight ${
                  isLight ? 'text-[#19240E]' : 'text-neutral-100'
                }`}
              >
                Phase 1 — Keval
              </h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30">
                {phase1Students.length} Students
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'}`}>
              Shows all students who have not yet been assigned to Phase 2 or Phase 3, including newly added students.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="Search in Phase 1..."
              value={phase1Search}
              onChange={e => {
                setPhase1Search(e.target.value);
                setPhase1Page(1);
              }}
              className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-[#587731] w-40 sm:w-48 ${
                isLight
                  ? 'bg-white border-[#E5DCBE] text-[#19240E]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            />

            <button
              type="button"
              onClick={() => handleExportPhaseExcel(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-[#FAF6EE] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-[#587731]'
              }`}
              title="Export Phase 1 records to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
              <span>Export</span>
            </button>

            {/* Individual Save Button for Phase 1 (Olive & Beige Theme) */}
            <button
              type="button"
              disabled={isSavingPhase1 || pendingByPhase.p1 === 0}
              onClick={() => handleSavePhase(1)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer ${
                pendingByPhase.p1 > 0
                  ? 'bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] shadow-[#587731]/25 border border-[#486228] active:scale-95'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 border border-neutral-300 dark:border-neutral-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              {isSavingPhase1 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phase 1 — Save Changes {pendingByPhase.p1 > 0 ? `(${pendingByPhase.p1})` : ''}</span>
                </>
              )}
            </button>

            {pendingByPhase.p1 > 0 && (
              <button
                type="button"
                onClick={() => handleCancelPhasePending(1)}
                className="text-xs font-bold text-neutral-400 hover:text-rose-400 px-1 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Phase 1 Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead
              className={`text-xs uppercase tracking-wider font-black border-b sticky top-0 ${
                isLight ? 'bg-[#FAF6EE] text-[#19240E] border-[#E5DCBE]' : 'bg-neutral-950 text-neutral-300 border-[#2C3D21]'
              }`}
            >
              <tr>
                <th className="py-3.5 px-4 w-12 text-center font-black">No.</th>
                <th className="py-3.5 px-4 font-black">Student ID</th>
                <th className="py-3.5 px-4 font-black">Student Name</th>
                <th className="py-3.5 px-4 font-black">Contact</th>
                <th className="py-3.5 px-4 font-black">Email</th>
                <th className="py-3.5 px-4 font-black">Course</th>
                <th className="py-3.5 px-4 font-black">Assigned Date</th>
                <th className="py-3.5 px-4 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/70'}`}>
              {phase1Students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <User className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                    <p className="font-bold text-sm">No students currently in Phase 1.</p>
                  </td>
                </tr>
              ) : (
                phase1Students
                  .slice((phase1Page - 1) * pageSize, phase1Page * pageSize)
                  .map((student, idx) => {
                    const rowNumber = (phase1Page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          student.isPending ? 'bg-[#587731]/10' : isLight ? 'hover:bg-neutral-50' : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-xs font-bold text-neutral-400">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">
                          <span className="text-[#587731] dark:text-[#8CB752]">{student.id}</span>
                          {student.isPending && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-sm">
                          <div className={isLight ? 'text-[#19240E]' : 'text-neutral-100'}>
                            {student.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold">
                          {student.phone ? (
                            <a
                              href={`tel:+91${student.phone}`}
                              className="text-neutral-300 hover:text-[#587731] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-[#587731]" />
                              <span>+91 {student.phone}</span>
                            </a>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {student.email ? (
                            <span className="truncate block max-w-[180px] text-neutral-400" title={student.email}>
                              {student.email}
                            </span>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          <span className={isLight ? 'text-[#243315]' : 'text-neutral-300'}>
                            {student.enrolledCourseName || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold text-neutral-400">
                          {student.assignedDate || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingStudent(student)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isLight
                                  ? 'border-[#E5DCBE] text-[#243315] hover:border-[#587731] hover:text-[#587731]'
                                  : 'border-neutral-700 text-neutral-300 hover:border-[#587731] hover:text-[#8CB752]'
                              }`}
                              title="View complete student details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowTransfer(student, 2)}
                              className="px-2.5 py-1 text-xs font-black rounded-lg bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 hover:bg-[#587731] hover:text-[#FAF6EE] transition-all cursor-pointer"
                              title="Move to Phase 2 (Hiren)"
                            >
                              → Phase 2
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowTransfer(student, 3)}
                              className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                                isLight
                                  ? 'bg-[#FAF6EE] text-[#243315] border-[#E5DCBE] hover:bg-[#587731] hover:text-[#FAF6EE]'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-[#587731] hover:text-[#FAF6EE]'
                              }`}
                              title="Move to Phase 3 (Shweta)"
                            >
                              → Phase 3
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

        {/* Phase 1 Mobile Cards List */}
        <div className={`md:hidden divide-y ${isLight ? 'divide-[#E5DCBE]' : 'divide-neutral-800'}`}>
          {phase1Students.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-bold">
              No students currently in Phase 1.
            </div>
          ) : (
            phase1Students
              .slice((phase1Page - 1) * pageSize, phase1Page * pageSize)
              .map((student, idx) => (
                <div key={student.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`font-black text-sm ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>{student.name}</div>
                      <div className="text-[11px] font-mono text-[#587731] dark:text-[#8CB752] mt-0.5">{student.id}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-bold">
                      #{(phase1Page - 1) * pageSize + idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1 text-neutral-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                      <span className="truncate">{student.enrolledCourseName || '-'}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                        <span>+91 {student.phone}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-1.5 font-mono truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono pt-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>Assigned: {student.assignedDate || '-'}</span>
                    </div>
                  </div>

                  <div className={`pt-2 flex items-center justify-between gap-2 border-t ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800'}`}>
                    <button
                      type="button"
                      onClick={() => setViewingStudent(student)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        isLight ? 'border-[#E5DCBE] text-[#243315]' : 'border-neutral-700 text-neutral-300'
                      }`}
                    >
                      View Details
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickRowTransfer(student, 2)}
                        className="px-2.5 py-1 text-xs font-black rounded-lg bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30"
                      >
                        → Phase 2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRowTransfer(student, 3)}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                          isLight ? 'bg-[#FAF6EE] text-[#243315] border-[#E5DCBE]' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        → Phase 3
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Phase 1 Pagination */}
        {phase1Students.length > pageSize && (
          <div
            className={`p-3 border-t flex items-center justify-between text-xs font-bold ${
              isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950 border-[#2C3D21]'
            }`}
          >
            <span>
              Showing {(phase1Page - 1) * pageSize + 1}–{Math.min(phase1Page * pageSize, phase1Students.length)} of {phase1Students.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={phase1Page === 1}
                onClick={() => setPhase1Page(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={phase1Page * pageSize >= phase1Students.length}
                onClick={() => setPhase1Page(p => p + 1)}
                className="px-2.5 py-1 rounded border border-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          TABLE 2: PHASE 2 — HIREN
          ======================================================== */}
      <section
        ref={phase2Ref}
        className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
          isLight ? 'bg-white border-[#E5DCBE]' : 'bg-[#182214]/90 border-[#2C3D21]'
        }`}
      >
        <div
          className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? 'bg-[#F5EFDF] border-[#E5DCBE]' : 'bg-neutral-950/80 border-[#2C3D21]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-7 h-7 rounded-lg bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] font-black text-xs flex items-center justify-center">
                2
              </span>
              <h2
                className={`text-lg sm:text-xl font-black tracking-tight ${
                  isLight ? 'text-[#19240E]' : 'text-neutral-100'
                }`}
              >
                Phase 2 — Hiren
              </h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30">
                {phase2Students.length} Students
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'}`}>
              Shows only students assigned to Phase 2. Moving a student here removes them from Phase 1.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="Search in Phase 2..."
              value={phase2Search}
              onChange={e => {
                setPhase2Search(e.target.value);
                setPhase2Page(1);
              }}
              className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-[#587731] w-40 sm:w-48 ${
                isLight
                  ? 'bg-white border-[#E5DCBE] text-[#19240E]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            />

            <button
              type="button"
              onClick={() => handleExportPhaseExcel(2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-[#FAF6EE] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-[#587731]'
              }`}
              title="Export Phase 2 records to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
              <span>Export</span>
            </button>

            {/* Individual Save Button for Phase 2 (Olive & Beige Theme) */}
            <button
              type="button"
              disabled={isSavingPhase2 || pendingByPhase.p2 === 0}
              onClick={() => handleSavePhase(2)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer ${
                pendingByPhase.p2 > 0
                  ? 'bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] shadow-[#587731]/25 border border-[#486228] active:scale-95'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 border border-neutral-300 dark:border-neutral-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              {isSavingPhase2 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phase 2 — Save Changes {pendingByPhase.p2 > 0 ? `(${pendingByPhase.p2})` : ''}</span>
                </>
              )}
            </button>

            {pendingByPhase.p2 > 0 && (
              <button
                type="button"
                onClick={() => handleCancelPhasePending(2)}
                className="text-xs font-bold text-neutral-400 hover:text-rose-400 px-1 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Phase 2 Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead
              className={`text-xs uppercase tracking-wider font-black border-b sticky top-0 ${
                isLight ? 'bg-[#FAF6EE] text-[#19240E] border-[#E5DCBE]' : 'bg-neutral-950 text-neutral-300 border-[#2C3D21]'
              }`}
            >
              <tr>
                <th className="py-3.5 px-4 w-12 text-center font-black">No.</th>
                <th className="py-3.5 px-4 font-black">Student ID</th>
                <th className="py-3.5 px-4 font-black">Student Name</th>
                <th className="py-3.5 px-4 font-black">Contact</th>
                <th className="py-3.5 px-4 font-black">Email</th>
                <th className="py-3.5 px-4 font-black">Course</th>
                <th className="py-3.5 px-4 font-black">Assigned Date</th>
                <th className="py-3.5 px-4 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/70'}`}>
              {phase2Students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <User className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                    <p className="font-bold text-sm">No students currently assigned to Phase 2 (Hiren).</p>
                  </td>
                </tr>
              ) : (
                phase2Students
                  .slice((phase2Page - 1) * pageSize, phase2Page * pageSize)
                  .map((student, idx) => {
                    const rowNumber = (phase2Page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          student.isPending ? 'bg-[#587731]/10' : isLight ? 'hover:bg-neutral-50' : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-xs font-bold text-neutral-400">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">
                          <span className="text-[#587731] dark:text-[#8CB752]">{student.id}</span>
                          {student.isPending && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-sm">
                          <div className={isLight ? 'text-[#19240E]' : 'text-neutral-100'}>
                            {student.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold">
                          {student.phone ? (
                            <a
                              href={`tel:+91${student.phone}`}
                              className="text-neutral-300 hover:text-[#587731] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-[#587731]" />
                              <span>+91 {student.phone}</span>
                            </a>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {student.email ? (
                            <span className="truncate block max-w-[180px] text-neutral-400" title={student.email}>
                              {student.email}
                            </span>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          <span className={isLight ? 'text-[#243315]' : 'text-neutral-300'}>
                            {student.enrolledCourseName || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold text-neutral-400">
                          {student.assignedDate || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingStudent(student)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isLight
                                  ? 'border-[#E5DCBE] text-[#243315] hover:border-[#587731] hover:text-[#587731]'
                                  : 'border-neutral-700 text-neutral-300 hover:border-[#587731] hover:text-[#8CB752]'
                              }`}
                              title="View complete student details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowTransfer(student, 1)}
                              className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                                isLight
                                  ? 'bg-[#FAF6EE] text-[#243315] border-[#E5DCBE] hover:bg-[#587731] hover:text-[#FAF6EE]'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-[#587731] hover:text-[#FAF6EE]'
                              }`}
                              title="Move back to Phase 1 (Keval)"
                            >
                              ← Phase 1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowTransfer(student, 3)}
                              className="px-2.5 py-1 text-xs font-black rounded-lg bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 hover:bg-[#587731] hover:text-[#FAF6EE] transition-all cursor-pointer"
                              title="Move to Phase 3 (Shweta)"
                            >
                              → Phase 3
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

        {/* Phase 2 Mobile Cards List */}
        <div className={`md:hidden divide-y ${isLight ? 'divide-[#E5DCBE]' : 'divide-neutral-800'}`}>
          {phase2Students.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-bold">
              No students currently assigned to Phase 2.
            </div>
          ) : (
            phase2Students
              .slice((phase2Page - 1) * pageSize, phase2Page * pageSize)
              .map((student, idx) => (
                <div key={student.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`font-black text-sm ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>{student.name}</div>
                      <div className="text-[11px] font-mono text-[#587731] dark:text-[#8CB752] mt-0.5">{student.id}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-bold">
                      #{(phase2Page - 1) * pageSize + idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1 text-neutral-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                      <span className="truncate">{student.enrolledCourseName || '-'}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                        <span>+91 {student.phone}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-1.5 font-mono truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono pt-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>Assigned: {student.assignedDate || '-'}</span>
                    </div>
                  </div>

                  <div className={`pt-2 flex items-center justify-between gap-2 border-t ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800'}`}>
                    <button
                      type="button"
                      onClick={() => setViewingStudent(student)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        isLight ? 'border-[#E5DCBE] text-[#243315]' : 'border-neutral-700 text-neutral-300'
                      }`}
                    >
                      View Details
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickRowTransfer(student, 1)}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                          isLight ? 'bg-[#FAF6EE] text-[#243315] border-[#E5DCBE]' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        ← Phase 1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRowTransfer(student, 3)}
                        className="px-2.5 py-1 text-xs font-black rounded-lg bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30"
                      >
                        → Phase 3
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Phase 2 Pagination */}
        {phase2Students.length > pageSize && (
          <div
            className={`p-3 border-t flex items-center justify-between text-xs font-bold ${
              isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950 border-[#2C3D21]'
            }`}
          >
            <span>
              Showing {(phase2Page - 1) * pageSize + 1}–{Math.min(phase2Page * pageSize, phase2Students.length)} of {phase2Students.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={phase2Page === 1}
                onClick={() => setPhase2Page(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={phase2Page * pageSize >= phase2Students.length}
                onClick={() => setPhase2Page(p => p + 1)}
                className="px-2.5 py-1 rounded border border-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          TABLE 3: PHASE 3 — SHWETA
          ======================================================== */}
      <section
        ref={phase3Ref}
        className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
          isLight ? 'bg-white border-[#E5DCBE]' : 'bg-[#182214]/90 border-[#2C3D21]'
        }`}
      >
        <div
          className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? 'bg-[#F5EFDF] border-[#E5DCBE]' : 'bg-neutral-950/80 border-[#2C3D21]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-7 h-7 rounded-lg bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] font-black text-xs flex items-center justify-center">
                3
              </span>
              <h2
                className={`text-lg sm:text-xl font-black tracking-tight ${
                  isLight ? 'text-[#19240E]' : 'text-neutral-100'
                }`}
              >
                Phase 3 — Shweta
              </h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30">
                {phase3Students.length} Students
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#243315] font-semibold' : 'text-neutral-400'}`}>
              Shows only students assigned to Phase 3. Moving a student here removes them from Phases 1 and 2.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="Search in Phase 3..."
              value={phase3Search}
              onChange={e => {
                setPhase3Search(e.target.value);
                setPhase3Page(1);
              }}
              className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-[#587731] w-40 sm:w-48 ${
                isLight
                  ? 'bg-white border-[#E5DCBE] text-[#19240E]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            />

            <button
              type="button"
              onClick={() => handleExportPhaseExcel(3)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-[#FAF6EE] text-[#243315] border-[#E5DCBE] hover:border-[#587731]'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-[#587731]'
              }`}
              title="Export Phase 3 records to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#587731] dark:text-[#8CB752]" />
              <span>Export</span>
            </button>

            {/* Individual Save Button for Phase 3 (Olive & Beige Theme) */}
            <button
              type="button"
              disabled={isSavingPhase3 || pendingByPhase.p3 === 0}
              onClick={() => handleSavePhase(3)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer ${
                pendingByPhase.p3 > 0
                  ? 'bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] shadow-[#587731]/25 border border-[#486228] active:scale-95'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 border border-neutral-300 dark:border-neutral-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              {isSavingPhase3 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phase 3 — Save Changes {pendingByPhase.p3 > 0 ? `(${pendingByPhase.p3})` : ''}</span>
                </>
              )}
            </button>

            {pendingByPhase.p3 > 0 && (
              <button
                type="button"
                onClick={() => handleCancelPhasePending(3)}
                className="text-xs font-bold text-neutral-400 hover:text-rose-400 px-1 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Phase 3 Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead
              className={`text-xs uppercase tracking-wider font-black border-b sticky top-0 ${
                isLight ? 'bg-[#FAF6EE] text-[#19240E] border-[#E5DCBE]' : 'bg-neutral-950 text-neutral-300 border-[#2C3D21]'
              }`}
            >
              <tr>
                <th className="py-3.5 px-4 w-12 text-center font-black">No.</th>
                <th className="py-3.5 px-4 font-black">Student ID</th>
                <th className="py-3.5 px-4 font-black">Student Name</th>
                <th className="py-3.5 px-4 font-black">Contact</th>
                <th className="py-3.5 px-4 font-black">Email</th>
                <th className="py-3.5 px-4 font-black">Course</th>
                <th className="py-3.5 px-4 font-black">Assigned Date</th>
                <th className="py-3.5 px-4 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-neutral-100' : 'divide-neutral-800/70'}`}>
              {phase3Students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <User className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
                    <p className="font-bold text-sm">No students currently assigned to Phase 3 (Shweta).</p>
                  </td>
                </tr>
              ) : (
                phase3Students
                  .slice((phase3Page - 1) * pageSize, phase3Page * pageSize)
                  .map((student, idx) => {
                    const rowNumber = (phase3Page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          student.isPending ? 'bg-[#587731]/10' : isLight ? 'hover:bg-neutral-50' : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-xs font-bold text-neutral-400">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">
                          <span className="text-[#587731] dark:text-[#8CB752]">{student.id}</span>
                          {student.isPending && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-sm">
                          <div className={isLight ? 'text-[#19240E]' : 'text-neutral-100'}>
                            {student.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold">
                          {student.phone ? (
                            <a
                              href={`tel:+91${student.phone}`}
                              className="text-neutral-300 hover:text-[#587731] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-[#587731]" />
                              <span>+91 {student.phone}</span>
                            </a>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {student.email ? (
                            <span className="truncate block max-w-[180px] text-neutral-400" title={student.email}>
                              {student.email}
                            </span>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          <span className={isLight ? 'text-[#243315]' : 'text-neutral-300'}>
                            {student.enrolledCourseName || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold text-neutral-400">
                          {student.assignedDate || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingStudent(student)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isLight
                                  ? 'border-[#E5DCBE] text-[#243315] hover:border-[#587731] hover:text-[#587731]'
                                  : 'border-neutral-700 text-neutral-300 hover:border-[#587731] hover:text-[#8CB752]'
                              }`}
                              title="View complete student details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowTransfer(student, 1)}
                              className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                                isLight
                                  ? 'bg-[#FAF6EE] text-[#243315] border-[#E5DCBE] hover:bg-[#587731] hover:text-[#FAF6EE]'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-[#587731] hover:text-[#FAF6EE]'
                              }`}
                              title="Move back to Phase 1 (Keval)"
                            >
                              ← Phase 1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowTransfer(student, 2)}
                              className="px-2.5 py-1 text-xs font-black rounded-lg bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 hover:bg-[#587731] hover:text-[#FAF6EE] transition-all cursor-pointer"
                              title="Move to Phase 2 (Hiren)"
                            >
                              ← Phase 2
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

        {/* Phase 3 Mobile Cards List */}
        <div className={`md:hidden divide-y ${isLight ? 'divide-[#E5DCBE]' : 'divide-neutral-800'}`}>
          {phase3Students.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-bold">
              No students currently assigned to Phase 3.
            </div>
          ) : (
            phase3Students
              .slice((phase3Page - 1) * pageSize, phase3Page * pageSize)
              .map((student, idx) => (
                <div key={student.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`font-black text-sm ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>{student.name}</div>
                      <div className="text-[11px] font-mono text-[#587731] dark:text-[#8CB752] mt-0.5">{student.id}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-bold">
                      #{(phase3Page - 1) * pageSize + idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1 text-neutral-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                      <span className="truncate">{student.enrolledCourseName || '-'}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#587731] shrink-0" />
                        <span>+91 {student.phone}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-1.5 font-mono truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono pt-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>Assigned: {student.assignedDate || '-'}</span>
                    </div>
                  </div>

                  <div className={`pt-2 flex items-center justify-between gap-2 border-t ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800'}`}>
                    <button
                      type="button"
                      onClick={() => setViewingStudent(student)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        isLight ? 'border-[#E5DCBE] text-[#243315]' : 'border-neutral-700 text-neutral-300'
                      }`}
                    >
                      View Details
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickRowTransfer(student, 1)}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                          isLight ? 'bg-[#FAF6EE] text-[#243315] border-[#E5DCBE]' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        ← Phase 1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRowTransfer(student, 2)}
                        className="px-2.5 py-1 text-xs font-black rounded-lg bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30"
                      >
                        ← Phase 2
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Phase 3 Pagination */}
        {phase3Students.length > pageSize && (
          <div
            className={`p-3 border-t flex items-center justify-between text-xs font-bold ${
              isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950 border-[#2C3D21]'
            }`}
          >
            <span>
              Showing {(phase3Page - 1) * pageSize + 1}–{Math.min(phase3Page * pageSize, phase3Students.length)} of {phase3Students.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={phase3Page === 1}
                onClick={() => setPhase3Page(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={phase3Page * pageSize >= phase3Students.length}
                onClick={() => setPhase3Page(p => p + 1)}
                className="px-2.5 py-1 rounded border border-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CONFIRMATION MODAL BEFORE APPLYING TRANSFERS */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-[#E5DCBE] text-[#19240E]'
                : 'bg-neutral-900 border-[#2C3D21] text-neutral-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#587731]/20 text-[#587731] dark:text-[#8CB752] flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Confirm Phase Assignment</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Target: <strong className="text-[#587731] dark:text-[#8CB752]">Phase {confirmModalData.targetPhase} — {confirmModalData.targetPerson}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 max-h-48 overflow-y-auto ${
                isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950 border-[#2C3D21]'
              }`}
            >
              <div className="font-bold text-neutral-400 uppercase tracking-wider text-[10px]">
                {confirmModalData.studentsToMove.length} Student(s) to be reassigned:
              </div>
              <div className="space-y-1.5 divide-y divide-neutral-800/40">
                {confirmModalData.studentsToMove.map(s => (
                  <div key={s.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <span className="font-bold truncate">{s.name}</span>
                    <span className="font-mono text-[10px] text-neutral-400 shrink-0">
                      Phase {s.currentPhase} → Phase {confirmModalData.targetPhase}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-[11px] font-semibold leading-relaxed ${
              isLight
                ? 'bg-[#F5EFDF] border-[#E5DCBE] text-[#243315]'
                : 'bg-[#587731]/15 border-[#587731]/30 text-neutral-200'
            }`}>
              <strong>Essential Rule:</strong> Moving students assigns them exclusively to Phase {confirmModalData.targetPhase} ({confirmModalData.targetPerson}) and removes them from previous phases. Course, fees, and invoice records remain 100% intact.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  isLight ? 'border-[#E5DCBE] hover:bg-[#FAF6EE]' : 'border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-2 text-xs font-black rounded-xl bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] shadow-md transition-all cursor-pointer"
              >
                Confirm &amp; Stage for Phase {confirmModalData.targetPhase}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DETAILS INSPECTION MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isLight
                ? 'bg-white border-[#E5DCBE] text-[#19240E]'
                : 'bg-neutral-900 border-[#2C3D21] text-neutral-100'
            }`}
          >
            <div className={`flex items-start justify-between gap-3 border-b pb-3 ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#587731] to-[#7EA746] text-[#FAF6EE] flex items-center justify-center text-base font-black shrink-0 shadow-md">
                  {viewingStudent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">{viewingStudent.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-bold text-[#587731] dark:text-[#8CB752]">{viewingStudent.id}</span>
                    {viewingStudent.enrollmentId && (
                      <span className="text-xs font-mono text-neutral-400">· {viewingStudent.enrollmentId}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="text-neutral-400 hover:text-neutral-200 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Phase Badge */}
            {(() => {
              const pInfo = getPhaseForStudent(viewingStudent);
              return (
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-[#182214]/80 border-[#2C3D21]'
                }`}>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#587731] dark:text-[#8CB752]">
                      Active Phase Assignment
                    </div>
                    <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                      Phase {pInfo.phase} — {pInfo.assignedPerson}
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-neutral-400">
                    <div>Assigned On:</div>
                    <div className="font-bold text-neutral-200">{pInfo.assignedAt}</div>
                  </div>
                </div>
              );
            })()}

            {/* Student Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950/60 border-neutral-800'}`}>
                <div className="text-neutral-500 font-bold">Contact Number</div>
                <div className={`font-mono font-bold mt-1 ${isLight ? 'text-[#19240E]' : 'text-neutral-200'}`}>
                  {viewingStudent.phone ? `+91 ${viewingStudent.phone}` : '-'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950/60 border-neutral-800'}`}>
                <div className="text-neutral-500 font-bold">Email Address</div>
                <div className={`font-mono font-bold mt-1 truncate ${isLight ? 'text-[#19240E]' : 'text-neutral-200'}`} title={viewingStudent.email}>
                  {viewingStudent.email || '-'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950/60 border-neutral-800'}`}>
                <div className="text-neutral-500 font-bold">Enrolled Course</div>
                <div className={`font-bold mt-1 ${isLight ? 'text-[#19240E]' : 'text-neutral-200'}`}>{viewingStudent.enrolledCourseName}</div>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950/60 border-neutral-800'}`}>
                <div className="text-neutral-500 font-bold">Admission Date</div>
                <div className={`font-mono font-bold mt-1 ${isLight ? 'text-[#19240E]' : 'text-neutral-200'}`}>{viewingStudent.enrollmentDate || '-'}</div>
              </div>
            </div>

            {/* Fee & Financial Summary */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${isLight ? 'bg-[#FAF6EE] border-[#E5DCBE]' : 'bg-neutral-950 border-neutral-800'}`}>
              <div className="flex items-center justify-between font-bold text-neutral-400 text-[11px]">
                <span>Tuition Ledger</span>
                <span className="uppercase font-mono px-2 py-0.5 rounded bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] font-black">
                  {viewingStudent.paymentStatus}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                <div>
                  <div className="text-neutral-500 text-[10px]">Agreed Fee</div>
                  <div className={`font-black text-sm ${isLight ? 'text-[#19240E]' : 'text-neutral-200'}`}>
                    ₹{(viewingStudent.agreedFee || 5000).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">Paid</div>
                  <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                    ₹{(viewingStudent.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">Balance</div>
                  <div className="font-black text-sm text-rose-600 dark:text-rose-400">
                    ₹{Math.max(0, (viewingStudent.agreedFee || 5000) - (viewingStudent.totalPaid || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Reassignment Quick Actions */}
            <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800'}`}>
              <div className="text-xs font-bold text-neutral-400">Quick Phase Transfer:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRowTransfer(viewingStudent, 1);
                    setViewingStudent(null);
                  }}
                  className="px-3 py-2 text-xs font-black rounded-xl bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 hover:bg-[#587731] hover:text-[#FAF6EE] transition-all cursor-pointer text-center"
                >
                  Phase 1 (Keval)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRowTransfer(viewingStudent, 2);
                    setViewingStudent(null);
                  }}
                  className="px-3 py-2 text-xs font-black rounded-xl bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 hover:bg-[#587731] hover:text-[#FAF6EE] transition-all cursor-pointer text-center"
                >
                  Phase 2 (Hiren)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRowTransfer(viewingStudent, 3);
                    setViewingStudent(null);
                  }}
                  className="px-3 py-2 text-xs font-black rounded-xl bg-[#587731]/15 text-[#587731] dark:text-[#8CB752] border border-[#587731]/30 hover:bg-[#587731] hover:text-[#FAF6EE] transition-all cursor-pointer text-center"
                >
                  Phase 3 (Shweta)
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#FAF6EE] hover:bg-[#F5EFDF] text-[#243315] border border-[#E5DCBE]'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
