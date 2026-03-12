'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, BookOpen, ClipboardCheck,
  FileBarChart, Megaphone, LogOut, Wifi, ChevronRight, User,
} from 'lucide-react';

interface TeacherUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  section?: string | null;
}

interface Props {
  onLogout: () => void;
  teacher: TeacherUser;
}

const navigation = [
  { name: 'Dashboard',       href: '/teacher/dashboard',      icon: LayoutDashboard },
  { name: 'Attendance Logs', href: '/teacher/attendance',     icon: Calendar },
  { name: 'Mark Attendance', href: '/teacher/mark-attendance',icon: ClipboardCheck },
  { name: 'FSL Progress',    href: '/teacher/fsl-progress',   icon: BookOpen },
  { name: 'Reports',         href: '/teacher/reports',        icon: FileBarChart },
  { name: 'Announcements',   href: '/teacher/announcements',  icon: Megaphone },
];

export default function TeacherSidebar({ onLogout, teacher }: Props) {
  const pathname = usePathname();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col z-40 transition-colors duration-200 shadow-sm dark:shadow-none">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">SafeCheck</h1>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map(({ name, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
              }`}>
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300'}`} />
              <span className="flex-1">{name}</span>
              {active && <ChevronRight className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-800 space-y-3">
        {/* Clock */}
        <div className="px-3 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-wider">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Teacher Info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0">
            {teacher.firstName[0]}{teacher.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {teacher.firstName} {teacher.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
              {teacher.section ? `Section ${teacher.section}` : 'Teacher'}
            </p>
          </div>
          <Link href="/teacher/profile"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
            <User className="w-4 h-4 text-slate-400 dark:text-gray-500" />
          </Link>
        </div>

        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
