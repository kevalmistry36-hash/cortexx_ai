import { Student, Course, Invoice, PaymentReceipt, PaymentMethod, PaymentStatus, CertificateRecord } from '../types';
import { INITIAL_COURSES, INITIAL_STUDENTS, INITIAL_INVOICES, INITIAL_RECEIPTS } from '../constants/initialData';

const STORAGE_KEYS = {
  COURSES: 'cortexx_courses_v1',
  STUDENTS: 'cortexx_students_v1',
  INVOICES: 'cortexx_invoices_v1',
  RECEIPTS: 'cortexx_receipts_v1',
  CERTIFICATES: 'cortexx_certificates_v1',
  DEACTIVATED_STUDENTS: 'cortexx_deactivated_students_v1',
  ADMIN_PIN: 'cortexx_admin_pin_v1',
  SUPABASE_CONFIG: 'cortexx_supabase_config_v1',
};

const DB_EVENT = 'cortexx-db-change';

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_EVENT));
  }
}

export function subscribeToDbChanges(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DB_EVENT, callback);
  return () => window.removeEventListener(DB_EVENT, callback);
}

// ----------------- Courses -----------------
export function getCourses(): Course[] {
  if (typeof window === 'undefined') return INITIAL_COURSES;
  const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
    return INITIAL_COURSES;
  }
  try {
    let courses: Course[] = JSON.parse(raw);
    const hasSixWeekCourse = courses.some(c => c.id === 'course-ai-agents-02' || c.duration.toLowerCase().includes('6 week'));
    const needs5000Update = courses.some(c => c.fee === 5000 && (!c.modules.includes('01. AI Tools & Productivity') || c.modules.includes('08. AI Agents') || c.name === 'Advanced Generative Media & Creative AI'));

    if (hasSixWeekCourse || needs5000Update) {
      courses = courses.filter(c => c.id !== 'course-ai-agents-02' && !c.duration.toLowerCase().includes('6 week'));
      const course5000Index = courses.findIndex(c => c.fee === 5000 || c.id === 'course-practical-ai-foundation-02' || c.id === 'course-generative-media-03');
      const updated5000Course: Course = {
        id: 'course-practical-ai-foundation-02',
        name: 'Practical AI Foundation Course',
        duration: '1 Month',
        mode: '100% Online',
        fee: 5000,
        certificateIncluded: true,
        description: 'Core practical AI training covering tools, prompt engineering, generative image and video, voice synthesis, automation, business marketing, and real-world projects.',
        modules: [
          '01. AI Tools & Productivity',
          '02. Prompt Engineering',
          '03. AI Image Generation',
          '04. AI Video Generation',
          '05. AI Voice & Audio',
          '06. AI Content Creation',
          '07. AI Automation',
          '08. AI for Business & Marketing',
          '09. Real-World Projects',
        ],
      };
      if (course5000Index >= 0) {
        courses[course5000Index] = updated5000Course;
      } else {
        courses.push(updated5000Course);
      }
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    }
    return courses;
  } catch {
    return INITIAL_COURSES;
  }
}

export function saveCourse(course: Course): Course {
  const courses = getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index >= 0) {
    courses[index] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  emitChange();
  return course;
}

export function deleteCourse(courseId: string) {
  const courses = getCourses().filter(c => c.id !== courseId);
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  emitChange();
}

