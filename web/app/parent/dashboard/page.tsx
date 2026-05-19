'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Calendar, TrendingUp,
  Clock, ChevronRight, AlertCircle, AlertTriangle,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import type { ChildInfo, AttendanceRecord, AttendanceStats } from '@/lib/api';
import { usePersistedUnreadCount } from '@/hooks/usePersistedUnreadCount';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

const PLACEHOLDER_CHILD = { id: '', firstName: '—', lastName: '', gradeLevel: null };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function ParentDashboardPage() {
  const router = useRouter();
  const [parent,         setParent]         = useState<ParentUser | null>(null);
  const [child,          setChild]          = useState<ChildInfo | null>(null);
  const [records,        setRecords]        = useState<AttendanceRecord[]>([]);
  const [stats,          setStats]          = useState<AttendanceStats | null>(null);
  const [todayRecord,    setTodayRecord]    = useState<AttendanceRecord | null | undefined>(undefined);
  const [loading,        setLoading]        = useState(true);
  const [dataLoading,    setDataLoading]    = useState(false);
  const [error,          setError]          = useState('');

  const unreadCount = usePersistedUnreadCount(parent?.id);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
      setLoading(false);

      setDataLoading(true);
      api.getParentChildren(p.id)
        .then(async (children) => {
          if (!children.length) return;
          const firstChild = children[0];
          setChild(firstChild);
          const [attendance, statsData, todayData] = await Promise.all([
            api.getStudentAttendance(firstChild.id).catch(() => [] as AttendanceRecord[]),
            api.getStudentStats(firstChild.id).catch(() => null),
            api.getTodayAttendance(firstChild.id).catch(() => null),
          ]);
          setRecords(attendance);
          setStats(statsData);
          setTodayRecord(todayData);
        })
        .catch(() => setError('Failed to load child data.'))
        .finally(() => setDataLoading(false));

    } catch { router.push('/login'); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading || !parent) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const recentRecords = records.slice(0, 5);
  const sidebarChild  = child
    ? { id: child.id, firstName: child.firstName, lastName: child.lastName, gradeLevel: child.gradeLevel }
    : PLACEHOLDER_CHILD;

  // ── Item 14: no tap-out warning ──────────────────────────────────────────
  const isPastDismissal    = new Date().getHours() >= 17;
  const showNoTapOutWarning = todayRecord?.timeIn && !todayRecord?.timeOut && isPastDismissal;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sidebarChild} unreadCount={unreadCount} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome, {parent.firstName}!</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {child
                ? `Here's an overview of ${child.firstName}'s attendance today`
                : 'Loading your child\'s data…'}
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

        {/* ── Item 14: No Tap-Out Warning Banner ── */}
        {showNoTapOutWarning && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                ⚠️ {child?.firstName} has not tapped out today
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                {child?.firstName} tapped in at {formatTime(todayRecord?.timeIn)} but no tap-out has been recorded.
                Please verify their whereabouts or contact the school.
              </p>
            </div>
          </div>
        )}

        {/* Today's RFID Tap Banner */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 mb-8 flex items-center gap-5 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="w-14 h-14 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 text-[#7B1113] dark:text-[#E8C96A]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-0.5">Today&apos;s RFID Tap</p>
            {dataLoading ? (
              <div className="h-5 w-56 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : todayRecord?.timeIn ? (
              <>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {child?.firstName} tapped in at{' '}
                  <span className="text-[#7B1113] dark:text-[#E8C96A]">{formatTime(todayRecord.timeIn)}</span>
                </p>
                {todayRecord.timeOut && (
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                    Checked out at {formatTime(todayRecord.timeOut)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xl font-bold text-slate-500 dark:text-gray-400">
                No tap recorded today
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400 dark:text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            {
              icon: Calendar,
              label: 'Attendance Rate',
              value: stats ? `${stats.attendanceRate.toFixed(0)}%` : '—',
              sub: stats ? `${stats.present} of ${stats.totalDays} days` : 'Loading…',
              color: 'text-[#7B1113] dark:text-[#E8C96A]',
              iconCls: 'text-[#7B1113] dark:text-[#E8C96A]',
              bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
            },
            {
              icon: TrendingUp,
              label: 'Days Present',
              value: stats ? stats.present : '—',
              sub: stats ? `${stats.late} late tap${stats.late !== 1 ? 's' : ''}` : 'Loading…',
              color: 'text-emerald-600 dark:text-emerald-400',
              iconCls: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-100 dark:bg-emerald-500/10',
            },
          ].map(({ icon: Icon, label, value, sub, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${iconCls}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A] opacity-60" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <h3 className={`text-3xl font-bold ${color}`}>{dataLoading ? '…' : value}</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* Recent Attendance Table */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Attendance</h2>
            <button
              onClick={() => router.push('/parent/attendance')}
              className="text-[#7B1113] dark:text-[#E8C96A] hover:opacity-80 text-sm font-medium transition-opacity flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {dataLoading ? (
            <div className="space-y-3 animate-pulse">
              {[0,1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-gray-800 rounded-lg" />)}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-gray-400">No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-gray-800">
                  <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                    {['Date', 'Time In', 'Time Out'].map((h) => (
                      <th key={h} className="pb-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          <span className="text-sm text-slate-700 dark:text-gray-300">{formatDate(r.date)}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{formatTime(r.timeIn)}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{formatTime(r.timeOut)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}