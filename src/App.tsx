import React, { useState, useEffect } from 'react';
import { Student, Course, Invoice, PaymentReceipt } from './types';
import {
  getCourses,
  getStudents,
  getInvoices,
  getReceipts,
  subscribeToDbChanges,
  isAdminAuthenticated,
  setAdminAuthenticated,
} from './services/storage';
import {
  fetchAndSyncAllDataFromFirebase,
  subscribeToAllFirebaseRealtime,
} from './services/firebase';
import { Navbar, NavView } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { CoursesView } from './components/CoursesView';
import { InvoicesView } from './components/InvoicesView';
import { BannerStudioView } from './components/BannerStudioView';
import { CertificatesView } from './components/CertificatesView';
import { CertificateVerificationGateway } from './components/CertificateVerificationGateway';
import { InvoiceModal } from './components/InvoiceModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminLockModal } from './components/AdminLockModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);

  // Public Certificate Verification Gateway state (?verify=...)
  const [verifyParam, setVerifyParam] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('verify') || params.get('v');
      if (code !== null) return code;
      if (window.location.hash.includes('verify=')) {
        const match = window.location.hash.match(/verify=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Protected Portal Access: App strictly requires PIN entry on initial load
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => false);

  // Modals & Overlays
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);

  // Theme Management (Dark Mode vs White & Orange Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cortexx_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('cortexx_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Inspector modaled items
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState<Student | null>(null);
  const [courseForAdStudio, setCourseForAdStudio] = useState<Course | null>(null);

  // Load Database State & background sync
  const reloadData = () => {
    setCourses(getCourses());
    setStudents(getStudents());
    setInvoices(getInvoices());
    setReceipts(getReceipts());
  };

  useEffect(() => {
    reloadData();
    const unsubscribeDb = subscribeToDbChanges(() => {
      reloadData();
    });

    // 1. Initial Cloud Boot Sync: Fetch all Students, Courses, Invoices, Receipts, and Certificates from Firebase Firestore
    fetchAndSyncAllDataFromFirebase()
      .then(() => reloadData())
      .catch(err => console.warn('Firebase initial sync note:', err));

    // 2. Realtime Subscription: Listen for changes across all Firestore collections in real-time
    const unsubscribeRealtime = subscribeToAllFirebaseRealtime(() => {
      reloadData();
    });

    return () => {
      unsubscribeDb();
      unsubscribeRealtime();
    };
  }, []);

  // Listen for browser popstate or verification navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('verify') || params.get('v');
      setVerifyParam(code);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Transition from public verification gateway to institute dashboard (requires authentication)
  const handleExitVerificationGateway = () => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, '', cleanUrl);
    setVerifyParam(null);
    setAdminAuthenticated(true);
    setIsAuthenticated(true);
    setActiveView('dashboard');
  };

  // Lock Admin Session
  const handleLockAdmin = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
  };

  // Quick Action Handlers
  const handleOpenAddStudent = () => {
    setIsAddStudentOpen(true);
    setActiveView('students');
  };

  const handleOpenAddCourse = () => {
    setIsAddCourseOpen(true);
    setActiveView('courses');
  };

  const handleOpenGenerateInvoice = () => {
    setSelectedStudentForInvoice(null);
    setIsGenerateInvoiceOpen(true);
    setActiveView('invoices');
  };

  const handleGenerateInvoiceForStudent = (student: Student) => {
    setSelectedStudentForInvoice(student);
    setIsGenerateInvoiceOpen(true);
    setActiveView('invoices');
  };

  const handleRecordPaymentForStudent = (student: Student) => {
    const matchingInvoice = invoices.find(i => i.studentId === student.id);
    if (matchingInvoice) {
      setActiveInvoice(matchingInvoice);
    }
    setActiveView('invoices');
  };

  const handleLaunchAdStudioForCourse = (course: Course) => {
    setCourseForAdStudio(course);
    setActiveView('ad-studio');
  };

  const handleEnrollInCourse = (course: Course) => {
    setIsAddStudentOpen(true);
    setActiveView('students');
  };

  // 1. If ?verify= parameter is detected in the URL, render the dedicated public verification gateway
  if (verifyParam !== null) {
    return (
      <CertificateVerificationGateway
        initialCode={verifyParam}
        onGoToPortal={handleExitVerificationGateway}
      />
    );
  }

  // 2. PIN-based authentication gate: App is strictly accessible only after entering Admin PIN
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#fafafc]' : 'bg-neutral-950'} flex flex-col font-sans`}>
        <AdminLockModal
          isOpen={true}
          isMandatoryGate={true}
          onUnlock={() => {
            setAdminAuthenticated(true);
            setIsAuthenticated(true);
          }}
          onGoToVerification={() => {
            setVerifyParam('');
          }}
          title="Admin Authentication Required"
          description="Enter 4-digit PIN to access institute management and records"
        />
      </div>
    );
  }

  // 3. Authenticated Dashboard & Management Portal
  return (
    <div
      className={`min-h-screen ${
        theme === 'light' ? 'bg-[#fafafc] text-neutral-900' : 'bg-neutral-950 text-neutral-100'
      } flex flex-col font-sans transition-colors duration-200 w-full max-w-full overflow-x-hidden`}
    >
      {/* Top Bar Navigation with Theme Switcher right near Admin Lock */}
      <Navbar
        activeView={activeView}
        onSelectView={setActiveView}
        onLockAdmin={handleLockAdmin}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLocked={false}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Viewport - Safely bounded to screen width with bottom spacing for mobile navbar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
        {activeView === 'dashboard' && (
          <DashboardView
            students={students}
            courses={courses}
            invoices={invoices}
            receipts={receipts}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenAddCourse={handleOpenAddCourse}
            onOpenGenerateInvoice={handleOpenGenerateInvoice}
            onNavigateToView={view => setActiveView(view)}
            onSelectInvoice={inv => setActiveInvoice(inv)}
            theme={theme}
          />
        )}

        {activeView === 'students' && (
          <StudentsView
            students={students}
            courses={courses}
            onGenerateInvoiceForStudent={handleGenerateInvoiceForStudent}
            onRecordPaymentForStudent={handleRecordPaymentForStudent}
            isAddModalOpen={isAddStudentOpen}
            onCloseAddModal={() => setIsAddStudentOpen(false)}
          />
        )}

        {activeView === 'courses' && (
          <CoursesView
            courses={courses}
            onOpenAddCourse={handleOpenAddCourse}
            onLaunchAdStudioForCourse={handleLaunchAdStudioForCourse}
            onEnrollInCourse={handleEnrollInCourse}
            isAddModalOpen={isAddCourseOpen}
            onCloseAddModal={() => setIsAddCourseOpen(false)}
          />
        )}

        {activeView === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            receipts={receipts}
            students={students}
            courses={courses}
            preSelectedStudent={selectedStudentForInvoice}
            onOpenInvoiceModal={inv => setActiveInvoice(inv)}
            onOpenReceiptModal={rec => setActiveReceipt(rec)}
            isCreateModalOpen={isGenerateInvoiceOpen}
            onCloseCreateModal={() => {
              setIsGenerateInvoiceOpen(false);
              setSelectedStudentForInvoice(null);
            }}
          />
        )}

        {activeView === 'certificates' && (
          <CertificatesView
            students={students}
            courses={courses}
            onOpenVerificationGateway={code => setVerifyParam(code)}
          />
        )}

        {activeView === 'ad-studio' && (
          <BannerStudioView courses={courses} initialCourse={courseForAdStudio} />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500 font-mono no-print mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Cortexx AI Institute · Where Thinking Meets Technology</span>
          <span>Contact: +91 7984691082 · info.cortexx@gmail.com</span>
        </div>
      </footer>

      {/* A4 Vector Invoice Modal */}
      <InvoiceModal invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />

      {/* A4 Payment Receipt Modal */}
      <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />

      {/* System Settings & Cloud Sync Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
