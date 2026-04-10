'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Wifi, FileText,
  BookOpen, Settings, LogOut, Cpu, GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  admin?: {
    firstName?: string;
    lastName?: string;
  };
}

const NAV_ITEMS = [
  { name: 'Dashboard',       href: '/admin/dashboard',       icon: LayoutDashboard },
  { name: 'Manage Users',    href: '/admin/users',           icon: Users           },
  { name: 'RFID Management', href: '/admin/rfid-management', icon: Wifi            },
  { name: 'Reports',         href: '/admin/reports',         icon: FileText        },
  { name: 'FSL Progress',    href: '/admin/fsl',             icon: BookOpen        },
  { name: 'Configuration',   href: '/admin/config',          icon: Settings        },
];

const ACTIVE_CLS =
  'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] font-medium';
const INACTIVE_CLS =
  'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white';

export default function Sidebar({ onLogout, admin }: SidebarProps) {
  const pathname = usePathname();

  return (
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Admin info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-lg text-white select-none shrink-0">
            {admin?.firstName?.[0] ?? 'A'}{admin?.lastName?.[0] ?? ''}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {admin?.firstName ?? 'Admin'} {admin?.lastName ?? ''}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto p-4 space-y-1"
        aria-label="Admin navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? ACTIVE_CLS : INACTIVE_CLS
              }`}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">System Status</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">RFID Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Cpu className="w-3 h-3 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">AI Active</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}