// ----------------- Students -----------------
export function getStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    let students: Student[] = JSON.parse(raw);
    const hasLegacyCourse = students.some(s => s.enrolledCourseId === 'course-ai-agents-02');
    if (hasLegacyCourse) {
      students = students.map(s => {
        if (s.enrolledCourseId === 'course-ai-agents-02') {
          return {
            ...s,
            enrolledCourseId: 'course-practical-ai-foundation-02',
            enrolledCourseName: 'Practical AI Foundation Course',
            agreedFee: 5000,
          };
        }
        return s;
      });
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
    return students;
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function getNextStudentId(): string {
  const students = getStudents();
  const year = new Date().getFullYear();
  let maxNum = 0;
  students.forEach(s => {
    const match = s.id.match(/COR-STU-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `COR-STU-${year}-${String(maxNum + 1).padStart(4, '0')}`;
}

export function getNextEnrollmentId(): string {
  const students = getStudents();
  const year = new Date().getFullYear();
  let maxNum = 0;
  students.forEach(s => {
    const match = s.enrollmentId?.match(/COR-ENR-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `COR-ENR-${year}-${String(maxNum + 1).padStart(4, '0')}`;
}

export function saveStudent(student: Student): Student {
  const students = getStudents();
  const index = students.findIndex(s => s.id === student.id);
  if (index >= 0) {
    students[index] = student;
  } else {
    students.unshift(student);
  }
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  // Sync matching invoice if exists, or auto-create one for newly admitted student
  const invoices = getInvoices();
  const invIndex = invoices.findIndex(i => i.studentId === student.id);
  const paid = student.totalPaid || 0;
  const agreedFee = student.agreedFee || 5000;
  const remaining = Math.max(0, agreedFee - paid);

  if (invIndex >= 0) {
    invoices[invIndex] = {
      ...invoices[invIndex],
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      courseName: student.enrolledCourseName,
      courseFee: agreedFee,
      totalPayable: agreedFee,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentStatus: student.paymentStatus,
    };
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } else {
    // Generate invoice for newly admitted student so financial books are completely accurate
    const invNumber = getNextInvoiceNumber();
    const newInv: Invoice = {
      invoiceNumber: invNumber,
      invoiceDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      enrollmentId: student.enrollmentId,
      courseName: student.enrolledCourseName,
      courseDuration: '1 Month',
      courseFee: agreedFee,
      discount: 0,
      totalPayable: agreedFee,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentMethod: 'UPI',
      paymentStatus: student.paymentStatus,
      notes: student.notes,
      createdAt: student.createdAt || new Date().toISOString(),
    };
    invoices.unshift(newInv);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

    if (paid > 0) {
      const receipts = getReceipts();
      const recNumber = getNextReceiptNumber();
      receipts.unshift({
        receiptNumber: recNumber,
        invoiceNumber: invNumber,
        studentId: student.id,
        studentName: student.name,
        paymentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
        amountReceived: paid,
        paymentMethod: 'UPI',
        remainingBalanceAfter: remaining,
        transactionRef: `ADM/${Date.now().toString().slice(-6)}/COR`,
        notes: 'Initial admission fee payment',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    }
  }

  emitChange();
  return student;
}

export function updateStudentFeeStatus(
  studentId: string,
  newStatus: PaymentStatus,
  customPaid?: number
): Student | null {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index === -1) return null;

  const current = students[index];
  const fee = current.agreedFee || 5000;
  let paid = current.totalPaid;

  if (customPaid !== undefined) {
    paid = customPaid;
  } else if (newStatus === 'paid') {
    paid = fee;
  } else if (newStatus === 'unpaid') {
    paid = 0;
  }

  const updated: Student = {
    ...current,
    paymentStatus: newStatus,
    totalPaid: paid,
  };

  students[index] = updated;
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  // Sync Invoice
  const invoices = getInvoices();
  const invIndex = invoices.findIndex(i => i.studentId === studentId);
  const remaining = Math.max(0, fee - paid);

  if (invIndex >= 0) {
    invoices[invIndex] = {
      ...invoices[invIndex],
      amountPaid: paid,
      remainingBalance: remaining,
      paymentStatus: newStatus,
    };
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } else {
    const invNumber = getNextInvoiceNumber();
    const newInv: Invoice = {
      invoiceNumber: invNumber,
      invoiceDate: current.enrollmentDate || new Date().toISOString().split('T')[0],
      studentId: current.id,
      studentName: current.name,
      studentPhone: current.phone,
      studentEmail: current.email,
      enrollmentId: current.enrollmentId,
      courseName: current.enrolledCourseName,
      courseDuration: '1 Month',
      courseFee: fee,
      discount: 0,
      totalPayable: fee,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentMethod: 'UPI',
      paymentStatus: newStatus,
      notes: `Fee status updated to ${newStatus}`,
      createdAt: new Date().toISOString(),
    };
    invoices.unshift(newInv);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }

  // Sync receipts if needed
  const receipts = getReceipts();
  if (newStatus === 'paid' && paid > 0) {
    const hasReceipt = receipts.some(r => r.studentId === studentId);
    if (!hasReceipt) {
      const inv = invoices.find(i => i.studentId === studentId);
      receipts.unshift({
        receiptNumber: getNextReceiptNumber(),
        invoiceNumber: inv?.invoiceNumber || 'COR-INV-SYNC',
        studentId: current.id,
        studentName: current.name,
        paymentDate: new Date().toISOString().split('T')[0],
        amountReceived: paid,
        paymentMethod: 'UPI',
        remainingBalanceAfter: 0,
        transactionRef: `STATUS/${Date.now().toString().slice(-6)}`,
        notes: 'Full payment cleared via Fee Status update',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    }
  } else if (newStatus === 'unpaid') {
    const filtered = receipts.filter(r => r.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(filtered));
  }

  emitChange();
  return updated;
}

export function deleteStudent(studentId: string, deleteAssociatedFinancials: boolean = true) {
  const students = getStudents().filter(s => s.id !== studentId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  if (deleteAssociatedFinancials) {
    const invoices = getInvoices().filter(i => i.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    const receipts = getReceipts().filter(r => r.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  }

  emitChange();
}

// ----------------- Certificates -----------------
export function getCertificates(): CertificateRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCertificate(cert: CertificateRecord): void {
  const certs = getCertificates();
  const index = certs.findIndex(c => c.id === cert.id || (c.studentId === cert.studentId && c.courseName === cert.courseName));
  if (index >= 0) {
    certs[index] = cert;
  } else {
    certs.unshift(cert);
  }
  localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));
  emitChange();
}

export function deleteCertificate(id: string): void {
  const certs = getCertificates().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));
  emitChange();
}

export function getNextCertificateNumber(): string {
  const certs = getCertificates();
  const year = new Date().getFullYear();
  const num = certs.length + 1;
  return `COR-CERT-${year}-${num.toString().padStart(4, '0')}`;
}

// ----------------- Deactivated Students Status -----------------
export function getDeactivatedStudents(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.DEACTIVATED_STUDENTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isStudentDeactivated(studentId?: string, studentName?: string): boolean {
  if (!studentId && !studentName) return false;
  const deactivated = getDeactivatedStudents();
  if (studentId && deactivated.includes(studentId)) return true;
  if (studentName && deactivated.includes(studentName.trim().toLowerCase())) return true;

  const students = getStudents();
  const found = students.find(
    s => (studentId && s.id === studentId) || (studentName && s.name.trim().toLowerCase() === studentName.trim().toLowerCase())
  );
  return !!(found?.isDeactivated || found?.status === 'deactivated');
}

export function toggleStudentDeactivated(studentId: string, studentName?: string): boolean {
  let deactivated = getDeactivatedStudents();
  const idKey = studentId;
  const nameKey = studentName ? studentName.trim().toLowerCase() : '';

  const isAlreadyDeactivated =
    (idKey ? deactivated.includes(idKey) : false) || (nameKey ? deactivated.includes(nameKey) : false);
  const nextStatus = !isAlreadyDeactivated;

  if (nextStatus) {
    if (idKey && !deactivated.includes(idKey)) deactivated.push(idKey);
    if (nameKey && !deactivated.includes(nameKey)) deactivated.push(nameKey);
  } else {
    deactivated = deactivated.filter(k => k !== idKey && k !== nameKey);
  }

  localStorage.setItem(STORAGE_KEYS.DEACTIVATED_STUDENTS, JSON.stringify(deactivated));

  // Sync students in storage
  const students = getStudents();
  let studentUpdated = false;
  const updatedStudents = students.map(s => {
    const matchesId = idKey && s.id === idKey;
    const matchesName = nameKey && s.name.trim().toLowerCase() === nameKey;
    if (matchesId || matchesName) {
      studentUpdated = true;
      return {
        ...s,
        isDeactivated: nextStatus,
        status: nextStatus ? ('deactivated' as const) : ('active' as const),
      };
    }
    return s;
  });
  if (studentUpdated) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
  }

  // Sync invoices in storage
  const invoices = getInvoices();
  let invoiceUpdated = false;
  const updatedInvoices = invoices.map(inv => {
    const matchesId = idKey && inv.studentId === idKey;
    const matchesName = nameKey && inv.studentName.trim().toLowerCase() === nameKey;
    if (matchesId || matchesName) {
      invoiceUpdated = true;
      return {
        ...inv,
        isStudentDeactivated: nextStatus,
      };
    }
    return inv;
  });
  if (invoiceUpdated) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));
  }

  // Sync receipts in storage
  const receipts = getReceipts();
  let receiptUpdated = false;
  const updatedReceipts = receipts.map(rec => {
    const matchesId = idKey && rec.studentId === idKey;
    const matchesName = nameKey && rec.studentName.trim().toLowerCase() === nameKey;
    if (matchesId || matchesName) {
      receiptUpdated = true;
      return {
        ...rec,
        isStudentDeactivated: nextStatus,
      };
    }
    return rec;
  });
  if (receiptUpdated) {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(updatedReceipts));
  }

  emitChange();
  return nextStatus;
}

export interface BulkStudentInput {
  name: string;
  phone: string;
  email: string;
  courseName?: string;
  enrolledCourseId?: string;
  enrollmentDate?: string;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export function bulkSaveStudents(items: BulkStudentInput[]): {
  addedCount: number;
  students: Student[];
} {
  const currentStudents = getStudents();
  const currentInvoices = getInvoices();
  const currentReceipts = getReceipts();
  const courses = getCourses();
  const defaultCourse = courses[0];
  const year = new Date().getFullYear();

  let maxStuNum = 0;
  currentStudents.forEach(s => {
    const match = s.id.match(/COR-STU-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxStuNum) maxStuNum = num;
    }
  });

  let maxEnrNum = 0;
  currentStudents.forEach(s => {
    const match = s.enrollmentId?.match(/COR-ENR-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxEnrNum) maxEnrNum = num;
    }
  });

  let maxInvNum = 0;
  currentInvoices.forEach(i => {
    const match = i.invoiceNumber.match(/COR-INV-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxInvNum) maxInvNum = num;
    }
  });

  let maxRecNum = 0;
  currentReceipts.forEach(r => {
    const match = r.receiptNumber.match(/COR-REC-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxRecNum) maxRecNum = num;
    }
  });

  const newStudents: Student[] = [];
  const newInvoices: Invoice[] = [];
  const newReceipts: PaymentReceipt[] = [];

  items.forEach(item => {
    maxStuNum++;
    maxEnrNum++;
    const studentId = `COR-STU-${year}-${String(maxStuNum).padStart(4, '0')}`;
    const enrollmentId = `COR-ENR-${year}-${String(maxEnrNum).padStart(4, '0')}`;

    let targetCourse = defaultCourse;
    if (item.enrolledCourseId) {
      const matched = courses.find(c => c.id === item.enrolledCourseId);
      if (matched) targetCourse = matched;
    } else if (item.courseName) {
      const lower = item.courseName.toLowerCase();
      const matched = courses.find(
        c =>
          c.name.toLowerCase().includes(lower) ||
          lower.includes(c.name.toLowerCase()) ||
          (lower.includes('5000') && c.fee === 5000) ||
          (lower.includes('foundation') && c.fee === 5000)
      );
      if (matched) targetCourse = matched;
    }

    const agreedFee = targetCourse.fee;
    const paid = Number(item.amountPaid) || 0;
    const remaining = Math.max(0, agreedFee - paid);

    let status: PaymentStatus = 'unpaid';
    if (remaining === 0 && paid > 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partially_paid';
    }

    const enrollmentDate = item.enrollmentDate || new Date().toISOString().split('T')[0];
    const paymentMethod: PaymentMethod = item.paymentMethod || 'UPI';

    const cleanPhone = item.phone.replace(/\D/g, '').slice(-10);

    const student: Student = {
      id: studentId,
      name: item.name.trim(),
      phone: cleanPhone || '9800000000',
      email: item.email.trim().toLowerCase(),
      enrolledCourseId: targetCourse.id,
      enrolledCourseName: targetCourse.name,
      enrollmentId,
      enrollmentDate,
      agreedFee,
      totalPaid: paid,
      paymentStatus: status,
      notes: item.notes?.trim() || 'Imported via Excel spreadsheet',
      createdAt: new Date().toISOString(),
    };

    newStudents.push(student);

    // Auto-create matching invoice
    maxInvNum++;
    const invoiceNumber = `COR-INV-${year}-${String(maxInvNum).padStart(4, '0')}`;
    const invoice: Invoice = {
      invoiceNumber,
      invoiceDate: enrollmentDate,
      studentId,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      enrollmentId,
      courseName: targetCourse.name,
      courseDuration: targetCourse.duration,
      courseFee: agreedFee,
      discount: 0,
      totalPayable: agreedFee,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentMethod,
      paymentStatus: status,
      notes: student.notes,
      createdAt: new Date().toISOString(),
    };
    newInvoices.push(invoice);

    // If paid > 0, generate initial payment receipt
    if (paid > 0) {
      maxRecNum++;
      const receiptNumber = `COR-REC-${year}-${String(maxRecNum).padStart(4, '0')}`;
      newReceipts.push({
        receiptNumber,
        invoiceNumber,
        studentId,
        studentName: student.name,
        paymentDate: enrollmentDate,
        amountReceived: paid,
        paymentMethod,
        remainingBalanceAfter: remaining,
        transactionRef: `EXCEL/${Date.now().toString().slice(-6)}/COR`,
        notes: 'Initial admission payment (Excel Bulk Import)',
        createdAt: new Date().toISOString(),
      });
    }
  });

  const updatedStudents = [...newStudents, ...currentStudents];
  const updatedInvoices = [...newInvoices, ...currentInvoices];
  const updatedReceipts = [...newReceipts, ...currentReceipts];

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));
  localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(updatedReceipts));
  emitChange();

  return { addedCount: newStudents.length, students: updatedStudents };
}

