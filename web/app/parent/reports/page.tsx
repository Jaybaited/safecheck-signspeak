'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileBarChart, Download, Calendar, Clock,
  TrendingUp, Bell, Info,
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

const sampleChild: Child = {
  id: 'child-1', firstName: 'Ana', lastName: 'Dela Cruz', gradeLevel: 'GRADE_8',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Attendance-only report — no FSL assessment data (Phase 2)
const mockReport = {
  attendance: {
    tappedIn: 17,
    noTap: 2,
    total: 20,
    records: [
      { date: 'Mar 12, 2026', timeIn: '07:45',  timeOut: '16:00' },
      { date: 'Mar 11, 2026', timeIn: '07:52',  timeOut: '16:00' },
      { date: 'Mar 10, 2026', timeIn: '08:10',  timeOut: '16:00' },
      { date: 'Mar 9, 2026',  timeIn: '07:48',  timeOut: '16:00' },
      { date: 'Mar 6, 2026',  timeIn: '—',      timeOut: '—'     },
    ],
  },
};

export default function ParentReportsPage() {
  const [parent, setParent]               = useState<ParentUser | null>(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating]   = useState(false);
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsGenerating(false);
  };

  if (authLoading || !parent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tapRate = Math.round((mockReport.attendance.tappedIn / mockReport.attendance.total) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sampleChild} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {sampleChild.firstName}&apos;s monthly attendance report
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

        {/* Phase 2 Notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl mb-6">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Attendance Reports Only</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
              FSL assessment reports will be available in Phase 2. Currently, you can export your child&apos;s attendance tap records (Date, Time In, Time Out).
            </p>
          </div>
        </div>

        {/* Report Config */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 mb-8 shadow-sm dark:shadow-none transition-colors duration-200">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Select Report Period</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors"
              >
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <FileBarChart className="w-4 h-4" />
                }
                {isGenerating ? 'Loading...' : 'View Report'}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <p className="text-lg font-bold text-slate-700 dark:text-gray-300 mb-6">
          {MONTHS[selectedMonth]} {selectedYear} — {sampleChild.firstName} {sampleChild.lastName}
        </p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Calendar,
              label: 'Days Tapped In',
              value: mockReport.attendance.tappedIn,
              color: 'text-[#7B1113] dark:text-[#E8C96A]',
              iconCls: 'text-[#7B1113] dark:text-[#E8C96A]',
              bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
            },
            {
              icon: Clock,
              label: 'No Tap Days',
              value: mockReport.attendance.noTap,
              color: 'text-slate-500 dark:text-gray-400',
              iconCls: 'text-slate-400 dark:text-gray-500',
              bg: 'bg-slate-100 dark:bg-gray-800',
            },
            {
              icon: TrendingUp,
              label: 'Tap-In Rate',
              value: `${tapRate}%`,
              color: 'text-[#7B1113] dark:text-[#E8C96A]',
              iconCls: 'text-[#7B1113] dark:text-[#E8C96A]',
              bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
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

        {/* Tap Rate Bar + Records Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Tap-In Rate</h3>
            <div className="space-y-5">
              {[
                {
                  label: 'Tapped In',
                  value: mockReport.attendance.tappedIn,
                  total: mockReport.attendance.total,
                  bar: 'bg-[#7B1113]',
                  text: 'text-[#7B1113] dark:text-[#E8C96A]',
                },
                {
                  label: 'No Tap',
                  value: mockReport.attendance.noTap,
                  total: mockReport.attendance.total,
                  bar: 'bg-slate-300 dark:bg-gray-600',
                  text: 'text-slate-500 dark:text-gray-400',
                },
              ].map(({ label, value, total, bar, text }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-gray-300">{label}</span>
                    <span className={`font-bold ${text}`}>{value} days</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all duration-700`}
                      style={{ width: `${(value / total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                    {Math.round((value / total) * 100)}% of school days
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-gray-800 text-center">
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Overall Tap Rate</p>
              <p className="text-4xl font-bold text-[#7B1113] dark:text-[#E8C96A]">{tapRate}%</p>
              <div className="w-full h-3 bg-slate-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#7B1113] rounded-full transition-all duration-700"
                  style={{ width: `${tapRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Records Table — Date, Time In, Time Out only */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Tap Records</h3>
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
                  {mockReport.attendance.records.map((r, i) => (
                    <tr
                      key={i}
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
                          <span className="text-sm text-slate-500 dark:text-gray-400">{r.timeIn}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{r.timeOut}</span>
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
