import React, { useState, useRef } from 'react';
import { Course } from '../types';
import { bulkSaveStudents, BulkStudentInput } from '../services/storage';
import {
  FileSpreadsheet,
  UploadCloud,
  ClipboardPaste,
  Download,
  AlertCircle,
  CheckCircle,
  Trash2,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkStudentImportModalProps {
  isOpen: boolean;
  courses: Course[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedRow extends BulkStudentInput {
  isValid: boolean;
  validationError?: string;
}

export const BulkStudentImportModal: React.FC<BulkStudentImportModalProps> = ({
  isOpen,
  courses,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Flexible column finder
  const findValue = (row: Record<string, any>, possibleKeys: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const pKey of possibleKeys) {
      const matchedKey = rowKeys.find(
        k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === pKey.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (matchedKey !== undefined && row[matchedKey] !== undefined && row[matchedKey] !== null) {
        return row[matchedKey];
      }
    }
    return '';
  };

  // Convert raw row object into normalized ParsedRow
  const normalizeRow = (raw: Record<string, any>): ParsedRow => {
    const rawName = String(
      findValue(raw, [
        'name',
        'fullname',
        'studentname',
        'student',
        'candidatename',
        'studentfullname',
        'nameofstudent',
        'studentsname',
      ]) || ''
    ).trim();

    const rawPhone = String(
      findValue(raw, [
        'phone',
        'mobile',
        'mobilenumber',
        'contact',
        'phonenumber',
        'cell',
        'whatsapp',
        'mobileno',
        'phoneno',
        'contactno',
        'whatsappnumber',
      ]) || ''
    ).trim();

    let rawEmail = String(
      findValue(raw, ['email', 'emailaddress', 'mail', 'emailid', 'emailaddress', 'mailid']) || ''
    ).trim();

    const rawCourse = String(
      findValue(raw, ['course', 'coursename', 'program', 'enrolledcourse', 'courseopted', 'selectedcourse', 'batch']) || ''
    ).trim();

    const rawDate = findValue(raw, [
      'date',
      'enrollmentdate',
      'admissiondate',
      'joiningdate',
      'dateofadmission',
      'dateofjoining',
    ]);

    const rawPaid = findValue(raw, [
      'paid',
      'amountpaid',
      'feespaid',
      'deposit',
      'amount',
      'feepaid',
      'feereceived',
      'receivedamount',
      'totalpaid',
    ]);

    const rawMethod = String(
      findValue(raw, ['method', 'paymentmethod', 'mode', 'paymentmode', 'modeofpayment', 'type']) || ''
    ).trim();

    const rawNotes = String(
      findValue(raw, ['notes', 'remarks', 'comment', 'description', 'remark', 'details']) || ''
    ).trim();

    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const amountPaid = typeof rawPaid === 'number' ? rawPaid : Number(String(rawPaid).replace(/[^0-9.]/g, '')) || 0;

    // Fallback email if institute sheet has empty email
    if (!rawEmail && cleanPhone) {
      const sanitizedName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
      rawEmail = `${sanitizedName}.${cleanPhone.slice(-4)}@cortexx.ai`;
    }

    let isValid = true;
    let validationError = '';

    if (!rawName) {
      isValid = false;
      validationError = 'Missing student name';
    } else if (cleanPhone.length < 10) {
      isValid = false;
      validationError = 'Invalid 10-digit mobile number';
    } else if (!rawEmail || !rawEmail.includes('@')) {
      isValid = false;
      validationError = 'Invalid email address';
    }

    // Match course
    let matchedCourseName = courses[0]?.name || '1-Month Practical AI Course';
    if (rawCourse) {
      const lower = rawCourse.toLowerCase();
      const found = courses.find(
        c =>
          c.name.toLowerCase().includes(lower) ||
          lower.includes(c.name.toLowerCase()) ||
          (lower.includes('5000') && c.fee === 5000) ||
          (lower.includes('foundation') && c.fee === 5000)
      );
      if (found) matchedCourseName = found.name;
    }

    // Normalize date (including Excel serial numbers)
    let enrollmentDate = new Date().toISOString().split('T')[0];
    if (rawDate) {
      if (typeof rawDate === 'number' && rawDate > 30000 && rawDate < 60000) {
        // Excel serial date number
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(excelEpoch.getTime() + rawDate * 86400000);
        if (!isNaN(d.getTime())) {
          enrollmentDate = d.toISOString().split('T')[0];
        }
      } else {
        const parsedD = new Date(String(rawDate));
        if (!isNaN(parsedD.getTime())) {
          enrollmentDate = parsedD.toISOString().split('T')[0];
        }
      }
    }

    // Payment method
    let paymentMethod: any = 'UPI';
    const methodUpper = rawMethod.toUpperCase();
    if (methodUpper.includes('CASH')) paymentMethod = 'Cash';
    else if (methodUpper.includes('BANK') || methodUpper.includes('NEFT') || methodUpper.includes('RTGS')) paymentMethod = 'Bank Transfer';
    else if (methodUpper.includes('CARD')) paymentMethod = 'Card';

    return {
      name: rawName,
      phone: cleanPhone || rawPhone,
      email: rawEmail.toLowerCase(),
      courseName: matchedCourseName,
      enrollmentDate,
      amountPaid,
      paymentMethod,
      notes: rawNotes,
      isValid,
      validationError,
    };
  };

  // Handle Excel (.xlsx, .xls, .csv) file processing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setErrorMessage('The uploaded sheet is empty or has no readable rows.');
          setIsProcessing(false);
          return;
        }

        const normalized = rawJson.map(normalizeRow);
        setParsedRows(normalized);
      } catch (err: any) {
        console.error('File parse error:', err);
        setErrorMessage('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Handle Copy-Pasted Tab / CSV text
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please paste tabular rows or spreadsheet text first.');
      return;
    }

    setErrorMessage(null);
    try {
      const lines = pastedText.trim().split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        setErrorMessage('Please provide at least a header row and 1 data row.');
        return;
      }

      // Detect separator: Tab or Comma
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

      const rawJson = lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      });

      const normalized = rawJson.map(normalizeRow);
      setParsedRows(normalized);
    } catch (err: any) {
      setErrorMessage(`Error parsing pasted data: ${err.message || 'Check delimiter'}`);
    }
  };

  // Remove a row from preview
  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Download Sample Template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = [
        ['Full Name', 'Mobile Number', 'Email', 'Course', 'Enrollment Date', 'Amount Paid', 'Payment Method', 'Notes'],
        ['Vikram Shah', '9825123456', 'vikram.shah@gmail.com', '1-Month Practical AI Course', today, 6000, 'UPI', 'Full fees paid during orientation'],
        ['Neha Joshi', '9724112233', 'neha.joshi@outlook.com', 'Practical AI Foundation Course', today, 2500, 'Cash', 'Part 1 payment received'],
        ['Karan Dave', '9898445566', 'karan.dave@gmail.com', '1-Month Practical AI Course', today, 0, 'Bank Transfer', 'Corporate batch enrollment'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 18 },
        { wch: 15 },
        { wch: 25 },
        { wch: 30 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 32 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Admissions');
      XLSX.writeFile(wb, 'cortexx_students_enrollment_template.xlsx');
    } catch {
      // Fallback to CSV
      const csvContent = `Full Name,Mobile Number,Email,Course,Enrollment Date,Amount Paid,Payment Method,Notes
Vikram Shah,9825123456,vikram.shah@gmail.com,1-Month Practical AI Course,${new Date().toISOString().split('T')[0]},6000,UPI,Full fees paid during orientation
Neha Joshi,9724112233,neha.joshi@outlook.com,Practical AI Foundation Course,${new Date().toISOString().split('T')[0]},2500,Cash,Part 1 payment received
Karan Dave,9898445566,karan.dave@gmail.com,1-Month Practical AI Course,${new Date().toISOString().split('T')[0]},0,Bank Transfer,Pending corporate sponsorship`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cortexx_students_enrollment_template.csv';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Perform Final Bulk Import
  const handleExecuteImport = () => {
    const validItems = parsedRows.filter(r => r.isValid);
    if (validItems.length === 0) {
      alert('No valid student rows found to import.');
      return;
    }

    const { addedCount } = bulkSaveStudents(validItems);
    onSuccess(addedCount);
    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-100 flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-orange-400" />
              <span>Bulk Student Admission from Excel / Spreadsheet</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Import students in bulk with automated Sequential IDs, Enrollment IDs, and Invoices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors"
              title="Download standard CSV template with expected columns"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Sample Template</span>
            </button>
            <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab selection: Upload File vs Paste Data */}
        <div className="flex items-center gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'upload'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-orange-400" />
            <span>Upload File (.xlsx / .xls / .csv)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'paste'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ClipboardPaste className="w-4 h-4 text-sky-400" />
            <span>Paste from Excel / Google Sheets</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Zone */}
        {activeTab === 'upload' && parsedRows.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-orange-500/80 bg-neutral-950/60 hover:bg-neutral-950 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all space-y-3 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-200">
                Click to browse or drag & drop your Excel spreadsheet
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV files
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Paste Zone */}
        {activeTab === 'paste' && parsedRows.length === 0 && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Copy rows from Excel and paste here (including header row)
            </label>
            <textarea
              rows={6}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={`Full Name\tMobile Number\tEmail\tCourse\tEnrollment Date\tAmount Paid\tPayment Method\tNotes\nAarav Sharma\t9825012345\taarav@gmail.com\t1-Month Practical AI Course\t2026-03-01\t6000\tUPI\tPaid in full\nMeera Patel\t9724098765\tmeera@gmail.com\tPractical AI Foundation Course\t2026-03-02\t2500\tCash\t1st Installment`}
              className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-200 focus:outline-none focus:border-orange-500 leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>Parse Pasted Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Preview & Verification Grid */}
        {parsedRows.length > 0 && (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-neutral-200">
                  Total Parsed: <span className="font-mono text-neutral-100">{parsedRows.length}</span>
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{validCount} Ready to Import</span>
                </span>
                {invalidCount > 0 && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{invalidCount} Incomplete</span>
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setParsedRows([]);
                  setPastedText('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 underline"
              >
                Choose Another File
              </button>
            </div>

            {/* Scrollable Preview Table */}
            <div className="max-h-72 overflow-y-auto border border-neutral-800 rounded-xl bg-neutral-950/60">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-neutral-900/90 sticky top-0 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Mobile (+91)</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Mapped Course</th>
                    <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {parsedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-neutral-850/50 transition-colors ${
                        !row.isValid ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-neutral-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-100">
                        {row.name || <span className="text-rose-400 italic">Empty Name</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {row.phone.length === 10 ? (
                          `+91 ${row.phone}`
                        ) : (
                          <span className="text-rose-400 font-bold">{row.phone || 'Missing'}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono truncate max-w-[140px]">
                        {row.email || <span className="text-rose-400">Missing</span>}
                      </td>
                      <td className="py-2.5 px-3 truncate max-w-[160px] text-orange-300/90 font-medium">
                        {row.courseName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-200">
                        ₹{row.amountPaid?.toLocaleString('en-IN') || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.isValid ? (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded">
                            Valid
                          </span>
                        ) : (
                          <span
                            title={row.validationError}
                            className="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 bg-rose-500/10 rounded cursor-help"
                          >
                            Fix Needed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <div className="text-xs text-neutral-400">
                <span>Auto-creates sequential Student IDs (COR-STU-2026-XXXX) & Invoices</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={validCount === 0}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-orange-950/40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Import {validCount} Students</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
