'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import { logout } from '@/lib/auth';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    logout();
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