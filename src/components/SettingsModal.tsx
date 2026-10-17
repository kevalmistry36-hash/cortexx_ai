import React, { useState } from 'react';
import {
  getAdminPin,
  setAdminPin,
  exportDataJson,
  importDataJson,
  resetToDefaults,
  getSupabaseConfig,
  saveSupabaseConfig,
  generateSupabaseSqlSchema,
} from '../services/storage';
import {
  testSupabaseConnection,
  pushAllLocalDataToSupabase,
  fetchAndSyncAllDataFromSupabase,
} from '../services/supabase';
import {
  KeyRound,
  Download,
  Upload,
  Database,
  Cloud,
  Copy,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  AlertCircle,
  Wifi,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // Admin PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Supabase state
  const initialSupabase = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(initialSupabase.anonKey);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isPullingAll, setIsPullingAll] = useState(false);

  // Backup state
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getAdminPin();
    if (currentPin !== storedPin) {
      setPinMessage({ text: 'Current PIN is incorrect.', error: true });
      return;
    }
    if (newPin.length < 4) {
      setPinMessage({ text: 'New PIN must be at least 4 digits.', error: true });
      return;
    }
    setAdminPin(newPin);
    setPinMessage({ text: 'Admin PIN successfully updated.', error: false });
    setCurrentPin('');
    setNewPin('');
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cortexx_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!importText.trim()) {
      setImportStatus({ text: 'Please paste backup JSON data to import.', error: true });
      return;
    }
    const result = importDataJson(importText.trim());
    setImportStatus({ text: result.message, error: !result.success });
    if (result.success) {
      setImportText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        const result = importDataJson(text);
        setImportStatus({ text: result.message, error: !result.success });
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSupabase = () => {
    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim(),
      autoSync: !!supabaseUrl && !!supabaseKey,
    });
    setSupabaseStatus('Supabase configuration saved.');
    setTimeout(() => setSupabaseStatus(null), 3500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setSupabaseStatus(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
      setSupabaseStatus(res.message);
    } catch (err: any) {
      setSupabaseStatus(`Connection error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAllNow = async () => {
    setIsSyncingAll(true);
    setSupabaseStatus(null);
    try {
      const res = await pushAllLocalDataToSupabase();
      if (res.error) {
        setSupabaseStatus(`Sync failed: ${res.error}`);
      } else {
        setSupabaseStatus(
          `Successfully synced to Supabase: ${res.studentsCount} students, ${res.coursesCount} courses, ${res.invoicesCount} invoices, ${res.receiptsCount} receipts, and ${res.certificatesCount} certificates!`
        );
      }
    } catch (err: any) {
      setSupabaseStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePullAllNow = async () => {
    setIsPullingAll(true);
    setSupabaseStatus(null);
    try {
      const res = await fetchAndSyncAllDataFromSupabase();
      setSupabaseStatus(
        `Pulled & synced ${res.students.length} students, ${res.courses.length} courses, ${res.invoices.length} invoices, ${res.receipts.length} receipts, and ${res.certificates.length} certificates from Supabase Cloud!`
      );
    } catch (err: any) {
      setSupabaseStatus(`Pull error: ${err.message}`);
    } finally {
      setIsPullingAll(false);
    }
  };

  const handleCopySchema = () => {
    const sql = generateSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to restore factory default demo records?')) {
      resetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              <span>System Settings & Database</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Security access, local database backups, and cloud synchronization
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Admin Master PIN */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Change Admin PIN
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdatePin} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="password"
              placeholder="Current PIN"
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
            />
            <input
              type="password"
              placeholder="New PIN (4+ digits)"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Update PIN
            </button>
          </form>

          {pinMessage && (
            <p className={`text-xs ${pinMessage.error ? 'text-rose-400' : 'text-emerald-400'}`}>
              {pinMessage.text}
            </p>
          )}
        </div>

        {/* 2. Database Backup & Restore */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Database Backup & Restore (Zero Data Loss)
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Export all courses, students, invoices, payment receipts, and certificates into a single JSON file.
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Download JSON Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload Backup File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <p className={`text-xs ${importStatus.error ? 'text-rose-400' : 'text-emerald-400'}`}>
              {importStatus.text}
            </p>
          )}
        </div>

        {/* 3. Supabase Cloud Sync & Realtime Persistence */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Supabase Realtime Cloud Sync (All Data)
              </span>
            </div>
            <button
              onClick={handleCopySchema}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSchema ? 'SQL Copied!' : 'Copy Complete Realtime SQL Schema'}</span>
            </button>
          </div>

          <p className="text-xs text-neutral-400">
            Records all Students, Courses, Invoices, Payment Receipts, and Certificates in Supabase Realtime so data integrity is uniform across all devices anywhere.
          </p>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] text-neutral-400 font-mono mb-0.5">Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 font-mono mb-0.5">Anon Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={handleSaveSupabase}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Save Credentials
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSyncAllNow}
              disabled={isSyncingAll}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpCircle className={`w-3.5 h-3.5 text-orange-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing...' : 'Push All Data to Cloud'}</span>
            </button>

            <button
              onClick={handlePullAllNow}
              disabled={isPullingAll}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowDownCircle className={`w-3.5 h-3.5 text-blue-400 ${isPullingAll ? 'animate-spin' : ''}`} />
              <span>{isPullingAll ? 'Pulling...' : 'Pull Cloud Data'}</span>
            </button>
          </div>

          {supabaseStatus && (
            <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              {supabaseStatus}
            </p>
          )}
        </div>

        {/* 4. Factory Demo Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Reset to Factory Demo Data
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
