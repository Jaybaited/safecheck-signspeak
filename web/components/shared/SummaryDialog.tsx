'use client';

import { useEffect, type ReactNode } from 'react';
import { Info, Loader2 } from 'lucide-react';

interface SummaryDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Plain yes/no review dialog for lower-risk changes. Risky ones use ConfirmDialog (typed word). */
export default function SummaryDialog({
  open, title, children, confirmLabel = 'Yes, continue', busy = false, onConfirm, onCancel,
}: SummaryDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-[#C4972A]" aria-hidden="true" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white pt-1.5">{title}</h3>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">{children}</div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} disabled={busy}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={busy}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-full text-sm font-semibold disabled:opacity-50">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}