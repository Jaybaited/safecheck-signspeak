'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Construction } from 'lucide-react';
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

export default function AssessmentPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 flex flex-col p-6 gap-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Track and complete your assigned assessments
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* ── Under Development ── */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] gap-4">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Under Development</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              This page is currently being built. Check back soon.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}