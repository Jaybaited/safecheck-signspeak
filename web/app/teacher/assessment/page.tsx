'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Construction } from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface TeacherUser {
  id: string; username: string; role: string; firstName: string; lastName: string;
}

export default function TeacherAssessmentPage() {
  const router = useRouter();
  const [teacher, setTeacher]         = useState<TeacherUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as TeacherUser;
      if (parsed.role !== 'TEACHER') { router.push('/login'); return; }
      setTeacher(parsed);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (authLoading || !teacher) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <TeacherSidebar onLogout={handleLogout} />
      <main className="ml-64 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Assessment</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              FSL quiz and assessment management for your class.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => router.push('/teacher/profile')}
              aria-label="View profile"
              title="My Profile"
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {teacher.firstName?.[0] ?? 'T'}{teacher.lastName?.[0] ?? ''}
            </button>
          </div>
        </div>

        {/* Under Development Card */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none p-16 flex flex-col items-center text-center max-w-lg w-full transition-colors duration-200">

            <div className="relative mb-8">
              <div className="w-24 h-24 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-2xl flex items-center justify-center">
                <FlaskConical className="w-12 h-12 text-[#7B1113] dark:text-[#E8C96A]" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                <Construction className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Page under development..
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              The Assessment feature is part of{' '}
              <span className="font-semibold text-[#7B1113] dark:text-[#E8C96A]">Phase 2</span>{' '}
              of SafeCheck–SignSpeak. It will allow you to create FSL quizzes, track
              student scores, and generate assessment reports for your class.
            </p>

            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full">
              <Construction className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Coming in Phase 2
              </span>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}