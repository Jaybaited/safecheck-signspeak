// app/student/dashboard/page.tsx
'use client';

import { useState, useEffect }       from 'react';
import { useRouter }                 from 'next/navigation';
import {
  Bell, Calendar, BookOpen, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle,
  Target, RefreshCw,
} from 'lucide-react';
import StudentSidebar                from '@/components/student/StudentSidebar';
import ThemeToggle                   from '@/components/ThemeToggle';
import {
  getStudentStats,
  getTodayAttendance,
  getStudentAttendance,
  type AttendanceRecord,
  type AttendanceStats,
} from '@/lib/api';

interface User {
  id:         string;
  username:   string;
  role:       string;
  firstName:  string;
  lastName:   string;
  gradeLevel: string | null;
  rfidCard:   string | null;
}

function formatTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatDate(iso: string): string {
  const d         = new Date(iso);
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toActivityItem(record: AttendanceRecord) {
  switch (record.status) {
    case 'ABSENT':
      return { id: record.id, title: 'Absent',            time: '—',                       date: formatDate(record.date), icon: XCircle,    color: 'text-red-500 dark:text-red-400',            bg: 'bg-red-100 dark:bg-red-500/10' };
    case 'LATE':
      return { id: record.id, title: 'Checked In (Late)', time: formatTime(record.timeIn), date: formatDate(record.date), icon: Clock,       color: 'text-[#8B6818] dark:text-[#E8C96A]',        bg: 'bg-[#C4972A]/10 dark:bg-[#C4972A]/10' };
    default:
      return { id: record.id, title: 'Checked In',        time: formatTime(record.timeIn), date: formatDate(record.date), icon: CheckCircle, color: 'text-emerald-600 dark:text-green-400',      bg: 'bg-emerald-100 dark:bg-green-500/10' };
  }
}

function getTodayStatus(record: AttendanceRecord | null) {
  if (!record)                  return { label: 'Not Recorded', sub: 'No check-in today',                       icon: AlertCircle, iconColor: 'text-slate-400 dark:text-gray-500',     iconBg: 'bg-slate-100 dark:bg-gray-800',         textColor: 'text-slate-400 dark:text-gray-500' };
  if (record.status === 'LATE') return { label: 'Late',          sub: `Checked in at ${formatTime(record.timeIn)}`, icon: Clock,       iconColor: 'text-[#C4972A] dark:text-[#E8C96A]',   iconBg: 'bg-[#C4972A]/15 dark:bg-[#C4972A]/10', textColor: 'text-[#C4972A] dark:text-[#E8C96A]' };
  if (record.status === 'ABSENT') return { label: 'Absent',      sub: 'Marked absent today',                       icon: XCircle,     iconColor: 'text-red-500 dark:text-red-400',         iconBg: 'bg-red-100 dark:bg-red-500/10',         textColor: 'text-red-500 dark:text-red-400' };
  return { label: 'Present', sub: `Checked in at ${formatTime(record.timeIn)}`, icon: CheckCircle, iconColor: 'text-[#C4972A] dark:text-[#E8C96A]', iconBg: 'bg-[#C4972A]/15 dark:bg-[#C4972A]/10', textColor: 'text-[#C4972A] dark:text-[#E8C96A]' };
}

// ── Compact card skeleton ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-20 h-3 bg-slate-200 dark:bg-gray-700 rounded" />
          <div className="w-14 h-6 bg-slate-200 dark:bg-gray-700 rounded" />
          <div className="w-28 h-3 bg-slate-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user,            setUser]            = useState<User | null>(null);
  const [authLoading,     setAuthLoading]     = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [todayRecord,     setTodayRecord]     = useState<AttendanceRecord | null>(null);
  const [recentRecords,   setRecentRecords]   = useState<AttendanceRecord[]>([]);
  const [dataLoading,     setDataLoading]     = useState(true);
  const [dataError,       setDataError]       = useState<string | null>(null);
  // Unread count — in production this would come from the announcements API
  const UNREAD_COUNT = 2;

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as User;
      if (parsed.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsed);
    } catch { router.push('/login'); }
    finally   { setAuthLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(user.id);
  }, [user]);

  async function fetchDashboardData(studentId: string) {
    setDataLoading(true);
    setDataError(null);
    try {
      const [stats, records] = await Promise.all([
        getStudentStats(studentId),
        getStudentAttendance(studentId),
      ]);
      setAttendanceStats(stats);
      const sorted = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecentRecords(sorted.slice(0, 5));
      try {
        const today = await getTodayAttendance(studentId);
        setTodayRecord(today);
      } catch { setTodayRecord(null); }
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally { setDataLoading(false); }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayStatus  = getTodayStatus(todayRecord);
  const activityItems = recentRecords.map(toActivityItem);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome back, {user.firstName}! 👋</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Here&apos;s your learning and attendance overview
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* ✅ Bell → Announcements page */}
            <button
              onClick={() => router.push('/student/announcements')}
              aria-label="View announcements"
              className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              {UNREAD_COUNT > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                  {UNREAD_COUNT}
                </span>
              )}
            </button>

            {/* Avatar → Profile */}
            <button
              onClick={() => router.push('/student/profile')}
              aria-label="Go to profile"
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md hover:brightness-110 transition-all active:scale-95"
            >
              {user.firstName[0]}{user.lastName[0]}
            </button>
          </div>
        </div>

        {/* ── Error Banner ───────────────────────────────────────────── */}
        {dataError && (
          <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-red-700 dark:text-red-400">{dataError}</span>
            </div>
            <button
              onClick={() => fetchDashboardData(user.id)}
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:text-red-800 font-medium shrink-0 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* ── Stat Cards — compact horizontal layout ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Attendance Rate */}
          {dataLoading ? <SkeletonCard /> : (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-emerald-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-500 dark:text-gray-400 text-sm">Attendance Rate</p>
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-green-400 mt-0.5">
                    {attendanceStats ? `${Math.round(attendanceStats.attendanceRate)}%` : '—'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                    {attendanceStats
                      ? `${attendanceStats.present} of ${attendanceStats.totalDays} days present`
                      : 'No data yet'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FSL Progress */}
          {dataLoading ? <SkeletonCard /> : (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-[#7B1113] dark:text-[#E8C96A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-500 dark:text-gray-400 text-sm">FSL Progress</p>
                  <h3 className="text-2xl font-bold text-[#7B1113] dark:text-[#E8C96A] mt-0.5">—</h3>
                  <button
                    onClick={() => router.push('/student/fsl')}
                    className="text-xs text-[#7B1113] dark:text-[#E8C96A] hover:opacity-75 mt-0.5 font-medium transition-opacity"
                  >
                    Start FSL Learning →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Today's Status */}
          {dataLoading ? <SkeletonCard /> : (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${todayStatus.iconBg}`}>
                  <todayStatus.icon className={`w-6 h-6 ${todayStatus.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-500 dark:text-gray-400 text-sm">Today&apos;s Status</p>
                  <h3 className={`text-2xl font-bold mt-0.5 ${todayStatus.textColor}`}>
                    {todayStatus.label}
                  </h3>
                  <p className={`text-xs mt-0.5 ${todayStatus.textColor} opacity-80`}>
                    {todayStatus.sub}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Two-Column Layout ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <button
                onClick={() => router.push('/student/attendance')}
                className="text-[#7B1113] dark:text-[#E8C96A] hover:opacity-75 text-sm font-medium transition-opacity"
              >
                View All
              </button>
            </div>

            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-3 bg-slate-200 dark:bg-gray-700 rounded" />
                      <div className="w-24 h-3 bg-slate-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityItems.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">No attendance records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        {item.date}{item.time !== '—' ? ` · ${item.time}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${item.bg} ${item.color}`}>
                      {item.title.includes('Late') ? 'LATE' : item.title === 'Absent' ? 'ABSENT' : 'ON TIME'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/student/fsl')}
                className="w-full flex items-center gap-3 p-4 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg transition-colors shadow-sm"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                <span className="font-medium">Practice FSL</span>
              </button>
              {[
                { label: 'View Attendance',  href: '/student/attendance', icon: Calendar    },
                { label: 'Track Progress',   href: '/student/progress',   icon: TrendingUp  },
                { label: 'My Profile',       href: '/student/profile',    icon: Target      },
              ].map(({ label, href, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5 text-slate-500 dark:text-gray-400 shrink-0" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>

            {!dataLoading && attendanceStats && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3">This Period</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Present', value: attendanceStats.present, color: 'text-emerald-600 dark:text-green-400',  bg: 'bg-emerald-50 dark:bg-green-500/10' },
                    { label: 'Late',    value: attendanceStats.late,    color: 'text-[#8B6818] dark:text-[#E8C96A]',   bg: 'bg-[#C4972A]/10' },
                    { label: 'Absent',  value: attendanceStats.absent,  color: 'text-red-500 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-500/10' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`p-2 ${bg} rounded-lg`}>
                      <p className={`text-lg font-bold ${color}`}>{value}</p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}