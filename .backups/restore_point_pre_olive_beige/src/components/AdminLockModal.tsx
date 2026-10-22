import React, { useState, useEffect } from 'react';
import { getAdminPin, setAdminAuthenticated } from '../services/storage';
import { CortexxLogo } from './CortexxLogo';
import { Lock, AlertTriangle, ArrowLeft, X, Shield, ExternalLink } from 'lucide-react';

interface AdminLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  onBack?: () => void;
  isMandatoryGate?: boolean;
  onGoToVerification?: () => void;
  title?: string;
  description?: string;
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  isOpen,
  onUnlock,
  onBack,
  isMandatoryGate = false,
  onGoToVerification,
  title = 'Admin Passcode Required',
  description = 'Enter 4-digit PIN to access institute management and records',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const correctPin = getAdminPin();

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin === correctPin) {
        setAdminAuthenticated(true);
        setTimeout(() => {
          setPin('');
          onUnlock();
        }, 150);
      } else if (nextPin.length === correctPin.length) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 800);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Escape' && !isMandatoryGate && onBack) {
      onBack();
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-xl outline-none select-none animate-fadeIn"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-5 bg-neutral-900/80 border border-neutral-800 p-6 sm:p-7 rounded-2xl shadow-2xl">
        {/* Top Action Bar (only if not mandatory or if cancel is allowed) */}
        {!isMandatoryGate && onBack && (
          <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700/80 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
              <span>Back</span>
            </button>

            <button
              onClick={onBack}
              title="Close"
              className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Authentic Cortexx AI Logo - Same as Dashboard Corner & Original App Launch */}
        <div className="w-full flex items-center justify-center pt-1 pb-1 transition-transform hover:scale-105 duration-300">
          <CortexxLogo size="lg" layout="vertical" showTagline={true} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-neutral-100 font-bold text-base">
            <Lock className="w-4 h-4 text-orange-500" />
            <span>{title}</span>
          </div>
          <p className="text-xs text-neutral-400">
            {description}
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                error
                  ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-900/50 animate-pulse'
                  : pin.length > idx
                  ? 'bg-orange-500 scale-105 shadow-md shadow-orange-900/50'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-rose-400 flex items-center gap-1.5 font-semibold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Incorrect PIN. Please try again.</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-64 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-full py-3 text-lg font-bold font-mono text-neutral-100 bg-neutral-950 hover:bg-neutral-800 active:bg-orange-500/20 border border-neutral-800 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="py-3 text-xs font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-800/80 rounded-xl cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="py-3 text-lg font-bold font-mono text-neutral-100 bg-neutral-950 hover:bg-neutral-800 active:bg-orange-500/20 border border-neutral-800 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 text-xs font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-800/80 rounded-xl cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* Navigation options for Mandatory Gate */}
        {isMandatoryGate && onGoToVerification && (
          <div className="w-full pt-2 border-t border-neutral-800/80">
            <button
              onClick={onGoToVerification}
              className="w-full py-2.5 text-xs font-medium text-neutral-400 hover:text-orange-400 hover:bg-neutral-950/80 border border-neutral-800/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Certificate Verification Portal</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </button>
          </div>
        )}

        {!isMandatoryGate && onBack && (
          <button
            onClick={onBack}
            className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950 border border-neutral-800/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Return</span>
          </button>
        )}
      </div>
    </div>
  );
};
