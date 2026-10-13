'use client';

import { useEffect, useState } from 'react';
import { X, Archive, Loader2 } from 'lucide-react';
import { api, ArchiveStatus, User as ApiUser } from '@/lib/api';

interface ArchiveStudentModalProps {
  student: ApiUser | null;
  onClose: () => void;
  onDone: (message: string) => void;
}

const OPTIONS: { value: ArchiveStatus; label: string; hint: string }[] = [
  { value: 'GRADUATED',       label: 'Graduated',       hint: 'Finished school here.' },
  { value: 'TRANSFERRED_OUT', label: 'Transferred out', hint: 'Moved to another school.' },
  { value: 'DROPPED_OUT',     label: 'Dropped out',     hint: 'Stopped attending.' },
  { value: 'OTHER',           label: 'Other',           hint: 'Another reason. A short note is required.' },
];

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ' +
  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113]';

export default function ArchiveStudentModal({ student, onClose, onDone }: ArchiveStudentModalProps) {
  const [status,     setStatus]     = useState<ArchiveStatus | ''>('');
  const [note,       setNote]       = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const studentId = student?.id;
  useEffect(() => {
    setStatus(''); setNote(''); setConfirming(false); setBusy(false); setError(null);
  }, [studentId]);

  if (!student) return null;
  const fullName = student.firstName + ' ' + student.lastName;
  const chosen = OPTIONS.find((o) => o.value === status);

  const review = () => {
    if (!status) { setError('Choose a reason first.'); return; }
    if (status === 'OTHER' && note.trim().length < 3) { setError('Please write a short note when the reason is Other.'); return; }
    setError(null);
    setConfirming(true);
  };

  const submit = async () => {
    if (!status || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await api.archiveStudent(student.id, status, note.trim() || undefined);
      onDone(res.message);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Archive student</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{fullName} ({student.username})</p>
          </div>
          <button onClick={onClose} disabled={busy}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {!confirming ? (
            <>
              <div className="space-y-2">
                {OPTIONS.map((o) => (
                  <label key={o.value}
                    className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' +
                      (status === o.value
                        ? 'border-[#7B1113] bg-[#7B1113]/5 dark:bg-[#7B1113]/10'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800')}>
                    <input type="radio" name="archive-status" value={o.value} checked={status === o.value}
                      onChange={() => { setStatus(o.value); setError(null); }} className="mt-1" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white">{o.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{o.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Note {status === 'OTHER' ? '(required)' : '(optional)'}
                </label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3}
                  className={INPUT_CLS} placeholder="Short reason or remark" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs text-slate-600 dark:text-gray-300 space-y-1">
                <p className="font-semibold">What happens when a student is archived:</p>
                <p>The student cannot log in, and the RFID card shows an "archived" notice when tapped (the card is kept and never reused).</p>
                <p>The student leaves the Users list, counts, and attendance totals. Records are kept.</p>
                <p>If this was the parent's last active student, the parent account becomes inactive until a student is restored or linked.</p>
                <p>You can restore the student at any time from the Archive page.</p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Archive this student?</p>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">Student</dt><dd className="font-semibold text-gray-900 dark:text-white text-right">{fullName}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">Reason</dt><dd className="font-semibold text-gray-900 dark:text-white text-right">{chosen?.label}</dd></div>
                {note.trim() && (
                  <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">Note</dt><dd className="text-gray-900 dark:text-white text-right">{note.trim()}</dd></div>
                )}
              </dl>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          {!confirming ? (
            <>
              <button type="button" onClick={onClose}
                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold">
                Cancel
              </button>
              <button type="button" onClick={review}
                className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-full text-sm font-semibold">
                <Archive className="w-4 h-4" /> Review
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}
                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold disabled:opacity-50">
                Go back
              </button>
              <button type="button" onClick={() => void submit()} disabled={busy}
                className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-full text-sm font-semibold disabled:opacity-50">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Yes, archive student
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}