'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Clock, CheckCircle, AlertCircle, AlertTriangle, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import type { ChildInfo } from '@/lib/api';
import { logout } from '@/lib/auth';
import { pickChild } from '@/lib/selected-child';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/hooks/usePersistedUnreadCount';

interface ParentUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface Note {
  id: string;
  message: string;
  sentAt: string;
  status: string;
  type: string;
}

const PLACEHOLDER_CHILD = { id: '', firstName: '', lastName: '', gradeLevel: null };
const REFRESH_MS = 15000;

function when(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today, ' + time;
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday, ' + time;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + time;
}

function kindOf(message: string): 'in' | 'out' | 'warn' {
  const m = message.toLowerCase();
  if (m.includes('not tapped out') || m.includes('no tap')) return 'warn';
  if (m.includes('left the school')) return 'out';
  return 'in';
}

export default function ParentNotificationsPage() {
  const router = useRouter();
  const [parent, setParent] = useState<ParentUser | null>(null);
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = notes.filter((n) => n.status === 'UNREAD').length;

  const load = useCallback((silent = false) => {
    if (!silent) setDataLoading(true);
    api.getMyNotifications()
      .then((list) => { setNotes(list as unknown as Note[]); setError(''); })
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
      setAuthLoading(false);
      api.getParentChildren(p.id)
        .then((children) => { if (children.length) setChild(pickChild(p.id, children) ?? children[0]); })
        .catch(() => {});
      load();
    } catch {
      router.push('/login');
    }
  }, [router, load]);

  useEffect(() => {
    if (!parent) return;
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [parent, load]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const markOne = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target || target.status !== 'UNREAD') return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)));
    api.markNotificationRead(id)
      .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT)))
      .catch(() => load(true));
  };

  const markAll = () => {
    setNotes((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
    api.markAllNotificationsRead()
      .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT)))
      .catch(() => load(true));
  };

  if (authLoading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarChild = child
    ? { id: child.id, firstName: child.firstName, lastName: child.lastName, gradeLevel: child.gradeLevel }
    : PLACEHOLDER_CHILD;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sidebarChild} unreadCount={unreadCount} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full">{unreadCount}</span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              School tap alerts for all your children. Your read marks are saved to your account.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => router.push('/parent/profile')}
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {parent.firstName[0]}{parent.lastName[0]}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-5 py-3 shadow-sm dark:shadow-none flex items-center gap-3">
              <div className="w-9 h-9 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold">{notes.length}</p>
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
              onClick={markAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {dataLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="p-16 text-center">
              <Bell className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-gray-400 font-medium">No notifications yet</p>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
                Alerts appear here when your child taps in or out at school.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
              {notes.map((n) => {
                const unread = n.status === 'UNREAD';
                const kind = kindOf(n.message);
                const Icon = kind === 'warn' ? AlertTriangle : kind === 'out' ? LogOutIcon : LogIn;
                const tone =
                  kind === 'warn'
                    ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A]';
                return (
                  <div
                    key={n.id}
                    onClick={() => markOne(n.id)}
                    className={'flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ' + (unread ? 'bg-[#7B1113]/5 dark:bg-[#7B1113]/10' : '')}
                  >
                    <div className={'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + tone}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={'text-sm ' + (unread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300')}>
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">{when(n.sentAt)}</p>
                    </div>
                    {unread && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 mt-1.5" />}
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