'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound, CheckCircle, XCircle, Clock, Copy,
  Check, Loader2, User,
} from 'lucide-react';
import {
  getAllResetRequests, approveResetRequest,
  rejectResetRequest, PasswordResetRequest,
} from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

type ApproveResult = { username: string; generatedPassword: string } | null;

export default function PasswordRequestsPage() {
  const router = useRouter();

  const [adminUser,    setAdminUser]    = useState<any>(null);
  const [requests,     setRequests]     = useState<PasswordResetRequest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approveResult, setApproveResult] = useState<ApproveResult>(null);
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdminUser(parsed);
      fetchRequests();
    } catch { router.push('/login'); }
    finally  { setLoading(false); }
  }, [router]);

  const fetchRequests = async () => {
    try {
      setRequests(await getAllResetRequests());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const result = await approveResetRequest(id);
      setApproveResult({ username: result.username, generatedPassword: result.generatedPassword });
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this password reset request?')) return;
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

  const handleCopy = () => {
    if (!approveResult) return;
    navigator.clipboard.writeText(approveResult.generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pending  = requests.filter((r) => r.status === 'PENDING');
  const resolved = requests.filter((r) => r.status !== 'PENDING');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const roleBadge = (role?: string) => {
    if (role === 'TEACHER') return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    if (role === 'STUDENT') return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    return 'bg-[#C4972A]/10 text-[#8B6818] border-[#C4972A]/20 dark:text-[#E8C96A]';
  };

  if (loading || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={adminUser} />

      <main className="ml-64 p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Password Requests</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Review and approve password reset requests from users
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* ── Approve result banner ── */}
        {approveResult && (
          <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
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
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <button
                onClick={() => setApproveResult(null)}
                className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>
        )}

        {/* ── Pending requests ── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Pending Requests
            </h2>
            {pending.length > 0 && (
              <span className="px-2 py-0.5 bg-[#7B1113] text-white text-xs font-bold rounded-full">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="text-center py-10">
              <KeyRound className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-gray-500 text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                          {req.username}
                        </span>
                        {req.user?.role && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge(req.user.role)}`}>
                            {req.user.role}
                          </span>
                        )}
                      </div>
                      {req.user && (
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          {req.user.firstName} {req.user.lastName}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                        Requested {formatDate(req.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading === req.id}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      {actionLoading === req.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle className="w-3.5 h-3.5" />
                      }
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Resolved requests ── */}
        {resolved.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Request History
            </h2>
            <div className="space-y-2">
              {resolved.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-700 dark:text-gray-200">{req.username}</span>
                        {req.user?.role && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${roleBadge(req.user.role)}`}>
                            {req.user.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-gray-500">
                        {formatDate(req.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}