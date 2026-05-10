'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Calendar, BookOpen, TrendingUp,
  Clock, ChevronRight,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface ParentUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
}

const sampleChild: Child = {
  id: 'child-1',
  firstName: 'Ana',
  lastName: 'Dela Cruz',
  gradeLevel: 'GRADE_8',
};

const sampleStats = {
  attendanceRate: 95,
  presentDays:    114,
  totalDays:      120,
  fslProgress:    72,
  lettersCompleted: 17,
  totalLetters:   24,
  streak:         9,
  lastCheckIn:    '7:45 AM',
  lastCheckOut:   '4:00 PM',
  todayTapped:    true,
};

// Date, Time In, Time Out only — no status
const recentAttendance = [
  { date: 'Mar 12, Wed', timeIn: '7:45 AM', timeOut: '4:00 PM' },
  { date: 'Mar 11, Tue', timeIn: '7:52 AM', timeOut: '4:00 PM' },
  { date: 'Mar 10, Mon', timeIn: '8:10 AM', timeOut: '4:00 PM' },
  { date: 'Mar 7, Fri',  timeIn: '7:48 AM', timeOut: '4:00 PM' },
  { date: 'Mar 6, Thu',  timeIn: '—',       timeOut: '—'       },
];

const recentAnnouncements = [
  { id: '1', title: 'FSL Quiz this Friday',   teacher: 'Mr. Santos', time: 'Yesterday' },
  { id: '2', title: 'Parent-Teacher Meeting', teacher: 'Mr. Santos', time: '2 days ago' },
];

export default function ParentDashboardPage() {
  const [parent, setParent]   = useState<ParentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sampleChild} />

      <main className="ml-64 p-8">
        {/* Header — matches Admin/Student pattern */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome, {parent.firstName}!
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Here&apos;s an overview of {sampleChild.firstName}&apos;s progress today
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              aria-label="Notifications"
              onClick={() => router.push('/parent/notifications')}
              className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                2
              </div>
            </button>
            <button
              onClick={() => router.push('/parent/profile')}
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {parent.firstName?.[0]}{parent.lastName?.[0]}
            </button>
          </div>
        </div>

        {/* Today's Check-in Banner — time in/out only, no status label */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 mb-8 flex items-center gap-5 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="w-14 h-14 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 text-[#7B1113] dark:text-[#E8C96A]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-0.5">Today&apos;s RFID Tap</p>
            {sampleStats.todayTapped ? (
              <>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {sampleChild.firstName} tapped in at <span className="text-[#7B1113] dark:text-[#E8C96A]">{sampleStats.lastCheckIn}</span>
                </p>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                  Checked out at {sampleStats.lastCheckOut}
                </p>
              </>
            ) : (
              <p className="text-xl font-bold text-slate-500 dark:text-gray-400">
                No tap recorded today
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400 dark:text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Calendar,
              label: 'Attendance Rate',
              value: `${sampleStats.attendanceRate}%`,
              sub: `${sampleStats.presentDays} of ${sampleStats.totalDays} days`,
              color: 'text-[#7B1113] dark:text-[#E8C96A]',
              iconCls: 'text-[#7B1113] dark:text-[#E8C96A]',
              bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
            },
            {
              icon: BookOpen,
              label: 'FSL Progress',
              value: `${sampleStats.fslProgress}%`,
              sub: `${sampleStats.lettersCompleted} of ${sampleStats.totalLetters} letters`,
              color: 'text-purple-600 dark:text-purple-400',
              iconCls: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-100 dark:bg-purple-500/10',
            },
            {
              icon: TrendingUp,
              label: 'Learning Streak',
              value: `${sampleStats.streak} days`,
              sub: 'Keep it going!',
              color: 'text-orange-500 dark:text-orange-400',
              iconCls: 'text-orange-500 dark:text-orange-400',
              bg: 'bg-orange-100 dark:bg-orange-500/10',
            },
          ].map(({ icon: Icon, label, value, sub, color, iconCls, bg }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${iconCls}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A] opacity-60" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Attendance — Date, Time In, Time Out only */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Attendance</h2>
              <button
                onClick={() => router.push('/parent/attendance')}
                className="text-[#7B1113] dark:text-[#E8C96A] hover:opacity-80 text-sm font-medium transition-opacity flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-gray-800">
                  <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                    {['Date', 'Time In', 'Time Out'].map((h) => (
                      <th key={h} className="pb-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          <span className="text-sm text-slate-700 dark:text-gray-300">{r.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{r.timeIn}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{r.timeOut}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* FSL Progress Mini */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">FSL Progress</h2>
                <button
                  onClick={() => router.push('/parent/fsl-progress')}
                  className="text-[#7B1113] dark:text-[#E8C96A] hover:opacity-80 text-sm font-medium transition-opacity flex items-center gap-1"
                >
                  Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{sampleStats.fslProgress}%</p>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {sampleStats.lettersCompleted} of {sampleStats.totalLetters} letters mastered
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${sampleStats.fslProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500 text-center mt-3">
                🔥 {sampleStats.streak}-day learning streak
              </p>
            </div>

            {/* Announcements */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Announcements</h2>
                <button
                  onClick={() => router.push('/parent/notifications')}
                  className="text-[#7B1113] dark:text-[#E8C96A] hover:opacity-80 text-sm font-medium transition-opacity flex items-center gap-1"
                >
                  All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                      {a.teacher} · {a.time}
                    </p>
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
