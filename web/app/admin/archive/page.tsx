'use client';

import { useEffect, useState } from 'react';
import { ALL_GRADES, gradeText } from '@/lib/grade';
import { useRouter } from 'next/navigation';
import { Search, RotateCcw, Archive as ArchiveIcon, X, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import RestoreStudentModal from '@/components/admin/RestoreStudentModal';
import { api, ArchivedStudent } from '@/lib/api';
import { logout } from '@/lib/auth';

interface AdminUser { id: string; username: string; role: string; firstName: string; lastName: string; }

const STATUS_LABEL: Record<string, string> = {
  GRADUATED: 'Graduated', TRANSFERRED_OUT: 'Transferred out', DROPPED_OUT: 'Dropped out', OTHER: 'Other',
};
const STATUS_CLS: Record<string, string> = {
  GRADUATED:       'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  TRANSFERRED_OUT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  DROPPED_OUT:     'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  OTHER:           'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};
const GRADES: readonly string[] = ALL_GRADES;
const gradeLabel = (g: string | null | undefined) => (g ? gradeText(g) : 'N/A');
const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

const FIELD =
  'bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]';

export default function ArchivePage() {
  const router = useRouter();
  const [admin,   setAdmin]   = useState<AdminUser | null>(null);
  const [rows,    setRows]    = useState<ArchivedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status,  setStatus]  = useState('');
  const [grade,   setGrade]   = useState('');
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [qInput,  setQInput]  = useState('');
  const [q,       setQ]       = useState('');
  const [restoreTarget, setRestoreTarget] = useState<ArchivedStudent | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AdminUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdmin(parsed);
    } catch { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    if (!admin) return;
    let off = false;
    setLoading(true);
    api.getArchivedStudents({ status, gradeLevel: grade, from, to, q })
      .then((res) => { if (!off) { setRows(res.data); setError(null); } })
      .catch((e) => { if (!off) setError(e instanceof Error ? e.message : 'Could not load the archive.'); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [admin, status, grade, from, to, q, reloadKey]);

  const anyFilter = !!(status || grade || from || to || qInput);
  const clearFilters = () => { setStatus(''); setGrade(''); setFrom(''); setTo(''); setQInput(''); setQ(''); };
  const handleLogout = () => { logout(); router.push('/login'); };

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={admin} />
      <main className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Archive</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Students who graduated, transferred out, or dropped out. Their records are kept.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400">{success}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={qInput} onChange={(e) => setQInput(e.target.value)}
                placeholder="Search name or username..." className={FIELD + ' pl-9 w-60'} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
              <option value="">All statuses</option>
              {Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={FIELD}>
              <option value="">All grades</option>
              {GRADES.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
            </select>
            <label className="text-xs text-slate-500 dark:text-gray-400">
              Archived from
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={FIELD + ' block mt-1'} />
            </label>
            <label className="text-xs text-slate-500 dark:text-gray-400">
              to
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={FIELD + ' block mt-1'} />
            </label>
            {anyFilter && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#7B1113] dark:text-[#E8C96A] hover:underline">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{rows.length}</span> archived student{rows.length === 1 ? '' : 's'}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-gray-800">
                <tr className="text-left text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Grade</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Archived</th>
                  <th className="pb-3 font-semibold">By</th>
                  <th className="pb-3 font-semibold">Parent</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800/50 align-top hover:bg-slate-50 dark:hover:bg-gray-800/30">
                    <td className="py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{r.firstName} {r.lastName}</div>
                      <div className="text-xs font-mono text-slate-500 dark:text-gray-400">{r.username}</div>
                    </td>
                    <td className="py-3 text-xs text-slate-500 dark:text-gray-400">{gradeLabel(r.gradeLevel)}</td>
                    <td className="py-3">
                      <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium border ' + (STATUS_CLS[r.archiveStatus ?? 'OTHER'])}>
                        {STATUS_LABEL[r.archiveStatus ?? 'OTHER']}
                      </span>
                      {r.archiveNote && <div className="mt-1 text-xs text-slate-500 dark:text-gray-400 max-w-xs">{r.archiveNote}</div>}
                    </td>
                    <td className="py-3 text-xs text-slate-500 dark:text-gray-400">{formatDate(r.archivedAt)}</td>
                    <td className="py-3 text-xs text-slate-500 dark:text-gray-400">{r.archivedBy ?? '-'}</td>
                    <td className="py-3 text-xs font-mono text-slate-500 dark:text-gray-400">{r.parent ? r.parent.username : '-'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setRestoreTarget(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7B1113] hover:bg-[#9B2020] text-white">
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && rows.length === 0 && (
              <div className="text-center py-12">
                <ArchiveIcon className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                  {anyFilter ? 'No archived students match these filters' : 'No archived students yet'}
                </p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">
                  {anyFilter ? 'Try different filters.' : 'Use "Archive student" in the Manage Users menu when a student leaves.'}
                </p>
              </div>
            )}
            {loading && <p className="py-6 text-center text-xs text-slate-400 dark:text-gray-500">Loading...</p>}
          </div>
        </div>
      </main>

      <RestoreStudentModal
        student={restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onDone={(msg) => {
          setSuccess(msg);
          setTimeout(() => setSuccess(null), 4000);
          setReloadKey((k) => k + 1);
        }}
      />
    </div>
  );
}