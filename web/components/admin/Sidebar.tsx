'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Wifi, FileText,
  BookOpen, Settings, LogOut, Cpu, GraduationCap, KeyRound,
} from 'lucide-react';
import { getPendingResetCount } from '@/lib/api';

interface SidebarProps {
  onLogout: () => void;
  admin?: {
    firstName?: string;
    lastName?: string;
  };
}

const ACTIVE_CLS =
  'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] font-medium';
const INACTIVE_CLS =
  'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white';

export default function Sidebar({ onLogout, admin }: SidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getPendingResetCount();
        setPendingCount(res.count);
      } catch {
        // silently ignore — badge just won't show
      }
    };
    fetchCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  const NAV_ITEMS = [
    { name: 'Dashboard',       href: '/admin/dashboard',         icon: LayoutDashboard, badge: 0            },
    { name: 'Manage Users',    href: '/admin/users',             icon: Users,           badge: 0            },
    { name: 'RFID Management', href: '/admin/rfid-management',   icon: Wifi,            badge: 0            },
    { name: 'Reports',         href: '/admin/reports',           icon: FileText,        badge: 0            },
    { name: 'FSL Progress',    href: '/admin/fsl',               icon: BookOpen,        badge: 0            },
    { name: 'Password Requests', href: '/admin/password-requests', icon: KeyRound,      badge: pendingCount },
    { name: 'Configuration',   href: '/admin/config',            icon: Settings,        badge: 0            },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50">

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
              Safe<span className="text-[#7B1113] dark:text-[#E8C96A]">Check</span>
              <span className="text-gray-400 dark:text-gray-500">·</span>SignSpeak
            </h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                isActive ? ACTIVE_CLS : INACTIVE_CLS
              }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-[#7B1113] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── System Status ────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
          System Status
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400">RFID Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <Cpu className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400">AI Active</span>
          </div>
        </div>
      </div>

      {/* ── Logout ───────────────────────────────────────────────── */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out of your account?'))
              onLogout();
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