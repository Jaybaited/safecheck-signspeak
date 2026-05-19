'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN:   '/admin/dashboard',
  STUDENT: '/student/dashboard',
  TEACHER: '/teacher/assessment',
  PARENT:  '/parent/dashboard',
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [userId, setUserId]       = useState('');
  const [role, setRole]           = useState('');
  const [newPassword, setNew]     = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }
    try {
      const u = JSON.parse(userData);
      if (!u.mustChangePassword) {
        // Already changed — redirect to dashboard
        router.push(ROLE_DASHBOARD[u.role] ?? '/login');
        return;
      }
      setUserId(u.id);
      setRole(u.role);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const validate = () => {
    if (!newPassword) return 'New password is required.';
    if (newPassword.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(newPassword)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(newPassword)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(newPassword)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword))
      return 'Password must contain at least one special character.';
    if (newPassword !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/force-change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ newPassword }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to change password.');
      }

      // Update local user cache — clear mustChangePassword flag
      const userData = localStorage.getItem('user');
      if (userData) {
        const u = JSON.parse(userData);
        u.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(u));
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(ROLE_DASHBOARD[role] ?? '/login');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">

        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7B1113] to-[#9B2020] rounded-2xl shadow-sm mb-5">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
            Set Your Password
          </h1>
          <p className="text-sm text-gray-400">
            This is your first login. You must set a new password to continue.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-600">Password changed! Redirecting…</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNew(e.target.value); setError(''); }}
                placeholder="Min. 8 characters"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showCon ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                placeholder="Re-enter new password"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
              />
              <button type="button" onClick={() => setShowCon(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showCon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password requirements hint */}
          <ul className="text-xs text-gray-400 space-y-1 pl-1">
            {[
              ['8+ characters', newPassword.length >= 8],
              ['One uppercase letter', /[A-Z]/.test(newPassword)],
              ['One lowercase letter', /[a-z]/.test(newPassword)],
              ['One number', /\d/.test(newPassword)],
              ['One special character', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)],
            ].map(([label, met]) => (
              <li key={label as string} className={`flex items-center gap-1.5 ${met ? 'text-emerald-500' : 'text-gray-400'}`}>
                <span>{met ? '✓' : '·'}</span> {label as string}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full h-11 flex items-center justify-center gap-2 mt-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                Saving…
              </>
            ) : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}