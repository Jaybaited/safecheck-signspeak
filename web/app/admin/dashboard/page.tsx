'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      setUser(parsedUser);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  // Sample data (replace with real API calls later)
  const stats = {
    totalUsers: 245,
    activeToday: 189,
    pendingApprovals: 12,
    systemHealth: 98.5,
  };

  const recentActivity = [
    {
      id: 1,
      user: 'Juan Dela Cruz',
      action: 'Checked in',
      time: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      user: 'Maria Santos',
      action: 'RFID card registered',
      time: '15 minutes ago',
      status: 'success',
    },
    {
      id: 3,
      user: 'Pedro Penduko',
      action: 'Failed check-in attempt',
      time: '1 hour ago',
      status: 'error',
    },
    {
      id: 4,
      user: 'Jose Rizal',
      action: 'Account created',
      time: '2 hours ago',
      status: 'success',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your system today
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Added the Theme Toggle Here */}
            <ThemeToggle />

            <button className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                3
              </div>
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {user.firstName[0]}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Total Users</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</h3>
            <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">+12% from last month</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Active Today</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeToday}</h3>
            <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">+8% from yesterday</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Pending Approvals</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingApprovals}</h3>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium">Needs attention</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">System Health</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.systemHealth}%</h3>
            <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">All systems operational</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <button className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium transition-colors">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === 'success'
                        ? 'bg-emerald-100 dark:bg-green-500/10'
                        : 'bg-red-100 dark:bg-red-500/10'
                    }`}
                  >
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{activity.user}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{activity.action}</p>
                  </div>
                  <span className="text-sm text-slate-400 dark:text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Quick Actions</h2>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-lg transition-colors shadow-sm">
                <Users className="w-5 h-5" />
                <span className="font-medium">Add New User</span>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">View Attendance</span>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <CheckCircle className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">Generate Report</span>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <AlertTriangle className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">Review Alerts</span>
              </button>
            </div>

            {/* System Status */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-gray-300">RFID Scanner</span>
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-500 dark:bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-gray-300">AI Service</span>
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-500 dark:bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-gray-300">Database</span>
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-500 dark:bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}