'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, CheckCircle, XCircle,
  TrendingUp, Calendar, AlertTriangle, RefreshCw,
  Clock, Activity,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface AdminUser {
  id:        string;
  username:  string;
  role:      string;
  firstName: string;
  lastName:  string;
}

interface UserRecord {
  id:         string;
  role:       string;
  firstName:  string;
  lastName:   string;
  [key: string]: unknown;
}

interface AttendanceRecord {
  id:        string;
  studentId: string;
  timeIn:    string | null;
  timeOut:   string | null;
  date:      string;
  status:    string;
}

interface DashboardStats {
  totalUsers:           number;
  totalStudents:        number;
  pendingNotifications: number;
  attendanceRate:       number;
  presentToday:         number;
  totalToday:           number;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-xl shrink-0" />
          <div>
            <div className="w-20 h-2.5 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
            <div className="w-28 h-2 bg-slate-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="text-right">
          <div className="w-10 h-6 bg-slate-200 dark:bg-gray-700 rounded mb-2 ml-auto" />
          <div className="w-5 h-4 bg-slate-200 dark:bg-gray-700 rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState<string | null>(null);
  const [recentLogs,  setRecentLogs]  = useState<(AttendanceRecord & { studentName: string })[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auth guard
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AdminUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdminUser(parsed);
    } catch {
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // ── Core fetcher — uses only endpoints that exist in the backend
  const fetchAll = useCallback(async (token: string, silent = false) => {
    if (!silent) {
      setDataLoading(true);
      setLogsLoading(true);
      setDataError(null);
    } else {
      setRefreshing(true);
    }

    // Step 1: fetch all users — the only reliable root endpoint
    let users: UserRecord[] = [];
    try {
      users = await apiFetch<UserRecord[]>('/users', token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      setDataError(msg);
      if (!silent) { setDataLoading(false); setLogsLoading(false); }
      else setRefreshing(false);
      return;
    }

    const students = users.filter(u => u.role === 'STUDENT');
    const studentIds = students.map(u => u.id);

    // Build a quick id → name map for the Recent Activity panel
    const nameMap: Record<string, string> = {};
    users.forEach(u => {
      nameMap[u.id] = `${u.firstName} ${u.lastName}`;
    });

    // Step 2: fetch today's attendance per student in parallel
    // Uses GET /attendance/student/:id/today  (exists in your backend)
    let presentToday = 0;
    let totalToday   = 0;

    if (studentIds.length > 0) {
      const sample = studentIds.slice(0, 30); // cap to keep it fast
      const todayResults = await Promise.allSettled(
        sample.map(id =>
          apiFetch<AttendanceRecord | null>(`/attendance/student/${id}/today`, token)
        )
      );
      todayResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          totalToday++;
          const s = r.value.status;
          if (s === 'PRESENT' || s === 'LATE') presentToday++;
        }
      });
    }

    const attendanceRate = totalToday > 0
      ? Math.round((presentToday / totalToday) * 100)
      : 0;

    setStats({
      totalUsers:           users.length,
      totalStudents:        students.length,
      pendingNotifications: 0,
      attendanceRate,
      presentToday,
      totalToday,
    });

    // Step 3: fetch recent attendance logs for first 5 students
    // Uses GET /attendance/student/:id  (exists in your backend)
    // Merges, sorts by date desc, takes top 10, attaches names from nameMap
    try {
      const sample = studentIds.slice(0, 5);
      const logResults = await Promise.allSettled(
        sample.map(id =>
          apiFetch<AttendanceRecord[]>(`/attendance/student/${id}`, token)
        )
      );
      const merged: (AttendanceRecord & { studentName: string })[] = [];
      logResults.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          r.value.forEach(record => {
            merged.push({
              ...record,
              studentName: nameMap[sample[i]] ?? `Student #${sample[i].slice(0, 6)}`,
            });
          });
        }
      });
      const sorted = merged.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecentLogs(sorted.slice(0, 10));
    } catch {
      setRecentLogs([]);
    }

    setLastUpdated(new Date());
    if (!silent) { setDataLoading(false); setLogsLoading(false); }
    else setRefreshing(false);
  }, []);

  // ── Initial load + 30-second live refresh
  useEffect(() => {
    if (!adminUser) return;
    const token = localStorage.getItem('token') ?? '';
    fetchAll(token);
    intervalRef.current = setInterval(() => fetchAll(token, true), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [adminUser, fetchAll]);

  const handleManualRefresh = () => {
    const token = localStorage.getItem('token') ?? '';
    fetchAll(token, true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const formatLastUpdated = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (authLoading || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label:     'Total Users',
      value:     stats?.totalUsers ?? '—',
      sub:       `${stats?.totalStudents ?? 0} students enrolled`,
      icon:      Users,
      iconBg:    'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
      iconColor: 'text-[#7B1113] dark:text-[#E8C96A]',
      trend:     <TrendingUp className="w-4 h-4 text-emerald-500" />,
    },
    {
      label:     'Students',
      value:     stats?.totalStudents ?? '—',
      sub:       'currently enrolled',
      icon:      CheckCircle,
      iconBg:    'bg-emerald-100 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend:     <TrendingUp className="w-4 h-4 text-emerald-500" />,
    },
    {
      label:     'Pending Alerts',
      value:     stats?.pendingNotifications ?? '—',
      sub:       stats?.pendingNotifications === 0 ? 'All clear' : 'Needs attention',
      icon:      AlertTriangle,
      iconBg:    'bg-orange-100 dark:bg-orange-500/10',
      iconColor: 'text-orange-500 dark:text-orange-400',
      trend:     <AlertTriangle className="w-4 h-4 text-orange-500" />,
    },
    {
      label:     'Attendance Rate',
      value:     `${stats?.attendanceRate ?? 0}%`,
      sub:       stats
        ? `${stats.presentToday} / ${stats.totalToday} present today`
        : "Today's rate",
      icon:      TrendingUp,
      iconBg:    'bg-[#C4972A]/10',
      iconColor: 'text-[#8B6818] dark:text-[#E8C96A]',
      trend:     <CheckCircle className="w-4 h-4 text-emerald-500" />,
    },
  ];

  const quickActions = [
    { label: 'Manage Users',    href: '/admin/users',           icon: Users         },
    { label: 'RFID Management', href: '/admin/rfid-management', icon: CheckCircle   },
    { label: 'Reports',         href: '/admin/reports',         icon: TrendingUp    },
    { label: 'FSL Progress',    href: '/admin/fsl',             icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={adminUser} />

      <main className="ml-64 p-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">
              Welcome back, {adminUser.firstName}! 👋
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Here&apos;s what&apos;s happening with your system today
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
              {refreshing ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#7B1113]" />
              ) : (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
              )}
              {lastUpdated && <span>Updated {formatLastUpdated(lastUpdated)}</span>}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh now"
              className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700
                hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400
                disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Error Banner ── */}
        {dataError && (
          <div className="mb-5 flex items-center justify-between gap-4 p-3.5
            bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
            rounded-xl text-sm">
            <div className="flex items-center gap-3">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-red-700 dark:text-red-400">{dataError}</span>
            </div>
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400
                hover:text-red-800 font-medium shrink-0 transition-colors text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {dataLoading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                    rounded-xl p-4 shadow-sm dark:shadow-none transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{card.label}</p>
                        <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                      <div className="flex justify-end mt-1">{card.trend}</div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900
            border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                  bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20
                  text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  <Activity className="w-2.5 h-2.5" /> Live
                </span>
              </div>
              <button
                onClick={() => router.push('/admin/rfid-management')}
                className="text-[#7B1113] dark:text-[#E8C96A] hover:text-[#9B2020] text-xs font-medium transition-colors"
              >
                View All
              </button>
            </div>

            {logsLoading ? (
  <div className="space-y-2.5">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-3 p-3
        bg-slate-50 dark:bg-gray-800/50 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-slate-200 dark:bg-gray-700 rounded-full shrink-0" />
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div className="h-2.5 bg-slate-200 dark:bg-gray-700 rounded col-span-1" />
          <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded" />
          <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    ))}
  </div>
) : recentLogs.length === 0 ? (
  <div className="text-center py-10">
    <Calendar className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
    <p className="text-slate-400 dark:text-gray-500 text-sm">No recent activity</p>
    <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">
      Activity will appear once students start tapping in
    </p>
  </div>
) : (
  <div className="overflow-x-auto">
    {/* Column headers */}
    <div className="grid grid-cols-4 gap-2 px-3 pb-2 border-b border-slate-100 dark:border-gray-800">
      <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Student</p>
      <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Date</p>
      <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Time In</p>
      <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Time Out</p>
    </div>

    <div className="space-y-0.5 mt-1">
      {recentLogs.map(log => (
        <div
          key={log.id}
          className="grid grid-cols-4 gap-2 items-center px-3 py-2.5
            rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {/* Student */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-[#9B2020] to-[#7B1113]
              rounded-full flex items-center justify-center
              text-[10px] font-bold text-white shrink-0">
              {log.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {log.studentName}
            </span>
          </div>

          {/* Date */}
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {formatDate(log.date)}
          </p>

          {/* Time In */}
          <p className={`text-xs font-medium ${
            log.timeIn
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-gray-500'
          }`}>
            {formatTime(log.timeIn)}
          </p>

          {/* Time Out */}
          <p className={`text-xs font-medium ${
            log.timeOut
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-400 dark:text-gray-500'
          }`}>
            {formatTime(log.timeOut)}
          </p>
        </div>
      ))}
    </div>
  </div>
               
            )}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900
              border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
              <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map(({ label, href, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => router.push(href)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${
                      href === '/admin/users'
                        ? 'bg-[#7B1113] hover:bg-[#9B2020] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${
                      href === '/admin/users' ? 'text-white' : 'text-slate-400 dark:text-gray-500'
                    }`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-900
              border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
              <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">System Status</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'RFID Scanner', status: 'Online'    },
                  { label: 'AI Service',   status: 'Active'    },
                  { label: 'Database',     status: 'Connected' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-gray-300">{item.label}</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {!dataLoading && stats && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-3">User Breakdown</p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg">
                      <p className="text-lg font-bold text-[#7B1113] dark:text-[#E8C96A]">
                        {stats.totalStudents}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Students</p>
                    </div>
                    <div className="p-2.5 bg-slate-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-lg font-bold text-slate-700 dark:text-gray-200">
                        {stats.totalUsers - stats.totalStudents}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Staff</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}