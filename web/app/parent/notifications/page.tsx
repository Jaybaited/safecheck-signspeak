'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, Clock, CheckCircle } from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

interface Child {
  id: string; firstName: string; lastName: string; gradeLevel: string | null;
}

// Only RFID attendance tap events — Date, Time In, Time Out
interface TapNotification {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  timestamp: string; // display label e.g. "Today, 7:45 AM"
  read: boolean;
}

const sampleChild: Child = {
  id: 'child-1', firstName: 'Ana', lastName: 'Dela Cruz', gradeLevel: 'GRADE_8',
};

const INITIAL_NOTIFICATIONS: TapNotification[] = [
  { id: '1', date: 'May 11, 2026',  timeIn: '7:45 AM',  timeOut: '4:00 PM',  timestamp: 'Today, 7:45 AM',    read: false },
  { id: '2', date: 'May 10, 2026',  timeIn: '7:52 AM',  timeOut: '4:00 PM',  timestamp: 'Yesterday, 7:52 AM', read: false },
  { id: '3', date: 'May 9, 2026',   timeIn: '8:10 AM',  timeOut: '4:00 PM',  timestamp: 'May 9, 8:10 AM',    read: true  },
  { id: '4', date: 'May 8, 2026',   timeIn: '7:48 AM',  timeOut: '4:00 PM',  timestamp: 'May 8, 7:48 AM',    read: true  },
  { id: '5', date: 'May 7, 2026',   timeIn: null,        timeOut: null,        timestamp: 'May 7',             read: true  },
  { id: '6', date: 'May 6, 2026',   timeIn: '7:50 AM',  timeOut: '4:00 PM',  timestamp: 'May 6, 7:50 AM',    read: true  },
  { id: '7', date: 'May 5, 2026',   timeIn: '7:44 AM',  timeOut: '4:00 PM',  timestamp: 'May 5, 7:44 AM',    read: true  },
  { id: '8', date: 'May 2, 2026',   timeIn: '8:22 AM',  timeOut: '4:00 PM',  timestamp: 'May 2, 8:22 AM',    read: true  },
];

export default function ParentNotificationsPage() {
  const [parent, setParent]               = useState<ParentUser | null>(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [notifications, setNotifications] = useState<TapNotification[]>(INITIAL_NOTIFICATIONS);
  const router                            = useRouter();

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead    = (id: string) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  if (authLoading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar
        onLogout={handleLogout}
        parent={parent}
        child={sampleChild}
        unreadCount={unreadCount}
      />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {sampleChild.firstName}&apos;s RFID attendance tap events
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {/* Bell with unread indicator */}
            <button
              aria-label="Notifications"
              className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-50 dark:border-gray-950">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/parent/profile')}
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {parent.firstName?.[0]}{parent.lastName?.[0]}
            </button>
          </div>
        </div>

        {/* Summary + Mark all read */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-5 py-3 shadow-sm dark:shadow-none flex items-center gap-3">
              <div className="w-9 h-9 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Total Tap Events</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{notifications.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-5 py-3 shadow-sm dark:shadow-none flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Unread</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {notifications.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-gray-400 font-medium">No tap events yet</p>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
                RFID tap records for {sampleChild.firstName} will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${
                    !n.read ? 'bg-[#7B1113]/5 dark:bg-[#7B1113]/10' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    n.timeIn
                      ? 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20'
                      : 'bg-slate-100 dark:bg-gray-800'
                  }`}>
                    <Calendar className={`w-5 h-5 ${
                      n.timeIn
                        ? 'text-[#7B1113] dark:text-[#E8C96A]'
                        : 'text-slate-400 dark:text-gray-500'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                      <p className={`text-sm font-semibold ${
                        n.read ? 'text-slate-700 dark:text-gray-300' : 'text-slate-900 dark:text-white'
                      }`}>
                        {n.timeIn ? `${sampleChild.firstName} tapped in` : 'No tap recorded'}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap">
                          {n.timestamp}
                        </span>
                        {!n.read && (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Date / Time In / Time Out — all three always shown */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                        <span className="text-sm text-slate-600 dark:text-gray-400">{n.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                        <span className="text-sm text-slate-500 dark:text-gray-400">
                          In: <span className="font-medium text-slate-700 dark:text-gray-300">{n.timeIn ?? '—'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                        <span className="text-sm text-slate-500 dark:text-gray-400">
                          Out: <span className="font-medium text-slate-700 dark:text-gray-300">{n.timeOut ?? '—'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}