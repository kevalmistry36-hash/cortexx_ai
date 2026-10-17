import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Student,
  Course,
  Invoice,
  PaymentReceipt,
  CertificateRecord,
} from '../types';
import {
  getCertificates,
  saveCertificate,
  getStudents,
  getCourses,
  getInvoices,
  getReceipts,
  getSupabaseConfig,
  saveSupabaseConfig,
} from './storage';

let supabaseInstance: SupabaseClient | null = null;
let currentSupabaseUrl = '';
let currentSupabaseKey = '';
let serverConfigAttempted = false;
let memoryServerUrl = '';
let memoryServerKey = '';

// Helper to safely format ISO date for Postgres DATE column
function safeDate(d?: string | null): string {
  if (!d) return new Date().toISOString().split('T')[0];
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

// Proactively pull Supabase credentials from the central server so all devices/browsers share them
export async function fetchServerSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.url && data.anonKey) {
        memoryServerUrl = data.url.trim();
        memoryServerKey = data.anonKey.trim();
        saveSupabaseConfig({
          url: memoryServerUrl,
          anonKey: memoryServerKey,
          autoSync: true,
        });
        getSupabaseClient(); // re-init client
      }
    }
  } catch (err) {
    // Backend fetch failed (e.g. offline) - fallback to local storage
  } finally {
    serverConfigAttempted = true;
  }
  return getActiveSupabaseCredentials();
}

// Save Supabase credentials to both central server (all devices) and local cache
export async function saveSupabaseCredentialsToServer(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  memoryServerUrl = cleanUrl;
  memoryServerKey = cleanKey;

  saveSupabaseConfig({
    url: cleanUrl,
    anonKey: cleanKey,
    autoSync: !!(cleanUrl && cleanKey),
  });

  // Reset current client so it reinitializes
  supabaseInstance = null;
  currentSupabaseUrl = '';
  currentSupabaseKey = '';

  let serverSaved = false;
  try {
    const res = await fetch('/api/supabase-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
    });
    if (res.ok) {
      serverSaved = true;
    }
  } catch {
    // Network or server error
  }

  // Test the new client
  if (cleanUrl && cleanKey) {
    const testRes = await testSupabaseConnection(cleanUrl, cleanKey);
    return {
      success: testRes.success,
      message: serverSaved
        ? `${testRes.message} (Credentials saved globally for all devices)`
        : testRes.message,
    };
  }

  return { success: true, message: 'Supabase credentials cleared.' };
}

// Resolve active Supabase credentials (In-memory server config -> Vite env -> local storage)
export function getActiveSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localConfig = getSupabaseConfig();

  const url = (memoryServerUrl || envUrl || localConfig.url || '').trim();
  const anonKey = (memoryServerKey || envKey || localConfig.anonKey || '').trim();

  return { url, anonKey };
}

// Check if Supabase is currently configured
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getActiveSupabaseCredentials();
  return !!(url && anonKey);
}

// Get or initialize singleton Supabase client
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getActiveSupabaseCredentials();

  if (!url || !anonKey) {
    // Trigger lazy server fetch once in background if not yet attempted
    if (!serverConfigAttempted && typeof window !== 'undefined') {
      fetchServerSupabaseConfig().catch(() => {});
    }
    return null;
  }

  if (supabaseInstance && currentSupabaseUrl === url && currentSupabaseKey === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentSupabaseUrl = url;
    currentSupabaseKey = anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Comprehensive connection test across all 5 tables
export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string; tablesFound?: string[]; missingTables?: string[] }> {
  const activeUrl = url || getActiveSupabaseCredentials().url;
  const activeKey = anonKey || getActiveSupabaseCredentials().anonKey;

  if (!activeUrl || !activeKey) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are required to enable multi-device sync.',
    };
  }

  try {
    const client = createClient(activeUrl, activeKey, {
      auth: { persistSession: false },
    });

    const tables = ['courses', 'students', 'invoices', 'receipts', 'certificates'];
    const tablesFound: string[] = [];
    const missingTables: string[] = [];
    let permissionError = false;

    for (const table of tables) {
      const { error } = await client.from(table).select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          missingTables.push(table);
        } else if (error.code === '42501') {
          permissionError = true;
          tablesFound.push(table);
        } else if (error.message && error.message.toLowerCase().includes('does not exist')) {
          missingTables.push(table);
        } else {
          // Table exists but maybe column differs, count as found
          tablesFound.push(table);
        }
      } else {
        tablesFound.push(table);
      }
    }

    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Connected to Supabase, but ${missingTables.length} table(s) missing (${missingTables.join(
          ', '
        )}). Please copy and run the SQL schema in your Supabase SQL Editor.`,
        tablesFound,
        missingTables,
      };
    }

    if (permissionError) {
      return {
        success: false,
        message:
          'Connected to Supabase, but Row Level Security blocked access. Execute the RLS policies in the SQL schema.',
        tablesFound,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase! All 5 tables are live and ready for real-time cloud sync.',
      tablesFound,
    };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || 'Network error'}` };
  }
}

