'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  TrendingUp,
  User,
  LogOut,
  Wifi,
  GraduationCap,
  Gamepad2,
  ClipboardList,
  Megaphone,
} from 'lucide-react';

interface StudentSidebarProps {
  onLogout: () => void;
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
}

const navigation = [
  { name: 'Dashboard',     href: '/student/dashboard',  icon: LayoutDashboard },
  { name: 'My Attendance', href: '/student/attendance', icon: Calendar },
  { name: 'FSL Learning',  href: '/student/fsl',        icon: BookOpen },
  { name: 'FSL Games',     href: '/student/games',      icon: Gamepad2 },   // ← new
  { name: 'FSL Quizzes',   href: '/student/quiz',       icon: ClipboardList }, // ← new
  { name: 'Announcements',   href: '/student/announcements',  icon: Megaphone },
  { name: 'My Progress',   href: '/student/progress',   icon: TrendingUp },
  { name: 'Profile',       href: '/student/profile',    icon: User },
];


function formatGradeLevel(gradeLevel: string | null) {
  if (!gradeLevel) return 'Not Set';
  return gradeLevel.replace('GRADE_', 'Grade ');
}

export default function StudentSidebar({ onLogout, student }: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Safe<span className="text-purple-600 dark:text-purple-400">Check</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatGradeLevel(student.gradeLevel)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}>
                <item.icon className="w-5 h-5" />
                <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* RFID Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">RFID Status</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">Card Active</span>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
