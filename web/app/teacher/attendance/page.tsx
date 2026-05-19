'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Clock, LogIn, LogOut, AlertTriangle, RefreshCw,
} from 'lucide-react';
import {
  api,
  FilteredAttendanceRecord,
  AttendanceQueryParams,
} from '@/lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_LEVELS = [
  'GRADE_1','GRADE_2','GRADE_3','GRADE_4','GRADE_5','GRADE_6',
  'GRADE_7','GRADE_8','GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];

const STATUS_OPTIONS = [
  { value: '',                label: 'All Statuses'    },
  { value: 'PRESENT',         label: 'Present'         },
  { value: 'LATE',            label: 'Late'            },
  { value: 'ABSENT',          label: 'Absent'          },
  { value: 'UNCONFIRMED_OUT', label: 'Unconfirmed Out' },
];

const STATUS_STYLE: Record<string, string> = {
  PRESENT:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  LATE:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  ABSENT:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  UNCONFIRMED_OUT:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
};

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: 'Asia/Manila',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year:     'numeric',
    month:    'short',
    day:      'numeric',
    timeZone: 'Asia/Manila',
  });
}

function formatGrade(g: string | null): string {
  if (!g) return '—';
  return g.replace('GRADE_', 'Grade ');
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TeacherAttendancePage() {
  const router = useRouter();

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    try {
      const u = JSON.parse(raw);
      if (u.role !== 'TEACHER' && u.role !== 'ADMIN')
        router.push('/login');
    } catch {
      router.push('/login');
    }
  }, [router]);

  // ── Filter state ───────────────────────────────────────────────────────────
  const today = getToday();
  const [dateFrom,   setDateFrom]   = useState(today);
  const [dateTo,     setDateTo]     = useState(today);
  const [status,     setStatus]     = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [search,     setSearch]     = useState('');

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page,       setPage]       = useState(1);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [records,    setRecords]    = useState<FilteredAttendanceRecord[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: AttendanceQueryParams = {
        page:  p,
        limit: PAGE_SIZE,
      };
      if (dateFrom)   params.dateFrom   = dateFrom;
      if (dateTo)     params.dateTo     = dateTo;
      if (status)     params.status     = status;
      if (gradeLevel) params.gradeLevel = gradeLevel;

      const res = await api.getFilteredAttendance(params);
      setRecords(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status, gradeLevel]);

  useEffect(() => {
    void fetchAttendance(page);
  }, [fetchAttendance, page]);

  const handleApplyFilters = () => {
    setPage(1);
    void fetchAttendance(1);
  };

  const handleReset = () => {
    setDateFrom(today);
    setDateTo(today);
    setStatus('');
    setGradeLevel('');
    setSearch('');
    setPage(1);
  };

  // ── Client-side name search ────────────────────────────────────────────────
  const filtered = search.trim()
    ? records.filter((r) => {
        const full = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
        return full.includes(search.trim().toLowerCase());
      })
    : records;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Attendance Records
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              View and filter student attendance across all dates.
            </p>
          </div>
          <button
            onClick={() => { setPage(1); void fetchAttendance(page); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Filters
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Date From */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || today}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={today}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors appearance-none"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Grade Level
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors appearance-none"
              >
                <option value="">All Grades</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{formatGrade(g)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            {/* Name search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-5 py-2 bg-[#7B1113] hover:bg-[#9B2020] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-1">
          <span>
            {loading
              ? 'Loading…'
              : `${total} record${total !== 1 ? 's' : ''} found`}
            {!loading && search.trim() && ` · ${filtered.length} matching "${search.trim()}"`}
          </span>
          {totalPages > 1 && !loading && (
            <span>Page {page} of {totalPages}</span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Grade
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5" /> Time In
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5" /> Time Out
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>

                {/* Skeleton rows */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                          style={{ width: `${60 + (j * 7) % 30}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                        <Clock className="w-10 h-10 opacity-30" />
                        <p className="text-sm font-medium">No attendance records found</p>
                        <p className="text-xs">Try adjusting your filters or date range.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && filtered.map((record) => {
                  let duration = '—';
                  if (record.timeIn && record.timeOut) {
                    const ms = new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime();
                    const h  = Math.floor(ms / 3_600_000);
                    const m  = Math.floor((ms % 3_600_000) / 60_000);
                    duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
                  } else if (record.timeIn && !record.timeOut) {
                    duration = 'In progress';
                  }

                  const statusCls = STATUS_STYLE[record.status ?? ''] ??
                    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {record.student.firstName[0]}{record.student.lastName[0]}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {record.student.firstName} {record.student.lastName}
                          </span>
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatGrade(record.student.gradeLevel)}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(record.date)}
                      </td>

                      {/* Time In */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatTime(record.timeIn)}
                      </td>

                      {/* Time Out */}
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        {record.timeOut ? (
                          <span className="text-gray-600 dark:text-gray-300">
                            {formatTime(record.timeOut)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-500 dark:text-orange-400">
                            <AlertTriangle className="w-3 h-3" /> No tap-out
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusCls}`}>
                          {record.status ?? 'Unknown'}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {duration}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = totalPages <= 5
                    ? i + 1
                    : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        pg === page
                          ? 'bg-[#7B1113] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}