'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Award,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

export default function StudentDashboardPage() {
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
      if (parsedUser.role !== 'STUDENT') {
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Sample data (replace with real API calls later)
  const stats = {
    attendanceRate: 95,
    totalDays: 120,
    presentDays: 114,
    fslProgress: 68,
    wordsLearned: 34,
    totalWords: 50,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'attendance',
      title: 'Checked In',
      time: '7:45 AM',
      date: 'Today',
      icon: CheckCircle,
      color: 'text-green-400',
    },
    {
      id: 2,
      type: 'fsl',
      title: 'Completed: Greetings Module',
      time: '2:30 PM',
      date: 'Yesterday',
      icon: Award,
      color: 'text-purple-400',
    },
    {
      id: 3,
      type: 'attendance',
      title: 'Checked Out',
      time: '3:45 PM',
      date: 'Yesterday',
      icon: Clock,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <StudentSidebar onLogout={handleLogout} student={user} />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-gray-400">
              Here&apos;s your learning progress today
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                2
              </div>
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Attendance */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-400">
                {stats.attendanceRate}%
              </span>
            </div>
            <h3 className="font-medium mb-1">Attendance Rate</h3>
            <p className="text-sm text-gray-400">
              {stats.presentDays} of {stats.totalDays} days present
            </p>
          </div>

          {/* FSL Progress */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {stats.fslProgress}%
              </span>
            </div>
            <h3 className="font-medium mb-1">FSL Progress</h3>
            <p className="text-sm text-gray-400">
              {stats.wordsLearned} of {stats.totalWords} words learned
            </p>
          </div>

          {/* Today's Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-2xl font-bold text-cyan-400">
                Present
              </span>
            </div>
            <h3 className="font-medium mb-1">Today&apos;s Status</h3>
            <p className="text-sm text-gray-400">
              Checked in at 7:45 AM
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'attendance' ? 'bg-green-500/10' : 'bg-purple-500/10'
                  }`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-400">
                      {activity.date} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/student/fsl')}
                className="w-full flex items-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Practice FSL</span>
              </button>

              <button
                onClick={() => router.push('/student/attendance')}
                className="w-full flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">View Attendance</span>
              </button>

              <button
                onClick={() => router.push('/student/progress')}
                className="w-full flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Track Progress</span>
              </button>

              <button
                onClick={() => router.push('/student/profile')}
                className="w-full flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Target className="w-5 h-5" />
                <span className="font-medium">My Profile</span>
              </button>
            </div>

            {/* Learning Streak */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Learning Streak 🔥
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-orange-400">7</div>
                <div className="text-sm text-gray-400">
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
