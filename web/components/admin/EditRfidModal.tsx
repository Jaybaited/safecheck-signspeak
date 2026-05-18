'use client';

import { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { useRfidScanner } from '@/hooks/useRfidScanner';

interface EditRfidModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onSubmit:    (userId: string, rfidCard: string) => Promise<void>;
  studentName: string;
  userId:      string;
  currentRfid: string | null;
}

// ── Friendly error mapper ← added
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('rfidCard') || msg.includes('"rfidCard"'))
    return 'This RFID card is already assigned to another student.';
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized'))
    return 'Your session has expired. Please log in again.';
  if (msg.toLowerCase().includes('network') || msg.includes('fetch'))
    return 'Cannot connect to the server. Please check your connection.';
  return msg || 'Failed to update RFID card. Please try again.';
}

export default function EditRfidModal({
  isOpen, onClose, onSubmit,
  studentName, userId, currentRfid,
}: EditRfidModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const {
    isScanning, scannedRfid,
    error: rfidError, startScan, resetScan,
  } = useRfidScanner();

  const handleClose = () => {
    resetScan();
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!scannedRfid) { startScan(); return; }
    if (submitting) return; // ← double-submit guard
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(userId, scannedRfid);
      handleClose();
    } catch (err) {
      setError(friendlyError(err)); // ← friendly message
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Update RFID Card</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{studentName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Current RFID */}
          <div className="p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
            <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Current RFID Card</p>
            <p className="text-sm font-mono font-semibold text-slate-700 dark:text-gray-200">
              {currentRfid ?? 'Not assigned'}
            </p>
          </div>

          {/* Error */}
          {(error || rfidError) && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error || rfidError}
            </div>
          )}

          {/* Scanned success */}
          {scannedRfid && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest">New Card Scanned</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">{scannedRfid}</p>
              </div>
              <button
                onClick={resetScan}
                className="ml-auto text-emerald-500 hover:text-emerald-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scanning animation */}
          {isScanning && (
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-[#7B1113]/5 dark:bg-[#7B1113]/10 border border-[#7B1113]/20">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-[#7B1113]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#7B1113] rounded-full border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#7B1113] dark:text-[#E8C96A]">Scanning RFID Card…</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tap the card on the reader now</p>
              </div>
              <button
                onClick={resetScan}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel scan
              </button>
            </div>
          )}

          {/* Idle — prompt */}
          {!isScanning && !scannedRfid && (
            <div className="text-center py-4">
              <CreditCard className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Click <span className="font-semibold">"Scan New Card"</span> then tap the RFID card on the reader.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || isScanning}
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-sm font-semibold transition-colors"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                Saving…
              </>
            ) : scannedRfid ? (
              'Save New Card'
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Scan New Card
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}