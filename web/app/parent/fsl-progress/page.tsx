'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, CheckCircle, Lock, TrendingUp,
  Flame, Star, Award, Target,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

interface Child {
  id: string; firstName: string; lastName: string; gradeLevel: string | null;
}

const sampleChild: Child = { id:'child-1', firstName:'Ana', lastName:'Dela Cruz', gradeLevel:'GRADE_8' };

const FSL_LETTERS = ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];

const completedLetters = new Set(['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R']);

const weeklyActivity = [
  { day: 'Mon', count: 4 },
  { day: 'Tue', count: 6 },
  { day: 'Wed', count: 2 },
  { day: 'Thu', count: 8 },
  { day: 'Fri', count: 5 },
  { day: 'Sat', count: 3 },
  { day: 'Sun', count: 0 },
];

const achievements = [
  { title: 'First Sign',        earned: true,  icon: Star,    xp: 50 },
  { title: 'Half the Alphabet', earned: true,  icon: BookOpen, xp: 200 },
  { title: 'Week Streak',       earned: true,  icon: Flame,   xp: 100 },
  { title: 'Full Alphabet',     earned: false, icon: Award,   xp: 500 },
];

export default function ParentFSLProgressPage() {
  const [parent, setParent]         = useState<ParentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router                      = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/'); return; }
      setParent(p);
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (authLoading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pct       = Math.round((completedLetters.size / FSL_LETTERS.length) * 100);
  const maxBar    = Math.max(...weeklyActivity.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sampleChild} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">FSL Progress</h1>
            <p className="text-slate-500 dark:text-gray-400">
              {sampleChild.firstName}&apos;s Filipino Sign Language learning progress
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: BookOpen,   label: 'Letters Mastered', value: `${completedLetters.size}/${FSL_LETTERS.length}`, color: 'text-purple-600 dark:text-purple-400', iconCls: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10', sub: `${pct}% complete` },
            { icon: TrendingUp, label: 'Overall Progress',  value: `${pct}%`,                                       color: 'text-emerald-600 dark:text-green-400', iconCls: 'text-emerald-600 dark:text-green-400', bg: 'bg-emerald-100 dark:bg-green-500/10', sub: 'FSL alphabet' },
            { icon: Flame,      label: 'Current Streak',    value: '9 days',                                        color: 'text-orange-500 dark:text-orange-400', iconCls: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/10', sub: 'Keep it up! 🔥' },
            { icon: Target,     label: 'Achievements',      value: `${achievements.filter((a) => a.earned).length}`, color: 'text-yellow-600 dark:text-yellow-400', iconCls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/10', sub: 'Badges earned' },
          ].map(({ icon: Icon, label, value, sub, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${iconCls}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
              <p className="text-sm text-emerald-600 dark:text-green-400 mt-2 font-medium">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">This Week&apos;s Activity</h2>
            <div className="flex items-end gap-3 h-40">
              {weeklyActivity.map(({ day, count }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                    {count > 0 ? count : ''}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                    <div
                      className="w-full bg-purple-500 dark:bg-purple-600 rounded-t-md transition-all duration-500 hover:bg-purple-600 dark:hover:bg-purple-500"
                      style={{ height: `${count > 0 ? (count / maxBar) * 100 : 4}%`, opacity: count > 0 ? 1 : 0.2, minHeight: count > 0 ? '8px' : '4px' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-gray-400">{day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-4 text-center">
              Number of letters practiced per day
            </p>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Achievements</h2>
            <div className="space-y-3">
              {achievements.map(({ title, earned, icon: Icon, xp }) => (
                <div key={title} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  earned
                    ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'
                    : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 opacity-50'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    earned ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${earned ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500 dark:text-gray-400'}`}>
                      {title}
                    </p>
                    <p className={`text-xs ${earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-gray-500'}`}>
                      +{xp} XP
                    </p>
                  </div>
                  {earned && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alphabet Map */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">FSL Alphabet Map</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                {completedLetters.size} of {FSL_LETTERS.length} letters mastered
              </p>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mb-6">
            <div className="bg-purple-600 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {FSL_LETTERS.map((l) => {
              const done = completedLetters.has(l);
              return (
                <div key={l} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500'
                }`}>
                  {l}
                  {done && <CheckCircle className="w-3 h-3 mt-0.5 opacity-80" />}
                </div>
              );
            })}
            {['J','Z'].map((l) => (
              <div key={l} className="aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold bg-slate-50 dark:bg-gray-900 text-slate-300 dark:text-gray-600 border-2 border-dashed border-slate-200 dark:border-gray-700">
                {l}
                <Lock className="w-3 h-3 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
