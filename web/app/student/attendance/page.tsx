// app/student/attendance/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter }                   from 'next/navigation';
import {
  Calendar, Clock, CheckCircle, XCircle, TrendingUp,
  Download, Filter, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import StudentSidebar                  from '@/components/student/StudentSidebar';
import ThemeToggle                     from '@/components/ThemeToggle';
import { api }                         from '@/lib/api';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string; gradeLevel: string | null;
}

interface AttendanceRecord {
  id: string; date: string; timeIn: string; timeOut: string | null;
}

interface Stats {
  totalDays: number; present: number; late: number;
  absent: number; attendanceRate: number;
}

type StatusFilter = 'all' | 'present' | 'late' | 'absent';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',     label: 'All Records' },
  { value: 'present', label: 'Present'     },
  { value: 'late',    label: 'Late'        },
  { value: 'absent',  label: 'Absent'      },
];

export default function StudentAttendancePage() {
  const router = useRouter();

  const [user,          setUser]          = useState<User | null>(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [dataLoading,   setDataLoading]   = useState(true);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [attendance,    setAttendance]    = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterStatus,  setFilterStatus]  = useState<StatusFilter>('all');
  const [showFilter,    setShowFilter]    = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // ── Auth guard
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as User;
      if (parsed.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsed);
      fetchData(parsed.id);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  // ── Close filter on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async (studentId: string) => {
    setDataLoading(true);
    try {
      const [statsData, attendanceData] = await Promise.all([
        api.getStudentStats(studentId),
        api.getStudentAttendance(studentId),
      ]);
      setStats(statsData);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const getStatus = (record: AttendanceRecord): StatusFilter => {
    if (!record.timeIn) return 'absent';
    const d = new Date(record.timeIn);
    return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0) ? 'late' : 'present';
  };

  // ── Apply status filter
  const filteredAttendance = attendance.filter((r) =>
    filterStatus === 'all' ? true : getStatus(r) === filterStatus
  );

  // ── CSV Export (no external dependency)
  const handleExport = () => {
    const headers = ['Date', 'Time In', 'Time Out', 'Status'];
    const rows = filteredAttendance.map((r) => {
      const status = getStatus(r);
      return [
        formatDate(r.date),
        r.timeIn  ? formatTime(r.timeIn)  : '—',
        r.timeOut ? formatTime(r.timeOut) : '—',
        status.charAt(0).toUpperCase() + status.slice(1),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `attendance_${user?.firstName ?? 'student'}_${user?.lastName ?? ''}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const changeMonth = (dir: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const statusConfig = {
    present: {
      badge: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/50',
      icon:  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-green-400" />,
    },
    late: {
      badge: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/50',
      icon:  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
    },
    absent: {
      badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/50',
      icon:  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    },
  };

  // ── Compact stat cards config
  const statCards = [
    { icon: Calendar,    label: 'Total Days',      value: stats?.totalDays ?? 0,                           iconBg: 'bg-slate-100 dark:bg-gray-800',             iconColor: 'text-slate-500 dark:text-gray-400',          valueColor: 'text-slate-900 dark:text-white' },
    { icon: CheckCircle, label: 'Present',          value: stats?.present ?? 0,                             iconBg: 'bg-emerald-100 dark:bg-green-500/10',        iconColor: 'text-emerald-600 dark:text-green-400',       valueColor: 'text-emerald-600 dark:text-green-400' },
    { icon: Clock,       label: 'Late',             value: stats?.late ?? 0,                                iconBg: 'bg-yellow-100 dark:bg-yellow-500/10',        iconColor: 'text-yellow-600 dark:text-yellow-400',       valueColor: 'text-yellow-600 dark:text-yellow-400' },
    { icon: XCircle,     label: 'Absent',           value: stats?.absent ?? 0,                              iconBg: 'bg-red-100 dark:bg-red-500/10',              iconColor: 'text-red-600 dark:text-red-400',             valueColor: 'text-red-600 dark:text-red-400' },
    { icon: TrendingUp,  label: 'Attendance Rate',  value: `${Math.round(stats?.attendanceRate ?? 0)}%`,   iconBg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',      iconColor: 'text-[#7B1113] dark:text-[#E8C96A]',        valueColor: 'text-[#7B1113] dark:text-[#E8C96A]' },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
            <p className="text-slate-500 dark:text-gray-400">Track your attendance and punctuality record</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* ── Filter Dropdown ─────────────────────────────────── */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilter((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors text-sm"
              >
                <Filter className="w-4 h-4" />
                {FILTER_OPTIONS.find((f) => f.value === filterStatus)?.label}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilter ? 'rotate-180' : ''}`} />
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
                  {FILTER_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => { setFilterStatus(value); setShowFilter(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        filterStatus === value
                          ? 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] font-medium'
                          : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {label}
                      {filterStatus === value && <CheckCircle className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── CSV Export ──────────────────────────────────────── */}
            <button
              onClick={handleExport}
              disabled={filteredAttendance.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Active Filter Badge ───────────────────────────────────── */}
        {filterStatus !== 'all' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-gray-400">Showing:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] text-xs font-medium rounded-full">
              {FILTER_OPTIONS.find((f) => f.value === filterStatus)?.label}
              <button onClick={() => setFilterStatus('all')} className="hover:opacity-70 ml-1">✕</button>
            </span>
            <span className="text-xs text-slate-400 dark:text-gray-500">
              ({filteredAttendance.length} record{filteredAttendance.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* ── Stat Cards — compact horizontal ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {dataLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-16" />
                      <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded w-10" />
                    </div>
                  </div>
                </div>
              ))
            : statCards.map(({ icon: Icon, label, value, iconBg, iconColor, valueColor }) => (
                <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 dark:text-gray-400 text-xs">{label}</p>
                      <p className={`text-xl font-bold mt-0.5 ${valueColor}`}>{value}</p>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── Calendar + Records ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Calendar */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeMonth('prev')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 w-32 text-center">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => changeMonth('next')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 dark:text-gray-500 font-medium">
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
                  { color: 'bg-yellow-500/20',  label: 'Late'    },
                  { color: 'bg-red-500/20',      label: 'Absent'  },
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Attendance Records</h2>

            {dataLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 py-3 border-b border-slate-100 dark:border-gray-800/50">
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-32" />
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-16" />
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-16" />
                    <div className="h-6 bg-slate-100 dark:bg-gray-800 rounded-full w-20" />
                  </div>
                ))}
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">
                  {filterStatus !== 'all'
                    ? `No "${filterStatus}" records found`
                    : 'No attendance records found'}
                </p>
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="mt-3 text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline"
                  >
                    Clear filter
                  </button>
                )}
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
                    {filteredAttendance.map((record) => {
                      const status = getStatus(record);
                      const cfg    = statusConfig[status];
                      return (
                        <tr key={record.id} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                              <span className="text-sm text-slate-700 dark:text-gray-300">{formatDate(record.date)}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                              <span className="text-sm text-slate-500 dark:text-gray-400">
                                {record.timeIn ? formatTime(record.timeIn) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                              <span className="text-sm text-slate-500 dark:text-gray-400">
                                {record.timeOut ? formatTime(record.timeOut) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {cfg.icon}
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
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