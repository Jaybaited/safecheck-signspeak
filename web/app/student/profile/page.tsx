// app/student/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import {
  User, Hash, GraduationCap, CreditCard,
  Shield, Save, Eye, EyeOff,
  CheckCircle, Wifi, AlertCircle, RefreshCw,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle    from '@/components/ThemeToggle';
import { api }        from '@/lib/api';

interface UserProfile {
  id:         string;
  username:   string;
  role:       string;
  firstName:  string;
  lastName:   string;
  gradeLevel: string | null;
  rfidCard:   string | null;
}

const GRADE_LEVELS = [
  'GRADE_7','GRADE_8','GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];

const formatGradeLevel = (gl: string | null) => {
  if (!gl) return 'Not Set';
  return gl.replace('GRADE_', 'Grade ');
};

export default function StudentProfilePage() {
  const router = useRouter();

  const [user,            setUser]            = useState<UserProfile | null>(null);
  const [authLoading,     setAuthLoading]     = useState(true);
  const [profileLoading,  setProfileLoading]  = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [saveSuccess,     setSaveSuccess]     = useState(false);
  const [saveError,       setSaveError]       = useState('');
  const [activeTab,       setActiveTab]       = useState<'info' | 'security'>('info');

  // Form fields
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  // Password fields
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [passwordError,    setPasswordError]    = useState('');
  const [passwordSuccess,  setPasswordSuccess]  = useState(false);

  // ── Auth guard + fetch fresh profile (ensures rfidCard is populated)
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }

    try {
      const cached = JSON.parse(userData) as UserProfile;
      if (cached.role !== 'STUDENT') { router.push('/login'); return; }

      // Show cached data immediately so UI isn't blank
      setUser(cached);
      setFirstName(cached.firstName);
      setLastName(cached.lastName);
      setGradeLevel(cached.gradeLevel ?? '');
      setAuthLoading(false);

      // ✅ Fetch fresh data from API so rfidCard is always current
      setProfileLoading(true);
      api.getUserById(cached.id)
        .then((fresh: UserProfile) => {
          setUser(fresh);
          setFirstName(fresh.firstName);
          setLastName(fresh.lastName);
          setGradeLevel(fresh.gradeLevel ?? '');
          // Sync localStorage so other pages also have rfidCard
          localStorage.setItem('user', JSON.stringify(fresh));
        })
        .catch(() => {
          // API failed — cached data is fine, rfidCard may just be stale
        })
        .finally(() => setProfileLoading(false));

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

  const handleSaveProfile = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      // Replace with: await api.updateStudentProfile(user!.id, { firstName, lastName, gradeLevel });
      await new Promise((r) => setTimeout(r, 800));
      const updated: UserProfile = {
        ...user!,
        firstName,
        lastName,
        gradeLevel: gradeLevel || null,
      };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
      // Replace with: await api.changePassword(user!.id, { currentPassword, newPassword });
      await new Promise((r) => setTimeout(r, 800));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError('Current password is incorrect.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasChanges =
    firstName  !== user.firstName ||
    lastName   !== user.lastName  ||
    gradeLevel !== (user.gradeLevel ?? '');

  // ── Reusable password input ─────────────────────────────────────────────
  const PasswordInput = ({
    label, value, show, onChange, onToggle, placeholder,
  }: {
    label: string; value: string; show: boolean;
    onChange: (v: string) => void;
    onToggle: () => void;
    placeholder: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-10 px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Manage your account information and security
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profileLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing…
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Avatar Card */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none text-center transition-colors duration-200">
              <div className="w-24 h-24 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-4 shadow-lg shadow-[#7B1113]/20">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                @{user.username}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] rounded-full text-xs font-medium">
                <GraduationCap className="w-3 h-3" />
                {formatGradeLevel(user.gradeLevel)}
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Account Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Student ID</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-300 font-mono">
                      {user.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Username</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      {user.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Role</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Student</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ RFID Card Section — always shows number when assigned */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">RFID Card</h3>

              {profileLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg" />
                  <div className="h-8 bg-slate-100 dark:bg-gray-800 rounded-lg" />
                </div>
              ) : user.rfidCard ? (
                <div className="space-y-3">
                  {/* Active Badge */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>

                  {/* ✅ Card Number Display */}
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
                /* No card assigned */
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      No Card Assigned
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                      Contact your admin to register an RFID card
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1 w-fit shadow-sm dark:shadow-none">
              {[
                { key: 'info',     label: 'Personal Info', icon: User   },
                { key: 'security', label: 'Security',      icon: Shield },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'info' | 'security')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'bg-[#7B1113] text-white shadow-sm'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Personal Info Tab ────────────────────────────────────── */}
            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Username — read only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user.username}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-400 dark:text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Grade Level
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
                    >
                      <option value="">Not Set</option>
                      {GRADE_LEVELS.map((gl) => (
                        <option key={gl} value={gl}>{formatGradeLevel(gl)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Save Feedback */}
                {saveSuccess && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Profile saved successfully!
                  </div>
                )}
                {saveError && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {saveError}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={!hasChanges || isSaving}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* ── Security Tab ─────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Change Password
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
                  Make sure to use a strong password you don&apos;t reuse elsewhere.
                </p>

                <div className="space-y-4 max-w-md">
                  <PasswordInput
                    label="Current Password"
                    value={currentPassword}
                    show={showCurrent}
                    onChange={setCurrentPassword}
                    onToggle={() => setShowCurrent(v => !v)}
                    placeholder="Enter current password"
                  />
                  <PasswordInput
                    label="New Password"
                    value={newPassword}
                    show={showNew}
                    onChange={setNewPassword}
                    onToggle={() => setShowNew(v => !v)}
                    placeholder="Min. 8 characters"
                  />
                  <PasswordInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    show={showConfirm}
                    onChange={setConfirmPassword}
                    onToggle={() => setShowConfirm(v => !v)}
                    placeholder="Re-enter new password"
                  />
                </div>

                {passwordError && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400 max-w-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 max-w-md">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Password changed successfully!
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  {isSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}