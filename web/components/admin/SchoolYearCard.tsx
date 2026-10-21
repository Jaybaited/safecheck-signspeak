'use client';

import { useEffect, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import SummaryDialog from '@/components/shared/SummaryDialog';
import { getSchoolYear, saveSchoolYear } from '@/lib/school-year-api';

const INPUT =
  'px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors';

// The school year starts in June, so before June we are still in the year that began last calendar year.
function suggestName(): string {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const y = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 5 ? y : y - 1;
  return startYear + '-' + (startYear + 1);
}

interface SchoolYearCardProps {
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

export default function SchoolYearCard({ onSaved, onError }: SchoolYearCardProps) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let off = false;
    getSchoolYear()
      .then((sy) => {
        if (off) return;
        if (sy) {
          setName(sy.name);
          setStart(sy.start);
          setEnd(sy.end);
          setSavedName(sy.name);
        } else {
          setName(suggestName());
        }
      })
      .catch(() => { if (!off) setName(suggestName()); })
      .finally(() => { if (!off) setLoaded(true); });
    return () => { off = true; };
  }, []);

  const validate = (): string | null => {
    const m = /^(\d{4})-(\d{4})$/.exec(name.trim());
    if (!m || Number(m[2]) !== Number(m[1]) + 1) return 'Type the school year like 2026-2027 (two years in a row).';
    if (!start || !end) return 'Pick the start and end dates of the school year.';
    if (end <= start) return 'The end date must be after the start date.';
    return null;
  };

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { onError(problem); return; }
    onError('');
    setConfirm(true);
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await saveSchoolYear({ name: name.trim(), start, end });
      setSavedName(name.trim());
      onSaved('School year saved.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save the school year.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SummaryDialog
        open={confirm}
        title="Save the school year?"
        confirmLabel="Save"
        busy={saving}
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); void doSave(); }}
      >
        <p>School year <strong>{name.trim()}</strong></p>
        <p>Starts {start || '-'} and ends {end || '-'}.</p>
        <p>The year-end tools show this name. This is recorded in the Action Log.</p>
      </SummaryDialog>

      <form
        onSubmit={review}
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 mb-5 shadow-sm dark:shadow-none"
      >
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold">School year</h2>
          <span className={'px-2 py-0.5 rounded-full text-[11px] font-medium border ' +
            (savedName
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20')}>
            {savedName ? 'Current: ' + savedName : loaded ? 'Not set yet' : 'Loading...'}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-gray-400">School year</label>
            <input
              type="text"
              value={name}
              maxLength={9}
              placeholder="2026-2027"
              onChange={(e) => setName(e.target.value)}
              className={INPUT + ' w-32'}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-gray-400">First day</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={INPUT} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Last day</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={INPUT} />
          </div>
          <button
            type="submit"
            disabled={saving || !loaded}
            className="px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save school year'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-gray-500">
          Used by the year-end tools on Manage Users. A semester or quarter setting can be added later if the school needs it.
        </p>
      </form>
    </>
  );
}