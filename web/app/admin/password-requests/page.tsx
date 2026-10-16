'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound, CheckCircle, XCircle, Clock, Copy, Check, Loader2, User,
  Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  getAllResetRequests, approveResetRequest, rejectResetRequest, PasswordResetRequest,
} from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import SummaryDialog from '@/components/shared/SummaryDialog';
import { logout } from '@/lib/auth';

type ApproveResult = { username: string; generatedPassword: string };
type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED';

const HISTORY_PAGE_SIZE = 8;

const FIELD =
  'px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function roleBadge(role?: string) {
  if (role === 'TEACHER')
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  if (role === 'STUDENT')
    return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  return 'bg-[#C4972A]/10 text-[#8B6818] border-[#C4972A]/20 dark:text-[#E8C96A]';
}

function personName(req: PasswordResetRequest) {
  return req.user ? `${req.user.firstName} ${req.user.lastName}` : '';
}

function matches(req: PasswordResetRequest, q: string) {
  if (!q) return true;
  const t = q.toLowerCase();
  return req.username.toLowerCase().includes(t) || personName(req).toLowerCase().includes(t);
}

export default function PasswordRequestsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; req: PasswordResetRequest } | null>(null);
  const [approveResult, setApproveResult] = useState<ApproveResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingQuery, setPendingQuery] = useState('');
  const [pendingRole, setPendingRole] = useState('ALL');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyStatus, setHistoryStatus] = useState<HistoryFilter>('ALL');
  const [historyPage, setHistoryPage] = useState(1);

  const fetchRequests = async () => {
    try {
      setRequests(await getAllResetRequests());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdminUser(parsed);
      fetchRequests();
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router]);

  // Warn before leaving while a new password has not been copied.
  useEffect(() => {
    if (!approveResult || hasCopied) return;
    const warnUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const guardLinks = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm('The new password has not been copied and will be lost if you leave. Leave anyway?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warnUnload);
    document.addEventListener('click', guardLinks, true);
    return () => {
      window.removeEventListener('beforeunload', warnUnload);
      document.removeEventListener('click', guardLinks, true);
    };
  }, [approveResult, hasCopied]);

  useEffect(() => { setHistoryPage(1); }, [historyQuery, historyStatus]);

  const pendingAll = useMemo(
    () => requests
      .filter((r) => r.status === 'PENDING')
      .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()),
    [requests],
  );
  const resolvedAll = useMemo(
    () => requests
      .filter((r) => r.status !== 'PENDING')
      .sort((a, b) =>
        new Date(b.resolvedAt ?? b.requestedAt).getTime() - new Date(a.resolvedAt ?? a.requestedAt).getTime()),
    [requests],
  );
  const pendingShown = useMemo(
    () => pendingAll.filter((r) => matches(r, pendingQuery.trim()) && (pendingRole === 'ALL' || r.user?.role === pendingRole)),
    [pendingAll, pendingQuery, pendingRole],
  );
  const historyShown = useMemo(
    () => resolvedAll.filter((r) => matches(r, historyQuery.trim()) && (historyStatus === 'ALL' || r.status === historyStatus)),
    [resolvedAll, historyQuery, historyStatus],
  );
  const historyPages = Math.max(1, Math.ceil(historyShown.length / HISTORY_PAGE_SIZE));
  const historyPageSafe = Math.min(historyPage, historyPages);
  const historyRows = historyShown.slice((historyPageSafe - 1) * HISTORY_PAGE_SIZE, historyPageSafe * HISTORY_PAGE_SIZE);
  const approvedCount = resolvedAll.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = resolvedAll.filter((r) => r.status === 'REJECTED').length;

  const handleLogout = () => {
    if (approveResult && !hasCopied && !window.confirm('The new password has not been copied and will be lost. Sign out anyway?')) return;
    logout();
    router.push('/login');
  };

  const handleApprove = async (id: string) => {
    if (approveResult && !hasCopied && !window.confirm('The previous password has not been copied and will be lost. Continue?')) return;
    setActionLoading(id);
    setError(null);
    try {
      const result = await approveResetRequest(id);
      setApproveResult({ username: result.username, generatedPassword: result.generatedPassword });
      setHasCopied(false);
      setCopied(false);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await rejectResetRequest(id);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = async () => {
    if (!approveResult) return;
    try {
      await navigator.clipboard.writeText(approveResult.generatedPassword);
      setCopied(true);
      setHasCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically. Select the password and copy it manually.');
    }
  };

  const handleCloseBanner = () => {
    if (!hasCopied && !window.confirm('This password will not be shown again. Close without copying it?')) return;
    setApproveResult(null);
    setHasCopied(false);
    setCopied(false);
  };

  if (loading || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Pending', value: pendingAll.length, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Approved', value: approvedCount, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Rejected', value: rejectedCount, color: 'text-slate-600 dark:text-gray-300' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <SummaryDialog
        open={confirmAction !== null}
        title={confirmAction?.type === 'approve' ? 'Approve this password reset?' : 'Reject this reset request?'}
        confirmLabel={confirmAction?.type === 'approve' ? 'Approve reset' : 'Reject request'}
        busy={actionLoading !== null}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          const a = confirmAction;
          setConfirmAction(null);
          if (!a) return;
          if (a.type === 'approve') void handleApprove(a.req.id);
          else void handleReject(a.req.id);
        }}
      >
        <p>Account: <strong className="font-mono">{confirmAction?.req.username}</strong></p>
        {confirmAction?.type === 'approve' ? (
          <p>A new temporary password is made and shown once. The user is signed out everywhere and must change it at the next login.</p>
        ) : (
          <p>The request is closed. The user has to ask again if they still need a reset.</p>
        )}
        <p>This is recorded in the Action Log.</p>
      </SummaryDialog>

      <Sidebar onLogout={handleLogout} admin={adminUser} />

      <main className="ml-64 p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Password Requests</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Review and approve password reset requests from users
            </p>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* New password banner: sticks to the top so it is never scrolled out of view */}
        {approveResult && (
          <div className="sticky top-3 z-30 mb-4 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Password reset approved for <span className="font-mono">{approveResult.username}</span>
              </p>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Relay this new password to the user. They will be required to change it on next login.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                {approveResult.generatedPassword}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleCloseBanner}
                aria-label="Close"
                className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>
        )}

        {/* Counts */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {statCards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-sm dark:shadow-none flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{c.label}</p>
              <p className={'text-2xl font-bold ' + c.color}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
          {/* Pending */}
          <section className="xl:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Pending Requests</h2>
              {pendingAll.length > 0 && (
                <span className="px-2 py-0.5 bg-[#7B1113] text-white text-xs font-bold rounded-full">{pendingAll.length}</span>
              )}
              <span className="text-[11px] text-slate-400 dark:text-gray-500">Oldest first</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={pendingQuery}
                    onChange={(e) => setPendingQuery(e.target.value)}
                    placeholder="Search..."
                    className={FIELD + ' pl-8 w-40'}
                  />
                </div>
                <select value={pendingRole} onChange={(e) => setPendingRole(e.target.value)} className={FIELD}>
                  <option value="ALL">All roles</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>
            </div>

            {pendingShown.length === 0 ? (
              <div className="text-center py-10">
                <KeyRound className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">
                  {pendingAll.length === 0 ? 'No pending requests' : 'No requests match your search'}
                </p>
              </div>
            ) : (
              <div className="max-h-[52vh] overflow-y-auto pr-1 space-y-2">
                {pendingShown.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono truncate">{req.username}</span>
                          {req.user?.role && (
                            <span className={'px-1.5 py-0.5 rounded-full text-[10px] font-medium border ' + roleBadge(req.user.role)}>
                              {req.user.role}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                          {personName(req)}{personName(req) ? ' · ' : ''}
                          <span title={formatDate(req.requestedAt)}>{timeAgo(req.requestedAt)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmAction({ type: 'reject', req })}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'approve', req })}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {actionLoading === req.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section className="xl:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">Request History</h2>
              <span className="text-[11px] text-slate-400 dark:text-gray-500">{historyShown.length} total</span>
              <div className="ml-auto relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search..."
                  className={FIELD + ' pl-8 w-36'}
                />
              </div>
            </div>

            <div className="flex gap-1 mb-3">
              {(['ALL', 'APPROVED', 'REJECTED'] as HistoryFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setHistoryStatus(s)}
                  className={
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors ' +
                    (historyStatus === s
                      ? 'bg-[#7B1113]/10 border-[#7B1113]/30 text-[#7B1113] dark:text-[#E8C96A]'
                      : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800')
                  }
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {historyRows.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 dark:text-gray-500">
                {resolvedAll.length === 0 ? 'Nothing resolved yet' : 'No history matches'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {historyRows.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-100 dark:border-gray-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-700 dark:text-gray-200 truncate">{req.username}</span>
                        {req.user?.role && (
                          <span className={'px-1.5 py-0.5 rounded-full text-[10px] font-medium border ' + roleBadge(req.user.role)}>
                            {req.user.role}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-gray-500 truncate">
                        {formatDate(req.resolvedAt ?? req.requestedAt)}
                      </p>
                    </div>
                    <span
                      className={
                        'shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border ' +
                        (req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700')
                      }
                    >
                      {req.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {historyShown.length > HISTORY_PAGE_SIZE && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-gray-800">
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Page {historyPageSafe} of {historyPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPageSafe <= 1}
                    aria-label="Previous page"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyPages, p + 1))}
                    disabled={historyPageSafe >= historyPages}
                    aria-label="Next page"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}