// ==========================================
// MAPPINGS: Types <-> Supabase Database Rows
// ==========================================

// --- 1. Students ---
function mapStudentToRow(s: Student) {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone || '',
    email: s.email || '',
    enrolled_course_id: s.enrolledCourseId || '',
    enrolled_course_name: s.enrolledCourseName || '',
    enrollment_id: s.enrollmentId || '',
    enrollment_date: safeDate(s.enrollmentDate),
    agreed_fee: Number(s.agreedFee) || 5000,
    total_paid: Number(s.totalPaid) || 0,
    payment_status: s.paymentStatus || 'unpaid',
    payment_method: s.paymentMethod || 'UPI',
    is_deactivated: !!s.isDeactivated,
    status: s.status || (s.isDeactivated ? 'deactivated' : 'active'),
    notes: s.notes || '',
    created_at: s.createdAt || new Date().toISOString(),
  };
}

function mapRowToStudent(row: any): Student {
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    enrolledCourseId: row.enrolled_course_id || '',
    enrolledCourseName: row.enrolled_course_name || '',
    enrollmentId: row.enrollment_id || '',
    enrollmentDate: row.enrollment_date || '',
    agreedFee: Number(row.agreed_fee) || 5000,
    totalPaid: Number(row.total_paid) || 0,
    paymentStatus: row.payment_status || 'unpaid',
    paymentMethod: row.payment_method || 'UPI',
    isDeactivated: !!row.is_deactivated,
    status: row.status || (row.is_deactivated ? 'deactivated' : 'active'),
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// --- 2. Courses ---
function mapCourseToRow(c: Course) {
  return {
    id: c.id,
    name: c.name,
    duration: c.duration || '1 Month',
    mode: c.mode || '100% Online',
    fee: Number(c.fee) || 0,
    certificate_included: c.certificateIncluded !== false,
    modules: Array.isArray(c.modules) ? c.modules : [],
    description: c.description || '',
    is_archived: !!c.isArchived,
  };
}

function mapRowToCourse(row: any): Course {
  return {
    id: row.id,
    name: row.name || '',
    duration: row.duration || '1 Month',
    mode: row.mode || '100% Online',
    fee: Number(row.fee) || 0,
    certificateIncluded: row.certificate_included !== false,
    modules: Array.isArray(row.modules) ? row.modules : [],
    description: row.description || '',
    isArchived: !!row.is_archived,
  };
}

// --- 3. Invoices ---
function mapInvoiceToRow(inv: Invoice) {
  return {
    invoice_number: inv.invoiceNumber,
    invoice_date: safeDate(inv.invoiceDate),
    student_id: inv.studentId,
    student_name: inv.studentName,
    student_phone: inv.studentPhone || '',
    student_email: inv.studentEmail || '',
    enrollment_id: inv.enrollmentId || '',
    course_name: inv.courseName,
    course_duration: inv.courseDuration || '1 Month',
    course_fee: Number(inv.courseFee) || 0,
    discount: Number(inv.discount) || 0,
    total_payable: Number(inv.totalPayable) || 0,
    amount_paid: Number(inv.amountPaid) || 0,
    remaining_balance: Number(inv.remainingBalance) || 0,
    payment_method: inv.paymentMethod || 'UPI',
    payment_status: inv.paymentStatus || 'unpaid',
    is_student_deactivated: !!inv.isStudentDeactivated,
    notes: inv.notes || '',
    created_at: inv.createdAt || new Date().toISOString(),
  };
}

function mapRowToInvoice(row: any): Invoice {
  return {
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date || '',
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    studentPhone: row.student_phone || '',
    studentEmail: row.student_email || '',
    enrollmentId: row.enrollment_id || '',
    courseName: row.course_name || '',
    courseDuration: row.course_duration || '1 Month',
    courseFee: Number(row.course_fee) || 0,
    discount: Number(row.discount) || 0,
    totalPayable: Number(row.total_payable) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    remainingBalance: Number(row.remaining_balance) || 0,
    paymentMethod: row.payment_method || 'UPI',
    paymentStatus: row.payment_status || 'unpaid',
    isStudentDeactivated: !!row.is_student_deactivated,
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// --- 4. Payment Receipts ---
function mapReceiptToRow(rec: PaymentReceipt) {
  return {
    receipt_number: rec.receiptNumber,
    invoice_number: rec.invoiceNumber,
    student_id: rec.studentId,
    student_name: rec.studentName,
    payment_date: safeDate(rec.paymentDate),
    amount_received: Number(rec.amountReceived) || 0,
    payment_method: rec.paymentMethod || 'UPI',
    remaining_balance_after: Number(rec.remainingBalanceAfter) || 0,
    transaction_ref: rec.transactionRef || '',
    is_student_deactivated: !!rec.isStudentDeactivated,
    notes: rec.notes || '',
    created_at: rec.createdAt || new Date().toISOString(),
  };
}

function mapRowToReceipt(row: any): PaymentReceipt {
  return {
    receiptNumber: row.receipt_number,
    invoiceNumber: row.invoice_number || '',
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    paymentDate: row.payment_date || '',
    amountReceived: Number(row.amount_received) || 0,
    paymentMethod: row.payment_method || 'UPI',
    remainingBalanceAfter: Number(row.remaining_balance_after) || 0,
    transactionRef: row.transaction_ref || '',
    isStudentDeactivated: !!row.is_student_deactivated,
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// --- 5. Certificates ---
function mapCertToRow(cert: CertificateRecord) {
  return {
    id: cert.id,
    student_id: cert.studentId,
    student_name: cert.studentName,
    course_name: cert.courseName,
    course_mode: cert.courseMode || '100% Online',
    course_duration: cert.courseDuration || '1 Month',
    start_date: safeDate(cert.startDate),
    end_date: safeDate(cert.endDate),
    issue_date: safeDate(cert.issueDate),
    certificate_number: cert.certificateNumber || cert.id,
    verification_code: cert.verificationCode,
    signatories: cert.signatories || [],
    status: cert.status || 'issued',
    created_at: cert.createdAt || new Date().toISOString(),
  };
}

function mapRowToCert(row: any): CertificateRecord {
  return {
    id: row.id || row.certificate_number,
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    courseName: row.course_name || '',
    courseMode: row.course_mode || '100% Online',
    courseDuration: row.course_duration || '1 Month',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    issueDate: row.issue_date || '',
    certificateNumber: row.certificate_number || row.id,
    verificationCode: row.verification_code || row.certificate_number || row.id,
    signatories: Array.isArray(row.signatories) ? row.signatories : [],
    status: (row.status as any) || 'issued',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ==========================================
// REAL-TIME SYNC: INDIVIDUAL MUTATIONS
// ==========================================

// --- Students Sync ---
export async function syncStudentToSupabase(student: Student): Promise<{ success: boolean; error?: string }> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const row = mapStudentToRow(student);
    const { error } = await supabase.from('students').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase students upsert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteStudentFromSupabase(studentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('students').delete().eq('id', studentId);
  } catch (err) {
    console.error('Failed to delete student in Supabase:', err);
  }
}

// --- Courses Sync ---
export async function syncCourseToSupabase(course: Course): Promise<{ success: boolean; error?: string }> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const row = mapCourseToRow(course);
    const { error } = await supabase.from('courses').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase courses upsert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCourseFromSupabase(courseId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('courses').delete().eq('id', courseId);
  } catch (err) {
    console.error('Failed to delete course in Supabase:', err);
  }
}

// --- Invoices Sync ---
export async function syncInvoiceToSupabase(invoice: Invoice): Promise<{ success: boolean; error?: string }> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const row = mapInvoiceToRow(invoice);
    const { error } = await supabase.from('invoices').upsert(row, { onConflict: 'invoice_number' });
    if (error) {
      console.warn('Supabase invoices upsert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteInvoiceFromSupabase(invoiceNumber: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('invoices').delete().eq('invoice_number', invoiceNumber);
  } catch (err) {
    console.error('Failed to delete invoice in Supabase:', err);
  }
}

// --- Receipts Sync ---
export async function syncReceiptToSupabase(receipt: PaymentReceipt): Promise<{ success: boolean; error?: string }> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const row = mapReceiptToRow(receipt);
    const { error } = await supabase.from('receipts').upsert(row, { onConflict: 'receipt_number' });
    if (error) {
      console.warn('Supabase receipts upsert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteReceiptFromSupabase(receiptNumber: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('receipts').delete().eq('receipt_number', receiptNumber);
  } catch (err) {
    console.error('Failed to delete receipt in Supabase:', err);
  }
}

// --- Certificates Sync ---
export async function syncCertificateToSupabase(cert: CertificateRecord): Promise<{ success: boolean; error?: string }> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) return { success: false, error: 'Supabase client not initialized. Configure Supabase in Settings.' };

  try {
    const row = mapCertToRow(cert);
    const { error } = await supabase.from('certificates').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase certificates upsert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCertificateFromSupabase(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('certificates').delete().eq('id', id);
  } catch (err) {
    console.error('Failed to delete certificate in Supabase:', err);
  }
}

// ==========================================
// BULK PUSH: ALL LOCAL DATA TO SUPABASE
// ==========================================
export async function pushAllLocalDataToSupabase(): Promise<{
  studentsCount: number;
  coursesCount: number;
  invoicesCount: number;
  receiptsCount: number;
  certificatesCount: number;
  error?: string;
}> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) {
    return {
      studentsCount: 0,
      coursesCount: 0,
      invoicesCount: 0,
      receiptsCount: 0,
      certificatesCount: 0,
      error: 'Supabase client not configured. Enter Supabase URL and Anon Key in Settings.',
    };
  }

  try {
    const students = getStudents();
    const courses = getCourses();
    const invoices = getInvoices();
    const receipts = getReceipts();
    const certs = getCertificates();

    // 1. Courses
    if (courses.length > 0) {
      const courseRows = courses.map(mapCourseToRow);
      const { error: cErr } = await supabase.from('courses').upsert(courseRows, { onConflict: 'id' });
      if (cErr) throw new Error(`Courses table error: ${cErr.message}`);
    }

    // 2. Students
    if (students.length > 0) {
      const studentRows = students.map(mapStudentToRow);
      const { error: sErr } = await supabase.from('students').upsert(studentRows, { onConflict: 'id' });
      if (sErr) throw new Error(`Students table error: ${sErr.message}`);
    }

    // 3. Invoices
    if (invoices.length > 0) {
      const invoiceRows = invoices.map(mapInvoiceToRow);
      const { error: iErr } = await supabase.from('invoices').upsert(invoiceRows, { onConflict: 'invoice_number' });
      if (iErr) throw new Error(`Invoices table error: ${iErr.message}`);
    }

    // 4. Receipts
    if (receipts.length > 0) {
      const receiptRows = receipts.map(mapReceiptToRow);
      const { error: rErr } = await supabase.from('receipts').upsert(receiptRows, { onConflict: 'receipt_number' });
      if (rErr) throw new Error(`Receipts table error: ${rErr.message}`);
    }

    // 5. Certificates
    if (certs.length > 0) {
      const certRows = certs.map(mapCertToRow);
      const { error: certErr } = await supabase.from('certificates').upsert(certRows, { onConflict: 'id' });
      if (certErr) throw new Error(`Certificates table error: ${certErr.message}`);
    }

    return {
      studentsCount: students.length,
      coursesCount: courses.length,
      invoicesCount: invoices.length,
      receiptsCount: receipts.length,
      certificatesCount: certs.length,
    };
  } catch (err: any) {
    console.error('Error during bulk push to Supabase:', err);
    return {
      studentsCount: 0,
      coursesCount: 0,
      invoicesCount: 0,
      receiptsCount: 0,
      certificatesCount: 0,
      error: err.message,
    };
  }
}

// Backwards-compatible alias
export async function pushAllLocalCertificatesToSupabase() {
  const res = await pushAllLocalDataToSupabase();
  return { total: res.certificatesCount, synced: res.certificatesCount, error: res.error };
}

// ==========================================
// BULK PULL: ALL DATA FROM SUPABASE
// ==========================================
export async function fetchAndSyncAllDataFromSupabase(): Promise<{
  students: Student[];
  courses: Course[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  certificates: CertificateRecord[];
}> {
  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }
  if (!supabase) {
    return {
      students: getStudents(),
      courses: getCourses(),
      invoices: getInvoices(),
      receipts: getReceipts(),
      certificates: getCertificates(),
    };
  }

  try {
    const [coursesRes, studentsRes, invoicesRes, receiptsRes, certsRes] = await Promise.allSettled([
      supabase.from('courses').select('*'),
      supabase.from('students').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('receipts').select('*'),
      supabase.from('certificates').select('*'),
    ]);

    let updatedAny = false;

    // Courses
    if (coursesRes.status === 'fulfilled' && coursesRes.value.data && coursesRes.value.data.length > 0) {
      const remoteCourses = coursesRes.value.data.map(mapRowToCourse);
      const local = getCourses();
      const map = new Map<string, Course>();
      local.forEach(c => map.set(c.id, c));
      remoteCourses.forEach(c => map.set(c.id, c));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_courses_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Students
    if (studentsRes.status === 'fulfilled' && studentsRes.value.data && studentsRes.value.data.length > 0) {
      const remoteStudents = studentsRes.value.data.map(mapRowToStudent);
      const local = getStudents();
      const map = new Map<string, Student>();
      local.forEach(s => map.set(s.id, s));
      remoteStudents.forEach(s => map.set(s.id, s));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_students_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Invoices
    if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data && invoicesRes.value.data.length > 0) {
      const remoteInvoices = invoicesRes.value.data.map(mapRowToInvoice);
      const local = getInvoices();
      const map = new Map<string, Invoice>();
      local.forEach(i => map.set(i.invoiceNumber, i));
      remoteInvoices.forEach(i => map.set(i.invoiceNumber, i));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_invoices_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Receipts
    if (receiptsRes.status === 'fulfilled' && receiptsRes.value.data && receiptsRes.value.data.length > 0) {
      const remoteReceipts = receiptsRes.value.data.map(mapRowToReceipt);
      const local = getReceipts();
      const map = new Map<string, PaymentReceipt>();
      local.forEach(r => map.set(r.receiptNumber, r));
      remoteReceipts.forEach(r => map.set(r.receiptNumber, r));
      const merged = Array.from(map.values());
      localStorage.setItem('cortexx_receipts_v1', JSON.stringify(merged));
      updatedAny = true;
    }

    // Certificates
    if (certsRes.status === 'fulfilled' && certsRes.value.data && certsRes.value.data.length > 0) {
      const remoteCerts = certsRes.value.data.map(mapRowToCert);
      const local = getCertificates();
      const map = new Map<string, CertificateRecord>();
      local.forEach(c => map.set(c.id, c));
      remoteCerts.forEach(c => map.set(c.id, c));
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
    console.error('Failed to pull all data from Supabase:', err);
    return {
      students: getStudents(),
      courses: getCourses(),
      invoices: getInvoices(),
      receipts: getReceipts(),
      certificates: getCertificates(),
    };
  }
}

// Backwards-compatible alias
export async function fetchAndSyncAllCertificatesFromSupabase(): Promise<CertificateRecord[]> {
  const all = await fetchAndSyncAllDataFromSupabase();
  return all.certificates;
}

// ==========================================
// PUBLIC VERIFICATION LOOKUP (Cloud + Cache)
// ==========================================
export async function verifyCertificateFromCloud(code: string): Promise<CertificateRecord | null> {
  const cleanCode = code.trim();
  if (!cleanCode) return null;

  let supabase = getSupabaseClient();
  if (!supabase) {
    await fetchServerSupabaseConfig();
    supabase = getSupabaseClient();
  }

  if (supabase) {
    try {
      // 1. Try exact match on verification_code or id or certificate_number
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .or(`verification_code.eq.${cleanCode},certificate_number.eq.${cleanCode},id.eq.${cleanCode}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        const cloudCert = mapRowToCert(data[0]);
        // Update local cache directly without re-triggering mutation sync
        const certs = getCertificates();
        const idx = certs.findIndex(c => c.id === cloudCert.id);
        if (idx >= 0) certs[idx] = cloudCert;
        else certs.unshift(cloudCert);
        localStorage.setItem('cortexx_certificates_v1', JSON.stringify(certs));
        return cloudCert;
      }

      // 2. Try partial search by student name or loose code
      const { data: nameData } = await supabase
        .from('certificates')
        .select('*')
        .ilike('student_name', `%${cleanCode}%`)
        .limit(1);

      if (nameData && nameData.length > 0) {
        const cloudCert = mapRowToCert(nameData[0]);
        const certs = getCertificates();
        const idx = certs.findIndex(c => c.id === cloudCert.id);
        if (idx >= 0) certs[idx] = cloudCert;
        else certs.unshift(cloudCert);
        localStorage.setItem('cortexx_certificates_v1', JSON.stringify(certs));
        return cloudCert;
      }
    } catch (err) {
      console.warn('Cloud verification lookup notice:', err);
    }
  }

  // Fallback to local cache
  const localCerts = getCertificates();
  const clean = cleanCode.toLowerCase();
  return (
    localCerts.find(
      c =>
        c.verificationCode.toLowerCase() === clean ||
        c.id.toLowerCase() === clean ||
        (c.certificateNumber ? c.certificateNumber.toLowerCase() === clean : false) ||
        c.studentName.toLowerCase().includes(clean)
    ) || null
  );
}

// ==========================================
// REAL-TIME BROADCAST SUBSCRIPTION (Across Devices)
// ==========================================
export function subscribeToAllSupabaseRealtime(onSync?: () => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('cortexx-all-db-changes')
      // 1. Students
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const student = mapRowToStudent(payload.new);
          const current = getStudents();
          const idx = current.findIndex(s => s.id === student.id);
          if (idx >= 0) current[idx] = student;
          else current.unshift(student);
          localStorage.setItem('cortexx_students_v1', JSON.stringify(current));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const oldId = (payload.old as any).id;
          const current = getStudents().filter(s => s.id !== oldId);
          localStorage.setItem('cortexx_students_v1', JSON.stringify(current));
        }
        window.dispatchEvent(new CustomEvent('cortexx-db-change'));
        if (onSync) onSync();
      })
      // 2. Courses
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const course = mapRowToCourse(payload.new);
          const current = getCourses();
          const idx = current.findIndex(c => c.id === course.id);
          if (idx >= 0) current[idx] = course;
          else current.push(course);
          localStorage.setItem('cortexx_courses_v1', JSON.stringify(current));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const oldId = (payload.old as any).id;
          const current = getCourses().filter(c => c.id !== oldId);
          localStorage.setItem('cortexx_courses_v1', JSON.stringify(current));
        }
        window.dispatchEvent(new CustomEvent('cortexx-db-change'));
        if (onSync) onSync();
      })
      // 3. Invoices
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const inv = mapRowToInvoice(payload.new);
          const current = getInvoices();
          const idx = current.findIndex(i => i.invoiceNumber === inv.invoiceNumber);
          if (idx >= 0) current[idx] = inv;
          else current.unshift(inv);
          localStorage.setItem('cortexx_invoices_v1', JSON.stringify(current));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const oldNum = (payload.old as any).invoice_number;
          const current = getInvoices().filter(i => i.invoiceNumber !== oldNum);
          localStorage.setItem('cortexx_invoices_v1', JSON.stringify(current));
        }
        window.dispatchEvent(new CustomEvent('cortexx-db-change'));
        if (onSync) onSync();
      })
      // 4. Receipts
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const rec = mapRowToReceipt(payload.new);
          const current = getReceipts();
          const idx = current.findIndex(r => r.receiptNumber === rec.receiptNumber);
          if (idx >= 0) current[idx] = rec;
          else current.unshift(rec);
          localStorage.setItem('cortexx_receipts_v1', JSON.stringify(current));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const oldNum = (payload.old as any).receipt_number;
          const current = getReceipts().filter(r => r.receiptNumber !== oldNum);
          localStorage.setItem('cortexx_receipts_v1', JSON.stringify(current));
        }
        window.dispatchEvent(new CustomEvent('cortexx-db-change'));
        if (onSync) onSync();
      })
      // 5. Certificates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const cert = mapRowToCert(payload.new);
          const current = getCertificates();
          const idx = current.findIndex(c => c.id === cert.id);
          if (idx >= 0) current[idx] = cert;
          else current.unshift(cert);
          localStorage.setItem('cortexx_certificates_v1', JSON.stringify(current));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const oldId = (payload.old as any).id;
          const current = getCertificates().filter(c => c.id !== oldId);
          localStorage.setItem('cortexx_certificates_v1', JSON.stringify(current));
        }
        window.dispatchEvent(new CustomEvent('cortexx-db-change'));
        if (onSync) onSync();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to realtime Supabase tables:', err);
    return () => {};
  }
}

// Backwards-compatible alias
export function subscribeToCertificatesRealtime(onChange: (cert: CertificateRecord) => void): () => void {
  return subscribeToAllSupabaseRealtime(() => {
    const certs = getCertificates();
    if (certs.length > 0) onChange(certs[0]);
  });
}
