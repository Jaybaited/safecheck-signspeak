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
} from 'lucide-react';

interface StudentSidebarProps {
  onLogout: () => void;
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
}

export default function StudentSidebar({ onLogout, student }: StudentSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Attendance', href: '/student/attendance', icon: Calendar },
    { name: 'FSL Learning', href: '/student/fsl', icon: BookOpen },
    { name: 'My Progress', href: '/student/progress', icon: TrendingUp },
    { name: 'Profile', href: '/student/profile', icon: User },
  ];

  const formatGradeLevel = (gradeLevel: string | null) => {
    if (!gradeLevel) return 'Not Set';
    return gradeLevel.replace('GRADE_', 'Grade ');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold">
              Safe<span className="text-cyan-400">Check</span>
            </h2>
            <p className="text-xs text-gray-400">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-gray-400">
              {formatGradeLevel(student.gradeLevel)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className={isActive ? 'font-medium' : ''}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* RFID Status */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400 mb-2">RFID Status</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-sm text-green-400">Card Active</span>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
