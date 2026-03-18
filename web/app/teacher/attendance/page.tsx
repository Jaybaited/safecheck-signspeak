'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, CheckCircle, XCircle,
  Search, Download, Filter, ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string; section: string | null;
}

interface AttendanceRow {
  id: string;
  studentName: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'present' | 'late' | 'absent';
}

// Sample data
const SAMPLE_LOGS: AttendanceRow[] = [
  { id:'1', studentName:'Ana Reyes',        date:'2026-03-12', timeIn:'07:42', timeOut:'16:00', status:'present' },
  { id:'2', studentName:'Carlo Santos',     date:'2026-03-12', timeIn:'08:15', timeOut:'16:00', status:'late' },
  { id:'3', studentName:'Diana Cruz',       date:'2026-03-12', timeIn:'07:55', timeOut:'16:00', status:'present' },
  { id:'4', studentName:'Enzo Villanueva',  date:'2026-03-12', timeIn:null,    timeOut:null,    status:'absent' },
  { id:'5', studentName:'Faith Lim',        date:'2026-03-12', timeIn:'07:48', timeOut:'16:00', status:'present' },
  { id:'6', studentName:'Gabriel Torres',  date:'2026-03-12', timeIn:'07:50', timeOut:'15:50', status:'present' },
  { id:'7', studentName:'Hannah Reyes',    date:'2026-03-12', timeIn:'08:05', timeOut:'16:00', status:'late' },
  { id:'8', studentName:'Ivan Castillo',   date:'2026-03-12', timeIn:null,    timeOut:null,    status:'absent' },
  { id:'9', studentName:'Julia Santos',    date:'2026-03-11', timeIn:'07:44', timeOut:'16:00', status:'present' },
  { id:'10',studentName:'Kevin Mendoza',   date:'2026-03-11', timeIn:'07:52', timeOut:'16:00', status:'present' },
];

const statusCfg = {
  present: { badge: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30', icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
  late:    { badge: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
  absent:  { badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',                   icon: <XCircle className="w-4 h-4 text-red-500" /> },
};

const PAGE_SIZE = 8;

export default function TeacherAttendancePage() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [page, setPage]           = useState(1);
  const router                    = useRouter();

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

  const filtered = SAMPLE_LOGS.filter((r) => {
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = {
    present: SAMPLE_LOGS.filter((r) => r.status === 'present').length,
    late:    SAMPLE_LOGS.filter((r) => r.status === 'late').length,
    absent:  SAMPLE_LOGS.filter((r) => r.status === 'absent').length,
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <TeacherSidebar onLogout={handleLogout} teacher={user} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Attendance Logs</h1>
            <p className="text-slate-500 dark:text-gray-400">View and track your class attendance records</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Records', value: SAMPLE_LOGS.length,  icon: Users,        color: 'text-slate-900 dark:text-white',       iconCls: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-100 dark:bg-cyan-500/10' },
            { label: 'Present',       value: summary.present,     icon: CheckCircle,  color: 'text-emerald-600 dark:text-green-400', iconCls: 'text-emerald-600 dark:text-green-400',bg: 'bg-emerald-100 dark:bg-green-500/10' },
            { label: 'Late',          value: summary.late,        icon: Clock,        color: 'text-yellow-600 dark:text-yellow-400', iconCls: 'text-yellow-600 dark:text-yellow-400',bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
            { label: 'Absent',        value: summary.absent,      icon: XCircle,      color: 'text-red-600 dark:text-red-400',       iconCls: 'text-red-600 dark:text-red-400',      bg: 'bg-red-100 dark:bg-red-500/10' },
          ].map(({ label, value, icon: Icon, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${iconCls}`} />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Table */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-gray-800">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input
                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search student..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 dark:text-gray-500" />
              {(['all','present','late','absent'] as const).map((s) => (
                <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === s
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-gray-800">
                <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                  {['Student Name','Date','Time In','Time Out','Status'].map((h) => (
                    <th key={h} className="px-6 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-gray-500">No records found</td></tr>
                ) : paginated.map((row) => {
                  const cfg = statusCfg[row.status];
                  return (
                    <tr key={row.id} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {row.studentName.split(' ').map((n) => n[0]).join('').slice(0,2)}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{row.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          <span className="text-sm text-slate-600 dark:text-gray-300">{row.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          <span className="text-sm text-slate-500 dark:text-gray-400">{row.timeIn ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{row.timeOut ?? '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {cfg.icon}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-gray-800">
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} records
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-gray-400" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? 'bg-cyan-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

