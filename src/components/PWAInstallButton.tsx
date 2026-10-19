import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone, suppress prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // In browsers where beforeinstallprompt hasn't fired yet or desktop Safari/Firefox,
      // show helpful install guide modal
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          title="Install Cortexx AI App on Home Screen (PWA)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all cursor-pointer shadow-sm group ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-neutral-950 font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4 text-neutral-950" />
          <span>{isInstalling ? 'Installing...' : 'Install PWA Web App'}</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 bg-gradient-to-r from-neutral-900 to-neutral-950 border border-orange-500/30 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 shadow-md ${className}`}>
          <div className="flex items-start sm:items-center gap-3">
            <img src="/pwa-192x192.png" alt="Cortexx AI" className="w-10 h-10 rounded-xl shadow-md border border-orange-500/30 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <span>Install Cortexx AI App</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 font-mono px-1.5 py-0.5 rounded border border-orange-500/30">PWA</span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Add to your Home Screen on Android, iPhone, or Desktop for instant offline access.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-neutral-950 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 shadow text-center flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-950" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* Guide Modal for iOS Safari / Unsupported Browsers */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/apple-touch-icon.png"
                  alt="Cortexx AI App Icon"
                  className="w-12 h-12 rounded-xl border border-orange-500/40 shadow-md"
                />
                <div>
                  <h3 className="text-base font-bold text-neutral-100">Install Cortexx AI</h3>
                  <p className="text-xs text-neutral-400">Add shortcut to your device</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
              <div className="font-semibold text-orange-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>On iPhone / iPad (Safari):</span>
              </div>
              <ol className="space-y-2 list-decimal list-inside text-neutral-300">
                <li className="flex items-center gap-2">
                  <span>1. Tap the</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-sky-400 font-medium">
                    <Share className="w-3 h-3" /> Share
                  </span>
                  <span>button below</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>2. Scroll down &amp; tap</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-neutral-200 font-medium">
                    <PlusSquare className="w-3 h-3 text-orange-400" /> Add to Home Screen
                  </span>
                </li>
                <li>3. Tap <strong>Add</strong> in the top-right corner</li>
              </ol>

              <div className="pt-2 border-t border-neutral-800/80">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>On Android (Chrome / Edge):</span>
                </div>
                <p className="text-neutral-400">
                  Tap the browser menu (⋮) in the top right and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Launches fullscreen with offline caching and native app performance.</span>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
