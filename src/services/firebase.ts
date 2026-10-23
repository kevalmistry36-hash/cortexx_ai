import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Student,
  Course,
  Invoice,
  PaymentReceipt,
  CertificateRecord,
  PhaseAssignment,
  PhaseAuditLog,
} from '../types';
import {
  getStudents,
  getCourses,
  getInvoices,
  getReceipts,
  getCertificates,
  saveCertificate,
} from './storage';

// Initialize Firebase App & Firestore with specific Database ID
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection to Firestore
export async function testFirebaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { success: true, message: `Connected to Firebase Firestore (${firebaseConfig.projectId})!` };
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Please check your internet or Firebase configuration.' };
    }
    // Any response indicating reaching the server (even permission or missing doc) means live connectivity
    return { success: true, message: `Connected to Firebase Project (${firebaseConfig.projectId})!` };
  }
}

// ==========================================
// REAL-TIME MUTATIONS: INDIVIDUAL SYNC
// ==========================================

// --- Students ---
export async function syncStudentToFirebase(student: Student): Promise<{ success: boolean; error?: string }> {
  const path = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), {
      id: student.id,
      name: student.name,
      phone: student.phone || '',
      email: student.email || '',
      enrolledCourseId: student.enrolledCourseId || '',
      enrolledCourseName: student.enrolledCourseName || '',
      enrollmentId: student.enrollmentId || '',
      enrollmentDate: student.enrollmentDate || '',
      agreedFee: Number(student.agreedFee) || 5000,
      totalPaid: Number(student.totalPaid) || 0,
      paymentStatus: student.paymentStatus || 'unpaid',
      paymentMethod: student.paymentMethod || 'UPI',
      isDeactivated: !!student.isDeactivated,
      status: student.status || (student.isDeactivated ? 'deactivated' : 'active'),
      notes: student.notes || '',
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phase: student.phase || 1,
      phaseAssignedPerson: student.phaseAssignedPerson || (student.phase === 2 ? 'Hiren' : student.phase === 3 ? 'Shweta' : 'Keval'),
      phaseAssignedAt: student.phaseAssignedAt || student.enrollmentDate || student.createdAt || new Date().toISOString(),
      phaseUpdatedAt: student.phaseUpdatedAt || new Date().toISOString(),
      phaseUpdatedBy: student.phaseUpdatedBy || '',
    });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: String(err) };
  }
}

export async function deleteStudentFromFirebase(studentId: string): Promise<void> {
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Courses ---
export async function syncCourseToFirebase(course: Course): Promise<{ success: boolean; error?: string }> {
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), {
      id: course.id,
      name: course.name,
      duration: course.duration || '1 Month',
      mode: course.mode || '100% Online',
      fee: Number(course.fee) || 0,
      certificateIncluded: course.certificateIncluded !== false,
      modules: Array.isArray(course.modules) ? course.modules : [],
      description: course.description || '',
      isArchived: !!course.isArchived,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: String(err) };
  }
}

