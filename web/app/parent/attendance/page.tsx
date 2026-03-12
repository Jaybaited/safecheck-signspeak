'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, CheckCircle, XCircle,
  TrendingUp, Download, ChevronLeft, ChevronRight,
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

interface AttendanceRecord {
  id: string; date: string;
  timeIn: string | null; timeOut: string | null;
  status: 'present' | 'late' | 'absent';
}

const sampleChild: Child = { id:'child-1', firstName:'Ana', lastName:'Dela Cruz', gradeLevel:'GRADE_8' };

const SAMPLE_RECORDS: AttendanceRecord[] = [
  { id:'1',  date:'2026-03-12', timeIn:'07:45', timeOut:'16:00', status:'present' },
  { id:'2',  date:'2026-03-11', timeIn:'07:52', timeOut:'16:00', status:'present' },
  { id:'3',  date:'2026-03-10', timeIn:'08:10', timeOut:'16:00', status:'late' },
  { id:'4',  date:'2026-03-09', timeIn:'07:48', timeOut:'16:00', status:'present' },
  { id:'5',  date:'2026-03-06', timeIn:null,    timeOut:null,    status:'absent' },
  { id:'6',  date:'2026-03-05', timeIn:'07:50', timeOut:'16:00', status:'present' },
  { id:'7',  date:'2026-03-04', timeIn:'07:44', timeOut:'16:00', status:'present' },
  { id:'8',  date:'2026-03-03', timeIn:'08:22', timeOut:'16:00', status:'late' },
  { id:'9',  date:'2026-03-02', timeIn:'07:55', timeOut:'16:00', status:'present' },
  { id:'10', date:'2026-02-28', timeIn:null,    timeOut:null,    status:'absent' },
];

const statusCfg = {
  present: { badge: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30', icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
  late:    { badge: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
  absent:  { badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',                   icon: <XCircle className="w-4 h-4 text-red-500" /> },
};

export default function ParentAttendancePage() {
  const [parent, setParent]       = useState<ParentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const router                    = useRouter();

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

  const changeMonth = (dir: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const stats = {
    total:   SAMPLE_RECORDS.length,
    present: SAMPLE_RECORDS.filter((r) => r.status === 'present').length,
    late:    SAMPLE_RECORDS.filter((r) => r.status === 'late').length,
    absent:  SAMPLE_RECORDS.filter((r) => r.status === 'absent').length,
    rate:    Math.round((SAMPLE_RECORDS.filter((r) => r.status !== 'absent').length / SAMPLE_RECORDS.length) * 100),
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Attendance History</h1>
            <p className="text-slate-500 dark:text-gray-400">
              {sampleChild.firstName}&apos;s attendance records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Calendar,    label: 'Total Days',      value: stats.total,    color: 'text-slate-900 dark:text-white',       iconCls: 'text-slate-500 dark:text-gray-400',    bg: 'bg-slate-100 dark:bg-gray-800' },
            { icon: CheckCircle, label: 'Present',          value: stats.present,  color: 'text-emerald-600 dark:text-green-400', iconCls: 'text-emerald-600 dark:text-green-400', bg: 'bg-emerald-100 dark:bg-green-500/10' },
            { icon: Clock,       label: 'Late',             value: stats.late,     color: 'text-yellow-600 dark:text-yellow-400', iconCls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
            { icon: XCircle,     label: 'Absent',           value: stats.absent,   color: 'text-red-600 dark:text-red-400',       iconCls: 'text-red-600 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-500/10' },
            { icon: TrendingUp,  label: 'Attendance Rate',  value: `${stats.rate}%`,color: 'text-emerald-600 dark:text-emerald-400',iconCls: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
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
          {/* Calendar */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h2>
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
                { color: 'bg-emerald-500/20', label: 'Present' },
                { color: 'bg-yellow-500/20',  label: 'Late' },
                { color: 'bg-red-500/20',     label: 'Absent' },
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-gray-800">
                  <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                    {['Date','Time In','Time Out','Status'].map((h) => (
                      <th key={h} className="pb-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_RECORDS.map((r) => {
                    const cfg = statusCfg[r.status];
                    return (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                            <span className="text-sm text-slate-700 dark:text-gray-300">{r.date}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                            <span className="text-sm text-slate-500 dark:text-gray-400">{r.timeIn ?? '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-sm text-slate-500 dark:text-gray-400">{r.timeOut ?? '—'}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            {cfg.icon}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
