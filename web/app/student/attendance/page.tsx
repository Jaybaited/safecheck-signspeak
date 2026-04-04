'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, CheckCircle, XCircle,
  TrendingUp, Download, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

interface Stats {
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

export default function StudentAttendancePage() {
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [attendance, setAttendance]   = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
      fetchAttendanceData(parsedUser.id);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const fetchAttendanceData = async (studentId: string) => {
    setDataLoading(true);
    try {
      const [statsData, attendanceData] = await Promise.all([
        api.getStudentStats(studentId),
        api.getStudentAttendance(studentId),
      ]);
      setStats(statsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

  const getStatus = (record: AttendanceRecord) => {
    if (!record.timeIn) return 'absent';
    const d = new Date(record.timeIn);
    return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0)
      ? 'late' : 'present';
  };

  const statusConfig = {
    present: {
      badge: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/50',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-green-400" />,
    },
    late: {
      badge: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/50',
      icon: <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    },
    absent: {
      badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/50',
      icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    },
  };

  const statCards = [
    { icon: Calendar,    label: 'Total Days',     value: stats?.totalDays ?? 0,            color: 'text-slate-900 dark:text-white',       iconCls: 'text-slate-500 dark:text-gray-400',    bg: 'bg-slate-100 dark:bg-gray-800' },
    { icon: CheckCircle, label: 'Present',         value: stats?.present ?? 0,              color: 'text-emerald-600 dark:text-green-400', iconCls: 'text-emerald-600 dark:text-green-400', bg: 'bg-emerald-100 dark:bg-green-500/10' },
    { icon: Clock,       label: 'Late',            value: stats?.late ?? 0,                 color: 'text-yellow-600 dark:text-yellow-400', iconCls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
    { icon: XCircle,     label: 'Absent',          value: stats?.absent ?? 0,               color: 'text-red-600 dark:text-red-400',       iconCls: 'text-red-600 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-500/10' },
    { icon: TrendingUp,  label: 'Attendance Rate', value: `${stats?.attendanceRate ?? 0}%`, color: 'text-cyan-600 dark:text-cyan-400',     iconCls: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-100 dark:bg-cyan-500/10' },
  ];

  const changeMonth = (dir: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  // Only block render on auth — not on data
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Track your attendance and punctuality record
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {dataLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none animate-pulse">
                <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-3 w-20 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-gray-700 rounded" />
              </div>
            ))
          ) : (
            statCards.map(({ icon: Icon, label, value, color, iconCls, bg }) => (
              <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconCls}`} />
                  </div>
                </div>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))
          )}
        </div>

        {/* Calendar + Records */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => changeMonth('prev')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 w-32 text-center">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth('next')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400 dark:text-gray-500 font-medium">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="text-center text-slate-400 dark:text-gray-500 py-8 text-sm">
                Calendar view coming soon
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-gray-800 space-y-2">
                {[
                  { color: 'bg-emerald-500/20', label: 'Present' },
                  { color: 'bg-yellow-500/20',  label: 'Late' },
                  { color: 'bg-red-500/20',     label: 'Absent' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 ${color} rounded`} />
                    <span className="text-slate-500 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Records</h2>

            {dataLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="grid grid-cols-4 gap-4 pb-3 border-b border-slate-200 dark:border-gray-800">
                  {['Date','Time In','Time Out','Status'].map((h) => (
                    <div key={h} className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-16" />
                  ))}
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-slate-100 dark:border-gray-800/50">
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-28" />
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-16" />
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-16" />
                    <div className="h-6 bg-slate-100 dark:bg-gray-800 rounded-full w-20" />
                  </div>
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                No attendance records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-gray-800">
                    <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Time In</th>
                      <th className="pb-3 font-medium">Time Out</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => {
                      const status = getStatus(record);
                      const cfg = statusConfig[status as keyof typeof statusConfig];
                      return (
                        <tr key={record.id}
                          className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                              <span className="text-sm text-slate-700 dark:text-gray-300">
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                              <span className="text-sm text-slate-500 dark:text-gray-400">
                                {record.timeIn ? formatTime(record.timeIn) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                              <span className="text-sm text-slate-500 dark:text-gray-400">
                                {record.timeOut ? formatTime(record.timeOut) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {cfg.icon}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