export async function deleteCourseFromFirebase(courseId: string): Promise<void> {
  const path = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Invoices ---
export async function syncInvoiceToFirebase(invoice: Invoice): Promise<{ success: boolean; error?: string }> {
  const path = `invoices/${invoice.invoiceNumber}`;
  try {
    await setDoc(doc(db, 'invoices', invoice.invoiceNumber), {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate || '',
      studentId: invoice.studentId || '',
      studentName: invoice.studentName || '',
      studentPhone: invoice.studentPhone || '',
      studentEmail: invoice.studentEmail || '',
      enrollmentId: invoice.enrollmentId || '',
      courseName: invoice.courseName || '',
      courseDuration: invoice.courseDuration || '1 Month',
      courseFee: Number(invoice.courseFee) || 0,
      discount: Number(invoice.discount) || 0,
      totalPayable: Number(invoice.totalPayable) || 0,
      amountPaid: Number(invoice.amountPaid) || 0,
      remainingBalance: Number(invoice.remainingBalance) || 0,
      paymentMethod: invoice.paymentMethod || 'UPI',
      paymentStatus: invoice.paymentStatus || 'unpaid',
      isStudentDeactivated: !!invoice.isStudentDeactivated,
      notes: invoice.notes || '',
      createdAt: invoice.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: String(err) };
  }
}

export async function deleteInvoiceFromFirebase(invoiceNumber: string): Promise<void> {
  const path = `invoices/${invoiceNumber}`;
  try {
    await deleteDoc(doc(db, 'invoices', invoiceNumber));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Receipts ---
export async function syncReceiptToFirebase(receipt: PaymentReceipt): Promise<{ success: boolean; error?: string }> {
  const path = `receipts/${receipt.receiptNumber}`;
  try {
    await setDoc(doc(db, 'receipts', receipt.receiptNumber), {
      receiptNumber: receipt.receiptNumber,
      invoiceNumber: receipt.invoiceNumber || '',
      studentId: receipt.studentId || '',
      studentName: receipt.studentName || '',
      paymentDate: receipt.paymentDate || '',
      amountReceived: Number(receipt.amountReceived) || 0,
      paymentMethod: receipt.paymentMethod || 'UPI',
      remainingBalanceAfter: Number(receipt.remainingBalanceAfter) || 0,
      transactionRef: receipt.transactionRef || '',
      isStudentDeactivated: !!receipt.isStudentDeactivated,
      notes: receipt.notes || '',
      createdAt: receipt.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: String(err) };
  }
}

export async function deleteReceiptFromFirebase(receiptNumber: string): Promise<void> {
  const path = `receipts/${receiptNumber}`;
  try {
    await deleteDoc(doc(db, 'receipts', receiptNumber));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Certificates ---
export async function syncCertificateToFirebase(cert: CertificateRecord): Promise<{ success: boolean; error?: string }> {
  const path = `certificates/${cert.id}`;
  try {
    await setDoc(doc(db, 'certificates', cert.id), {
      id: cert.id,
      studentId: cert.studentId || '',
      studentName: cert.studentName || '',
      courseName: cert.courseName || '',
      courseMode: cert.courseMode || '100% Online',
      courseDuration: cert.courseDuration || '1 Month',
      startDate: cert.startDate || '',
      endDate: cert.endDate || '',
      issueDate: cert.issueDate || '',
      certificateNumber: cert.certificateNumber || cert.id,
      verificationCode: cert.verificationCode || cert.id,
      signatories: Array.isArray(cert.signatories) ? cert.signatories : [],
      status: cert.status || 'issued',
      createdAt: cert.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: String(err) };
  }
}

export async function deleteCertificateFromFirebase(id: string): Promise<void> {
  const path = `certificates/${id}`;
  try {
    await deleteDoc(doc(db, 'certificates', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Phase Assignments (Atomic & Exclusive) ---
export async function syncPhaseAssignmentToFirebase(assignment: PhaseAssignment): Promise<{ success: boolean; error?: string }> {
  const path = `phase_assignments/${assignment.studentId}`;
  try {
    await setDoc(doc(db, 'phase_assignments', assignment.studentId), {
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      phase: assignment.phase,
      assignedPerson: assignment.assignedPerson,
      assignedAt: assignment.assignedAt,
      updatedAt: assignment.updatedAt || new Date().toISOString(),
      updatedBy: assignment.updatedBy || 'admin',
    });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: String(err) };
  }
}

export async function logPhaseTransferToFirebase(log: PhaseAuditLog): Promise<void> {
  const path = `phase_audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, 'phase_audit_logs', log.id), {
      id: log.id,
      studentId: log.studentId,
      studentName: log.studentName,
      previousPhase: log.previousPhase ?? null,
      newPhase: log.newPhase,
      changedBy: log.changedBy,
      timestamp: log.timestamp,
      note: log.note || '',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function batchSavePhaseAssignmentsToFirebase(
  assignments: PhaseAssignment[],
  logs?: PhaseAuditLog[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (assignments.length === 0) return { success: true, count: 0 };
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const a of assignments) {
      // 1. Exclusive doc in phase_assignments
      const phaseDocRef = doc(db, 'phase_assignments', a.studentId);
      batch.set(phaseDocRef, {
        studentId: a.studentId,
        studentName: a.studentName,
        phase: a.phase,
        assignedPerson: a.assignedPerson,
        assignedAt: a.assignedAt,
        updatedAt: now,
        updatedBy: a.updatedBy || 'Kevalmistry36@gmail.com',
      });

      // 2. Atomic sync to Student document
      const studentDocRef = doc(db, 'students', a.studentId);
      batch.set(
        studentDocRef,
        {
          phase: a.phase,
          phaseAssignedPerson: a.assignedPerson,
          phaseAssignedAt: a.assignedAt,
          phaseUpdatedAt: now,
          phaseUpdatedBy: a.updatedBy || 'Kevalmistry36@gmail.com',
          updatedAt: now,
        },
        { merge: true }
      );
    }

    // 3. Audit logs if present
    if (logs && logs.length > 0) {
      for (const log of logs) {
        const logDocRef = doc(db, 'phase_audit_logs', log.id);
        batch.set(logDocRef, {
          id: log.id,
          studentId: log.studentId,
          studentName: log.studentName,
          previousPhase: log.previousPhase ?? null,
          newPhase: log.newPhase,
          changedBy: log.changedBy,
          timestamp: log.timestamp || now,
          note: log.note || '',
        });
      }
    }

    await batch.commit();
    return { success: true, count: assignments.length };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, 'batch_phase_assignments');
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

// ==========================================
// BULK PUSH: ALL LOCAL DATA TO FIREBASE
// ==========================================
export async function pushAllLocalDataToFirebase(): Promise<{
  studentsCount: number;
  coursesCount: number;
  invoicesCount: number;
  receiptsCount: number;
  certificatesCount: number;
  error?: string;
}> {
  try {
    const students = getStudents();
    const courses = getCourses();
    const invoices = getInvoices();
    const receipts = getReceipts();
    const certs = getCertificates();

    // Sync all in parallel
    await Promise.all([
      ...courses.map(c => syncCourseToFirebase(c)),
      ...students.map(s => syncStudentToFirebase(s)),
      ...invoices.map(i => syncInvoiceToFirebase(i)),
      ...receipts.map(r => syncReceiptToFirebase(r)),
      ...certs.map(c => syncCertificateToFirebase(c)),
    ]);

    return {
      studentsCount: students.length,
      coursesCount: courses.length,
      invoicesCount: invoices.length,
      receiptsCount: receipts.length,
      certificatesCount: certs.length,
    };
  } catch (err: any) {
    console.error('Error migrating data to Firebase:', err);
    return {
      studentsCount: 0,
      coursesCount: 0,
      invoicesCount: 0,
      receiptsCount: 0,
      certificatesCount: 0,
      error: err.message || String(err),
    };
  }
}

// ==========================================
// BULK PULL: ALL DATA FROM FIREBASE
// ==========================================
export async function fetchAndSyncAllDataFromFirebase(): Promise<{
  students: Student[];
  courses: Course[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  certificates: CertificateRecord[];
}> {
  try {
    const [coursesSnap, studentsSnap, invoicesSnap, receiptsSnap, certsSnap] = await Promise.allSettled([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'invoices')),
      getDocs(collection(db, 'receipts')),
      getDocs(collection(db, 'certificates')),
    ]);

    let updatedAny = false;

    // Courses
    if (coursesSnap.status === 'fulfilled' && !coursesSnap.value.empty) {
      const remote = coursesSnap.value.docs.map(d => d.data() as Course);
      const local = getCourses();
      const map = new Map<string, Course>();
      local.forEach(c => map.set(c.id, c));
      remote.forEach(c => map.set(c.id, c));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_courses_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Students
    if (studentsSnap.status === 'fulfilled' && !studentsSnap.value.empty) {
      const remote = studentsSnap.value.docs.map(d => d.data() as Student);
      const local = getStudents();
      const map = new Map<string, Student>();
      local.forEach(s => map.set(s.id, s));
      remote.forEach(s => map.set(s.id, s));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_students_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Invoices
    if (invoicesSnap.status === 'fulfilled' && !invoicesSnap.value.empty) {
      const remote = invoicesSnap.value.docs.map(d => d.data() as Invoice);
      const local = getInvoices();
      const map = new Map<string, Invoice>();
      local.forEach(i => map.set(i.invoiceNumber, i));
      remote.forEach(i => map.set(i.invoiceNumber, i));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_invoices_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Receipts
    if (receiptsSnap.status === 'fulfilled' && !receiptsSnap.value.empty) {
      const remote = receiptsSnap.value.docs.map(d => d.data() as PaymentReceipt);
      const local = getReceipts();
      const map = new Map<string, PaymentReceipt>();
      local.forEach(r => map.set(r.receiptNumber, r));
      remote.forEach(r => map.set(r.receiptNumber, r));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_receipts_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Certificates
    if (certsSnap.status === 'fulfilled' && !certsSnap.value.empty) {
      const remote = certsSnap.value.docs.map(d => d.data() as CertificateRecord);
      const local = getCertificates();
      const map = new Map<string, CertificateRecord>();
      local.forEach(c => map.set(c.id, c));
      remote.forEach(c => map.set(c.id, c));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_certificates_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    if (updatedAny && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cortexx-db-change'));
    }

    return {
      students: getStudents(),
      courses: getCourses(),
      invoices: getInvoices(),
      receipts: getReceipts(),
      certificates: getCertificates(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'all_collections');
    return {
      students: getStudents(),
      courses: getCourses(),
      invoices: getInvoices(),
      receipts: getReceipts(),
      certificates: getCertificates(),
    };
  }
}

// ==========================================
// PUBLIC VERIFICATION LOOKUP (Cloud + Cache)
// ==========================================
export async function verifyCertificateFromCloud(code: string): Promise<CertificateRecord | null> {
  const cleanCode = code.trim();
  if (!cleanCode) return null;

  try {
    // 1. Direct document lookup by ID
    const directDoc = await getDocFromServer(doc(db, 'certificates', cleanCode));
    if (directDoc.exists()) {
      const cloudCert = directDoc.data() as CertificateRecord;
      saveCertificate(cloudCert);
      return cloudCert;
    }

    // 2. Query by verificationCode
    const q1 = query(collection(db, 'certificates'), where('verificationCode', '==', cleanCode), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const cloudCert = snap1.docs[0].data() as CertificateRecord;
      saveCertificate(cloudCert);
      return cloudCert;
    }

    // 3. Query by certificateNumber
    const q2 = query(collection(db, 'certificates'), where('certificateNumber', '==', cleanCode), limit(1));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const cloudCert = snap2.docs[0].data() as CertificateRecord;
      saveCertificate(cloudCert);
      return cloudCert;
    }

    // 4. Fallback to local cache
    const localCerts = getCertificates();
    const clean = cleanCode.toLowerCase();
    return localCerts.find(
      c =>
        c.verificationCode.toLowerCase() === clean ||
        c.id.toLowerCase() === clean ||
        (c.certificateNumber ? c.certificateNumber.toLowerCase() === clean : false) ||
        c.studentName.toLowerCase() === clean
    ) || null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `certificates/${cleanCode}`);
    const localCerts = getCertificates();
    const clean = cleanCode.toLowerCase();
    return localCerts.find(
      c =>
        c.verificationCode.toLowerCase() === clean ||
        c.id.toLowerCase() === clean ||
        (c.certificateNumber ? c.certificateNumber.toLowerCase() === clean : false) ||
        c.studentName.toLowerCase() === clean
    ) || null;
  }
}

// ==========================================
// REAL-TIME BROADCAST SUBSCRIPTION (Across Devices)
// ==========================================
export function subscribeToAllFirebaseRealtime(onSync?: () => void): () => void {
  try {
    const unsubStudents = onSnapshot(collection(db, 'students'), snapshot => {
      snapshot.docChanges().forEach(change => {
        const student = change.doc.data() as Student;
        const current = getStudents();
        if (change.type === 'added' || change.type === 'modified') {
          const idx = current.findIndex(s => s.id === student.id);
          if (idx >= 0) current[idx] = student;
          else current.unshift(student);
        } else if (change.type === 'removed') {
          const idx = current.findIndex(s => s.id === student.id);
          if (idx >= 0) current.splice(idx, 1);
        }
        localStorage.setItem('cortexx_students_v1', JSON.stringify(current));
      });
      window.dispatchEvent(new CustomEvent('cortexx-db-change'));
      if (onSync) onSync();
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'students');
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), snapshot => {
      snapshot.docChanges().forEach(change => {
        const course = change.doc.data() as Course;
        const current = getCourses();
        if (change.type === 'added' || change.type === 'modified') {
          const idx = current.findIndex(c => c.id === course.id);
          if (idx >= 0) current[idx] = course;
          else current.push(course);
        } else if (change.type === 'removed') {
          const idx = current.findIndex(c => c.id === course.id);
          if (idx >= 0) current.splice(idx, 1);
        }
        localStorage.setItem('cortexx_courses_v1', JSON.stringify(current));
      });
      window.dispatchEvent(new CustomEvent('cortexx-db-change'));
      if (onSync) onSync();
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'courses');
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), snapshot => {
      snapshot.docChanges().forEach(change => {
        const inv = change.doc.data() as Invoice;
        const current = getInvoices();
        if (change.type === 'added' || change.type === 'modified') {
          const idx = current.findIndex(i => i.invoiceNumber === inv.invoiceNumber);
          if (idx >= 0) current[idx] = inv;
          else current.unshift(inv);
        } else if (change.type === 'removed') {
          const idx = current.findIndex(i => i.invoiceNumber === inv.invoiceNumber);
          if (idx >= 0) current.splice(idx, 1);
        }
        localStorage.setItem('cortexx_invoices_v1', JSON.stringify(current));
      });
      window.dispatchEvent(new CustomEvent('cortexx-db-change'));
      if (onSync) onSync();
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'invoices');
    });

    const unsubReceipts = onSnapshot(collection(db, 'receipts'), snapshot => {
      snapshot.docChanges().forEach(change => {
        const rec = change.doc.data() as PaymentReceipt;
        const current = getReceipts();
        if (change.type === 'added' || change.type === 'modified') {
          const idx = current.findIndex(r => r.receiptNumber === rec.receiptNumber);
          if (idx >= 0) current[idx] = rec;
          else current.unshift(rec);
        } else if (change.type === 'removed') {
          const idx = current.findIndex(r => r.receiptNumber === rec.receiptNumber);
          if (idx >= 0) current.splice(idx, 1);
        }
        localStorage.setItem('cortexx_receipts_v1', JSON.stringify(current));
      });
      window.dispatchEvent(new CustomEvent('cortexx-db-change'));
      if (onSync) onSync();
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'receipts');
    });

    const unsubCertificates = onSnapshot(collection(db, 'certificates'), snapshot => {
      snapshot.docChanges().forEach(change => {
        const cert = change.doc.data() as CertificateRecord;
        const current = getCertificates();
        if (change.type === 'added' || change.type === 'modified') {
          const idx = current.findIndex(c => c.id === cert.id);
          if (idx >= 0) current[idx] = cert;
          else current.unshift(cert);
        } else if (change.type === 'removed') {
          const idx = current.findIndex(c => c.id === cert.id);
          if (idx >= 0) current.splice(idx, 1);
        }
        localStorage.setItem('cortexx_certificates_v1', JSON.stringify(current));
      });
      window.dispatchEvent(new CustomEvent('cortexx-db-change'));
      if (onSync) onSync();
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'certificates');
    });

    const unsubPhaseAssignments = onSnapshot(collection(db, 'phase_assignments'), snapshot => {
      let changed = false;
      const currentStudents = getStudents();
      snapshot.docChanges().forEach(change => {
        const assignment = change.doc.data() as PhaseAssignment;
        const sIdx = currentStudents.findIndex(s => s.id === assignment.studentId);
        if (sIdx >= 0) {
          currentStudents[sIdx] = {
            ...currentStudents[sIdx],
            phase: assignment.phase,
            phaseAssignedPerson: assignment.assignedPerson,
            phaseAssignedAt: assignment.assignedAt,
            phaseUpdatedAt: assignment.updatedAt,
            phaseUpdatedBy: assignment.updatedBy,
          };
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('cortexx_students_v1', JSON.stringify(currentStudents));
        window.dispatchEvent(new CustomEvent('cortexx-db-change'));
        if (onSync) onSync();
      }
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'phase_assignments');
    });

    return () => {
      unsubStudents();
      unsubCourses();
      unsubInvoices();
      unsubReceipts();
      unsubCertificates();
      unsubPhaseAssignments();
    };
  } catch (err) {
    console.error('Failed to subscribe to Firebase realtime:', err);
    return () => {};
  }
}

// Certificate-specific realtime subscription for public gateway
export function subscribeToCertificatesRealtime(onChange: (cert: CertificateRecord) => void): () => void {
  try {
    return onSnapshot(collection(db, 'certificates'), snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          const cert = change.doc.data() as CertificateRecord;
          onChange(cert);
        }
      });
    });
  } catch (err) {
    console.error('Failed to subscribe to certificates in Firebase:', err);
    return () => {};
  }
}

export async function fetchAndSyncAllCertificatesFromFirebase(): Promise<CertificateRecord[]> {
  const all = await fetchAndSyncAllDataFromFirebase();
  return all.certificates;
}

export async function pushAllLocalCertificatesToFirebase(): Promise<{ total: number; synced: number; error?: string }> {
  const res = await pushAllLocalDataToFirebase();
  return { total: res.certificatesCount, synced: res.certificatesCount, error: res.error };
}
