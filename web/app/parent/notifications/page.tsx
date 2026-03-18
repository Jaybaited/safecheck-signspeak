'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Megaphone, CheckCircle, Clock,
  Calendar, BookOpen, Users, Filter,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

interface Child {
  id: string; firstName: string; lastName: string; gradeLevel: string | null;
}

interface Notification {
  id: string;
  type: 'announcement' | 'attendance' | 'fsl' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  from?: string;
}

const sampleChild: Child = {
  id: 'child-1', firstName: 'Ana', lastName: 'Dela Cruz', gradeLevel: 'GRADE_8',
};

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id:'1',  type:'attendance',    title:'Ana checked in',                  message:'Ana tapped her RFID card at 7:45 AM. She is marked as Present.',                                      time:'Today, 7:45 AM',    read:false },
  { id:'2',  type:'announcement',  title:'FSL Quiz this Friday',            message:'There will be an FSL alphabet quiz this Friday. Students should practice letters A to M using the app.',time:'Yesterday, 2:30 PM', read:false, from:'Mr. Santos' },
  { id:'3',  type:'fsl',           title:'New letters completed!',          message:'Ana completed letters O and P in FSL learning. Great progress!',                                        time:'Yesterday, 4:00 PM', read:true },
  { id:'4',  type:'announcement',  title:'Parent-Teacher Meeting',          message:'A parent-teacher conference is scheduled for March 20 at 3:00 PM. Kindly confirm your attendance.',    time:'2 days ago',         read:true,  from:'Mr. Santos' },
  { id:'5',  type:'attendance',    title:'Ana was absent',                  message:'Ana did not check in today (March 6). Please contact the school if this is unexpected.',               time:'Mar 6, 8:30 AM',     read:true },
  { id:'6',  type:'fsl',           title:'🔥 9-day streak achieved!',       message:'Ana has been practicing FSL for 9 consecutive days. Keep encouraging her!',                            time:'Mar 5, 6:00 PM',     read:true },
  { id:'7',  type:'announcement',  title:'No Classes on March 25',          message:'There will be no classes on March 25 in observance of the holiday.',                                   time:'Mar 4, 4:00 PM',     read:true,  from:'Mr. Santos' },
  { id:'8',  type:'system',        title:'Monthly report available',        message:'The monthly report for February 2026 is now available. Tap to view.',                                  time:'Mar 1, 9:00 AM',     read:true },
];

const typeCfg = {
  announcement: { icon: Megaphone, bg: 'bg-cyan-100 dark:bg-cyan-500/10',     icon_color: 'text-cyan-600 dark:text-cyan-400',     label: 'Announcement' },
  attendance:   { icon: Calendar,  bg: 'bg-emerald-100 dark:bg-green-500/10', icon_color: 'text-emerald-600 dark:text-green-400', label: 'Attendance' },
  fsl:          { icon: BookOpen,  bg: 'bg-purple-100 dark:bg-purple-500/10', icon_color: 'text-purple-600 dark:text-purple-400', label: 'FSL' },
  system:       { icon: Bell,      bg: 'bg-slate-100 dark:bg-gray-800',       icon_color: 'text-slate-500 dark:text-gray-400',    label: 'System' },
};

type FilterType = 'all' | 'announcement' | 'attendance' | 'fsl' | 'system';

export default function ParentNotificationsPage() {
  const [parent, setParent]             = useState<ParentUser | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [filter, setFilter]             = useState<FilterType>('all');
  const router                          = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered     = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const unreadCount  = notifications.filter((n) => !n.read).length;

  if (authLoading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sampleChild} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
              Stay updated on {sampleChild.firstName}&apos;s attendance and learning progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Summary Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {([
            { type: 'announcement', label: 'Announcements', Icon: Megaphone },
            { type: 'attendance',   label: 'Attendance',    Icon: Calendar },
            { type: 'fsl',          label: 'FSL Updates',   Icon: BookOpen },
            { type: 'system',       label: 'System',        Icon: Bell },
          ] as const).map(({ type, label, Icon }) => {
            const count = notifications.filter((n) => n.type === type).length;
            const cfg   = typeCfg[type];
            return (
              <div key={type} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none flex items-center gap-3 transition-colors duration-200">
                <div className={`w-10 h-10 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${cfg.icon_color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Tabs + List */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-gray-800">
            <Filter className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
            {(['all', 'announcement', 'attendance', 'fsl', 'system'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? `All (${notifications.length})` : f}
              </button>
            ))}
          </div>

          {/* Notification Items */}
          <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-gray-500">No notifications in this category</p>
              </div>
            ) : filtered.map((n) => {
              const cfg  = typeCfg[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${
                    !n.read ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.icon_color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold ${n.read ? 'text-slate-700 dark:text-gray-300' : 'text-slate-900 dark:text-white'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap">{n.time}</span>
                        {!n.read && (
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1.5">{n.message}</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.icon_color}`}>
                        {cfg.label}
                      </span>
                      {n.from && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                          <Users className="w-3 h-3" />
                          {n.from}
                        </span>
                      )}
                      {n.read && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                          <Clock className="w-3 h-3" /> Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

