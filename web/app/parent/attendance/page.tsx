'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Download,
  ChevronLeft, ChevronRight, Bell,
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

// Only Date, Time In, Time Out — no status field
interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

const sampleChild: Child = {
  id: 'child-1', firstName: 'Ana', lastName: 'Dela Cruz', gradeLevel: 'GRADE_8',
};

const SAMPLE_RECORDS: AttendanceRecord[] = [
  { id: '1',  date: '2026-03-12', timeIn: '07:45', timeOut: '16:00' },
  { id: '2',  date: '2026-03-11', timeIn: '07:52', timeOut: '16:00' },
  { id: '3',  date: '2026-03-10', timeIn: '08:10', timeOut: '16:00' },
  { id: '4',  date: '2026-03-09', timeIn: '07:48', timeOut: '16:00' },
  { id: '5',  date: '2026-03-06', timeIn: null,    timeOut: null    },
  { id: '6',  date: '2026-03-05', timeIn: '07:50', timeOut: '16:00' },
  { id: '7',  date: '2026-03-04', timeIn: '07:44', timeOut: '16:00' },
  { id: '8',  date: '2026-03-03', timeIn: '08:22', timeOut: '16:00' },
  { id: '9',  date: '2026-03-02', timeIn: '07:55', timeOut: '16:00' },
  { id: '10', date: '2026-02-28', timeIn: null,    timeOut: null    },
];

export default function ParentAttendancePage() {
  const [parent, setParent]             = useState<ParentUser | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
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

  const changeMonth = (dir: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const stats = {
    total:   SAMPLE_RECORDS.length,
    tapped:  SAMPLE_RECORDS.filter((r) => r.timeIn !== null).length,
    noTap:   SAMPLE_RECORDS.filter((r) => r.timeIn === null).length,
  };

  if (authLoading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-3xl font-bold mb-1">Attendance History</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {sampleChild.firstName}&apos;s RFID tap records
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              aria-label="Notifications"
              onClick={() => router.push('/parent/notifications')}
              className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => router.push('/parent/profile')}
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {parent.firstName?.[0]}{parent.lastName?.[0]}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Calendar,
              label: 'Total Records',
              value: stats.total,
              color: 'text-slate-900 dark:text-white',
              iconCls: 'text-slate-500 dark:text-gray-400',
              bg: 'bg-slate-100 dark:bg-gray-800',
            },
            {
              icon: Clock,
              label: 'Days Tapped In',
              value: stats.tapped,
              color: 'text-[#7B1113] dark:text-[#E8C96A]',
              iconCls: 'text-[#7B1113] dark:text-[#E8C96A]',
              bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
            },
            {
              icon: Download,
              label: 'No Tap Days',
              value: stats.noTap,
              color: 'text-slate-500 dark:text-gray-400',
              iconCls: 'text-slate-400 dark:text-gray-500',
              bg: 'bg-slate-100 dark:bg-gray-800',
            },
          ].map(({ icon: Icon, label, value, color, iconCls, bg }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200"
            >
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Month</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeMonth('prev')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 w-32 text-center">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => changeMonth('next')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 dark:text-gray-500 font-medium mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d}>{d}</div>
              ))}
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

          {/* Records Table — Date, Time In, Time Out only */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tap Records</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
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
                  {SAMPLE_RECORDS.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          <span className="text-sm text-slate-700 dark:text-gray-300">{r.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          <span className="text-sm text-slate-500 dark:text-gray-400">
                            {r.timeIn ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm text-slate-500 dark:text-gray-400">
                          {r.timeOut ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
