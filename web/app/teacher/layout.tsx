'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar onLogout={handleLogout} />
      {/* Offset main content by sidebar width */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}