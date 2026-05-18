// components/student/StudentSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link                    from 'next/link';
import { usePathname }         from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  TrendingUp,
  User,
  LogOut,
  Wifi,
  GraduationCap,
  Gamepad2,
  ClipboardList,
  Megaphone,
  ChevronDown,
  Hand,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface StudentSidebarProps {
  onLogout: () => void;
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
}

// ── Nav config ─────────────────────────────────────────────────────────────
const TOP_NAV = [
  { name: 'Dashboard',     href: '/student/dashboard',     icon: LayoutDashboard },
  { name: 'My Attendance', href: '/student/attendance',    icon: Calendar        },
  { name: 'Announcements', href: '/student/announcements', icon: Megaphone       },
];

const BOTTOM_NAV = [
  { name: 'Profile', href: '/student/profile', icon: User },
];

const FSL_GROUP = {
  label:    'FSL & Progress',
  icon:     Hand,
  children: [
    { name: 'FSL Learning', href: '/student/fsl',      icon: BookOpen      },
    { name: 'FSL Games',    href: '/student/games',    icon: Gamepad2      },
    { name: 'FSL Assessment',  href: '/student/quiz',     icon: ClipboardList },
    { name: 'My Progress',  href: '/student/progress', icon: TrendingUp    },
  ],
};

const FSL_HREFS = FSL_GROUP.children.map((c) => c.href);

// ── Brand color classes — centralised so future updates are a 1-line change
// Active item:  maroon bg tint + maroon text (light) / gold text (dark)
const ACTIVE_CLS =
  'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A]';
const INACTIVE_CLS =
  'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white';

// ── Helpers ────────────────────────────────────────────────────────────────
function formatGradeLevel(gradeLevel: string | null) {
  if (!gradeLevel) return 'Not Set';
  return gradeLevel.replace('GRADE_', 'Grade ');
}

// ── Component ──────────────────────────────────────────────────────────────
export default function StudentSidebar({ onLogout, student }: StudentSidebarProps) {
  const pathname   = usePathname();
  const isFslActive = FSL_HREFS.includes(pathname);
  const [fslOpen, setFslOpen] = useState(isFslActive);

  useEffect(() => {
    if (isFslActive) setFslOpen(true);
  }, [isFslActive]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {/* Brand gradient: maroon tones instead of cyan-purple */}
          <div className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#5A0A0A] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Safe<span className="text-[#7B1113] dark:text-[#E8C96A]">Check</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Student Portal</p>
          </div>
        </div>
      </div>

    

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto p-4 space-y-1"
        aria-label="Student navigation"
      >
        {/* Top flat items */}
        {TOP_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? ACTIVE_CLS : INACTIVE_CLS
              }`}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
              </div>
            </Link>
          );
        })}

        {/* ── FSL Collapsible ─────────────────────────────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setFslOpen((o) => !o)}
            aria-expanded={fslOpen}
            aria-controls="fsl-submenu"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isFslActive ? ACTIVE_CLS : INACTIVE_CLS
            }`}
          >
            <FSL_GROUP.icon className="w-5 h-5 shrink-0" />
            <span className={`flex-1 text-left ${isFslActive ? 'font-medium' : ''}`}>
              {FSL_GROUP.label}
            </span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                fslOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {/* Animated submenu */}
          <div
            id="fsl-submenu"
            className="overflow-hidden transition-all duration-200 ease-in-out"
            style={{ maxHeight: fslOpen ? `${FSL_GROUP.children.length * 56}px` : '0px' }}
          >
            <div className="mt-1 ml-4 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
              {FSL_GROUP.children.map((child) => {
                const isActive = pathname === child.href;
                return (
                  <Link key={child.name} href={child.href}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive ? ACTIVE_CLS : INACTIVE_CLS
                    }`}>
                      <child.icon className="w-4 h-4 shrink-0" />
                      <span className={isActive ? 'font-medium' : ''}>{child.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom flat items */}
        {BOTTOM_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? ACTIVE_CLS : INACTIVE_CLS
              }`}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── RFID Status ───────────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">RFID Status</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">Card Active</span>
        </div>
      </div>

      {/* ── Logout ────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
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
