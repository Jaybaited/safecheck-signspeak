'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Users, CheckCircle, XCircle,
  Clock, TrendingUp, Calendar, AlertTriangle,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  pendingNotifications: number;
  attendanceRate: number;
  totalStudents: number;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'error' | 'warning';
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

 const fetchDashboardData = useCallback(async () => {
  try {
    const users = await api.getUsers();

    setStats({
      totalUsers: users.length,
      activeToday: users.filter((u) => u.role === 'STUDENT').length,
      pendingNotifications: 0,
      attendanceRate: 0,
      totalStudents: users.filter((u) => u.role === 'STUDENT').length,
    });

    setRecentActivity([]);
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err);
  } finally {
    setDataLoading(false);
  }
}, []);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) { router.push('/login'); return; }

    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'ADMIN') { router.push('/login'); return; }
      setUser(parsedUser);
      fetchDashboardData();
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day(s) ago`;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.firstName}!</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your system today
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              {stats && stats.pendingNotifications > 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {stats.pendingNotifications}
                </div>
              )}
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {user.firstName[0]}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {dataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Total Users</p>
              <h3 className="text-3xl font-bold">{stats?.totalUsers ?? '—'}</h3>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">
                {stats?.totalStudents} students enrolled
              </p>
            </div>

            {/* Active Today */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-green-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Active Today</p>
              <h3 className="text-3xl font-bold">{stats?.activeToday ?? '—'}</h3>
              <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">
                students checked in
              </p>
            </div>

            {/* Pending Notifications */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Pending Notifications</p>
              <h3 className="text-3xl font-bold">{stats?.pendingNotifications ?? '—'}</h3>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium">
                {stats?.pendingNotifications === 0 ? 'All sent' : 'Needs attention'}
              </p>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Attendance Rate</p>
              <h3 className="text-3xl font-bold">{stats?.attendanceRate ?? '—'}%</h3>
              <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">
                Today&apos;s attendance
              </p>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <button
                onClick={() => router.push('/admin/notifications')}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 text-sm font-medium"
              >
                View All
              </button>
            </div>

            {dataLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-slate-400 dark:text-gray-500 text-sm text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === 'success'
                        ? 'bg-emerald-100 dark:bg-green-500/10'
                        : activity.status === 'warning'
                        ? 'bg-orange-100 dark:bg-orange-500/10'
                        : 'bg-red-100 dark:bg-red-500/10'
                    }`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-green-400" />
                      ) : activity.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{activity.action}</p>
                    </div>
                    <span className="text-sm text-slate-400 dark:text-gray-500 whitespace-nowrap">
                      {timeAgo(activity.time)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/users/new')}
                className="w-full flex items-center gap-3 p-4 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Add New User</span>
              </button>
              <button
                onClick={() => router.push('/admin/attendance')}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">View Attendance</span>
              </button>
              <button
                onClick={() => router.push('/admin/reports')}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">Generate Report</span>
              </button>
              <button
                onClick={() => router.push('/admin/notifications')}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">Review Alerts</span>
              </button>
            </div>

            {/* System Status */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3">System Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'RFID Scanner', status: 'Online' },
                  { label: 'AI Service', status: 'Active' },
                  { label: 'Database', status: 'Connected' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-gray-300">{item.label}</span>
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400 text-sm font-medium">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

