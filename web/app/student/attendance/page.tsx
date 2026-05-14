'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  LogIn,
  LogOut,
  RefreshCw,
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
  rfidCard: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

export default function StudentAttendancePage() {
  const [user, setUser]                   = useState<User | null>(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [dataLoading, setDataLoading]     = useState(true);
  const [attendance, setAttendance]       = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [refreshing, setRefreshing]       = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
      fetchData(parsedUser.id);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const fetchData = async (studentId: string, silent = false) => {
    if (!silent) setDataLoading(true);
    else setRefreshing(true);
    try {
      const data = await api.getStudentAttendance(studentId);
      setAttendance(data as AttendanceRecord[]);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { if (user) fetchData(user.id, true); };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

  const formatTime = (str: string) =>
    new Date(str).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const changeMonth = (dir: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const filteredRecords = useMemo(() =>
    attendance.filter((r) => {
      const d = new Date(r.date);
      return (
        d.getFullYear() === selectedMonth.getFullYear() &&
        d.getMonth()    === selectedMonth.getMonth()
      );
    }),
  [attendance, selectedMonth]);

  const totalDays   = filteredRecords.length;
  const withTimeIn  = filteredRecords.filter((r) => r.timeIn).length;
  const withTimeOut = filteredRecords.filter((r) => r.timeOut).length;
  const missing     = filteredRecords.filter((r) => r.timeIn && !r.timeOut).length;

  const calendarDays = useMemo(() => {
    const year  = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days  = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedMonth]);

  const recordsByDay = useMemo(() => {
    const map: Record<number, AttendanceRecord> = {};
    filteredRecords.forEach((r) => { map[new Date(r.date).getDate()] = r; });
    return map;
  }, [filteredRecords]);

  const today         = new Date();
  const isCurrentMonth =
    today.getFullYear() === selectedMonth.getFullYear() &&
    today.getMonth()    === selectedMonth.getMonth();

  const handleExport = () => {
    if (!filteredRecords.length) return;
    const header = ['Date', 'Time In', 'Time Out', 'Duration'];
    const rows = filteredRecords.map((r) => {
      let duration = '—';
      if (r.timeIn && r.timeOut) {
        const ms   = new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime();
        const hrs  = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        duration   = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      }
      return [
        formatDate(r.date),
        r.timeIn  ? formatTime(r.timeIn)  : '—',
        r.timeOut ? formatTime(r.timeOut) : '—',
        duration,
      ];
    });
    const csv  = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `attendance-${selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 h-screen flex flex-col overflow-hidden px-6 pt-5 pb-4 gap-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My Attendance</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Your time-in and time-out records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700
                text-slate-600 dark:text-gray-300
                hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!filteredRecords.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            { label: 'Days This Month',    value: totalDays,   icon: Calendar, color: 'text-slate-700 dark:text-white',          iconBg: 'bg-slate-100 dark:bg-gray-800',        iconColor: 'text-slate-500 dark:text-gray-400'    },
            { label: 'Time-In Recorded',   value: withTimeIn,  icon: LogIn,    color: 'text-purple-600 dark:text-purple-400',    iconBg: 'bg-purple-100 dark:bg-purple-500/10',  iconColor: 'text-purple-600 dark:text-purple-400' },
            { label: 'Time-Out Recorded',  value: withTimeOut, icon: LogOut,   color: 'text-cyan-600 dark:text-cyan-400',        iconBg: 'bg-cyan-100 dark:bg-cyan-500/10',      iconColor: 'text-cyan-600 dark:text-cyan-400'     },
            { label: 'Missing Time-Out',   value: missing,     icon: Clock,    color: 'text-amber-600 dark:text-amber-400',      iconBg: 'bg-amber-100 dark:bg-amber-500/10',    iconColor: 'text-amber-600 dark:text-amber-400'   },
          ].map(({ label, value, icon: Icon, color, iconBg, iconColor }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm dark:shadow-none transition-colors"
            >
              <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-none mb-1">{label}</p>
                <p className={`text-xl font-bold leading-none ${color}`}>
                  {dataLoading ? '—' : value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Calendar + Table ── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── Mini Calendar ── */}
          <div className="w-64 shrink-0 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
            rounded-xl p-4 shadow-sm dark:shadow-none flex flex-col gap-3 transition-colors">

            {/* Month Nav */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeMonth('prev')}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-gray-400" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-200">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => changeMonth('next')}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-slate-400 dark:text-gray-600 py-0.5">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const record  = recordsByDay[day];
                const isToday = isCurrentMonth && day === today.getDate();
                const hasIn   = !!record?.timeIn;
                const hasOut  = !!record?.timeOut;

                return (
                  <div
                    key={day}
                    title={
                      record
                        ? `In: ${record.timeIn ? formatTime(record.timeIn) : '—'} · Out: ${record.timeOut ? formatTime(record.timeOut) : 'Pending'}`
                        : String(day)
                    }
                    className={`relative flex flex-col items-center justify-center rounded-md cursor-default
                      text-[11px] font-medium transition-colors select-none
                      ${isToday
                        ? 'bg-purple-600 text-white'
                        : record
                        ? 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-700'
                        : 'text-slate-400 dark:text-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                      }`}
                    style={{ aspectRatio: '1' }}
                  >
                    <span>{day}</span>
                    {record && !isToday && (
                      <div className="flex gap-0.5 mt-px">
                        <div className={`w-1 h-1 rounded-full ${hasIn  ? 'bg-purple-500' : 'bg-slate-300 dark:bg-gray-600'}`} />
                        <div className={`w-1 h-1 rounded-full ${hasOut ? 'bg-cyan-500'   : 'bg-slate-300 dark:bg-gray-600'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 dark:border-gray-800 space-y-1.5">
              {[
                { dot: 'bg-purple-500', label: 'Time-in recorded' },
                { dot: 'bg-cyan-500',   label: 'Time-out recorded' },
                { dot: 'bg-slate-300 dark:bg-gray-600', label: 'Not recorded' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-[10px] text-slate-500 dark:text-gray-500">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-3 rounded-sm bg-purple-600 shrink-0" />
                <span className="text-[10px] text-slate-500 dark:text-gray-500">Today</span>
              </div>
            </div>
          </div>

          {/* ── Records Table ── */}
          <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
            rounded-xl shadow-sm dark:shadow-none flex flex-col overflow-hidden transition-colors">

            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-gray-800 shrink-0">
              <h2 className="text-sm font-bold">
                Records —{' '}
                <span className="text-purple-600 dark:text-purple-400">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </h2>
              <span className="text-xs text-slate-400 dark:text-gray-500">
                {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {dataLoading ? (
                <div className="space-y-0 animate-pulse">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-6 px-5 py-3 border-b border-slate-100 dark:border-gray-800">
                      <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded w-36" />
                      <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded w-20" />
                      <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded w-20" />
                      <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm font-medium text-slate-500 dark:text-gray-400">No records for this month</p>
                  <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">Try navigating to a different month</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-slate-100 dark:border-gray-800">
                    <tr>
                      {['Date', 'Time In', 'Time Out', 'Duration'].map((h) => (
                        <th key={h} className="text-left px-5 py-2 text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                    {filteredRecords.map((record) => {
                      let duration = '—';
                      if (record.timeIn && record.timeOut) {
                        const ms   = new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime();
                        const hrs  = Math.floor(ms / 3600000);
                        const mins = Math.floor((ms % 3600000) / 60000);
                        duration   = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                      }

                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          {/* Date */}
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-gray-600 shrink-0" />
                              <span className="text-xs text-slate-700 dark:text-gray-300 whitespace-nowrap">
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </td>

                          {/* Time In */}
                          <td className="px-5 py-2.5">
                            {record.timeIn ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                                  {formatTime(record.timeIn)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-gray-600">—</span>
                            )}
                          </td>

                          {/* Time Out */}
                          <td className="px-5 py-2.5">
                            {record.timeOut ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                                  {formatTime(record.timeOut)}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                                text-amber-600 dark:text-amber-400
                                bg-amber-50 dark:bg-amber-500/10
                                border border-amber-200 dark:border-amber-500/30
                                px-2 py-0.5 rounded-full">
                                <Clock className="w-2.5 h-2.5" />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="px-5 py-2.5">
                            <span className={`text-xs tabular-nums ${
                              duration !== '—'
                                ? 'font-semibold text-slate-700 dark:text-gray-300'
                                : 'text-slate-300 dark:text-gray-600'
                            }`}>
                              {duration}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}