// ----------------- Invoices -----------------
export function getInvoices(): Invoice[] {
  if (typeof window === 'undefined') return INITIAL_INVOICES;
  const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    return INITIAL_INVOICES;
  }
  try {
    let invoices: Invoice[] = JSON.parse(raw);
    const hasLegacyCourse = invoices.some(i => i.courseName === 'Autonomous AI Agents & Workflows' || i.courseDuration.toLowerCase().includes('6 week'));
    if (hasLegacyCourse) {
      invoices = invoices.map(i => {
        if (i.courseName === 'Autonomous AI Agents & Workflows' || i.courseDuration.toLowerCase().includes('6 week')) {
          return {
            ...i,
            courseName: 'Practical AI Foundation Course',
            courseDuration: '1 Month',
            courseFee: 5000,
            totalPayable: 5000,
            remainingBalance: Math.max(0, 5000 - i.amountPaid),
          };
        }
        return i;
      });
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    }
    return invoices;
  } catch {
    return INITIAL_INVOICES;
  }
}

export function getNextInvoiceNumber(): string {
  const invoices = getInvoices();
  const year = new Date().getFullYear();
  let maxNum = 0;
  invoices.forEach(inv => {
    const match = inv.invoiceNumber.match(/COR-INV-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `COR-INV-${year}-${String(maxNum + 1).padStart(4, '0')}`;
}

export function saveInvoice(invoice: Invoice): Invoice {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.invoiceNumber === invoice.invoiceNumber);
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.unshift(invoice);
  }
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

  // Sync back to student records if matched
  const students = getStudents();
  const stuIndex = students.findIndex(s => s.id === invoice.studentId);
  if (stuIndex >= 0) {
    const stu = students[stuIndex];
    stu.totalPaid = invoice.amountPaid;
    stu.agreedFee = invoice.totalPayable;
    stu.paymentStatus = invoice.paymentStatus;
    saveStudent(stu);
  }

  emitChange();
  return invoice;
}

export function deleteInvoice(invoiceNumber: string) {
  const invoices = getInvoices().filter(i => i.invoiceNumber !== invoiceNumber);
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  emitChange();
}

// ----------------- Receipts -----------------
export function getReceipts(): PaymentReceipt[] {
  if (typeof window === 'undefined') return INITIAL_RECEIPTS;
  const raw = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
    return INITIAL_RECEIPTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_RECEIPTS;
  }
}

