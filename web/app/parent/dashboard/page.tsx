'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Calendar, BookOpen, TrendingUp,
  CheckCircle, Clock, XCircle, Award,
  Flame, ChevronRight,
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

// Sample data — replace with real API calls
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
  todayStatus:    'present' as 'present' | 'late' | 'absent',
};

const recentAttendance = [
  { date: 'Mar 12, Wed', status: 'present', timeIn: '7:45 AM', timeOut: '4:00 PM' },
  { date: 'Mar 11, Tue', status: 'present', timeIn: '7:52 AM', timeOut: '4:00 PM' },
  { date: 'Mar 10, Mon', status: 'late',    timeIn: '8:10 AM', timeOut: '4:00 PM' },
  { date: 'Mar 7, Fri',  status: 'present', timeIn: '7:48 AM', timeOut: '4:00 PM' },
  { date: 'Mar 6, Thu',  status: 'absent',  timeIn: '—',       timeOut: '—' },
];

const recentAnnouncements = [
  { id: '1', title: 'FSL Quiz this Friday',    teacher: 'Mr. Santos', time: 'Yesterday' },
  { id: '2', title: 'Parent-Teacher Meeting',  teacher: 'Mr. Santos', time: '2 days ago' },
];

const statusCfg = {
  present: { color: 'text-emerald-600 dark:text-green-400',  bg: 'bg-emerald-100 dark:bg-green-500/10',  icon: CheckCircle, badge: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30' },
  late:    { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/10', icon: Clock,        badge: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30' },
  absent:  { color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-500/10',       icon: XCircle,      badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30' },
};

export default function ParentDashboardPage() {
  const [parent, setParent]   = useState<ParentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/'); return; }
      setParent(p);
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayCfg = statusCfg[sampleStats.todayStatus];
  const TodayIcon = todayCfg.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sampleChild} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {parent.firstName}!
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
              Here&apos;s an overview of {sampleChild.firstName}&apos;s progress today
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                2
              </div>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {parent.firstName[0]}{parent.lastName[0]}
            </div>
          </div>
        </div>

        {/* Today's Status Banner */}
        <div className={`rounded-xl p-5 mb-8 border-2 flex items-center gap-5 transition-colors duration-200 ${
          sampleStats.todayStatus === 'present'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
            : sampleStats.todayStatus === 'late'
            ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-300 dark:border-yellow-500/30'
            : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30'
        }`}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${todayCfg.bg}`}>
            <TodayIcon className={`w-7 h-7 ${todayCfg.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-0.5">Today&apos;s Status</p>
            <p className={`text-2xl font-bold ${todayCfg.color}`}>
              {sampleStats.todayStatus.charAt(0).toUpperCase() + sampleStats.todayStatus.slice(1)}
            </p>
            {sampleStats.todayStatus !== 'absent' && (
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                {sampleChild.firstName} checked in at <span className="font-semibold">{sampleStats.lastCheckIn}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 dark:text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Calendar, label: 'Attendance Rate', value: `${sampleStats.attendanceRate}%`,
              sub: `${sampleStats.presentDays} of ${sampleStats.totalDays} days`,
              color: 'text-emerald-600 dark:text-green-400',
              iconCls: 'text-emerald-600 dark:text-green-400',
              bg: 'bg-emerald-100 dark:bg-green-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
            {
              icon: BookOpen, label: 'FSL Progress', value: `${sampleStats.fslProgress}%`,
              sub: `${sampleStats.lettersCompleted} of ${sampleStats.totalLetters} letters`,
              color: 'text-purple-600 dark:text-purple-400',
              iconCls: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-100 dark:bg-purple-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
            {
              icon: Flame, label: 'Learning Streak', value: `${sampleStats.streak} days`,
              sub: 'Keep it going! 🔥',
              color: 'text-orange-500 dark:text-orange-400',
              iconCls: 'text-orange-500 dark:text-orange-400',
              bg: 'bg-orange-100 dark:bg-orange-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
            {
              icon: Award, label: 'Achievements', value: '4',
              sub: 'Badges earned',
              color: 'text-yellow-600 dark:text-yellow-400',
              iconCls: 'text-yellow-600 dark:text-yellow-400',
              bg: 'bg-yellow-100 dark:bg-yellow-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
          ].map(({ icon: Icon, label, value, sub, color, iconCls, bg, trend }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${iconCls}`} />
                </div>
                {trend}
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
              <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Attendance */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Attendance</h2>
              <button onClick={() => router.push('/parent/attendance')}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentAttendance.map((r, i) => {
                const cfg  = statusCfg[r.status as keyof typeof statusCfg];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{r.date}</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">
                        {r.timeIn !== '—' ? `In: ${r.timeIn}  •  Out: ${r.timeOut}` : 'No record'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* FSL Progress Mini */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">FSL Progress</h2>
                <button onClick={() => router.push('/parent/fsl-progress')}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-1">
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
                <div className="bg-purple-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${sampleStats.fslProgress}%` }} />
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500 text-center mt-3">
                🔥 {sampleStats.streak}-day learning streak
              </p>
            </div>

            {/* Announcements */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Announcements</h2>
                <button onClick={() => router.push('/parent/notifications')}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-1">
                  All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                      {a.teacher} • {a.time}
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
