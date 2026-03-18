'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Calendar, BookOpen, TrendingUp,
  Clock, CheckCircle, Target, Award,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

const stats = {
  attendanceRate: 95,
  totalDays: 120,
  presentDays: 114,
  fslProgress: 68,
  wordsLearned: 34,
  totalWords: 50,
};

const recentActivity = [
  { id: 1, type: 'attendance', title: 'Checked In',                  time: '7:45 AM',  date: 'Today',     icon: CheckCircle, color: 'text-emerald-600 dark:text-green-400',  bg: 'bg-emerald-100 dark:bg-green-500/10' },
  { id: 2, type: 'fsl',        title: 'Completed: Greetings Module', time: '2:30 PM',  date: 'Yesterday', icon: Award,        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10' },
  { id: 3, type: 'attendance', title: 'Checked Out',                 time: '3:45 PM',  date: 'Yesterday', icon: Clock,        color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/10' },
];

export default function StudentDashboardPage() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
              Here&apos;s your learning progress today
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <button className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                2
              </div>
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600 dark:text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Attendance Rate</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.attendanceRate}%</h3>
            <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">
              {stats.presentDays} of {stats.totalDays} days present
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">FSL Progress</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.fslProgress}%</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 font-medium">
              {stats.wordsLearned} of {stats.totalWords} words learned
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Today&apos;s Status</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Present</h3>
            <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">Checked in at 7:45 AM</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.bg}`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{activity.title}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{activity.date} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => router.push('/student/fsl')}
                className="w-full flex items-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors shadow-sm">
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Practice FSL</span>
              </button>
              <button onClick={() => router.push('/student/attendance')}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">View Attendance</span>
              </button>
              <button onClick={() => router.push('/student/progress')}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <TrendingUp className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">Track Progress</span>
              </button>
              <button onClick={() => router.push('/student/profile')}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <Target className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <span className="font-medium">My Profile</span>
              </button>
            </div>

            {/* Learning Streak */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-3">
                Learning Streak 🔥
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">7</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  <div>days</div>
                  <div>in a row!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

