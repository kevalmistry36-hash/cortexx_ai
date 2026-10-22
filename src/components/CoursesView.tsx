import React, { useState } from 'react';
import { Course } from '../types';
import { saveCourse, deleteCourse } from '../services/storage';
import { BookOpen, CheckCircle, Clock, Plus, Sparkles, Edit3, Trash2, Award, Users, X, AlertTriangle, Youtube } from 'lucide-react';

interface CoursesViewProps {
  courses: Course[];
  onOpenAddCourse?: () => void;
  onLaunchAdStudioForCourse: (course: Course) => void;
  onEnrollInCourse: (course: Course) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  theme?: 'light' | 'dark';
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  onLaunchAdStudioForCourse,
  onEnrollInCourse,
  isAddModalOpen = false,
  onCloseAddModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [showModal, setShowModal] = useState(isAddModalOpen);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('1 Month');
  const [mode, setMode] = useState('100% Online');
  const [fee, setFee] = useState<number>(6000);
  const [certificateIncluded, setCertificateIncluded] = useState(true);
  const [description, setDescription] = useState('');
  const [modulesText, setModulesText] = useState('');
  const [formError, setFormError] = useState('');

  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingCourse(null);
    setName('');
    setDuration('1 Month');
    setMode('100% Online');
    setFee(6000);
    setCertificateIncluded(true);
    setDescription('');
    setModulesText('01. AI Tools & Productivity\n02. Prompt Engineering\n03. AI Image Generation\n04. AI Video Generation\n05. AI Voice & Audio\n06. AI Content Creation\n07. AI Automation\n08. AI Agents\n09. AI for Business & Marketing\n10. Real-World Projects');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setDuration(course.duration);
    setMode(course.mode);
    setFee(course.fee);
    setCertificateIncluded(course.certificateIncluded);
    setDescription(course.description || '');
    setModulesText(course.modules.join('\n'));
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Course title is required.');
      return;
    }

    const modules = modulesText
      .split('\n')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (modules.length === 0) {
      setFormError('Please provide at least 1 curriculum module.');
      return;
    }

    const courseData: Course = {
      id: editingCourse ? editingCourse.id : `course-${Date.now()}`,
      name: name.trim(),
      duration: duration.trim(),
      mode: mode.trim(),
      fee: Number(fee) || 0,
      certificateIncluded,
      description: description.trim(),
      modules,
    };

    saveCourse(courseData);
    handleCloseModal();
  };

  const handleInitiateDelete = (course: Course) => {
    setCourseToDelete(course);
  };

  const handleConfirmDelete = () => {
    if (!courseToDelete) return;
    deleteCourse(courseToDelete.id);
    setCourseToDelete(null);
  };

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

  const certifiedCount = courses.filter(c => c.certificateIncluded).length;
  const totalModules = courses.reduce((sum, c) => sum + (c.modules?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header - Matches Dashboard Command Center */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b ${isLight ? 'border-neutral-300' : 'border-neutral-800/80'}`}>
        <div>
          <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-neutral-100'}`}>
            Course Curriculum Catalog
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-black font-bold' : 'text-neutral-400'}`}>
            Cortexx AI Institute · <span className="text-orange-600 dark:text-orange-500 font-black">Practical AI Modules, Pricing & Syllabus</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition-colors shrink-0 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Courses Section 4 KPI Cards - Identical Appearance to Dashboard Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Courses */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Total Courses">📚</span>
              <span className={kpiTitleClass}>Total Courses</span>
            </div>
            <div className={kpiIconBoxClass}>
              <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{courses.length}</span>
            <span className={kpiBadgeClass}>Live</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-neutral-300'}>Active Academic Programs</span>
          </div>
        </div>

        {/* KPI 2: Flagship Program */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Flagship Program">⚡</span>
              <span className={kpiTitleClass}>Flagship Program</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>1-Month</span>
            <span className={kpiBadgeClass}>Practical AI</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-neutral-300'}>Hands-on Masterclass</span>
          </div>
        </div>

        {/* KPI 3: Certifications */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Certifications">📜</span>
              <span className={kpiTitleClass}>Certifications</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{certifiedCount}</span>
            <span className={kpiBadgeClass}>Included</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-amber-400'}>QR Verified Credentials</span>
          </div>
        </div>

        {/* KPI 4: Practical Modules */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="kpi-emoji text-lg select-none shrink-0" role="img" aria-label="Practical Modules">💡</span>
              <span className={kpiTitleClass}>Practical Modules</span>
            </div>
            <div className={kpiIconBoxClass}>
              <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>{totalModules}</span>
            <span className={kpiBadgeClass}>Topics</span>
          </div>
          <div className={kpiSubtextClass}>
            <span className={isLight ? 'text-black font-extrabold' : 'text-neutral-300'}>Curriculum Breakdown</span>
          </div>
        </div>
      </div>

      {/* Courses Grid - Dashboard Card Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {courses.map((course, idx) => {
          const isFlagship = idx === 0 || course.name.toLowerCase().includes('1-month practical ai');

          return (
            <div
              key={course.id}
              className={`flex flex-col justify-between border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 ${
                isLight
                  ? `bg-[#FAF6EE] border-2 ${isFlagship ? 'border-[#587731] shadow-md hover:shadow-xl' : 'border-[#E5DCBE] shadow-sm hover:shadow-lg'} text-[#243315]`
                  : `bg-[#182214]/90 ${isFlagship ? 'border-[#587731]/70 shadow-lg shadow-[#587731]/20 hover:border-[#587731]' : 'border-[#2C3D21] hover:border-neutral-700 hover:shadow-lg'} text-neutral-100`
              }`}
            >
              {isFlagship && (
                <div className="absolute top-0 right-0 bg-[#587731] text-[#FAF6EE] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
                  Flagship Program
                </div>
              )}

              <div>
                {/* Course Metadata Strip */}
                <div className="flex items-center gap-2 text-xs font-mono font-black">
                  <span className={isLight ? 'text-[#243315]' : 'text-neutral-300'}>{course.duration}</span>
                  <span className={isLight ? 'text-[#587731]' : 'text-neutral-600'}>·</span>
                  <span className={isLight ? 'text-[#243315]' : 'text-neutral-300'}>{course.mode}</span>
                  {course.certificateIncluded && (
                    <>
                      <span className={isLight ? 'text-[#587731]' : 'text-neutral-600'}>·</span>
                      <span className={`flex items-center gap-1 font-black ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                        <Award className="w-3.5 h-3.5" /> Certificate
                      </span>
                    </>
                  )}
                </div>

                {/* Course Title & Fee */}
                <h3 className={`text-xl font-black mt-2 leading-snug tracking-tight ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                  {course.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono tabular-nums ${isLight ? 'text-[#19240E]' : 'text-neutral-100'}`}>
                    ₹{course.fee.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-xs font-black ${isLight ? 'text-[#587731]' : 'text-neutral-400'}`}>All-Inclusive</span>
                </div>

                <p className={`text-xs mt-3 line-clamp-2 leading-relaxed font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-300'}`}>
                  {course.description}
                </p>

                {/* Module List (Interactive Numbered Roadmap) */}
                <div className={`mt-5 pt-4 border-t ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800/80'}`}>
                  <div className={`text-xs font-black uppercase tracking-wider mb-2.5 flex items-center justify-between ${isLight ? 'text-[#243315]' : 'text-neutral-300'}`}>
                    <span>Curriculum Syllabus</span>
                    <span className={`font-mono text-[11px] font-black ${isLight ? 'text-[#587731]' : 'text-neutral-400'}`}>{course.modules.length} Modules</span>
                  </div>

                  <ul className={`space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs font-bold ${isLight ? 'text-[#243315]' : 'text-neutral-200'}`}>
                    {course.modules.map((mod, modIdx) => (
                      <li key={modIdx} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-[#587731]/10 transition-colors">
                        <span className="w-5 h-5 rounded-md bg-[#587731]/15 border border-[#587731]/30 text-[#587731] dark:text-[#8CB752] font-mono text-[10px] flex items-center justify-center shrink-0 font-black">
                          {modIdx + 1 < 10 ? `0${modIdx + 1}` : modIdx + 1}
                        </span>
                        <span className={`truncate text-xs ${isLight ? 'text-[#243315] font-bold' : 'text-neutral-200'}`}>
                          {mod.replace(/^\d+[\.\s]+/, '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`mt-6 pt-4 border-t flex flex-col gap-2 ${isLight ? 'border-[#E5DCBE]' : 'border-neutral-800'}`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEnrollInCourse(course)}
                    className="flex-1 py-2 px-3 bg-[#587731] hover:bg-[#486228] text-[#FAF6EE] text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Enroll Student</span>
                  </button>

                  <button
                    onClick={() => onLaunchAdStudioForCourse(course)}
                    className={`flex-1 py-2 px-3 border text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isLight
                        ? 'bg-red-50 hover:bg-red-100 text-red-900 border-red-200'
                        : 'bg-red-600/15 hover:bg-red-600/25 border-red-500/30 text-red-300'
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>Watch Video</span>
                  </button>
                </div>

                <div className={`flex items-center justify-end gap-2 pt-1 text-xs font-bold ${isLight ? 'text-black' : 'text-neutral-500'}`}>
                  <button
                    onClick={() => openEditModal(course)}
                    className={`flex items-center gap-1 cursor-pointer ${isLight ? 'text-black font-black hover:text-orange-600' : 'hover:text-neutral-300'}`}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  {courses.length > 1 && (
                    <button
                      onClick={() => handleInitiateDelete(course)}
                      className="hover:text-rose-500 flex items-center gap-1 cursor-pointer font-black"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-100">
                {editingCourse ? 'Edit Course Curriculum' : 'Add New Course'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-200 p-1">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 1-Month Practical AI Course"
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="1 Month"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Mode
                  </label>
                  <input
                    type="text"
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                    placeholder="100% Online"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Standard Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="certCheck"
                  checked={certificateIncluded}
                  onChange={e => setCertificateIncluded(e.target.checked)}
                  className="rounded border-neutral-700 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="certCheck" className="text-xs text-neutral-300">
                  Official Course Certificate Included upon Completion
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Course Overview Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Hands-on practical AI mastery from foundation to agentic tools."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Curriculum Modules (1 per line) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={modulesText}
                  onChange={e => setModulesText(e.target.value)}
                  placeholder="01. AI Tools & Productivity&#10;02. Prompt Engineering&#10;03. AI Image Generation..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

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
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">Delete Course</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Are you sure you want to remove this course from the catalog?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCourseToDelete(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-950 border border-neutral-800/90 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Course Name:</span>
                <span className="font-bold text-neutral-100 text-sm">{courseToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Duration:</span>
                <span className="text-neutral-300">{courseToDelete.duration}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Fee:</span>
                <span className="text-orange-400 font-semibold">₹{courseToDelete.fee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Curriculum Modules:</span>
                <span className="text-neutral-300 font-mono">{courseToDelete.modules.length} Modules</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
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
                <span>Yes, Delete Course</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
