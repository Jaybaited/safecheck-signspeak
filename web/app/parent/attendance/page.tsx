'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Download,
  ChevronLeft, ChevronRight, Bell, AlertCircle,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import type { ChildInfo, AttendanceRecord } from '@/lib/api';
import { usePersistedUnreadCount } from '@/hooks/usePersistedUnreadCount';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

const PLACEHOLDER_CHILD = { id: '', firstName: '—', lastName: '', gradeLevel: null };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function ParentAttendancePage() {
  const router = useRouter();
  const [parent,        setParent]        = useState<ParentUser | null>(null);
  const [child,         setChild]         = useState<ChildInfo | null>(null);
  const [records,       setRecords]       = useState<AttendanceRecord[]>([]);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [dataLoading,   setDataLoading]   = useState(false);
  const [error,         setError]         = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // ── Bell badge — reads from localStorage, syncs across pages
  const unreadCount = usePersistedUnreadCount(parent?.id);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/login'); return; }
      setParent(p);
      setAuthLoading(false);

      api.getParentChildren(p.id)
        .then((children) => {
          if (!children.length) return;
          const firstChild = children[0];
          setChild(firstChild);
          setDataLoading(true);
          return api.getStudentAttendance(firstChild.id)
            .then(setRecords)
            .catch(() => setError('Failed to load attendance records.'))
            .finally(() => setDataLoading(false));
        })
        .catch(() => setError('Failed to load child data.'));
    } catch { router.push('/login'); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/login');
  };

  const changeMonth = (dir: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const filteredRecords = records.filter((r) => {
    const d = new Date(r.date);
    return (
      d.getFullYear() === selectedMonth.getFullYear() &&
      d.getMonth()    === selectedMonth.getMonth()
    );
  });

  const stats = {
    total:  filteredRecords.length,
    tapped: filteredRecords.filter((r) => r.timeIn).length,
    noTap:  filteredRecords.filter((r) => !r.timeIn).length,
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Time In', 'Time Out'],
      ...filteredRecords.map((r) => [
        formatDate(r.date),
        formatTime(r.timeIn),
        formatTime(r.timeOut),
      ]),
    ];
    const csv  = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `attendance-${selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <h1 className="text-3xl font-bold mb-1">Attendance History</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {child ? `${child.firstName}'s RFID tap records` : 'Loading child data…'}
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Calendar, label: 'Total Records',  value: stats.total,  color: 'text-slate-900 dark:text-white',     iconCls: 'text-slate-500 dark:text-gray-400',   bg: 'bg-slate-100 dark:bg-gray-800' },
            { icon: Clock,    label: 'Days Tapped In', value: stats.tapped, color: 'text-[#7B1113] dark:text-[#E8C96A]', iconCls: 'text-[#7B1113] dark:text-[#E8C96A]', bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20' },
            { icon: Download, label: 'No Tap Days',    value: stats.noTap,  color: 'text-slate-500 dark:text-gray-400',   iconCls: 'text-slate-400 dark:text-gray-500',   bg: 'bg-slate-100 dark:bg-gray-800' },
          ].map(({ icon: Icon, label, value, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${iconCls}`} />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Month Navigator */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Month</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => changeMonth('prev')} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 w-32 text-center">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth('next')} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 dark:text-gray-500 font-medium mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="text-center text-slate-400 dark:text-gray-500 py-8 text-sm">
              Calendar view coming soon
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-gray-800 space-y-2">
              {[
                { color: 'bg-[#7B1113]/20', label: 'Tapped In' },
                { color: 'bg-slate-200 dark:bg-gray-700', label: 'No Tap' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 ${color} rounded`} />
                  <span className="text-slate-500 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Records Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Tap Records</h2>
              <button
                onClick={handleExportCSV}
                disabled={filteredRecords.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {dataLoading ? (
              <div className="space-y-3 animate-pulse">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-gray-800 rounded-lg" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-16 text-center">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-gray-400 font-medium">No records for this month</p>
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
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                            <span className="text-sm text-slate-700 dark:text-gray-300">{formatDate(r.date)}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                            <span className="text-sm text-slate-500 dark:text-gray-400">{formatTime(r.timeIn)}</span>
                          </div>
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
        </div>
      </main>
    </div>
  );
}