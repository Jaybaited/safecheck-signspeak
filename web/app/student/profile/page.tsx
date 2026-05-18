'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Hash, GraduationCap, CreditCard, Shield,
  Eye, EyeOff, CheckCircle, Wifi, AlertCircle, RefreshCw, Users,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle    from '@/components/ThemeToggle';
import { api }        from '@/lib/api';
import type { ParentInfo } from '@/lib/api';

interface UserProfile {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
  gradeLevel: string | null; rfidCard: string | null;
}

const formatGradeLevel = (gl: string | null) =>
  gl ? gl.replace('GRADE_', 'Grade ') : 'Not Set';

export default function StudentProfilePage() {
  const router = useRouter();

  const [user,           setUser]           = useState<UserProfile | null>(null);
  const [authLoading,    setAuthLoading]    = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [parent,         setParent]         = useState<ParentInfo | null>(null);
  const [parentLoading,  setParentLoading]  = useState(false);

  // Password fields
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [isSaving,         setIsSaving]         = useState(false);
  const [passwordError,    setPasswordError]    = useState('');
  const [passwordSuccess,  setPasswordSuccess]  = useState(false);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }

    try {
      const cached = JSON.parse(userData) as UserProfile;
      if (cached.role !== 'STUDENT') { router.push('/login'); return; }

      setUser(cached);
      setAuthLoading(false);

      // Fetch fresh profile (ensures rfidCard is current)
      setProfileLoading(true);
      api.getUserById(cached.id)
        .then((fresh: UserProfile) => {
          setUser(fresh);
          localStorage.setItem('user', JSON.stringify(fresh));
        })
        .catch(() => {})
        .finally(() => setProfileLoading(false));

      // Fetch linked parent
      setParentLoading(true);
      api.getStudentParent(cached.id)
        .then((p) => setParent(p))
        .catch(() => setParent(null))
        .finally(() => setParentLoading(false));

    } catch {
      router.push('/login');
      setAuthLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.'); return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.'); return;
    }
    setIsSaving(true);
    try {
      await api.changePassword(user!.id, currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Current password is incorrect.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Reusable password input ─────────────────────────────────────────────
  const PasswordInput = ({
    label, value, show, onChange, onToggle, placeholder,
  }: {
    label: string; value: string; show: boolean;
    onChange: (v: string) => void; onToggle: () => void; placeholder: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pr-10 px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-slate-500 dark:text-gray-400">View your account information and change your password</p>
          </div>
          <div className="flex items-center gap-3">
            {profileLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" /> Syncing…
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="space-y-6">

            {/* Avatar Card */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none text-center transition-colors duration-200">
              <div className="w-24 h-24 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-4 shadow-lg shadow-[#7B1113]/20">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">@{user.username}</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] rounded-full text-xs font-medium">
                <GraduationCap className="w-3 h-3" /> {formatGradeLevel(user.gradeLevel)}
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold mb-4">Account Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Hash,         label: 'Student ID', value: user.id.slice(0, 8).toUpperCase(), mono: true },
                  { icon: User,         label: 'Username',   value: user.username,                     mono: false },
                  { icon: Shield,       label: 'Role',       value: 'Student',                         mono: false },
                  { icon: GraduationCap,label: 'Grade Level',value: formatGradeLevel(user.gradeLevel), mono: false },
                ].map(({ icon: Icon, label, value, mono }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500">{label}</p>
                      <p className={`text-sm font-medium text-slate-700 dark:text-gray-300 ${mono ? 'font-mono' : ''}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent Info */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400 dark:text-gray-500" /> Parent / Guardian
              </h3>
              {parentLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              ) : parent ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {parent.firstName[0]}{parent.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {parent.firstName} {parent.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Parent</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">No Parent Linked</p>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Contact your admin to link a parent account</p>
                  </div>
                </div>
              )}
            </div>

            {/* RFID Card */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold mb-4">RFID Card</h3>
              {profileLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg" />
                </div>
              ) : user.rfidCard ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Active</span>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
                    <CreditCard className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mb-0.5">Card UID</p>
                      <p className="text-sm font-mono font-semibold text-slate-800 dark:text-gray-200 tracking-wider break-all">
                        {user.rfidCard}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">No Card Assigned</p>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Contact your admin to register an RFID card</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Password Only ── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h2 className="text-xl font-bold mb-2">Change Password</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
                Make sure to use a strong password you don&apos;t reuse elsewhere.
              </p>
              <div className="space-y-4 max-w-md">
                <PasswordInput label="Current Password"     value={currentPassword} show={showCurrent} onChange={setCurrentPassword} onToggle={() => setShowCurrent(v => !v)} placeholder="Enter current password" />
                <PasswordInput label="New Password"         value={newPassword}     show={showNew}     onChange={setNewPassword}     onToggle={() => setShowNew(v => !v)}     placeholder="Min. 8 characters" />
                <PasswordInput label="Confirm New Password" value={confirmPassword} show={showConfirm} onChange={setConfirmPassword} onToggle={() => setShowConfirm(v => !v)} placeholder="Re-enter new password" />
              </div>

              {passwordError && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400 max-w-md">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 max-w-md">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Password changed successfully!
                </div>
              )}

              <button
                onClick={handleChangePassword} disabled={isSaving}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {isSaving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Shield className="w-4 h-4" />
                }
                {isSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}