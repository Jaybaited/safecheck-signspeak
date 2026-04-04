'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wifi,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'RFID Management', href: '/admin/rfid-management', icon: Wifi },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'FSL Progress', href: '/admin/fsl', icon: BookOpen },
    { name: 'Configuration', href: '/admin/config', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-950 border-r border-slate-200 dark:border-gray-800 flex flex-col text-slate-900 dark:text-slate-200 transition-colors duration-200 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-gray-800 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight transition-colors duration-200">
              Safe<span className="text-cyan-600 dark:text-cyan-400">Check</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 transition-colors duration-200">Admin Panel</p>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-gray-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-800 transition-colors duration-200">
        <div className="text-xs text-slate-500 dark:text-gray-400 mb-3 font-medium uppercase tracking-wider transition-colors duration-200">System Status</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors duration-200">RFID Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors duration-200">AI Service Active</span>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-800 transition-colors duration-200">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg w-full transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}