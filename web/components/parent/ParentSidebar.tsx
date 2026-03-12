'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, BookOpen,
  FileBarChart, Bell, LogOut, Wifi,
  ChevronRight, User, GraduationCap,
} from 'lucide-react';

interface ParentUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
}

interface Props {
  onLogout: () => void;
  parent: ParentUser;
  child?: Child | null;
}

const navigation = [
  { name: 'Dashboard',       href: '/parent/dashboard',    icon: LayoutDashboard },
  { name: 'Attendance',      href: '/parent/attendance',   icon: Calendar },
  { name: 'FSL Progress',    href: '/parent/fsl-progress', icon: BookOpen },
  { name: 'Reports',         href: '/parent/reports',      icon: FileBarChart },
  { name: 'Notifications',   href: '/parent/notifications',icon: Bell },
];

const formatGrade = (gl: string | null) => gl ? gl.replace('GRADE_', 'Grade ') : 'N/A';

export default function ParentSidebar({ onLogout, parent, child }: Props) {
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
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">SafeCheck</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Parent Portal</p>
          </div>
        </div>
      </div>

      {/* Child Card */}
      {child && (
        <div className="mx-4 mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
          <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mb-1.5">Viewing child:</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {child.firstName[0]}{child.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {child.firstName} {child.lastName}
              </p>
              <div className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                <p className="text-xs text-slate-500 dark:text-gray-400">{formatGrade(child.gradeLevel)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
        {navigation.map(({ name, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
              }`}>
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300'}`} />
              <span className="flex-1">{name}</span>
              {active && <ChevronRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
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

        {/* Parent Info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0">
            {parent.firstName[0]}{parent.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {parent.firstName} {parent.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400">Parent</p>
          </div>
          <Link href="/parent/profile"
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
