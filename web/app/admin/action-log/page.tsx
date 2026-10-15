'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History, XCircle,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import { getAdminLog, AdminLogResponse } from '@/lib/admin-log-api';

interface AdminUser {
  id: string; username: string; role: string; firstName: string; lastName: string;
}

const FIELD =
  'px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors';

// "STUDENT_ARCHIVED" -> "Student archived"
function actionLabel(action: string): string {
  const t = action.toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function actionClass(action: string): string {
  const a = action.toUpperCase();
  if (a.includes('DELETE') || a.includes('REJECT') || a.includes('REMOVED'))
    return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
  if (a.includes('ARCHIVE') || a.includes('OVERRIDDEN') || a.includes('CHANGED'))
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  if (a.includes('CREATED') || a.includes('ADDED') || a.includes('RESTORED') || a.includes('APPROVED') || a.includes('RELEASED'))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ActionLogPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [adminId, setAdminId] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<AdminLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AdminUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdmin(parsed);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  // Search box waits 400 ms after the last keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    if (!admin) return;
    let off = false;
    setLoading(true);
    getAdminLog({ adminId, action, from, to, q, page, limit: 25 })
      .then((r) => { if (!off) { setResult(r); setError(null); } })
      .catch((e) => { if (!off) setError(e instanceof Error ? e.message : 'Could not load the action log.'); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [admin, adminId, action, from, to, q, page]);

  const anyFilter = !!(adminId || action || from || to || qInput);
  const clearFilters = () => {
    setAdminId(''); setAction(''); setFrom(''); setTo(''); setQInput(''); setQ(''); setPage(1);
  };
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const handleLogout = () => { logout(); router.push('/login'); };

  if (authLoading || !admin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rows = result?.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={admin} />

      <main className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Action Log</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Every admin change, newest first. Times are Manila time.
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

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search the summary..."
                className={FIELD + ' pl-9 w-60'}
              />
            </div>

            <select value={adminId} onChange={(e) => { setAdminId(e.target.value); setPage(1); }} className={FIELD}>
              <option value="">All admins</option>
              {(result?.admins ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={FIELD}>
              <option value="">All actions</option>
              {(result?.actions ?? []).map((a) => (
                <option key={a} value={a}>{actionLabel(a)}</option>
              ))}
            </select>

            <label className="text-xs text-slate-500 dark:text-gray-400">
              From
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={FIELD + ' block mt-1'} />
            </label>
            <label className="text-xs text-slate-500 dark:text-gray-400">
              To
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={FIELD + ' block mt-1'} />
            </label>

            {anyFilter && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#7B1113] dark:text-[#E8C96A] hover:underline">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
            {loading ? 'Loading...' : `${result?.total ?? 0} entr${(result?.total ?? 0) === 1 ? 'y' : 'ies'}`}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-gray-800">
                <tr className="text-left text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">When</th>
                  <th className="pb-3 font-semibold">Admin</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">What happened</th>
                  <th className="pb-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const open = expanded.has(r.id);
                  const hasDetails = r.details !== null && r.details !== undefined;
                  return (
                    <Fragment key={r.id}>
                      <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800/50 align-top hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 pr-3 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{formatWhen(r.createdAt)}</td>
                        <td className="py-3 pr-3 text-xs text-slate-700 dark:text-gray-200 whitespace-nowrap">{r.adminName}</td>
                        <td className="py-3 pr-3">
                          <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ' + actionClass(r.action)}>
                            {actionLabel(r.action)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-slate-800 dark:text-gray-100">{r.summary}</td>
                        <td className="py-3 text-right">
                          {hasDetails && (
                            <button
                              onClick={() => toggle(r.id)}
                              className="inline-flex items-center gap-1 text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline"
                            >
                              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              {open ? 'Hide' : 'Show'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr key={r.id + '-d'} className="border-b border-slate-100 dark:border-gray-800/50">
                          <td colSpan={5} className="pb-3">
                            <pre className="text-xs bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto text-slate-700 dark:text-gray-200">
{JSON.stringify(r.details, null, 2)}
                            </pre>
                            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 font-mono">
                              {r.targetType}{r.targetId ? ' · ' + r.targetId : ''}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            {!loading && rows.length === 0 && (
              <div className="text-center py-12">
                <History className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                  {anyFilter ? 'No entries match these filters' : 'No admin actions recorded yet'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-200 dark:border-gray-800">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Page {result?.page ?? 1} of {result?.totalPages ?? 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || page >= (result?.totalPages ?? 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}