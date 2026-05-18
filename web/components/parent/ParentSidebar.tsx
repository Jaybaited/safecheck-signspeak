'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, BookOpen,
  FileBarChart, Bell, LogOut, GraduationCap,
  ChevronRight, User,
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
  unreadCount?: number; // passed from parent page so bell badge stays in sync
}

const navigation = [
  { name: 'Dashboard',     href: '/parent/dashboard',    icon: LayoutDashboard },
  { name: 'Attendance',    href: '/parent/attendance',   icon: Calendar },
  { name: 'FSL Progress',  href: '/parent/fsl-progress', icon: BookOpen },
  { name: 'Reports',       href: '/parent/reports',      icon: FileBarChart },
  {
    name: 'Notifications',
    href: '/parent/notifications',
    icon: Bell,
    badge: true, // flag so we can render the unread dot
  },
  { name: 'Profile',       href: '/parent/profile',      icon: User },
];

const formatGrade = (gl: string | null) =>
  gl ? gl.replace('GRADE_', 'Grade ') : 'N/A';

export default function ParentSidebar({ onLogout, parent, child, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col z-40 transition-colors duration-200 shadow-sm dark:shadow-none">
      {/* Logo Block */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Safe<span className="text-[#7B1113] dark:text-[#E8C96A]">Check</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Parent Portal</p>
          </div>
        </div>
      </div>

      {/* Child Card */}
      {child && (
        <div className="mx-4 mt-4 p-3 bg-[#7B1113]/5 dark:bg-[#7B1113]/10 border border-[#7B1113]/20 dark:border-[#7B1113]/30 rounded-xl">
          <p className="text-xs text-[#7B1113] dark:text-[#E8C96A] font-medium mb-1.5">Viewing child:</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
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
        {navigation.map(({ name, href, icon: Icon, badge }) => {
          const active = pathname === href;
          const showBadge = badge && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative shrink-0">
                <Icon
                  className={`w-5 h-5 ${
                    active
                      ? 'text-[#7B1113] dark:text-[#E8C96A]'
                      : 'text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300'
                  }`}
                />
                {/* Unread dot on the bell icon in the sidebar */}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
              <span className="flex-1">{name}</span>
              {/* Badge count next to label */}
              {showBadge && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {active && !showBadge && <ChevronRight className="w-4 h-4 text-[#7B1113] dark:text-[#E8C96A]" />}
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

       
        <button
  onClick={() => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out of your account?'
    );
    if (confirmed) onLogout();
  }}
  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
>
  <LogOut className="w-5 h-5" />
  Sign Out
</button>
      </div>
    </aside>
  );
}