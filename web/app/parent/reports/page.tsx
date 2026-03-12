'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileBarChart, Download, Calendar, CheckCircle,
  TrendingUp, BookOpen, AlertCircle, Info,
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

const mockReport = {
  attendance: { present: 17, late: 2, absent: 1, total: 20, rate: 95 },
  fsl:        { progress: 72, lettersCompleted: 17, totalLetters: 24, streak: 9 },
  notes: [
    { type: 'positive', text: 'Consistent early check-ins — arrived before 8:00 AM on 15 out of 17 present days.' },
    { type: 'positive', text: 'Strong FSL progress — completed 17 of 24 letters this month.' },
    { type: 'warning',  text: '1 unexcused absence on March 6. Please coordinate with the teacher.' },
    { type: 'info',     text: 'Participation in FSL games increased by 30% compared to last month.' },
  ],
};

const noteCfg = {
  positive: {
    bg:   'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    icon: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    bg:   'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
    icon: <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />,
    text: 'text-orange-700 dark:text-orange-300',
  },
  info: {
    bg:   'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
    text: 'text-blue-700 dark:text-blue-300',
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
    if (!token || !userData) { router.push('/'); return; }
    try {
      const p = JSON.parse(userData) as ParentUser;
      if (p.role !== 'PARENT') { router.push('/'); return; }
      setParent(p);
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsGenerating(false);
  };

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
            <h1 className="text-3xl font-bold mb-2">Reports</h1>
            <p className="text-slate-500 dark:text-gray-400">
              {sampleChild.firstName}&apos;s monthly performance report
            </p>
          </div>
          <ThemeToggle />
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
                className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              >
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <FileBarChart className="w-4 h-4" />
                }
                {isGenerating ? 'Loading...' : 'View Report'}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Report Title */}
        <p className="text-lg font-bold text-slate-700 dark:text-gray-300 mb-6">
          {MONTHS[selectedMonth]} {selectedYear} — {sampleChild.firstName} {sampleChild.lastName}
        </p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Calendar,    label: 'Attendance Rate',  value: `${mockReport.attendance.rate}%`,
              color: 'text-emerald-600 dark:text-green-400',
              iconCls: 'text-emerald-600 dark:text-green-400',
              bg: 'bg-emerald-100 dark:bg-green-500/10',
            },
            {
              icon: CheckCircle, label: 'Days Present',
              value: `${mockReport.attendance.present}/${mockReport.attendance.total}`,
              color: 'text-slate-900 dark:text-white',
              iconCls: 'text-cyan-600 dark:text-cyan-400',
              bg: 'bg-cyan-100 dark:bg-cyan-500/10',
            },
            {
              icon: BookOpen,    label: 'FSL Progress',     value: `${mockReport.fsl.progress}%`,
              color: 'text-purple-600 dark:text-purple-400',
              iconCls: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-100 dark:bg-purple-500/10',
            },
            {
              icon: TrendingUp,  label: 'Letters Mastered',
              value: `${mockReport.fsl.lettersCompleted}/${mockReport.fsl.totalLetters}`,
              color: 'text-yellow-600 dark:text-yellow-400',
              iconCls: 'text-yellow-600 dark:text-yellow-400',
              bg: 'bg-yellow-100 dark:bg-yellow-500/10',
            },
          ].map(({ icon: Icon, label, value, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${iconCls}`} />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Attendance Breakdown + Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance Breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Attendance Breakdown</h3>
            <div className="space-y-5">
              {[
                {
                  label: 'Present',
                  value: mockReport.attendance.present,
                  total: mockReport.attendance.total,
                  bar: 'bg-emerald-500',
                  text: 'text-emerald-600 dark:text-green-400',
                },
                {
                  label: 'Late',
                  value: mockReport.attendance.late,
                  total: mockReport.attendance.total,
                  bar: 'bg-yellow-500',
                  text: 'text-yellow-600 dark:text-yellow-400',
                },
                {
                  label: 'Absent',
                  value: mockReport.attendance.absent,
                  total: mockReport.attendance.total,
                  bar: 'bg-red-400',
                  text: 'text-red-600 dark:text-red-400',
                },
              ].map(({ label, value, total, bar, text }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-gray-300">{label}</span>
                    <span className={`font-bold ${text}`}>{value} day{value !== 1 ? 's' : ''}</span>
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

            {/* Attendance Rate Ring */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-gray-800 text-center">
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Overall Rate</p>
              <p className="text-4xl font-bold text-emerald-600 dark:text-green-400">
                {mockReport.attendance.rate}%
              </p>
              <div className="w-full h-3 bg-slate-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${mockReport.attendance.rate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Report Notes */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Report Notes</h3>
            <div className="space-y-3">
              {mockReport.notes.map((note, i) => {
                const cfg = noteCfg[note.type as keyof typeof noteCfg];
                return (
                  <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg}`}>
                    {cfg.icon}
                    <p className={`text-sm ${cfg.text}`}>{note.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FSL Summary */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5">FSL Learning Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progress bar */}
            <div className="md:col-span-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-gray-300 font-medium">Letters Mastered</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  {mockReport.fsl.lettersCompleted} / {mockReport.fsl.totalLetters}
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-700"
                  style={{ width: `${mockReport.fsl.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500 mt-2">
                <span>0 letters</span>
                <span>{mockReport.fsl.progress}% complete</span>
                <span>24 letters</span>
              </div>
            </div>

            {/* Streak */}
            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl mb-1">🔥</p>
              <p className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                {mockReport.fsl.streak}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-500 font-medium">Day Streak</p>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Keep it going!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
