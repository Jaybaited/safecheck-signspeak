'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  confirmWord?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks the admin to type a word (default "Confirm") before a risky action goes ahead. */
export default function ConfirmDialog({
  open, title, children, confirmLabel = 'Confirm', confirmWord = 'Confirm',
  danger = true, busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;
  const ready = typed.trim().toLowerCase() === confirmWord.toLowerCase();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className={'h-1 w-full ' + (danger ? 'bg-[#7B1113]' : 'bg-amber-500')} aria-hidden="true" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white pt-1.5">{title}</h3>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">{children}</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
              Type <span className="font-bold normal-case">{confirmWord}</span> to continue
            </label>
            <input ref={inputRef} type="text" value={typed} autoComplete="off" placeholder={confirmWord}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && ready && !busy) onConfirm(); }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113]" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} disabled={busy}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={!ready || busy}
              className={'flex-1 h-11 flex items-center justify-center gap-2 text-white rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ' +
                (danger ? 'bg-[#7B1113] hover:bg-[#9B2020]' : 'bg-amber-600 hover:bg-amber-700')}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}