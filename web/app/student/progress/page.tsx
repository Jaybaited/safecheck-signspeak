'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, BookOpen, Calendar, Award,
  Flame, CheckCircle, Lock, Star, Target,
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

const FSL_LETTERS = [
  'A','B','C','D','E','F','G','H','I',
  'K','L','M','N','O','P','Q','R','S',
  'T','U','V','W','X','Y',
];

// Sample data — replace with real API calls
const sampleProgress = {
  streak:          7,
  totalXP:         1240,
  completedLetters: new Set(['A','B','C','D','E','F','G','H','I','K','L','M','N','O']),
  attendanceRate:  95,
  presentDays:     114,
  totalDays:       120,
  weeklyActivity: [
    { day: 'Mon', fsl: 4, attendance: 1 },
    { day: 'Tue', fsl: 6, attendance: 1 },
    { day: 'Wed', fsl: 2, attendance: 1 },
    { day: 'Thu', fsl: 8, attendance: 1 },
    { day: 'Fri', fsl: 5, attendance: 1 },
    { day: 'Sat', fsl: 3, attendance: 0 },
    { day: 'Sun', fsl: 0, attendance: 0 },
  ],
  achievements: [
    { id: 1, title: 'First Sign',       desc: 'Completed your first FSL letter',    icon: Star,    earned: true,  xp: 50  },
    { id: 2, title: 'Half the Alphabet',desc: 'Completed 12 letters',               icon: BookOpen, earned: true, xp: 200 },
    { id: 3, title: 'Perfect Week',     desc: 'Attended all 5 days in a week',      icon: Calendar, earned: true, xp: 150 },
    { id: 4, title: 'Week Streak',      desc: '7-day learning streak',              icon: Flame,    earned: true, xp: 100 },
    { id: 5, title: 'Full Alphabet',    desc: 'Complete all 24 FSL letters',        icon: Award,    earned: false, xp: 500 },
    { id: 6, title: 'Perfect Month',    desc: 'Full attendance for an entire month',icon: Target,   earned: false, xp: 300 },
  ],
};

export default function StudentProgressPage() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router                    = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/'); return; }
      setUser(parsedUser);
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fslPct        = Math.round((sampleProgress.completedLetters.size / FSL_LETTERS.length) * 100);
  const maxBarFSL     = Math.max(...sampleProgress.weeklyActivity.map((d) => d.fsl), 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Progress</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Track your FSL learning and attendance milestones
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: BookOpen,
              label: 'FSL Progress',
              value: `${fslPct}%`,
              sub: `${sampleProgress.completedLetters.size} of ${FSL_LETTERS.length} letters`,
              color: 'text-purple-600 dark:text-purple-400',
              iconCls: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-100 dark:bg-purple-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
            {
              icon: Calendar,
              label: 'Attendance Rate',
              value: `${sampleProgress.attendanceRate}%`,
              sub: `${sampleProgress.presentDays} of ${sampleProgress.totalDays} days`,
              color: 'text-emerald-600 dark:text-green-400',
              iconCls: 'text-emerald-600 dark:text-green-400',
              bg: 'bg-emerald-100 dark:bg-green-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
            {
              icon: Flame,
              label: 'Current Streak',
              value: `${sampleProgress.streak} days`,
              sub: 'Keep it going! 🔥',
              color: 'text-orange-500 dark:text-orange-400',
              iconCls: 'text-orange-500 dark:text-orange-400',
              bg: 'bg-orange-100 dark:bg-orange-500/10',
              trend: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            },
            {
              icon: Star,
              label: 'Total XP',
              value: sampleProgress.totalXP.toLocaleString(),
              sub: `${sampleProgress.achievements.filter((a) => a.earned).length} achievements earned`,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Activity Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Weekly FSL Activity</h2>
            <div className="flex items-end gap-3 h-40">
              {sampleProgress.weeklyActivity.map(({ day, fsl }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                    {fsl > 0 ? fsl : ''}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                    <div
                      className="w-full bg-purple-500 dark:bg-purple-600 rounded-t-md transition-all duration-500 hover:bg-purple-600 dark:hover:bg-purple-500"
                      style={{ height: `${fsl > 0 ? (fsl / maxBarFSL) * 100 : 4}%`, minHeight: fsl > 0 ? '8px' : '4px', opacity: fsl > 0 ? 1 : 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-gray-400">{day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-4 text-center">
              Letters practiced per day this week
            </p>
          </div>

          {/* Streak & Attendance Summary */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">This Week</h2>

            <div className="space-y-4">
              {sampleProgress.weeklyActivity.map(({ day, fsl, attendance }) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-gray-300 w-8">{day}</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    {/* Attendance dot */}
                    <div className={`w-2 h-2 rounded-full ${
                      attendance ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-gray-700'
                    }`} />
                    {/* FSL bar */}
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${fsl > 0 ? (fsl / maxBarFSL) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 dark:text-gray-500 w-12 text-right">
                      {fsl > 0 ? `${fsl} signs` : 'none'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-gray-800 flex items-center gap-4 text-xs text-slate-400 dark:text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Attended
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-full bg-purple-500" />
                FSL signs
              </div>
            </div>
          </div>
        </div>

        {/* FSL Alphabet Map */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">FSL Alphabet Progress</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                {sampleProgress.completedLetters.size} of {FSL_LETTERS.length} letters mastered
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{fslPct}%</span>
              <p className="text-xs text-slate-400 dark:text-gray-500">complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mb-6">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${fslPct}%` }}
            />
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {FSL_LETTERS.map((letter) => {
              const done = sampleProgress.completedLetters.has(letter);
              return (
                <div
                  key={letter}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                    done
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500'
                  }`}
                >
                  {letter}
                  {done && <CheckCircle className="w-3 h-3 mt-0.5 opacity-80" />}
                </div>
              );
            })}
            {['J','Z'].map((letter) => (
              <div key={letter}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold bg-slate-50 dark:bg-gray-900 text-slate-300 dark:text-gray-600 border-2 border-dashed border-slate-200 dark:border-gray-700">
                {letter}
                <Lock className="w-3 h-3 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleProgress.achievements.map(({ id, title, desc, icon: Icon, earned, xp }) => (
              <div
                key={id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  earned
                    ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'
                    : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 opacity-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  earned
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                    : 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm ${
                      earned ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500 dark:text-gray-400'
                    }`}>
                      {title}
                    </p>
                    <span className={`text-xs font-bold shrink-0 ${
                      earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-gray-500'
                    }`}>
                      +{xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  {earned && (
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Earned</span>
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