export function getNextReceiptNumber(): string {
  const receipts = getReceipts();
  const year = new Date().getFullYear();
  let maxNum = 0;
  receipts.forEach(rec => {
    const match = rec.receiptNumber.match(/COR-REC-(\d{4})-(\d{4})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `COR-REC-${year}-${String(maxNum + 1).padStart(4, '0')}`;
}

export function saveReceipt(receipt: PaymentReceipt): PaymentReceipt {
  const receipts = getReceipts();
  receipts.unshift(receipt);
  localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  emitChange();
  return receipt;
}

export function deleteReceipt(receiptNumber: string) {
  const receipts = getReceipts().filter(r => r.receiptNumber !== receiptNumber);
  localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  emitChange();
}

// ----------------- Payment Recording Logic -----------------
export function recordPayment(params: {
  invoiceNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}): { invoice: Invoice; receipt: PaymentReceipt } {
  const invoices = getInvoices();
  const invIndex = invoices.findIndex(i => i.invoiceNumber === params.invoiceNumber);
  if (invIndex === -1) {
    throw new Error(`Invoice ${params.invoiceNumber} not found.`);
  }

  const invoice = { ...invoices[invIndex] };
  const newAmountPaid = invoice.amountPaid + params.amount;
  const newRemainingBalance = Math.max(0, invoice.totalPayable - newAmountPaid);

  let newStatus: PaymentStatus = 'partially_paid';
  if (newRemainingBalance === 0) {
    newStatus = 'paid';
  } else if (newAmountPaid === 0) {
    newStatus = 'unpaid';
  }

  invoice.amountPaid = newAmountPaid;
  invoice.remainingBalance = newRemainingBalance;
  invoice.paymentStatus = newStatus;
  invoice.paymentMethod = params.paymentMethod;

  invoices[invIndex] = invoice;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

  // Update corresponding student
  const students = getStudents();
  const studentIndex = students.findIndex(s => s.id === invoice.studentId);
  if (studentIndex >= 0) {
    students[studentIndex].totalPaid = newAmountPaid;
    students[studentIndex].paymentStatus = newStatus;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  // Create payment receipt
  const receiptNumber = getNextReceiptNumber();
  const paymentDate = new Date().toISOString().split('T')[0];
  const receipt: PaymentReceipt = {
    receiptNumber,
    invoiceNumber: invoice.invoiceNumber,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    paymentDate,
    amountReceived: params.amount,
    paymentMethod: params.paymentMethod,
    remainingBalanceAfter: newRemainingBalance,
    transactionRef: params.transactionRef,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };

  saveReceipt(receipt);
  emitChange();

  return { invoice, receipt };
}

// ----------------- Admin PIN -----------------
export function getAdminPin(): string {
  if (typeof window === 'undefined') return '2026';
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '2026';
}

export function setAdminPin(newPin: string): boolean {
  if (!newPin || newPin.length < 4) return false;
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin);
  return true;
}

// ----------------- Supabase Config -----------------
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') return { url: '', anonKey: '', autoSync: false };
  const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
  if (!raw) return { url: '', anonKey: '', autoSync: false };
  try {
    return JSON.parse(raw);
  } catch {
    return { url: '', anonKey: '', autoSync: false };
  }
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  emitChange();
}

// ----------------- Backup & Restore -----------------
export function exportDataJson(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    courses: getCourses(),
    students: getStudents(),
    invoices: getInvoices(),
    receipts: getReceipts(),
  };
  return JSON.stringify(data, null, 2);
}

export function importDataJson(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.courses || !data.students || !data.invoices) {
      return { success: false, message: 'Invalid backup file: Missing key records.' };
    }
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(data.courses));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data.invoices));
    if (data.receipts) {
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(data.receipts));
    }
    emitChange();
    return { success: true, message: 'Database successfully restored from backup.' };
  } catch (err: any) {
    return { success: false, message: `Import error: ${err.message || 'Malformed JSON'}` };
  }
}

export function resetToDefaults() {
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '2026');
  emitChange();
}

export function generateSupabaseSqlSchema(): string {
  return `-- Cortexx AI Institute Database Schema
-- Execute in Supabase SQL Editor to establish cloud persistence tables

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  mode TEXT NOT NULL,
  fee NUMERIC NOT NULL,
  certificate_included BOOLEAN DEFAULT true,
  modules JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  enrolled_course_id TEXT REFERENCES courses(id),
  enrolled_course_name TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  enrollment_date DATE NOT NULL,
  agreed_fee NUMERIC NOT NULL,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  invoice_number TEXT PRIMARY KEY,
  invoice_date DATE NOT NULL,
  student_id TEXT REFERENCES students(id),
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  student_email TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_duration TEXT NOT NULL,
  course_fee NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total_payable NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_receipts (
  receipt_number TEXT PRIMARY KEY,
  invoice_number TEXT REFERENCES invoices(invoice_number),
  student_id TEXT REFERENCES students(id),
  student_name TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount_received NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  remaining_balance_after NUMERIC NOT NULL,
  transaction_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
}
