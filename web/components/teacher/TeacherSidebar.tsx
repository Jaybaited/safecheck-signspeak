'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, User, LogOut, GraduationCap } from 'lucide-react';
import LogoutModal from '@/components/shared/LogoutModal';

interface TeacherSidebarProps { onLogout: () => void; }

const NAV_ITEMS = [
  { name: 'Assessment', href: '/teacher/assessment', icon: FlaskConical },
  { name: 'Profile',    href: '/teacher/profile',    icon: User         },
];

const ACTIVE   = 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] font-medium';
const INACTIVE = 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white';

export default function TeacherSidebar({ onLogout }: TeacherSidebarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50">

        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-lg flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Safe<span className="text-[#7B1113] dark:text-[#E8C96A]">Check</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Teacher navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive ? ACTIVE : INACTIVE}`}>
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={() => { setShowLogoutModal(false); onLogout(); }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}