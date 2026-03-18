'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Hash, GraduationCap,
  CreditCard, Shield, Save, Eye, EyeOff,
  CheckCircle, Wifi, AlertCircle,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

const GRADE_LEVELS = [
  'GRADE_7','GRADE_8','GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];

const formatGradeLevel = (gl: string | null) => {
  if (!gl) return 'Not Set';
  return gl.replace('GRADE_', 'Grade ');
};

export default function StudentProfilePage() {
  const [user, setUser]           = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [passwordError, setPasswordError]       = useState('');
  const [passwordSuccess, setPasswordSuccess]   = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as UserProfile;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
      setFirstName(parsedUser.firstName);
      setLastName(parsedUser.lastName);
      setGradeLevel(parsedUser.gradeLevel ?? '');
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Replace with real API call: await api.updateProfile(user!.id, { firstName, lastName, gradeLevel });
      await new Promise((r) => setTimeout(r, 800)); // simulate API
      const updated = { ...user!, firstName, lastName, gradeLevel: gradeLevel || null };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
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
      // Replace with real API call: await api.changePassword(user!.id, { currentPassword, newPassword });
      await new Promise((r) => setTimeout(r, 800)); // simulate API
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
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasChanges =
    firstName !== user.firstName ||
    lastName  !== user.lastName  ||
    gradeLevel !== (user.gradeLevel ?? '');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Manage your account information and security
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Avatar Card */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none text-center transition-colors duration-200">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-4 shadow-lg shadow-purple-500/20">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                @{user.username}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                <GraduationCap className="w-3 h-3" />
                {formatGradeLevel(user.gradeLevel)}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Account Details</h3>
              <div className="space-y-3">
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

            {/* RFID Status */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">RFID Card</h3>
              {user.rfidCard ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Active</span>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500">Card UID</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300 font-mono">
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

          {/* Right — Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1 w-fit shadow-sm dark:shadow-none">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Personal Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="First name"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {/* Username — read only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Username <span className="text-slate-400 dark:text-gray-500 font-normal">(read-only)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={user.username}
                        readOnly
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-400 dark:text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Grade Level
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors appearance-none"
                      >
                        <option value="">Not Set</option>
                        {GRADE_LEVELS.map((g) => (
                          <option key={g} value={g}>{formatGradeLevel(g)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-gray-800">
                  {saveSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Profile updated successfully!
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-gray-500">
                      {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
                    </p>
                  )}
                  <button
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 dark:disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Change Password</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
                  Make sure your new password is at least 8 characters long.
                </p>

                <div className="space-y-5 max-w-md">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 pr-10 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 pr-10 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength indicator */}
                    {newPassword && (
                      <div className="mt-2 flex gap-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            newPassword.length >= i * 3
                              ? newPassword.length >= 12 ? 'bg-emerald-500'
                              : newPassword.length >= 8  ? 'bg-yellow-500'
                              : 'bg-red-500'
                              : 'bg-slate-200 dark:bg-gray-700'
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 pr-10 py-2.5 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-slate-200 dark:border-gray-700'
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Error / Success */}
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Password changed successfully!</p>
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

