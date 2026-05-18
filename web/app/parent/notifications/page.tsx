'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import type { ChildInfo, AttendanceRecord } from '@/lib/api';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

interface TapNotification {
  id:        string;
  date:      string;
  timeIn:    string | null;
  timeOut:   string | null;
  timestamp: string;
}

const PLACEHOLDER_CHILD = { id: '', firstName: '—', lastName: '', gradeLevel: null };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getTimestamp = (iso: string, timeIn: string | null): string => {
  const recordDate = new Date(iso);
  const today      = new Date();
  const yesterday  = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const time       = formatTime(timeIn);
  if (recordDate.toDateString() === today.toDateString())
    return time ? `Today, ${time}` : 'Today';
  if (recordDate.toDateString() === yesterday.toDateString())
    return time ? `Yesterday, ${time}` : 'Yesterday';
  return formatDate(iso) + (time ? `, ${time}` : '');
};

const recordToNotification = (r: AttendanceRecord): TapNotification => ({
  id:        r.id,
  date:      formatDate(r.date),
  timeIn:    formatTime(r.timeIn),
  timeOut:   formatTime(r.timeOut),
  timestamp: getTimestamp(r.date, r.timeIn),
});

export default function ParentNotificationsPage() {
  const router = useRouter();
  const [parent,        setParent]        = useState<ParentUser | null>(null);
  const [child,         setChild]         = useState<ChildInfo | null>(null);
  const [notifications, setNotifications] = useState<TapNotification[]>([]);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [dataLoading,   setDataLoading]   = useState(false);
  const [error,         setError]         = useState('');

  const { markRead, markAllRead, getUnreadCount, isRead } = useUnreadCount(parent?.id);

  // Derived — recalculates whenever notifications or readIds change
  const notifIds    = notifications.map((n) => n.id);
  const unreadCount = getUnreadCount(notifIds);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
      setAuthLoading(false);

      setDataLoading(true);
      api.getParentChildren(p.id)
        .then((children) => {
          if (!children.length) return;
          const firstChild = children[0];
          setChild(firstChild);
          return api.getStudentAttendance(firstChild.id)
            .then((records) => setNotifications(records.map(recordToNotification)))
            .catch(() => setError('Failed to load tap events.'));
        })
        .catch(() => setError('Failed to load child data.'))
        .finally(() => setDataLoading(false));
    } catch { router.push('/login'); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/login');
  };

  if (authLoading || !parent) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const sidebarChild = child
    ? { id: child.id, firstName: child.firstName, lastName: child.lastName, gradeLevel: child.gradeLevel }
    : PLACEHOLDER_CHILD;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sidebarChild} unreadCount={unreadCount} />

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
              {child ? `${child.firstName}'s RFID attendance tap events` : 'Loading…'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button
              onClick={() => router.push('/parent/profile')}
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {parent.firstName?.[0]}{parent.lastName?.[0]}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Summary bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-5 py-3 shadow-sm dark:shadow-none flex items-center gap-3">
              <div className="w-9 h-9 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Total Tap Events</p>
                <p className="text-xl font-bold">{notifications.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-5 py-3 shadow-sm dark:shadow-none flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Unread</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead(notifIds)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {dataLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[0,1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-gray-800 rounded-xl" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-gray-400 font-medium">No tap events yet</p>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
                RFID tap records for {child?.firstName ?? 'your child'} will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
              {notifications.map((n) => {
                const read = isRead(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${
                      !read ? 'bg-[#7B1113]/5 dark:bg-[#7B1113]/10' : ''
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      n.timeIn ? 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20' : 'bg-slate-100 dark:bg-gray-800'
                    }`}>
                      <Calendar className={`w-5 h-5 ${n.timeIn ? 'text-[#7B1113] dark:text-[#E8C96A]' : 'text-slate-400 dark:text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1.5">
                        <p className={`text-sm font-semibold ${read ? 'text-slate-700 dark:text-gray-300' : 'text-slate-900 dark:text-white'}`}>
                          {n.timeIn ? `${child?.firstName ?? 'Child'} tapped in` : 'No tap recorded'}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap">{n.timestamp}</span>
                          {!read && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />}
                        </div>
                      </div>
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
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}