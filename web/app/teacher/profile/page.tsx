'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Hash, Shield, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface TeacherUser { id: string; username: string; role: string; firstName: string; lastName: string; }

export default function TeacherProfilePage() {
  const router = useRouter();
  const [teacher, setTeacher]             = useState<TeacherUser | null>(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [activeTab, setActiveTab]         = useState<'info' | 'security'>('info');
  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess]     = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]     = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as TeacherUser;
      if (parsed.role !== 'TEACHER') { router.push('/login'); return; }
      setTeacher(parsed); setFirstName(parsed.firstName); setLastName(parsed.lastName);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); };

  const handleSaveProfile = async () => {
    setIsSaving(true); setSaveError('');
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${teacher!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName, lastName }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = { ...teacher!, firstName, lastName };
      setTeacher(updated); localStorage.setItem('user', JSON.stringify(updated));
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to save changes.'); }
    finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    setPasswordError(''); setPasswordSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('All fields are required.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${teacher!.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string })?.message ?? 'Current password is incorrect.');
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordSuccess(true); setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) { setPasswordError(err instanceof Error ? err.message : 'Failed to change password.'); }
    finally { setIsSaving(false); }
  };

  if (authLoading || !teacher) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const hasChanges = firstName !== teacher.firstName || lastName !== teacher.lastName;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <TeacherSidebar onLogout={handleLogout} />
      <main className="ml-64 p-8">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Profile</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">Manage your account information and security settings.</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => router.push('/teacher/profile')} aria-label="View profile"
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95">
              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none text-center transition-colors duration-200">
              <div className="w-24 h-24 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-4 shadow-lg shadow-[#7B1113]/20 select-none">
                {teacher.firstName?.[0]}{teacher.lastName?.[0]}
              </div>
              <h2 className="text-xl font-bold">{teacher.firstName} {teacher.lastName}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{teacher.username}</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] rounded-full text-xs font-medium">
                <Shield className="w-3 h-3" /> Teacher
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold mb-4">Account Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Hash,   label: 'Teacher ID', value: teacher.id.slice(0, 8).toUpperCase(), mono: true },
                  { icon: User,   label: 'Username',   value: teacher.username,                      mono: false },
                  { icon: Shield, label: 'Role',       value: 'Teacher',                             mono: false },
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
          </div>

          {/* Right Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1 w-fit shadow-sm dark:shadow-none">
              <button onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-[#7B1113] text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <User className="w-4 h-4" /> Personal Info
              </button>
              <button onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-[#7B1113] text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <Shield className="w-4 h-4" /> Security
              </button>
            </div>

            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <h2 className="text-xl font-bold mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: 'First Name', value: firstName, setter: setFirstName },
                    { label: 'Last Name',  value: lastName,  setter: setLastName  },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">{label}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                        <input type="text" value={value} onChange={(e) => setter(e.target.value)} placeholder={label}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors" />
                      </div>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Username <span className="text-slate-400 font-normal">(read-only)</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                      <input type="text" value={teacher.username} readOnly
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-400 dark:text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-gray-800">
                  <div>
                    {saveSuccess && <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Profile updated!</div>}
                    {saveError  && <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{saveError}</div>}
                    {!saveSuccess && !saveError && <p className="text-sm text-slate-400 dark:text-gray-500">{hasChanges ? 'You have unsaved changes.' : 'No changes to save.'}</p>}
                  </div>
                  <button onClick={handleSaveProfile} disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <h2 className="text-xl font-bold mb-2">Change Password</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">New password must be at least 8 characters.</p>
                <div className="space-y-5 max-w-md">
                  {[
                    { label: 'Current Password', val: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent((p) => !p) },
                    { label: 'New Password',      val: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew((p) => !p)     },
                    { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm((p) => !p) },
                  ].map(({ label, val, set, show, toggle }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">{label}</label>
                      <div className="relative">
                        <input type={show ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)} placeholder={label}
                          className={`w-full px-4 pr-10 py-2.5 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors ${
                            label.includes('Confirm') && val && val !== newPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-gray-700'
                          }`} />
                        <button type="button" onClick={toggle}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300">
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {label.includes('Confirm') && val && val !== newPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                      {label === 'New Password' && val && (
                        <div className="mt-2 flex gap-1">
                          {[1,2,3,4].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${val.length >= i * 3 ? val.length >= 12 ? 'bg-emerald-500' : val.length >= 8 ? 'bg-yellow-500' : 'bg-red-500' : 'bg-slate-200 dark:bg-gray-700'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
                  <button onClick={handleChangePassword} disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
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