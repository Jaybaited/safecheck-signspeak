'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Play, CheckCircle, Clock, RotateCcw, ClipboardList } from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import { getMyLevels, LevelCard } from '@/lib/assessments-api';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

const BTN = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors';
const BTN_PRIMARY = BTN + ' bg-[#7B1113] hover:bg-[#9B2020] text-white';

export default function AssessmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [levels, setLevels] = useState<LevelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLevels(await getMyLevels());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the levels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const action = (l: LevelCard) => {
    switch (l.state) {
      case 'LOCKED':
        return (
          <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
            <Lock className="w-5 h-5" /> Pass Level {l.level - 1} to unlock this level.
          </div>
        );
      case 'AVAILABLE':
        return <Link href={`/student/assessment/${l.id}`} className={BTN_PRIMARY}><Play className="w-5 h-5" /> Start</Link>;
      case 'IN_PROGRESS':
        return <Link href={`/student/assessment/${l.id}`} className={BTN_PRIMARY}><Play className="w-5 h-5" /> Continue</Link>;
      case 'AWAITING_REVIEW':
        return (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="w-5 h-5" /> Waiting for school staff to check your answers.
            </span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-red-600 dark:text-red-400 font-medium">
              Not passed{l.score != null ? ` (${l.score}%)` : ''}. You need {l.passMark}%.
            </span>
            <Link href={`/student/assessment/${l.id}`} className={BTN_PRIMARY}><RotateCcw className="w-5 h-5" /> Try again</Link>
          </div>
        );
      case 'PASSED':
        return (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle className="w-5 h-5" /> Passed{l.score != null ? ` (${l.score}%)` : ''}
            </span>
            <Link href={`/student/assessment/${l.id}`} className={BTN + ' border border-slate-300 dark:border-gray-700'}>See result</Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 flex flex-col p-6 gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Watch the lesson, then answer the questions. Pass a level to open the next one.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : levels.length === 0 && !error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-500 dark:text-gray-400">
            <ClipboardList className="w-10 h-10" />
            <p>No assessments are available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {levels.map((l) => (
              <div
                key={l.id}
                className={`bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col gap-4 ${l.state === 'LOCKED' ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#7B1113] dark:text-[#E8C96A]">Level {l.level}</p>
                    <h2 className="text-xl font-bold">{l.title}</h2>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
                    {l.questionCount} questions
                  </span>
                </div>
                {l.lessonDescription && (
                  <p className="text-slate-600 dark:text-gray-300">{l.lessonDescription}</p>
                )}
                <div className="mt-auto pt-2">{action(l)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}