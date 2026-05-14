'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Calendar, CheckCircle, Lock,
  LogIn, LogOut, TrendingUp, RefreshCw,
  Clock, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { studentStorage } from '@/lib/storage';
import { api } from '@/lib/api';
import type { AttendanceRecord, AttendanceStats } from '@/lib/api';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
  gradeLevel: string | null; rfidCard: string | null;
}

const FSL_LETTERS = [
  'A','B','C','D','E','F','G','H','I',
  'K','L','M','N','O','P','Q','R','S',
  'T','U','V','W','X','Y',
];

interface WeekDay {
  label: string; iso: string;
  fsl: number; hasTimeIn: boolean; hasTimeOut: boolean;
}

function getWeekDates(): { label: string; iso: string }[] {
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, iso: d.toISOString().split('T')[0] };
  });
}

export default function StudentProgressPage() {
  const router = useRouter();
  const [user,             setUser]             = useState<User | null>(null);
  const [authLoading,      setAuthLoading]      = useState(true);
  const [dataLoading,      setDataLoading]      = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [completedLetters, setCompletedLetters] = useState<Set<string>>(new Set());
  const [attendanceStats,  setAttendanceStats]  = useState<AttendanceStats | null>(null);
  const [weekDays,         setWeekDays]         = useState<WeekDay[]>([]);
  const [recentRecords,    setRecentRecords]    = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
      const savedLetters = studentStorage.get(parsedUser.id, 'fsl_completed');
      const letters: Set<string> = savedLetters
        ? new Set(JSON.parse(savedLetters) as string[])
        : new Set();
      setCompletedLetters(letters);
      loadData(parsedUser.id);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const loadData = async (studentId: string, silent = false) => {
    if (!silent) setDataLoading(true);
    else setRefreshing(true);
    try {
      const weekDates = getWeekDates();
      const [stats, records] = await Promise.all([
        api.getStudentStats(studentId),
        api.getStudentAttendance(studentId),
      ]);
      setAttendanceStats(stats as AttendanceStats);

      const recordsByDate: Record<string, AttendanceRecord> = {};
      (records as AttendanceRecord[]).forEach((r) => {
        recordsByDate[r.date.split('T')[0]] = r;
      });

      setWeekDays(weekDates.map(({ label, iso }) => ({
        label, iso,
        fsl:        studentStorage.getFslActivity(studentId, iso),
        hasTimeIn:  !!recordsByDate[iso]?.timeIn,
        hasTimeOut: !!recordsByDate[iso]?.timeOut,
      })));

      const sorted = [...(records as AttendanceRecord[])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      setRecentRecords(sorted);
    } catch (err) {
      console.error('Failed to load progress data:', err);
      const weekDates = getWeekDates();
      setWeekDays(weekDates.map(({ label, iso }) => ({
        label, iso,
        fsl: studentStorage.getFslActivity(studentId, iso),
        hasTimeIn: false, hasTimeOut: false,
      })));
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { if (user) loadData(user.id, true); };
  const handleLogout  = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatTime = (str?: string | null) =>
    str ? new Date(str).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fslPct         = Math.round((completedLetters.size / FSL_LETTERS.length) * 100);
  const remaining      = FSL_LETTERS.length - completedLetters.size;
  const presentDays    = attendanceStats?.present        ?? 0;
  const totalDays      = attendanceStats?.totalDays      ?? 0;
  const attendanceRate = attendanceStats?.attendanceRate ?? 0;
  const maxBarFSL      = Math.max(...weekDays.map(d => d.fsl), 1);
  const weekFSLTotal   = weekDays.reduce((s, d) => s + d.fsl, 0);
  const weekTimeIns    = weekDays.filter(d => d.hasTimeIn).length;
  const nextLetter     = FSL_LETTERS.find(l => !completedLetters.has(l)) ?? null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 flex flex-col p-6 gap-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Track your FSL learning and attendance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700
                text-slate-600 dark:text-gray-300
                hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              icon: BookOpen,   label: 'FSL Progress',
              value: `${fslPct}%`,
              sub: `${completedLetters.size} of ${FSL_LETTERS.length} letters mastered`,
              iconBg: 'bg-purple-100 dark:bg-purple-500/10',
              iconColor: 'text-purple-600 dark:text-purple-400',
              valueColor: 'text-purple-600 dark:text-purple-400',
            },
            {
              icon: Calendar,   label: 'Attendance Rate',
              value: dataLoading ? '—' : `${Math.round(attendanceRate)}%`,
              sub: dataLoading ? 'Loading…' : `${presentDays} of ${totalDays} days present`,
              iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
              iconColor: 'text-emerald-600 dark:text-emerald-400',
              valueColor: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              icon: LogIn,      label: 'Time-In This Week',
              value: dataLoading ? '—' : String(weekTimeIns),
              sub: 'days with time-in recorded',
              iconBg: 'bg-cyan-100 dark:bg-cyan-500/10',
              iconColor: 'text-cyan-600 dark:text-cyan-400',
              valueColor: 'text-cyan-600 dark:text-cyan-400',
            },
            {
              icon: TrendingUp, label: 'FSL This Week',
              value: dataLoading ? '—' : String(weekFSLTotal),
              sub: 'letters practiced this week',
              iconBg: 'bg-amber-100 dark:bg-amber-500/10',
              iconColor: 'text-amber-600 dark:text-amber-400',
              valueColor: 'text-amber-600 dark:text-amber-400',
            },
          ].map(({ icon: Icon, label, value, sub, iconBg, iconColor, valueColor }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                rounded-xl p-4 flex items-center gap-4 shadow-sm dark:shadow-none transition-colors"
            >
              <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-0.5">{label}</p>
                <p className={`text-2xl font-bold leading-none ${valueColor}`}>{value}</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 truncate">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div className="flex gap-4 items-start">

          {/* ── LEFT: FSL Progress ── */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">

            {/* FSL Alphabet Grid */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
              rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold">FSL Alphabet Progress</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                    {completedLetters.size} mastered · {remaining} remaining
                    {nextLetter && (
                      <span className="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                        · Next up: <strong>{nextLetter}</strong>
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{fslPct}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mb-4">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${fslPct}%` }}
                />
              </div>

              {/* Letter grid */}
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                {FSL_LETTERS.map((letter) => {
                  const done   = completedLetters.has(letter);
                  const isNext = letter === nextLetter;
                  return (
                    <div
                      key={letter}
                      className={`h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold
                        transition-all relative
                        ${done
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                          : isNext
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400 ring-offset-1 dark:ring-offset-gray-900'
                          : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'
                        }`}
                    >
                      {letter}
                      {done && <CheckCircle className="w-2.5 h-2.5 text-white/70 mt-0.5" />}
                    </div>
                  );
                })}
                {['J','Z'].map((letter) => (
                  <div
                    key={letter}
                    className="h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold
                      bg-slate-50 dark:bg-gray-900 text-slate-300 dark:text-gray-600
                      border border-dashed border-slate-200 dark:border-gray-700"
                  >
                    {letter}
                    <Lock className="w-2.5 h-2.5 mt-0.5" />
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                {[
                  { color: 'bg-purple-600', label: 'Mastered' },
                  { color: 'bg-purple-100 dark:bg-purple-500/20 ring-2 ring-purple-400', label: 'Next up' },
                  { color: 'bg-slate-100 dark:bg-gray-800', label: 'Not yet started' },
                  { color: 'bg-slate-50 dark:bg-gray-900 border border-dashed border-slate-300 dark:border-gray-600', label: 'Dynamic (locked)' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                    <div className={`w-4 h-4 rounded-md ${color}`} /> {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly FSL Bar Chart */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
              rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">

              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="text-base font-bold">Weekly FSL Activity</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    Letters practiced per day this week
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{weekFSLTotal}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">this week</p>
                </div>
              </div>

              {dataLoading ? (
                <div className="h-36 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-3 h-36 pt-3">
                    {weekDays.map(({ label, fsl, hasTimeIn }) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        {fsl > 0 && (
                          <span className="text-xs text-slate-500 dark:text-gray-400 font-semibold tabular-nums">
                            {fsl}
                          </span>
                        )}
                        <div className="w-full flex-1 flex flex-col justify-end">
                          <div
                            className="w-full rounded-t-md bg-purple-600 dark:bg-purple-500
                              hover:bg-purple-700 transition-colors"
                            style={{
                              height:    fsl > 0 ? `${(fsl / maxBarFSL) * 100}%` : '4px',
                              minHeight: fsl > 0 ? '8px' : '4px',
                              opacity:   fsl > 0 ? 1 : 0.15,
                            }}
                          />
                        </div>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          hasTimeIn ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-gray-700'
                        }`} />
                        <span className="text-xs text-slate-500 dark:text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-5 mt-3 pt-3 border-t border-slate-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                      <div className="w-4 h-3 rounded-sm bg-purple-600" /> FSL letters practiced
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Attended (time-in recorded)
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Attendance Summary ── */}
          <div className="w-72 shrink-0 flex flex-col gap-4">

            {/* Attendance Overview */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
              rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">
              <h2 className="text-base font-bold mb-4">Attendance Overview</h2>

              {/* Circular rate */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none"
                      className="stroke-slate-100 dark:stroke-gray-800" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none"
                      className="stroke-emerald-500" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - (dataLoading ? 0 : attendanceRate / 100))}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {dataLoading ? '—' : `${Math.round(attendanceRate)}%`}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {dataLoading ? '—' : presentDays}
                    <span className="text-sm font-normal text-slate-400 dark:text-gray-500 ml-1">
                      / {totalDays}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">days attended</p>
                </div>
              </div>

              {/* This week tracker */}
              <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                This Week
              </p>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(({ label, hasTimeIn, hasTimeOut }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-7 rounded-lg flex items-center justify-center transition-colors
                      ${hasTimeIn && hasTimeOut
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40'
                        : hasTimeIn
                        ? 'bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/40'
                        : 'bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700'
                      }`}
                    >
                      {hasTimeIn && (
                        <div className={`w-2 h-2 rounded-full ${hasTimeOut ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500">{label.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { color: 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40', label: 'Full day' },
                  { color: 'bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/40',   label: 'Time-in only' },
                  { color: 'bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700',               label: 'No record' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${color}`} />
                    <span className="text-[10px] text-slate-400 dark:text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
              rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">

              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold">Recent Check-ins</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Last 3 entries</p>
                </div>
                <Link
                  href="/student/attendance"
                  className="flex items-center gap-1 text-xs font-medium
                    text-purple-600 dark:text-purple-400
                    hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {dataLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl bg-slate-50 dark:bg-gray-800 p-3 space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24" />
                      <div className="flex gap-3">
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-16" />
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-16" />
                      </div>
                    </div>
                  ))
                ) : recentRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-gray-700 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-gray-400">No records yet</p>
                  </div>
                ) : (
                  recentRecords.map((record) => {
                    let duration = '';
                    if (record.timeIn && record.timeOut) {
                      const ms   = new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime();
                      const hrs  = Math.floor(ms / 3600000);
                      const mins = Math.floor((ms % 3600000) / 60000);
                      duration   = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                    }
                    return (
                      <div
                        key={record.id}
                        className="rounded-xl bg-slate-50 dark:bg-gray-800/60
                          border border-slate-100 dark:border-gray-700/50 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-gray-200">
                            {formatDate(record.date)}
                          </span>
                          {duration && (
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {duration}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                              <LogIn className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                              {formatTime(record.timeIn)}
                            </span>
                          </div>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
                              <LogOut className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            {record.timeOut ? (
                              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                                {formatTime(record.timeOut)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-500 dark:text-amber-400">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}