'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import {
  User, Hash, Shield, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, CreditCard, GraduationCap, Users,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle   from '@/components/ThemeToggle';
import { api }       from '@/lib/api';
import type { ChildInfo } from '@/lib/api';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

const formatGradeLevel = (gl: string | null) =>
  gl ? gl.replace('GRADE_', 'Grade ') : 'N/A';

// Placeholder child so ParentSidebar never receives undefined
const PLACEHOLDER_CHILD = {
  id: '', firstName: '—', lastName: '', gradeLevel: null,
};

export default function ParentProfilePage() {
  const router = useRouter();
  const [parent,         setParent]         = useState<ParentUser | null>(null);
  const [authLoading,    setAuthLoading]    = useState(true);
  const [children,       setChildren]       = useState<ChildInfo[]>([]);
  const [childrenLoading,setChildrenLoading]= useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld,         setShowOld]         = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [pwError,         setPwError]         = useState('');
  const [pwSuccess,       setPwSuccess]       = useState(false);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
      setAuthLoading(false);

      // Fetch real children
      setChildrenLoading(true);
      api.getParentChildren(p.id)
        .then(setChildren)
        .catch(() => setChildren([]))
        .finally(() => setChildrenLoading(false));

    } catch { router.push('/login'); setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All fields are required.'); return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.'); return;
    }
    setIsSaving(true);
    try {
      await api.changePassword(parent!.id, currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Current password is incorrect.');
    } finally { setIsSaving(false); }
  };

  if (authLoading || !parent) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Pass first real child to sidebar (or placeholder while loading)
  const sidebarChild = children[0]
    ? { id: children[0].id, firstName: children[0].firstName, lastName: children[0].lastName, gradeLevel: children[0].gradeLevel }
    : PLACEHOLDER_CHILD;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sidebarChild} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Profile</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">View your account information and change your password</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none">
              {parent.firstName?.[0]}{parent.lastName?.[0]}
            </div>
          </div>
        </div>

        {pwSuccess && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Password changed successfully.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Avatar + Account Details + Children ── */}
          <div className="space-y-6">

            {/* Avatar Card */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                {parent.firstName[0]}{parent.lastName[0]}
              </div>
              <h2 className="text-xl font-bold">{parent.firstName} {parent.lastName}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">@{parent.username}</p>
              <span className="mt-3 px-3 py-1 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] text-xs font-semibold rounded-full">
                Parent
              </span>
            </div>

            {/* Account Details */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold mb-4">Account Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Hash,   label: 'Parent ID', value: parent.id.slice(0, 8).toUpperCase(), mono: true  },
                  { icon: User,   label: 'First Name',value: parent.firstName,                    mono: false },
                  { icon: User,   label: 'Last Name', value: parent.lastName,                     mono: false },
                  { icon: User,   label: 'Username',  value: parent.username,                     mono: false },
                  { icon: Shield, label: 'Role',      value: 'Parent',                            mono: false },
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

            {/* Children List */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                Linked Children
              </h3>

              {childrenLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[0,1].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-gray-800 rounded-xl" />
                  ))}
                </div>
              ) : children.length === 0 ? (
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">No Children Linked</p>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Contact admin to link a child account</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div key={child.id} className="p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 space-y-2">
                      {/* Name + Grade */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {child.firstName} {child.lastName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <GraduationCap className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {formatGradeLevel(child.gradeLevel)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* RFID */}
                      <div className="flex items-center gap-2 pl-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 shrink-0" />
                        {child.rfidCard ? (
                          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-gray-300 tracking-wider">
                            {child.rfidCard}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-gray-500 italic">No RFID assigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Change Password Only ── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Keep your account secure</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {/* Current Password */}
                {[
                  { label: 'Current Password',    val: currentPassword, set: setCurrentPassword, show: showOld,     toggle: () => setShowOld(!showOld)         },
                  { label: 'New Password',         val: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(!showNew)         },
                  { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                ].map(({ label, val, set, show, toggle }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'} value={val}
                        onChange={(e) => set(e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors ${
                          pwError && !val ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-gray-700'
                        }`}
                      />
                      <button type="button" onClick={toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {pwError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit" disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Lock className="w-4 h-4" />
                    }
                    {isSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}