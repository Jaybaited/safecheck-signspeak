'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Wifi, FileText,
  BookOpen, Settings, LogOut, Cpu, GraduationCap, KeyRound, ClipboardCheck,
} from 'lucide-react';
import { getPendingResetCount } from '@/lib/api';
import LogoutModal from '@/components/shared/LogoutModal';
import { useSystemStatus } from '@/hooks/useSystemStatus';

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const status = useSystemStatus();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getPendingResetCount();
        setPendingCount(res.count);
      } catch {
        // silently ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  const NAV_ITEMS = [
    { name: 'Dashboard',         href: '/admin/dashboard',          icon: LayoutDashboard, badge: 0            },
    { name: 'Manage Users',      href: '/admin/users',              icon: Users,           badge: 0            },
    { name: 'RFID Management',   href: '/admin/rfid-management',    icon: Wifi,            badge: 0            },
    { name: 'Reports',           href: '/admin/reports',            icon: FileText,        badge: 0            },
    { name: 'FSL Progress',      href: '/admin/fsl',                icon: BookOpen,        badge: 0            },
    { name: 'Assessment Results', href: '/admin/assessment-results', icon: ClipboardCheck, badge: 0 },
    { name: 'Password Requests', href: '/admin/password-requests',  icon: KeyRound,        badge: pendingCount },
    { name: 'Configuration',     href: '/admin/config',             icon: Settings,        badge: 0            },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50">

        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${isActive ? ACTIVE_CLS : INACTIVE_CLS}`}>
                  <div className="relative shrink-0">
                    <item.icon className="w-4 h-4" />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            System Status
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={'w-1.5 h-1.5 rounded-full ' + (status.api === 'online' ? 'bg-emerald-500 animate-pulse' : status.api === 'offline' ? 'bg-red-500' : 'bg-gray-400')} />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Server: {status.api === 'online' ? 'Online' : status.api === 'offline' ? 'Offline' : 'Checking'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-1.5 h-1.5 rounded-full ' + (status.database === true ? 'bg-emerald-500 animate-pulse' : status.database === false ? 'bg-red-500' : 'bg-gray-400')} />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Database: {status.database === null ? (status.api === 'offline' ? 'Unknown' : 'Checking') : status.database ? 'Connected' : 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-1.5 h-1.5 rounded-full ' + (status.ai === 'online' ? 'bg-emerald-500 animate-pulse' : status.ai === 'checking' ? 'bg-gray-400' : 'bg-red-500')} />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                AI service: {status.ai === 'online' ? 'Online' : status.ai === 'nomodel' ? 'No model' : status.ai === 'offline' ? 'Offline' : 'Checking'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Last tap: {status.lastTapAt ? new Date(status.lastTapAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'none today'}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
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