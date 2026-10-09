'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Search, Users, TrendingUp, Activity, Hand } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import { getFslOverview } from '@/lib/fsl-api';
import type { FslOverviewRow } from '@/lib/fsl-api';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

type SortKey = 'name' | 'progress' | 'activity';

const formatGrade = (g: string | null) => (g ? g.replace('GRADE_', 'Grade ') : '-');
const formatDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';

type FslStatusFilter = 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

function progressStatus(r: FslOverviewRow): Exclude<FslStatusFilter, 'ALL'> {
  if (r.totalLetters > 0 && r.masteredCount >= r.totalLetters) return 'COMPLETED';
  if (r.masteredCount > 0 || r.lastPracticed) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

export default function AdminFSLProgressPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<FslOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [grade, setGrade] = useState('ALL');
  const [status, setStatus] = useState<FslStatusFilter>('ALL');

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      setRows(await getFslOverview());
    } catch {
      setError('Could not load FSL progress. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AdminUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdminUser(parsed);
      load();
    } catch {
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) && (grade === 'ALL' || r.gradeLevel === grade) && (status === 'ALL' || progressStatus(r) === status));
    if (sort === 'progress') return [...list].sort((a, b) => b.percent - a.percent);
    if (sort === 'activity') return [...list].sort((a, b) => b.weekCount - a.weekCount);
    return list;
  }, [rows, query, sort, grade, status]);

  if (authLoading || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grades = Array.from(new Set(rows.map((r) => r.gradeLevel).filter((g): g is string => !!g)))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  const avgPercent = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : 0;
  const activeThisWeek = rows.filter((r) => r.weekCount > 0).length;
  const signedThisWeek = rows.reduce((s, r) => s + r.weekCount, 0);

  const cards = [
    { icon: Users, label: 'Students', value: String(rows.length), sub: 'with student accounts' },
    { icon: TrendingUp, label: 'Average Progress', value: avgPercent + '%', sub: 'of the FSL alphabet' },
    { icon: Activity, label: 'Active This Week', value: String(activeThisWeek), sub: 'students who practiced' },
    { icon: Hand, label: 'Signs This Week', value: String(signedThisWeek), sub: 'letters signed in total' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={adminUser} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">FSL Module Progress</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Alphabet progress for every student. Dynamic words are not tracked yet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {cards.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#7B1113] dark:text-[#E8C96A]" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <h3 className="text-3xl font-bold text-[#7B1113] dark:text-[#E8C96A]">{loading ? '-' : value}</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-gray-800">
            <h2 className="text-xl font-bold">Students</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search student"
                  className="pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7B1113]/40"
                />
              </div>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
              >
                <option value="ALL">All grades</option>
                {grades.map((g) => (
                  <option key={g} value={g}>{formatGrade(g)}</option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FslStatusFilter)}
                className="py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
              >
                <option value="ALL">All statuses</option>
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
              >
                <option value="name">Sort: Name</option>
                <option value="progress">Sort: Progress</option>
                <option value="activity">Sort: This week</option>
              </select>
            </div>
          </div>

          {error && <p className="p-5 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-gray-500">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                  <th className="px-5 py-3 font-semibold w-64">Alphabet progress</th>
                  <th className="px-5 py-3 font-semibold">This week</th>
                  <th className="px-5 py-3 font-semibold">Best game score</th>
                  <th className="px-5 py-3 font-semibold">Last practiced</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">Loading...</td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No students found.</td>
                  </tr>
                ) : (
                  visible.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 dark:border-gray-800">
                      <td className="px-5 py-3 font-medium">{r.firstName} {r.lastName}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-gray-400">{formatGrade(r.gradeLevel)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                            <div className="bg-[#7B1113] h-2 rounded-full" style={{ width: r.percent + '%' }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums w-20 text-right">
                            {r.masteredCount}/{r.totalLetters} ({r.percent}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums">{r.weekCount}</td>
                      <td className="px-5 py-3 tabular-nums">{r.highScore.toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-gray-400">{formatDate(r.lastPracticed)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}