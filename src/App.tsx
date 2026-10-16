import React, { useState, useEffect } from 'react';
import { Student, Course, Invoice, PaymentReceipt } from './types';
import {
  getCourses,
  getStudents,
  getInvoices,
  getReceipts,
  subscribeToDbChanges,
} from './services/storage';
import { Navbar, NavView } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { CoursesView } from './components/CoursesView';
import { InvoicesView } from './components/InvoicesView';
import { BannerStudioView } from './components/BannerStudioView';
import { InvoiceModal } from './components/InvoiceModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminLockModal } from './components/AdminLockModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);

  // Modals & Overlays
  const [isLocked, setIsLocked] = useState(false);
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

  // Load Database State
  const reloadData = () => {
    setCourses(getCourses());
    setStudents(getStudents());
    setInvoices(getInvoices());
    setReceipts(getReceipts());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToDbChanges(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

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
    // Find matching invoice or switch to invoices
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

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#fafafc] text-neutral-900' : 'bg-neutral-950 text-neutral-100'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Bar Navigation with Theme Switcher right near Admin Lock */}
      <Navbar
        activeView={activeView}
        onSelectView={setActiveView}
        onLockAdmin={() => setIsLocked(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLocked={isLocked}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
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

        {activeView === 'ad-studio' && (
          <BannerStudioView
            courses={courses}
            initialCourse={courseForAdStudio}
          />
        )}
      </main>

      {/* Footer Branding (Quiet and Anti-Slop) */}
      <footer className="mt-auto border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500 font-mono no-print mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Cortexx AI Institute · Where Thinking Meets Technology</span>
          <span>Contact: +91 7984691082 · info.cortexx@gmail.com</span>
        </div>
      </footer>

      {/* A4 Vector Invoice Modal */}
      <InvoiceModal
        invoice={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

      {/* A4 Payment Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Admin Passcode Gatekeeper */}
      <AdminLockModal
        isOpen={isLocked}
        onUnlock={() => setIsLocked(false)}
        onBack={() => setIsLocked(false)}
      />

      {/* System Settings & Cloud Sync Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
