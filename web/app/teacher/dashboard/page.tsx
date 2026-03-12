'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Users, CheckCircle, TrendingUp,
  BookOpen, AlertTriangle, XCircle, Clock,
  ClipboardCheck, Megaphone, FileBarChart,
} from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  section: string | null;
}

// Sample data — replace with real API calls
const stats = {
  totalStudents:   38,
  presentToday:    34,
  absentToday:     4,
  avgFSLProgress:  62,
};

const recentAttendance = [
  { id: 1, name: 'Ana Reyes',      status: 'present', time: '7:42 AM' },
  { id: 2, name: 'Carlo Santos',   status: 'late',    time: '8:15 AM' },
  { id: 3, name: 'Diana Cruz',     status: 'present', time: '7:55 AM' },
  { id: 4, name: 'Enzo Villanueva',status: 'absent',  time: '—' },
  { id: 5, name: 'Faith Lim',      status: 'present', time: '7:48 AM' },
];

const fslTop = [
  { name: 'Ana Reyes',       pct: 92 },
  { name: 'Diana Cruz',      pct: 88 },
  { name: 'Faith Lim',       pct: 81 },
  { name: 'Carlo Santos',    pct: 74 },
  { name: 'Marco Bautista',  pct: 68 },
];

const statusCfg = {
  present: { color: 'text-emerald-600 dark:text-green-400',  bg: 'bg-emerald-100 dark:bg-green-500/10',  icon: CheckCircle, badge: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30' },
  late:    { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/10', icon: Clock,        badge: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30' },
  absent:  { color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-500/10',       icon: XCircle,      badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30' },
};

export default function TeacherDashboardPage() {
  const [user, setUser]           = useState<User | null>(null);
  const [loading, setLoading]     = useState(true);
  const router                    = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'TEACHER') { router.push('/'); return; }
      setUser(parsedUser);
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const attendancePct = Math.round((stats.presentToday / stats.totalStudents) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <TeacherSidebar onLogout={handleLogout} teacher={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.firstName}!
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">2</div>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users,      label: 'Total Students',   value: stats.totalStudents,  sub: `Section ${user.section ?? 'N/A'}`,       color: 'text-slate-900 dark:text-white',      iconCls: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-100 dark:bg-cyan-500/10',    trend: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
            { icon: CheckCircle,label: 'Present Today',    value: stats.presentToday,   sub: `${attendancePct}% attendance rate`,      color: 'text-emerald-600 dark:text-green-400',iconCls: 'text-emerald-600 dark:text-green-400',bg: 'bg-emerald-100 dark:bg-green-500/10', trend: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
            { icon: AlertTriangle,label:'Absent Today',    value: stats.absentToday,    sub: 'Needs follow-up',                        color: 'text-red-600 dark:text-red-400',      iconCls: 'text-red-600 dark:text-red-400',      bg: 'bg-red-100 dark:bg-red-500/10',      trend: <AlertTriangle className="w-5 h-5 text-red-500" /> },
            { icon: BookOpen,   label: 'Avg FSL Progress', value: `${stats.avgFSLProgress}%`, sub: 'Class average',                    color: 'text-purple-600 dark:text-purple-400',iconCls: 'text-purple-600 dark:text-purple-400',bg: 'bg-purple-100 dark:bg-purple-500/10',trend: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
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
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Attendance */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today&apos;s Attendance</h2>
              <button onClick={() => router.push('/teacher/attendance')}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium transition-colors">
                View All
              </button>
            </div>

            {/* Attendance bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 dark:text-gray-400">
                  <span className="font-semibold text-emerald-600 dark:text-green-400">{stats.presentToday}</span> present
                </span>
                <span className="text-slate-500 dark:text-gray-400">
                  <span className="font-semibold text-red-600 dark:text-red-400">{stats.absentToday}</span> absent
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${attendancePct}%` }} />
                <div className="h-full bg-red-400 transition-all duration-700 flex-1" />
              </div>
            </div>

            <div className="space-y-3">
              {recentAttendance.map((s) => {
                const cfg = statusCfg[s.status as keyof typeof statusCfg];
                const Icon = cfg.icon;
                return (
                  <div key={s.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-gray-500">{s.time}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h2>
              <div className="space-y-3">
                <button onClick={() => router.push('/teacher/mark-attendance')}
                  className="w-full flex items-center gap-3 p-3.5 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-lg transition-colors shadow-sm">
                  <ClipboardCheck className="w-5 h-5" />
                  <span className="font-medium text-sm">Mark Attendance</span>
                </button>
                <button onClick={() => router.push('/teacher/announcements')}
                  className="w-full flex items-center gap-3 p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                  <Megaphone className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">Send Announcement</span>
                </button>
                <button onClick={() => router.push('/teacher/reports')}
                  className="w-full flex items-center gap-3 p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                  <FileBarChart className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">Generate Report</span>
                </button>
                <button onClick={() => router.push('/teacher/fsl-progress')}
                  className="w-full flex items-center gap-3 p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                  <BookOpen className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">View FSL Progress</span>
                </button>
              </div>
            </div>

            {/* Top FSL Students */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Top FSL Students</h2>
              <div className="space-y-3">
                {fslTop.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-500' : 'text-slate-400 dark:text-gray-500'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full mt-1">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0">{s.pct}%</span>
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
