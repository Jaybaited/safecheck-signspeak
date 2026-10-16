'use client';

import { useEffect, useState } from 'react';
import { ALL_GRADES, gradeText } from '@/lib/grade';
import { X, RotateCcw, Loader2 } from 'lucide-react';
import { api, ArchivedStudent } from '@/lib/api';

interface RestoreStudentModalProps {
  student: ArchivedStudent | null;
  onClose: () => void;
  onDone: (message: string) => void;
}

const GRADES: readonly string[] = ALL_GRADES;
const gradeLabel = (g: string) => gradeText(g);

export default function RestoreStudentModal({ student, onClose, onDone }: RestoreStudentModalProps) {
  const [grade,      setGrade]      = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const studentId = student?.id;
  const currentGrade = student?.gradeLevel ?? '';
  useEffect(() => {
    setGrade(currentGrade); setConfirming(false); setBusy(false); setError(null);
  }, [studentId, currentGrade]);

  if (!student) return null;
  const fullName = student.firstName + ' ' + student.lastName;

  const review = () => {
    if (!grade) { setError('Choose the grade level for the restored student.'); return; }
    setError(null);
    setConfirming(true);
  };

  const submit = async () => {
    if (!grade || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await api.restoreStudent(student.id, grade);
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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Restore student</h2>
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
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The student can log in again and the card works again. Their parent account becomes active again. Choose the grade level for this school year.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Grade level</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30">
                  <option value="">Select grade</option>
                  {GRADES.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">Restore this student?</p>
              <p className="text-gray-600 dark:text-gray-300">{fullName} will return to the Users list as a {gradeLabel(grade)} student.</p>
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
                <RotateCcw className="w-4 h-4" /> Review
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
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Yes, restore student
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}