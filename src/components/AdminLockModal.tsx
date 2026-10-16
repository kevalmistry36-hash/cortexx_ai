import React, { useState } from 'react';
import { getAdminPin } from '../services/storage';
import { CortexxLogo } from './CortexxLogo';
import { Lock, Unlock, KeyRound, AlertTriangle, ArrowLeft, X } from 'lucide-react';

interface AdminLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  onBack: () => void;
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({ isOpen, onUnlock, onBack }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const correctPin = getAdminPin();

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin === correctPin) {
        setTimeout(() => {
          setPin('');
          onUnlock();
        }, 150);
      } else if (nextPin.length === correctPin.length) {
        setError(true);
        setTimeout(() => setPin(''), 600);
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
    } else if (e.key === 'Escape') {
      onBack();
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-xl outline-none select-none animate-fadeIn"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-5 bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl shadow-2xl">
        {/* Top Back Action Bar */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800/80">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
            <span>Back</span>
          </button>

          <button
            onClick={onBack}
            title="Close / Cancel"
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <CortexxLogo size="sm" showTagline={true} />

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-neutral-100 font-bold text-base">
            <Lock className="w-4 h-4 text-orange-500" />
            <span>Admin Passcode Required</span>
          </div>
          <p className="text-xs text-neutral-400">
            Enter PIN to access student records and financial ledgers
          </p>
          <p className="text-[11px] text-neutral-500 font-mono">
            (Default Master PIN: <span className="text-orange-400 font-bold">2026</span>)
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all ${
                error
                  ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-900/50'
                  : pin.length > idx
                  ? 'bg-orange-500 scale-105 shadow-md shadow-orange-900/50'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-rose-400 flex items-center gap-1 font-semibold animate-shake">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incorrect PIN. Please try again.</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-60 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-full py-3 text-lg font-bold font-mono text-neutral-100 bg-neutral-950 hover:bg-neutral-800 active:bg-orange-500/20 border border-neutral-800 rounded-xl transition-all shadow-sm"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="py-3 text-xs font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-900 rounded-xl"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="py-3 text-lg font-bold font-mono text-neutral-100 bg-neutral-950 hover:bg-neutral-800 active:bg-orange-500/20 border border-neutral-800 rounded-xl transition-all shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 text-xs font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-900 rounded-xl"
          >
            ⌫
          </button>
        </div>

        {/* Bottom Back Button */}
        <button
          onClick={onBack}
          className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950 border border-neutral-800/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel & Return to Previous Screen</span>
        </button>
      </div>
    </div>
  );
};
