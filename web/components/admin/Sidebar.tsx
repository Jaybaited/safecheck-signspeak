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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col text-slate-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xl tracking-tight">
              Safe<span className="text-cyan-400">Check</span>
            </h2>
            <p className="text-xs text-gray-400">Admin Panel</p>
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
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
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

      {/* System Status */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">System Status</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <Wifi className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-slate-300">RFID Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <Cpu className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-slate-300">AI Service Active</span>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}