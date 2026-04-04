'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileBarChart, Download, Calendar, Users,
  CheckCircle, TrendingUp, BookOpen, Filter,
} from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string; section: string | null;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const mockReport = {
  attendanceSummary: { present: 892, late: 64, absent: 124, total: 1080 },
  fslSummary:        { avgProgress: 62, studentsAbove75: 7, studentsBelow50: 4 },
  topAttenders: [
    { name: 'Ana Reyes',      days: 20, pct: 100 },
    { name: 'Diana Cruz',     days: 19, pct: 95 },
    { name: 'Faith Lim',      days: 19, pct: 95 },
    { name: 'Carlo Santos',   days: 18, pct: 90 },
    { name: 'Gabriel Torres', days: 18, pct: 90 },
  ],
  topFSL: [
    { name: 'Ana Reyes',     pct: 92 },
    { name: 'Diana Cruz',    pct: 88 },
    { name: 'Faith Lim',     pct: 81 },
    { name: 'Carlo Santos',  pct: 74 },
  ],
  needsAttention: [
    { name: 'Ivan Castillo',   issue: 'Low attendance + low FSL progress' },
    { name: 'Enzo Villanueva', issue: 'Frequent absences' },
    { name: 'Laura Bautista',  issue: 'Low FSL engagement' },
  ],
};

export default function TeacherReportsPage() {
  const [user, setUser]             = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating]   = useState(false);
  const router                            = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as User;
      if (p.role !== 'TEACHER') { router.push('/login'); return; }
      setUser(p);
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
    await new Promise((r) => setTimeout(r, 1200));
    setIsGenerating(false);
    // In production: generate PDF or CSV
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const attPct = Math.round((mockReport.attendanceSummary.present / mockReport.attendanceSummary.total) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <TeacherSidebar onLogout={handleLogout} teacher={user} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class Reports</h1>
            <p className="text-slate-500 dark:text-gray-400">Generate and view detailed class performance reports</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Report Config */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 mb-8 shadow-sm dark:shadow-none transition-colors duration-200">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generate Report</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60">
                {isGenerating
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <FileBarChart className="w-4 h-4" />
                }
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Report for selected month */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-700 dark:text-gray-300 mb-4">
            Report: {MONTHS[selectedMonth]} {selectedYear} — Section {user.section ?? 'N/A'}
          </h2>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,       label: 'Total Records',    value: mockReport.attendanceSummary.total,      color: 'text-slate-900 dark:text-white',       iconCls: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-100 dark:bg-cyan-500/10' },
            { icon: CheckCircle, label: 'Attendance Rate',  value: `${attPct}%`,                            color: 'text-emerald-600 dark:text-green-400', iconCls: 'text-emerald-600 dark:text-green-400',bg: 'bg-emerald-100 dark:bg-green-500/10' },
            { icon: BookOpen,    label: 'Avg FSL Progress', value: `${mockReport.fslSummary.avgProgress}%`, color: 'text-purple-600 dark:text-purple-400', iconCls: 'text-purple-600 dark:text-purple-400',bg: 'bg-purple-100 dark:bg-purple-500/10' },
            { icon: TrendingUp,  label: 'Above 75% FSL',    value: mockReport.fslSummary.studentsAbove75,   color: 'text-yellow-600 dark:text-yellow-400', iconCls: 'text-yellow-600 dark:text-yellow-400',bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Attendees */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">🏅 Top Attendees</h3>
            <div className="space-y-3">
              {mockReport.topAttenders.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 shrink-0 ${i===0?'text-yellow-500':i===1?'text-slate-400':i===2?'text-orange-500':'text-slate-400 dark:text-gray-500'}`}>#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-green-400 shrink-0">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top FSL */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">🌟 Top FSL Learners</h3>
            <div className="space-y-3">
              {mockReport.topFSL.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 shrink-0 ${i===0?'text-yellow-500':i===1?'text-slate-400':i===2?'text-orange-500':'text-slate-400 dark:text-gray-500'}`}>#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full mt-1">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">⚠️ Needs Attention</h3>
            <div className="space-y-3">
              {mockReport.needsAttention.map((s) => (
                <div key={s.name} className="p-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">{s.name}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">{s.issue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

