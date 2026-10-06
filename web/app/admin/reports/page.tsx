'use client';


import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Search, RefreshCw, Calendar as CalendarIcon,
  Clock, FileText, X, XCircle,
} from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import { logout } from '@/lib/auth';


interface AuthUser {
  id:        string;
  username:  string;
  role:      string;
  firstName: string;
  lastName:  string;
}


interface ReportRow {
  studentId:   string;
  studentName: string;
  rfidCard:    string | null;
  gradeLevel:  string;
  date:        string;
  timeIn:      string | null;
  timeOut:     string | null;
  status:      string | null;
}


function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-gray-800 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24" />
        </td>
      ))}
    </tr>
  );
}


const GRADE_LEVELS = [
  'GRADE_1','GRADE_2','GRADE_3','GRADE_4','GRADE_5','GRADE_6',
  'GRADE_7','GRADE_8','GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];
const STATUS_OPTIONS = ['PRESENT','LATE','ABSENT','UNCONFIRMED_OUT'];


function formatGradeLabel(g: string) { return g.replace('GRADE_', 'Grade '); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function formatTime(iso: string | null) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}


function exportToCSV(rows: ReportRow[], filename: string) {
  const headers = ['Student Name', 'RFID Card', 'Grade Level', 'Date', 'Time In', 'Time Out', 'Status'];
  const data = rows.map((r) => [
    r.studentName,
    r.rfidCard    ?? 'No RFID',
    r.gradeLevel,
    r.date,
    r.timeIn      ? formatTime(r.timeIn)  : '--:--',
    r.timeOut     ? formatTime(r.timeOut) : '--:--',
    r.status      ?? '--',
  ]);
  const bom = '\uFEFF';
  const csv = [headers, ...data]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


export default function ReportsPage() {
  const router = useRouter();


  const [authUser,    setAuthUser]    = useState<AuthUser | null>(null);
  const [rows,        setRows]        = useState<ReportRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchTerm,   setSearchTerm]   = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter,  setGradeFilter]  = useState('');


  // ── Pagination ────────────────────────────────────────────────────────────
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 20;


  // ── KPI stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const tappedIn    = rows.filter((r) => r.timeIn  !== null).length;
    const tappedOut   = rows.filter((r) => r.timeOut !== null).length;
    const late        = rows.filter((r) => r.status === 'LATE').length;
    const unconfirmed = rows.filter((r) => r.status === 'UNCONFIRMED_OUT').length;
    return { total: rows.length, tappedIn, tappedOut, late, unconfirmed };
  }, [rows]);


  const fetchReports = useCallback(async (silent = false, targetPage = 1) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);


    try {
      // ✅ FIX: Use api.getFilteredAttendance() which correctly calls
      // GET /attendance?... instead of the non-existent /attendance/filtered
      const res = await api.getFilteredAttendance({
        page:       targetPage,
        limit:      LIMIT,
        ...(dateFrom     && { dateFrom }),
        ...(dateTo       && { dateTo }),
        ...(statusFilter && { status: statusFilter }),
        ...(gradeFilter  && { gradeLevel: gradeFilter }),
      });


      // Enrich with rfidCard — fetch all users once and build a lookup map
      const users = await api.getUsers();
      const rfidMap: Record<string, string | null> = {};
      for (const u of users) rfidMap[u.id] = u.rfidCard ?? null;


      const mapped: ReportRow[] = res.data.map((rec) => ({
        studentId:   rec.student.id,
        studentName: `${rec.student.firstName} ${rec.student.lastName}`,
        rfidCard:    rfidMap[rec.student.id] ?? null,
        gradeLevel:  rec.student.gradeLevel
          ? formatGradeLabel(rec.student.gradeLevel)
          : 'N/A',
        date:    formatDate(rec.date),
        timeIn:  rec.timeIn,
        timeOut: rec.timeOut,
        status:  rec.status,
      }));


      setRows(mapped);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports.');
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, [dateFrom, dateTo, statusFilter, gradeFilter]);


  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AuthUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAuthUser(parsed);
      fetchReports();
    } catch {
      router.push('/login');
    }
  }, [router, fetchReports]);


  const handleLogout = () => {
    logout();
    router.push('/login');
  };


  // Client-side search filter on top of server-side filters
  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(term) ||
        (r.rfidCard ?? '').toLowerCase().includes(term),
    );
  }, [rows, searchTerm]);


  const handleApplyFilters = () => {
    setPage(1);
    fetchReports(false, 1);
  };


  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setGradeFilter('');
    setSearchTerm('');
    setPage(1);
  };


  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchReports(false, newPage);
  };


  const statusBadge = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, string> = {
      PRESENT:         'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      LATE:            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
      ABSENT:          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
      UNCONFIRMED_OUT: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };


  if (loading || !authUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  const hasActiveFilters = dateFrom || dateTo || statusFilter || gradeFilter;


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={authUser} />


      <main className="ml-64 p-6">


        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Attendance Reports</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              View, filter, and export student attendance records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
              {refreshing ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#7B1113]" />
              ) : (
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
              )}
              {lastUpdated && (
                <span>
                  Updated{' '}
                  {lastUpdated.toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchReports(true, page)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-slate-200
                dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800
                text-slate-500 dark:text-gray-400 disabled:opacity-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>


        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Records', value: total,          color: 'text-slate-900 dark:text-white'         },
            { label: 'Tapped In (this page)',     value: stats.tappedIn, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Tapped Out (this page)',    value: stats.tappedOut,color: 'text-blue-600 dark:text-blue-400'       },
            { label: 'Late (this page)',          value: stats.late,     color: stats.late > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                p-4 rounded-xl shadow-sm flex items-center justify-between"
            >
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-snug">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>


        {/* ── Filters ── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
          rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">


            {/* Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">From</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200
                    dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
                />
              </div>
            </div>


            {/* Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">To</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200
                    dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
                />
              </div>
            </div>


            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200
                  dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>


            {/* Grade Level */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Grade</label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200
                  dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
              >
                <option value="">All Grades</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{formatGradeLabel(g)}</option>
                ))}
              </select>
            </div>


            {/* Apply */}
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg
                text-sm font-medium transition-colors shadow-sm"
            >
              Apply Filters
            </button>


            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500
                  dark:text-gray-400 hover:text-slate-700 dark:hover:text-white
                  hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>


        {/* ── Table ── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
          rounded-xl shadow-sm">


          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Records</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 rounded-full
                text-xs font-medium text-slate-500 dark:text-gray-400">
                {total} total
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name or RFID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-52 pl-9 pr-8 py-2 bg-slate-50 dark:bg-gray-800 border
                    border-slate-200 dark:border-gray-700 rounded-lg text-sm
                    text-slate-900 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Export */}
              <button
                onClick={() =>
                  exportToCSV(filteredRows, `attendance-report-${new Date().toISOString().slice(0, 10)}`)
                }
                disabled={filteredRows.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200
                  dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200
                  dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-lg
                  text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>


          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-500/10
              border-b border-red-200 dark:border-red-500/20 text-sm">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}


          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-gray-400 border-b
                  border-slate-200 dark:border-gray-800">
                  {['Student Name', 'RFID Card', 'Grade', 'Date', 'Time In', 'Time Out', 'Status'].map((h) => (
                    <th key={h} className="pb-3 px-4 pt-3 text-xs font-semibold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14">
                      <Clock className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-slate-400 dark:text-gray-500 text-sm font-medium">
                        {searchTerm ? `No records matching "${searchTerm}"` : 'No attendance records found.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr
                      key={`${row.studentId}-${row.date}-${idx}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {row.studentName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-gray-300">
                        {row.rfidCard ?? (
                          <span className="text-slate-400 dark:text-gray-500 font-sans">No RFID</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-gray-400">
                        {row.gradeLevel}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-gray-400">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-gray-200 font-medium">
                        {formatTime(row.timeIn)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-gray-200 font-medium">
                        {formatTime(row.timeOut)}
                      </td>
                      <td className="py-3 px-4">
                        {statusBadge(row.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>


          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t
              border-slate-200 dark:border-gray-800">
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Page {page} of {totalPages} · {total} records
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50
                    dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700
                    text-slate-700 dark:text-gray-300 rounded-lg text-xs transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const p = Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-[#7B1113] text-white'
                          : 'bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50
                    dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700
                    text-slate-700 dark:text-gray-300 rounded-lg text-xs transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}