import React, { useState } from 'react';
import {
  getAdminPin,
  setAdminPin,
  exportDataJson,
  importDataJson,
  resetToDefaults,
} from '../services/storage';
import {
  testFirebaseConnection,
  pushAllLocalDataToFirebase,
  fetchAndSyncAllDataFromFirebase,
} from '../services/firebase';
import {
  getSmtpConfig,
  saveSmtpConfig,
  testSmtpConnection,
  SmtpConfig,
} from '../services/emailService';
import {
  KeyRound,
  Download,
  Upload,
  Database,
  Cloud,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  AlertCircle,
  Wifi,
  ArrowDownCircle,
  ArrowUpCircle,
  Mail,
  Send,
  Eye,
  EyeOff,
  Server,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // Navigation Tabs: 'general' | 'cloud' | 'smtp' | 'backup' | 'pwa'
  const [activeTab, setActiveTab] = useState<'general' | 'cloud' | 'smtp' | 'backup' | 'pwa'>('cloud');

  // Admin PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Firebase Realtime Cloud state
  const [firebaseStatus, setFirebaseStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isPullingAll, setIsPullingAll] = useState(false);

  // SMTP Mail Server State
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => getSmtpConfig());
  const [smtpTestRecipient, setSmtpTestRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{ text: string; error?: boolean } | null>(null);

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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFirebaseStatus(null);
    try {
      const res = await testFirebaseConnection();
      setFirebaseStatus(res.message);
    } catch (err: any) {
      setFirebaseStatus(`Connection error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAllNow = async () => {
    setIsSyncingAll(true);
    setFirebaseStatus(null);
    try {
      const res = await pushAllLocalDataToFirebase();
      if (res.error) {
        setFirebaseStatus(`Sync failed: ${res.error}`);
      } else {
        setFirebaseStatus(
          `Successfully migrated & synced to Firebase Firestore: ${res.studentsCount} students, ${res.coursesCount} courses, ${res.invoicesCount} invoices, ${res.receiptsCount} receipts, and ${res.certificatesCount} certificates!`
        );
      }
    } catch (err: any) {
      setFirebaseStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePullAllNow = async () => {
    setIsPullingAll(true);
    setFirebaseStatus(null);
    try {
      const res = await fetchAndSyncAllDataFromFirebase();
      setFirebaseStatus(
        `Pulled & synced ${res.students.length} students, ${res.courses.length} courses, ${res.invoices.length} invoices, ${res.receipts.length} receipts, and ${res.certificates.length} certificates from Firebase Firestore Cloud!`
      );
    } catch (err: any) {
      setFirebaseStatus(`Pull error: ${err.message}`);
    } finally {
      setIsPullingAll(false);
    }
  };

  const handleProviderSelect = (provider: 'gmail' | 'brevo' | 'hostinger' | 'custom') => {
    if (provider === 'gmail') {
      setSmtpConfig(prev => ({
        ...prev,
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
      }));
    } else if (provider === 'brevo') {
      setSmtpConfig(prev => ({
        ...prev,
        provider: 'brevo',
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
      }));
    } else if (provider === 'hostinger') {
      setSmtpConfig(prev => ({
        ...prev,
        provider: 'hostinger',
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
      }));
    } else {
      setSmtpConfig(prev => ({ ...prev, provider: 'custom' }));
    }
  };

  const handleSaveSmtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveSmtpConfig(smtpConfig);
    setSmtpStatus({ text: 'SMTP configuration saved successfully!', error: false });
    setTimeout(() => setSmtpStatus(null), 4000);
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpStatus(null);
    try {
      const res = await testSmtpConnection(smtpConfig, smtpTestRecipient);
      setSmtpStatus({ text: res.message, error: !res.success });
      if (res.success) {
        saveSmtpConfig({ ...smtpConfig, enabled: true });
      }
    } catch (err: any) {
      setSmtpStatus({ text: err.message || 'SMTP test error', error: true });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to restore factory default demo records?')) {
      resetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              <span>System Settings & Integrations</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Cloud database, Direct Mail / SMTP dispatch, security access, and backups
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-orange-400" />
            <span>Firebase Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('smtp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'smtp'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Mail / SMTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-400" />
            <span>PWA &amp; App</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* TAB 1: CLOUD DATABASE */}
          {activeTab === 'cloud' && (
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Firebase Firestore Realtime Cloud Database
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  Active & Synced
                </span>
              </div>

              {/* Real-Time Sync Automatic Explanation Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Instant Real-Time Sync Active (No Manual Push Needed!)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Whenever you <strong>create, edit, or delete</strong> any student, course, invoice, payment receipt, or certificate, it is <strong>automatically pushed to Firebase Firestore instantly</strong> in the background. You do <strong className="text-white">not</strong> have to manually push or pull from this modal every time.
                </p>
                <p className="text-[11px] text-neutral-400">
                  The manual buttons below are provided exclusively for bulk migrations, disaster recovery, or restoring data on a brand-new device.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-neutral-900/80 border border-neutral-800/80 p-3 rounded-lg text-neutral-300">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-sans">Firebase Project ID</span>
                  <span className="text-orange-400 font-bold">clear-tiger-zd2jw</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-sans">Firestore Database</span>
                  <span className="text-neutral-200 truncate block">ai-studio-cortexxdashboard-cbc36379-5e45...</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncAllNow}
                  disabled={isSyncingAll}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowUpCircle className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Migrating...' : 'Migrate / Push All Local Data to Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullAllNow}
                  disabled={isPullingAll}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowDownCircle className={`w-3.5 h-3.5 text-blue-400 ${isPullingAll ? 'animate-spin' : ''}`} />
                  <span>{isPullingAll ? 'Pulling...' : 'Pull Cloud Data'}</span>
                </button>
              </div>

              {firebaseStatus && (
                <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                  {firebaseStatus}
                </p>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT MAIL & SMTP INTEGRATION */}
          {activeTab === 'smtp' && (
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Direct Mail & SMTP Integration
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] font-mono font-semibold">
                  <Server className="w-3 h-3" />
                  Native Express SMTP
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your SMTP mail server (Gmail, Hostinger, Brevo, or custom SMTP) to send <strong>Tax Invoices, Payment Receipts, and Admission Confirmations</strong> directly to students with one click.
              </p>

              {/* Provider Presets */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Mail Provider Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('gmail')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      smtpConfig.provider === 'gmail'
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Gmail / Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('hostinger')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      smtpConfig.provider === 'hostinger'
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Hostinger
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('brevo')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      smtpConfig.provider === 'brevo'
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Brevo / Sendinblue
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('custom')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      smtpConfig.provider === 'custom'
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Custom SMTP
                  </button>
                </div>
              </div>

              {/* SMTP Credentials Form */}
              <form onSubmit={handleSaveSmtp} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                      SMTP Host Server
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={e => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                      Port (587 / 465)
                    </label>
                    <input
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={e => setSmtpConfig(prev => ({ ...prev, port: Number(e.target.value) || 587 }))}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                      Username / Email
                    </label>
                    <input
                      type="email"
                      placeholder="info.cortexx@gmail.com"
                      value={smtpConfig.user}
                      onChange={e => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                      App Password / Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPassword ? 'text' : 'password'}
                        placeholder="••••••••••••••••"
                        value={smtpConfig.pass}
                        onChange={e => setSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                        className="w-full px-3 py-1.5 pr-8 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        className="absolute right-2 top-2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        {showSmtpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      placeholder="Cortexx AI Institute"
                      value={smtpConfig.fromName}
                      onChange={e => setSmtpConfig(prev => ({ ...prev, fromName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                      Sender Email (From)
                    </label>
                    <input
                      type="email"
                      placeholder="info.cortexx@gmail.com"
                      value={smtpConfig.fromEmail}
                      onChange={e => setSmtpConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {smtpConfig.provider === 'gmail' && (
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-2.5 text-[11px] text-sky-300">
                    💡 <strong>Gmail Tip:</strong> Use an <strong>App Password</strong> instead of your regular password. Enable 2-Step Verification in Google Account &gt; Security &gt; App Passwords, generate a 16-character code, and paste it here.
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>

                  {/* Test Dispatch Form */}
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <input
                      type="email"
                      placeholder="Send test email to..."
                      value={smtpTestRecipient}
                      onChange={e => setSmtpTestRecipient(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp}
                      className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isTestingSmtp ? 'Testing...' : 'Test SMTP'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {smtpStatus && (
                <p
                  className={`text-xs p-2.5 rounded-lg border font-medium ${
                    smtpStatus.error
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  }`}
                >
                  {smtpStatus.text}
                </p>
              )}
            </div>
          )}

          {/* TAB 3: ADMIN PIN */}
          {activeTab === 'general' && (
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Change Admin PIN
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-400">
                The Master PIN protects administrative actions, invoice creations, and portal access. Default is <strong>1234</strong>.
              </p>

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
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
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
                  type="button"
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
          )}

          {/* TAB 5: PWA & MOBILE WEB SHORTCUT */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* PWA Install Banner */}
              <PWAInstallButton variant="banner" />

              {/* Generated Icon Assets Showcase */}
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      <span>Official Generated PWA &amp; Web Shortcut Icons</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      High-resolution assets tailored for Apple iOS Safari, Android Adaptive Icons, and Desktop PWAs
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Apple Touch Icon */}
                  <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col items-center text-center space-y-2">
                    <div className="relative">
                      <img
                        src="/apple-touch-icon.png"
                        alt="Apple Touch Icon"
                        className="w-16 h-16 rounded-2xl shadow-lg border border-neutral-700 bg-black"
                      />
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-neutral-800 text-[9px] font-bold text-neutral-200 rounded border border-neutral-700">
                        iOS
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-200">Apple Touch Icon</div>
                      <div className="text-[10px] font-mono text-neutral-400">180 × 180 PNG</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">iPhone &amp; iPad Home Screen</div>
                    </div>
                  </div>

                  {/* Android Adaptive / Maskable Icon */}
                  <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col items-center text-center space-y-2">
                    <div className="relative">
                      <img
                        src="/pwa-maskable-512x512.png"
                        alt="Android Maskable Icon"
                        className="w-16 h-16 rounded-full shadow-lg border border-orange-500/30 bg-black"
                      />
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-500/20 text-[9px] font-bold text-emerald-400 rounded border border-emerald-500/30">
                        Android
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-200">Android Maskable</div>
                      <div className="text-[10px] font-mono text-neutral-400">512 × 512 PNG</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">Adaptive Circle / Squircle</div>
                    </div>
                  </div>

                  {/* Standard Web App Icon */}
                  <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col items-center text-center space-y-2">
                    <div className="relative">
                      <img
                        src="/pwa-512x512.png"
                        alt="HD Web App Icon"
                        className="w-16 h-16 rounded-2xl shadow-lg border border-orange-500/30 bg-black"
                      />
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-orange-500/20 text-[9px] font-bold text-orange-400 rounded border border-orange-500/30">
                        PWA
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-200">HD Web App Icon</div>
                      <div className="text-[10px] font-mono text-neutral-400">512 × 512 PNG</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">Chrome, Edge &amp; Desktop</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Shortcut Guides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Apple iOS Guide */}
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>Apple iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="space-y-1.5 text-neutral-300 list-decimal list-inside pl-0.5">
                    <li>Open this URL in <strong>Safari</strong></li>
                    <li>Tap the <strong>Share</strong> button (box with upward arrow)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Confirm name as <strong>"Cortexx AI"</strong> and tap <strong>Add</strong></li>
                  </ol>
                  <p className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                    Creates an app icon using the official Apple Touch PNG shortcut.
                  </p>
                </div>

                {/* Android / Desktop Guide */}
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Android &amp; Desktop (Chrome / Edge)</span>
                  </div>
                  <ol className="space-y-1.5 text-neutral-300 list-decimal list-inside pl-0.5">
                    <li>Click the <strong>"Install App"</strong> button in top header</li>
                    <li>Or tap the browser menu (<strong>⋮</strong>) in the top-right</li>
                    <li>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                    <li>Confirm installation to launch as standalone window</li>
                  </ol>
                  <p className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                    Supports offline caching, background updates, and zero browser chrome.
                  </p>
                </div>
              </div>

              {/* Manifest & Service Worker Technical Status */}
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-neutral-200 font-semibold font-sans">Service Worker &amp; Manifest:</span>
                  <span>Standalone Mode Active</span>
                </div>
                <span className="text-[11px] text-orange-400 font-sans">Workbox Precached</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Reset to Factory Demo Data
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
