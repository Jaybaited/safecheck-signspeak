'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Users, CheckCircle, XCircle,
  TrendingUp, Calendar, AlertTriangle, RefreshCw,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id:        string;
  username:  string;
  role:      string;
  firstName: string;
  lastName:  string;
}

interface UserRecord {
  id:   string;
  role: string;
  [key: string]: unknown;
}

interface DashboardStats {
  totalUsers:           number;
  totalStudents:        number;
  pendingNotifications: number;
  attendanceRate:       number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-lg" />
        <div className="w-5 h-5 bg-slate-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="w-24 h-3 bg-slate-200 dark:bg-gray-700 rounded mb-3" />
      <div className="w-16 h-8 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
      <div className="w-32 h-3 bg-slate-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState<string | null>(null);

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

  // ── Fetch data once auth is confirmed
  const fetchDashboardData = useCallback(async (token: string) => {
    setDataLoading(true);
    setDataError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const users: UserRecord[] = await res.json();

      setStats({
        totalUsers:           users.length,
        totalStudents:        users.filter((u) => u.role === 'STUDENT').length,
        pendingNotifications: 0,
        attendanceRate:       0,
      });
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    const token = localStorage.getItem('token') ?? '';
    fetchDashboardData(token);
  }, [adminUser, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // ── Full-page loader
  if (authLoading || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
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
      trend:     <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-green-400" />,
    },
    {
      label:     'Students',
      value:     stats?.totalStudents ?? '—',
      sub:       'currently enrolled',
      icon:      CheckCircle,
      iconBg:    'bg-emerald-100 dark:bg-green-500/10',
      iconColor: 'text-emerald-600 dark:text-green-400',
      trend:     <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-green-400" />,
    },
    {
      label:     'Pending Alerts',
      value:     stats?.pendingNotifications ?? '—',
      sub:       stats?.pendingNotifications === 0 ? 'All clear' : 'Needs attention',
      icon:      AlertTriangle,
      iconBg:    'bg-orange-100 dark:bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
      trend:     <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
    },
    {
      label:     'Attendance Rate',
      value:     `${stats?.attendanceRate ?? 0}%`,
      sub:       "Today's rate",
      icon:      TrendingUp,
      iconBg:    'bg-[#C4972A]/10 dark:bg-[#C4972A]/10',
      iconColor: 'text-[#8B6818] dark:text-[#E8C96A]',
      trend:     <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-green-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={adminUser} />

      <main className="ml-64 p-8">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {adminUser.firstName}! 👋
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Here&apos;s what&apos;s happening with your system today
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <button
              aria-label="Notifications"
              className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/admin/profile')}
              aria-label="Admin profile"
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {adminUser.firstName?.[0] ?? 'A'}{adminUser.lastName?.[0] ?? ''}
            </button>
          </div>
        </div>

        {/* ── Error Banner ──────────────────────────────────────────── */}
        {dataError && (
          <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-red-700 dark:text-red-400">{dataError}</span>
            </div>
            <button
              onClick={() => fetchDashboardData(localStorage.getItem('token') ?? '')}
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:text-red-800 font-medium shrink-0 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* ── Stat Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {dataLoading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                      <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    {card.trend}
                  </div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{card.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {card.value}
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">{card.sub}</p>
                </div>
              ))}
        </div>

        {/* ── Two-Column Layout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recent Activity
              </h2>
              <button
                onClick={() => router.push('/admin/attendance')}
                className="text-[#7B1113] dark:text-[#E8C96A] hover:text-[#9B2020] dark:hover:text-[#C4972A] text-sm font-medium transition-colors"
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
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">
                  No recent activity
                </p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">
                  Activity will appear once students start tapping in
                </p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="w-full flex items-center gap-3 p-4 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg transition-colors shadow-sm"
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <span className="font-medium">Manage Users</span>
                </button>

                {[
                  { label: 'View Attendance', href: '/admin/attendance',    icon: Calendar      },
                  { label: 'Generate Report', href: '/admin/reports',       icon: CheckCircle   },
                  { label: 'Review Alerts',   href: '/admin/notifications', icon: AlertTriangle },
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
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h2 className="text-xl font-bold mb-5 text-slate-900 dark:text-white">
                System Status
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'RFID Scanner', status: 'Online'    },
                  { label: 'AI Service',   status: 'Active'    },
                  { label: 'Database',     status: 'Connected' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400 text-sm font-medium">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary strip */}
              {!dataLoading && stats && (
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3">
                    User Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg">
                      <p className="text-lg font-bold text-[#7B1113] dark:text-[#E8C96A]">
                        {stats.totalStudents}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Students</p>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-gray-800 rounded-lg">
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