export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';
export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Card';

export interface Student {
  id: string; // e.g. COR-STU-2026-0001
  name: string;
  phone: string;
  email: string;
  enrolledCourseId: string;
  enrolledCourseName: string;
  enrollmentId: string; // e.g. COR-ENR-2026-0001
  enrollmentDate: string; // YYYY-MM-DD
  agreedFee: number;
  totalPaid: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  isDeactivated?: boolean;
  status?: 'active' | 'deactivated';
  notes?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  duration: string;
  mode: string; // e.g. '100% Online'
  fee: number;
  certificateIncluded: boolean;
  modules: string[];
  description: string;
  isArchived?: boolean;
}

export interface Invoice {
  invoiceNumber: string; // e.g. COR-INV-2026-0001
  invoiceDate: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  enrollmentId: string;
  courseName: string;
  courseDuration: string;
  courseFee: number;
  discount: number;
  totalPayable: number;
  amountPaid: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  isStudentDeactivated?: boolean;
  notes?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  receiptNumber: string; // e.g. COR-REC-2026-0001
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  paymentDate: string; // YYYY-MM-DD
  amountReceived: number;
  paymentMethod: PaymentMethod;
  remainingBalanceAfter: number;
  transactionRef?: string;
  isStudentDeactivated?: boolean;
  notes?: string;
  createdAt: string;
}

export interface InstituteProfile {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  upiId: string;
  website: string;
}

export type BannerTheme = 'dark-ember' | 'pure-dark' | 'vibrant-orange' | 'minimal-light';

export interface AdFormat {
  id: string;
  name: string;
  category: 'iab' | 'social';
  width: number;
  height: number;
  description: string;
  aspectRatio: string;
}

export interface BannerAdConfig {
  headline: string;
  subheadline: string;
  courseBadge: string;
  featureBullets: string[];
  ctaText: string;
  targetUrl: string;
  theme: BannerTheme;
  priceTag?: string;
  durationTag?: string;
  showLogo: boolean;
  showBadge: boolean;
  showPrice: boolean;
  showUrl: boolean;
}

export interface CertificateRecord {
  id: string; // e.g. COR-CERT-2026-0001
  studentId: string;
  studentName: string;
  courseName: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  verificationCode: string; // e.g. COR-VERIFY-XXXX
  createdAt: string;
}

