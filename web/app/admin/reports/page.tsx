'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Search, RefreshCw, Calendar as CalendarIcon,
  Users, Clock, FileText, X, XCircle,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';

interface AuthUser {
  id:        string;
  username:  string;
  role:      string;
  firstName: string;
  lastName:  string;
}

interface AttendanceRecord {
  id:        string;
  studentId: string;
  timeIn:    string | null;
  timeOut:   string | null;
  date:      string;
}

interface ReportRow {
  studentId:   string;
  studentName: string;
  rfidCard:    string | null; // ← added
  gradeLevel:  string;
  date:        string;
  timeIn:      string | null;
  timeOut:     string | null;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-gray-800 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => ( // ← 6 cols
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24" />
        </td>
      ))}
    </tr>
  );
}

function exportToCSV(rows: ReportRow[], filename: string) {
  const headers = ['Student Name', 'RFID Card', 'Grade Level', 'Date', 'Time In', 'Time Out']; // ← added RFID Card
  const data = rows.map(r => [
    r.studentName,
    r.rfidCard ?? 'No RFID', // ← added
    r.gradeLevel,
    r.date,
    r.timeIn  ?? '--:--',
    r.timeOut ?? '--:--',
  ]);
  const bom = '\uFEFF';
  const csv = [headers, ...data]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function ReportsPage() {
  const router = useRouter();

  const [authUser,    setAuthUser]    = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rows,        setRows]        = useState<ReportRow[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm,   setSearchTerm]   = useState('');

  // ── Auth guard
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AuthUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAuthUser(parsed);
    } catch {
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // ── Fetch attendance for all students on the selected date
  const fetchReport = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token') ?? '';
    if (!silent) { setLoading(true); setError(null); }
    else setRefreshing(true);

    try {
      const users    = await api.getUsers();
      const students = users.filter((u: any) => u.role === 'STUDENT');

      const results = await Promise.allSettled(
        students.map((s: any) =>
          apiFetch<AttendanceRecord[]>(`/attendance/student/${s.id}`, token)
            .then(records => ({ student: s, records }))
        )
      );

      const reportRows: ReportRow[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          const { student, records } = r.value;
          records.forEach(record => {
            const recDate = record.date.split('T')[0];
            if (recDate === selectedDate) {
              reportRows.push({
                studentId:   student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                rfidCard:    student.rfidCard ?? null, // ← added
                gradeLevel:  student.gradeLevel
                  ? student.gradeLevel.replace('GRADE_', 'Grade ')
                  : 'N/A',
                date:    recDate,
                timeIn:  record.timeIn,
                timeOut: record.timeOut,
              });
            }
          });
        }
      });

      reportRows.sort((a, b) => a.studentName.localeCompare(b.studentName));
      setRows(reportRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data.');
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (authUser) fetchReport();
  }, [authUser, fetchReport]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDisplayDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  // ── Live search filter — name, grade, and RFID card
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return rows;
    return rows.filter(r =>
      r.studentName.toLowerCase().includes(term) ||
      r.gradeLevel.toLowerCase().includes(term)  ||
      (r.rfidCard ?? '').toLowerCase().includes(term) // ← added
    );
  }, [rows, searchTerm]);

  // ── Stats derived from filtered rows
  const totalTappedIn  = filtered.filter(r => r.timeIn).length;
  const totalTappedOut = filtered.filter(r => r.timeOut).length;

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={authUser} />

      <main className="ml-64 p-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Attendance Reports</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              View and export daily RFID attendance records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchReport(true)}
              disabled={refreshing || loading}
              title="Refresh"
              className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700
                hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400
                disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 p-3.5
            bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
            rounded-xl text-sm">
            <div className="flex items-center gap-3">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
            <button
              onClick={() => fetchReport()}
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400
                hover:text-red-800 font-medium shrink-0 transition-colors text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Records */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
            rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                  bg-[#7B1113]/10 dark:bg-[#7B1113]/20 shrink-0">
                  <FileText className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Total Records</p>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
                    {searchTerm ? 'Filtered results' : `For ${selectedDate}`}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
            </div>
          </div>

          {/* Tapped In */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
            rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                  bg-emerald-100 dark:bg-emerald-500/10 shrink-0">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Tapped In</p>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">With recorded time in</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalTappedIn}</p>
            </div>
          </div>

          {/* Tapped Out */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
            rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                  bg-blue-100 dark:bg-blue-500/10 shrink-0">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Tapped Out</p>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">With recorded time out</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTappedOut}</p>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
          rounded-xl shadow-sm dark:shadow-none overflow-hidden">

          {/* Toolbar */}
          <div className="p-5 border-b border-slate-200 dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Attendance Log
                </h2>
                {!loading && (
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    {formatDisplayDate(selectedDate)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Date picker */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-800
                  border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium
                      focus:ring-0 outline-none text-slate-700 dark:text-gray-200
                      dark:[color-scheme:dark]"
                  />
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name or RFID..." // ← updated placeholder
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-48 pl-9 pr-8 py-2 bg-slate-50 dark:bg-gray-800
                      border border-slate-200 dark:border-gray-700 rounded-lg text-sm
                      text-slate-900 dark:text-white placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2
                        text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Export CSV */}
                <button
                  onClick={() => exportToCSV(filtered, `attendance-report-${selectedDate}`)}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-2 px-4 py-2
                    bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed
                    text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Active filters indicator */}
            {searchTerm && (
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-gray-400">
                <span>
                  Showing <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> of <span className="font-semibold">{rows.length}</span> records
                </span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800
                  text-slate-600 dark:text-gray-300 rounded-full">
                  Search: &quot;{searchTerm}&quot;
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800/50
  border-b border-slate-200 dark:border-gray-800">
  <tr className="text-left text-slate-500 dark:text-gray-400
    text-xs uppercase tracking-wider">
    <th className="px-4 py-3 font-semibold">Student Name</th>
    <th className="px-4 py-3 font-semibold">RFID Card</th>
    <th className="px-4 py-3 font-semibold">Grade Level</th>
    <th className="px-4 py-3 font-semibold">Date</th>
    <th className="px-4 py-3 font-semibold">Time In</th>
    <th className="px-4 py-3 font-semibold">Time Out</th>
  </tr>
</thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}> {/* ← updated from 5 */}
                      <div className="text-center py-14">
                        <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-slate-400 dark:text-gray-500 text-sm font-medium">
                          {searchTerm
                            ? `No records matching "${searchTerm}"`
                            : `No attendance records for ${selectedDate}`}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="mt-2 text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(row => (
                    <tr
                      key={`${row.studentId}-${row.date}`}
                      className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Student Name with avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gradient-to-br from-[#9B2020] to-[#7B1113]
                            rounded-full flex items-center justify-center
                            text-xs font-bold text-white shrink-0">
                            {row.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {row.studentName}
                          </span>
                        </div>
                      </td>

                      {/* RFID Card ← added */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-gray-400">
                        {row.rfidCard ?? (
                          <span className="text-slate-300 dark:text-gray-600 font-sans">No RFID</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-gray-400">
                        {row.gradeLevel}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-gray-300">
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>

                      {/* Time In */}
                      <td className="px-4 py-3">
                        {row.timeIn ? (
                          <span className="flex items-center gap-1.5
                            text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {formatTime(row.timeIn)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-gray-500 text-sm">--:--</span>
                        )}
                      </td>

                      {/* Time Out */}
                      <td className="px-4 py-3">
                        {row.timeOut ? (
                          <span className="flex items-center gap-1.5
                            text-blue-600 dark:text-blue-400 font-medium text-sm">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {formatTime(row.timeOut)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-gray-500 text-sm">--:--</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-gray-800">
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}
                {searchTerm && ` (filtered from ${rows.length} total)`}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}