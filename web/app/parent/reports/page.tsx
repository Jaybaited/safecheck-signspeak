'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileBarChart, Download, Calendar, Clock,
  TrendingUp, Bell, Info, AlertCircle,
} from 'lucide-react';
import ParentSidebar from '@/components/parent/ParentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import type { ChildInfo, AttendanceRecord } from '@/lib/api';

interface ParentUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PLACEHOLDER_CHILD = { id: '', firstName: '—', lastName: '', gradeLevel: null };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function ParentReportsPage() {
  const router = useRouter();
  const [parent,         setParent]         = useState<ParentUser | null>(null);
  const [child,          setChild]          = useState<ChildInfo | null>(null);
  const [allRecords,     setAllRecords]     = useState<AttendanceRecord[]>([]);
  const [authLoading,    setAuthLoading]    = useState(true);
  const [dataLoading,    setDataLoading]    = useState(false);
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [error,          setError]          = useState('');
  const [selectedMonth,  setSelectedMonth]  = useState(new Date().getMonth());
  const [selectedYear,   setSelectedYear]   = useState(new Date().getFullYear());

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
            .then(setAllRecords)
            .catch(() => setError('Failed to load attendance data.'));
        })
        .catch(() => setError('Failed to load child data.'))
        .finally(() => setDataLoading(false));
    } catch { router.push('/login'); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/login');
  };

  // Filter records to selected month/year
  const filteredRecords = allRecords.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  const tappedIn = filteredRecords.filter((r) => r.timeIn).length;
  const noTap    = filteredRecords.filter((r) => !r.timeIn).length;
  const total    = filteredRecords.length;
  const tapRate  = total > 0 ? Math.round((tappedIn / total) * 100) : 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsGenerating(false);
  };

  const handleExportCSV = () => {
    if (!child || filteredRecords.length === 0) return;
    const rows = [
      ['Student', `${child.firstName} ${child.lastName}`],
      ['Period', `${MONTHS[selectedMonth]} ${selectedYear}`],
      [],
      ['Date', 'Time In', 'Time Out'],
      ...filteredRecords.map((r) => [
        formatDate(r.date), formatTime(r.timeIn), formatTime(r.timeOut),
      ]),
      [],
      ['Days Tapped In', tappedIn],
      ['No Tap Days',    noTap],
      ['Total Days',     total],
      ['Tap-In Rate',    `${tapRate}%`],
    ];
    const csv  = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `report-${child.firstName}-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
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
      <ParentSidebar onLogout={handleLogout} parent={parent} child={sidebarChild} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {child ? `${child.firstName}'s` : "Child's"} monthly attendance report
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
          <h2 className="text-lg font-bold mb-4">Select Report Period</h2>
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
                disabled={isGenerating || dataLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileBarChart className="w-4 h-4" />}
                {isGenerating ? 'Loading...' : 'View Report'}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredRecords.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        <p className="text-lg font-bold text-slate-700 dark:text-gray-300 mb-6">
          {MONTHS[selectedMonth]} {selectedYear} — {child ? `${child.firstName} ${child.lastName}` : '…'}
        </p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Calendar,   label: 'Days Tapped In', value: dataLoading ? '…' : tappedIn, color: 'text-[#7B1113] dark:text-[#E8C96A]',  iconCls: 'text-[#7B1113] dark:text-[#E8C96A]',  bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20' },
            { icon: Clock,      label: 'No Tap Days',    value: dataLoading ? '…' : noTap,     color: 'text-slate-500 dark:text-gray-400',      iconCls: 'text-slate-400 dark:text-gray-500',    bg: 'bg-slate-100 dark:bg-gray-800' },
            { icon: TrendingUp, label: 'Tap-In Rate',    value: dataLoading ? '…' : `${tapRate}%`, color: 'text-[#7B1113] dark:text-[#E8C96A]', iconCls: 'text-[#7B1113] dark:text-[#E8C96A]', bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20' },
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
          {/* Rate breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold mb-5">Tap-In Rate</h3>
            {dataLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-100 dark:bg-gray-800 rounded" />
                <div className="h-8 bg-slate-100 dark:bg-gray-800 rounded" />
              </div>
            ) : (
              <div className="space-y-5">
                {[
                  { label: 'Tapped In', value: tappedIn, bar: 'bg-[#7B1113]',                     text: 'text-[#7B1113] dark:text-[#E8C96A]' },
                  { label: 'No Tap',    value: noTap,    bar: 'bg-slate-300 dark:bg-gray-600',     text: 'text-slate-500 dark:text-gray-400' },
                ].map(({ label, value, bar, text }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700 dark:text-gray-300">{label}</span>
                      <span className={`font-bold ${text}`}>{value} days</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar} rounded-full transition-all duration-700`}
                        style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                      {total > 0 ? `${Math.round((value / total) * 100)}%` : '0%'} of school days
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-gray-800 text-center">
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Overall Tap Rate</p>
              <p className="text-4xl font-bold text-[#7B1113] dark:text-[#E8C96A]">{tapRate}%</p>
              <div className="w-full h-3 bg-slate-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-[#7B1113] rounded-full transition-all duration-700" style={{ width: `${tapRate}%` }} />
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <h3 className="font-bold mb-5">Tap Records</h3>
            {dataLoading ? (
              <div className="space-y-3 animate-pulse">
                {[0,1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-gray-800 rounded-lg" />)}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-gray-400">No records for {MONTHS[selectedMonth]} {selectedYear}</p>
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
                    {filteredRecords.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
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