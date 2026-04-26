// app/student/progress/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import {
  TrendingUp, BookOpen, Calendar, Award,
  Flame, CheckCircle, Lock, Star, Target,
} from 'lucide-react';
import StudentSidebar  from '@/components/student/StudentSidebar';
import ThemeToggle     from '@/components/ThemeToggle';
import { studentStorage } from '@/lib/storage';
import { api }            from '@/lib/api';
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

interface WeekDay { label: string; iso: string; fsl: number; attended: boolean; }

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

function calcStreak(records: AttendanceRecord[]): number {
  const presentDates = new Set(
    records
      .filter(r => r.status === 'PRESENT' || r.status === 'LATE')
      .map(r => r.date.split('T')[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    const iso = d.toISOString().split('T')[0];
    if (presentDates.has(iso)) { streak++; }
    else { if (i === 0) continue; break; }
  }
  return streak;
}

export default function StudentProgressPage() {
  const router = useRouter();
  const [user,             setUser]             = useState<User | null>(null);
  const [authLoading,      setAuthLoading]      = useState(true);
  const [dataLoading,      setDataLoading]      = useState(true);
  const [completedLetters, setCompletedLetters] = useState<Set<string>>(new Set());
  const [attendanceStats,  setAttendanceStats]  = useState<AttendanceStats | null>(null);
  const [weekDays,         setWeekDays]         = useState<WeekDay[]>([]);
  const [streak,           setStreak]           = useState(0);
  const [totalXP,          setTotalXP]          = useState(0);
  const [highScore,        setHighScore]        = useState(0);
  const [quizBest,         setQuizBest]         = useState(0);

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

      const hs = parseInt(studentStorage.get(parsedUser.id, 'fsl_highscore') ?? '0');
      const qb = parseInt(studentStorage.get(parsedUser.id, 'fsl_quiz_best') ?? '0');
      setHighScore(hs);
      setQuizBest(qb);

      const weekDates = getWeekDates();

      Promise.all([
        api.getStudentStats(parsedUser.id),
        api.getStudentAttendance(parsedUser.id),
      ])
        .then(([stats, records]: [AttendanceStats, AttendanceRecord[]]) => {
          setAttendanceStats(stats);
          setStreak(calcStreak(records));
          const presentDates = new Set(
            records
              .filter(r => r.status === 'PRESENT' || r.status === 'LATE')
              .map(r => r.date.split('T')[0])
          );
          setWeekDays(weekDates.map(({ label, iso }) => ({
            label, iso,
            fsl:      studentStorage.getFslActivity(parsedUser.id, iso),
            attended: presentDates.has(iso),
          })));
          setTotalXP(letters.size * 50 + Math.floor(hs / 10) + qb * 20);
        })
        .catch(() => {
          setWeekDays(weekDates.map(({ label, iso }) => ({
            label, iso,
            fsl:      studentStorage.getFslActivity(parsedUser.id, iso),
            attended: false,
          })));
          setTotalXP(letters.size * 50 + Math.floor(hs / 10) + qb * 20);
        })
        .finally(() => setDataLoading(false));
    } catch { router.push('/login'); }
    finally   { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fslPct         = Math.round((completedLetters.size / FSL_LETTERS.length) * 100);
  const maxBarFSL      = Math.max(...weekDays.map(d => d.fsl), 1);
  const presentDays    = attendanceStats?.present     ?? 0;
  const totalDays      = attendanceStats?.totalDays   ?? 0;
  const attendanceRate = attendanceStats?.attendanceRate ?? 0;

  const achievements = [
    { id: 1, title: 'First Sign',        desc: 'Completed your first FSL letter',       icon: Star,     xp: 50,  earned: completedLetters.size >= 1  },
    { id: 2, title: 'Half the Alphabet', desc: 'Mastered 12 or more letters',           icon: BookOpen, xp: 200, earned: completedLetters.size >= 12 },
    { id: 3, title: 'Full Alphabet',     desc: 'Mastered all 24 FSL letters',           icon: Award,    xp: 500, earned: completedLetters.size >= 24 },
    { id: 4, title: 'Perfect Week',      desc: 'Attended all 5 weekdays this week',     icon: Calendar, xp: 150, earned: weekDays.filter(d => ['Mon','Tue','Wed','Thu','Fri'].includes(d.label) && d.attended).length >= 5 },
    { id: 5, title: 'Week Streak',       desc: '7-day attendance streak',               icon: Flame,    xp: 100, earned: streak >= 7 },
    { id: 6, title: 'High Scorer',       desc: 'Score 500+ points in FSL Games',        icon: Target,   xp: 300, earned: highScore >= 500 },
  ];

  // ── Compact horizontal stat cards ──────────────────────────────────────────
  const statCards = [
    {
      icon: BookOpen, label: 'FSL Progress',
      value: `${fslPct}%`,
      sub: `${completedLetters.size} of ${FSL_LETTERS.length} letters`,
      iconBg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
      iconColor: 'text-[#7B1113] dark:text-[#E8C96A]',
      valueColor: 'text-[#7B1113] dark:text-[#E8C96A]',
    },
    {
      icon: Calendar, label: 'Attendance Rate',
      value: dataLoading ? '…' : `${Math.round(attendanceRate)}%`,
      sub: dataLoading ? 'Loading…' : `${presentDays} of ${totalDays} days`,
      iconBg: 'bg-emerald-100 dark:bg-green-500/10',
      iconColor: 'text-emerald-600 dark:text-green-400',
      valueColor: 'text-emerald-600 dark:text-green-400',
    },
    {
      icon: Flame, label: 'Current Streak',
      value: dataLoading ? '…' : `${streak} days`,
      sub: streak > 0 ? 'Keep it going! 🔥' : 'Start attending!',
      iconBg: 'bg-orange-100 dark:bg-orange-500/10',
      iconColor: 'text-orange-500 dark:text-orange-400',
      valueColor: 'text-orange-500 dark:text-orange-400',
    },
    {
      icon: Star, label: 'Total XP',
      value: totalXP.toLocaleString(),
      sub: `${achievements.filter(a => a.earned).length} achievements earned`,
      iconBg: 'bg-yellow-100 dark:bg-yellow-500/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      valueColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Progress</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Track your FSL learning and attendance milestones
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* ── Compact Horizontal Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {statCards.map(({ icon: Icon, label, value, sub, iconBg, iconColor, valueColor }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200"
            >
              {/* ✅ Horizontal layout — icon left, text right, NO blank space */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-500 dark:text-gray-400 text-sm">{label}</p>
                  <h3 className={`text-2xl font-bold mt-0.5 ${valueColor}`}>{value}</h3>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 truncate">{sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Weekly Activity + This Week ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Weekly FSL Activity
            </h2>
            {dataLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3 h-40">
                  {weekDays.map(({ label, fsl }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                        {fsl > 0 ? fsl : ''}
                      </span>
                      <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                        {/* ✅ Maroon bars, not purple */}
                        <div
                          className="w-full bg-[#7B1113] dark:bg-[#9B2020] rounded-t-md transition-all duration-500 hover:bg-[#9B2020]"
                          style={{
                            height:    fsl > 0 ? `${(fsl / maxBarFSL) * 100}%` : '4px',
                            minHeight: fsl > 0 ? '8px' : '4px',
                            opacity:   fsl > 0 ? 1 : 0.2,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-4 text-center">
                  Letters practiced per day this week
                </p>
              </>
            )}
          </div>

          {/* This Week Sidebar */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">This Week</h2>
            {dataLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-5 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {weekDays.map(({ label, fsl, attended }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300 w-8">
                      {label}
                    </span>
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        attended ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-gray-700'
                      }`} />
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        {/* ✅ Maroon mini-bars */}
                        <div
                          className="h-full bg-[#7B1113] dark:bg-[#9B2020] rounded-full transition-all duration-500"
                          style={{ width: fsl > 0 ? `${(fsl / maxBarFSL) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-gray-500 w-14 text-right">
                      {fsl > 0 ? `${fsl} signs` : 'none'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-gray-800 flex items-center gap-4 text-xs text-slate-400 dark:text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Attended
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-full bg-[#7B1113]" /> FSL signs
              </div>
            </div>
          </div>
        </div>

        {/* ── FSL Alphabet Progress ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                FSL Alphabet Progress
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                {completedLetters.size} of {FSL_LETTERS.length} letters mastered
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#7B1113] dark:text-[#E8C96A]">
                {fslPct}%
              </span>
              <p className="text-xs text-slate-400 dark:text-gray-500">complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mb-6">
            <div
              className="bg-[#7B1113] h-2 rounded-full transition-all duration-700"
              style={{ width: `${fslPct}%` }}
            />
          </div>

          {/* Letter grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {FSL_LETTERS.map((letter) => {
              const done = completedLetters.has(letter);
              return (
                <div
                  key={letter}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                    done
                      ? 'bg-[#7B1113] text-white shadow-md shadow-[#7B1113]/30'
                      : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500'
                  }`}
                >
                  {letter}
                  {done && <CheckCircle className="w-3 h-3 mt-0.5 opacity-80" />}
                </div>
              );
            })}
            {/* J and Z locked */}
            {['J', 'Z'].map((letter) => (
              <div
                key={letter}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold bg-slate-50 dark:bg-gray-900 text-slate-300 dark:text-gray-600 border-2 border-dashed border-slate-200 dark:border-gray-700"
              >
                {letter}
                <Lock className="w-3 h-3 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Achievements ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(({ id, title, desc, icon: Icon, earned, xp }) => (
              <div
                key={id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  earned
                    ? 'bg-[#7B1113]/5 dark:bg-[#7B1113]/10 border-[#7B1113]/20 dark:border-[#7B1113]/30'
                    : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 opacity-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  earned
                    ? 'bg-[#7B1113] text-white shadow-md shadow-[#7B1113]/30'
                    : 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm ${
                      earned
                        ? 'text-[#7B1113] dark:text-[#E8C96A]'
                        : 'text-slate-500 dark:text-gray-400'
                    }`}>
                      {title}
                    </p>
                    <span className={`text-xs font-bold shrink-0 ${
                      earned
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-slate-400 dark:text-gray-500'
                    }`}>
                      +{xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  {earned && (
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Earned
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}