'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, User, X, RefreshCw, Activity, Clock } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import EditRfidModal from '@/components/admin/EditRfidModal';
import { api } from '@/lib/api';

interface AuthUser {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

interface RfidCard {
  id:          string;
  rfidNumber:  string | null;
  studentName: string;
  gradeLevel:  string;
  status:      'active' | 'unassigned';
  lastScanned: string;
}

interface ActivityLog {
  id:          string;
  studentName: string;
  action:      string;
  time:        string;
  status:      'present' | 'late' | 'absent';
}

interface AttendanceRecord {
  id:        string;
  studentId: string;
  timeIn:    string | null;
  timeOut:   string | null;
  date:      string;
  status:    string;
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

export default function RfidManagement() {
  const router = useRouter();

  const [authUser,    setAuthUser]    = useState<AuthUser | null>(null);
  const [rfidCards,   setRfidCards]   = useState<RfidCard[]>([]);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [recentLogs,  setRecentLogs]  = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0, assignedCards: 0,
    unassignedCards: 0, safetyAlerts: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [editModal, setEditModal] = useState<{
    open: boolean;
    userId: string;
    studentName: string;
    currentRfid: string | null;
  }>({ open: false, userId: '', studentName: '', currentRfid: null });

  const formatGradeLevel = (g: string | null) => g ? g.replace('GRADE_', 'Grade ') : 'N/A';
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  const formatLastUpdated = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const fetchData = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token') ?? '';
    if (!silent) { setLoading(true); setLogsLoading(true); }
    else setRefreshing(true);

    try {
      const users    = await api.getUsers();
      const students = users.filter((u: any) => u.role === 'STUDENT');

      // ── RFID cards
      const cards: RfidCard[] = students.map((s: any) => ({
        id:          s.id,
        rfidNumber:  s.rfidCard ?? null,
        studentName: `${s.firstName} ${s.lastName}`,
        gradeLevel:  formatGradeLevel(s.gradeLevel ?? null),
        status:      s.rfidCard ? 'active' : 'unassigned',
        lastScanned: formatDate(s.updatedAt ?? s.createdAt),
      }));
      setRfidCards(cards);
      setStats({
        totalStudents:   students.length,
        assignedCards:   cards.filter((c) => c.status === 'active').length,
        unassignedCards: cards.filter((c) => c.status === 'unassigned').length,
        safetyAlerts:    cards.filter((c) => c.status === 'unassigned').length,
      });

      // ── Recent attendance logs — today, up to 10 students
      const nameMap: Record<string, string> = {};
      students.forEach((s: any) => {
        nameMap[s.id] = `${s.firstName} ${s.lastName}`;
      });

      const sample = students.slice(0, 10).map((s: any) => s.id);
      const logResults = await Promise.allSettled(
        sample.map((id: string) =>
          apiFetch<AttendanceRecord | null>(`/attendance/student/${id}/today`, token)
        )
      );

      const liveLogs: ActivityLog[] = [];
      logResults.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const record = r.value;
          const s = record.status?.toUpperCase();
          liveLogs.push({
            id:          record.id,
            studentName: nameMap[sample[i]] ?? `Student #${sample[i].slice(0, 6)}`,
            action:      record.timeIn ? 'RFID tap' : 'No tap',
            time:        formatTime(record.timeIn),
            status:      s === 'PRESENT' ? 'present' : s === 'LATE' ? 'late' : 'absent',
          });
        }
      });

      // Sort: present first, then late, then absent
      liveLogs.sort((a, b) => {
        const order = { present: 0, late: 1, absent: 2 };
        return order[a.status] - order[b.status];
      });

      setRecentLogs(liveLogs);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch RFID data:', err);
    } finally {
      if (!silent) { setLoading(false); setLogsLoading(false); }
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AuthUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAuthUser(parsed);
      fetchData();
      intervalRef.current = setInterval(() => fetchData(true), 30_000);
    } catch { router.push('/login'); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleRfidUpdate = async (userId: string, rfidCard: string) => {
    await api.updateUser(userId, { rfidCard });
    await fetchData();
  };

  const filteredCards = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return rfidCards;
    return rfidCards.filter((c) =>
      c.studentName.toLowerCase().includes(term) ||
      (c.rfidNumber ?? '').toLowerCase().includes(term) ||
      c.gradeLevel.toLowerCase().includes(term)
    );
  }, [rfidCards, searchTerm]);

  if (loading || !authUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students',   value: stats.totalStudents,   color: 'text-slate-900 dark:text-white'         },
    { label: 'Assigned Cards',   value: stats.assignedCards,   color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Unassigned Cards', value: stats.unassignedCards, color: 'text-orange-600 dark:text-orange-400'   },
    { label: 'Safety Alerts',    value: stats.safetyAlerts,    color: 'text-rose-600 dark:text-red-400'        },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={authUser} />

      <main className="ml-64 p-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">RFID Management</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Monitor student RFID cards and attendance activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
              {refreshing ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#7B1113]" />
              ) : (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
              )}
              {lastUpdated && <span>Updated {formatLastUpdated(lastUpdated)}</span>}
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Refresh now"
              className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-slate-200
                dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800
                text-slate-500 dark:text-gray-400 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, color }) => (
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

        {/* ── Today's Attendance Logs — full width ── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
          p-5 rounded-xl shadow-sm mb-6">

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Today&apos;s Attendance Logs</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                  bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20
                  text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  <Activity className="w-2.5 h-2.5" /> Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Real-time RFID tap activity for today
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/reports')}
              className="text-[#7B1113] dark:text-[#E8C96A] hover:text-[#9B2020] text-xs font-medium transition-colors"
            >
              View Full Report →
            </button>
          </div>

          {logsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3
                  bg-slate-50 dark:bg-gray-800/50 rounded-lg animate-pulse">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-gray-700 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-28 h-2.5 bg-slate-200 dark:bg-gray-700 rounded" />
                    <div className="w-20 h-2 bg-slate-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="w-14 h-5 bg-slate-200 dark:bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-gray-500 text-sm font-medium">No activity recorded today yet</p>
              <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">
                Logs will appear once students start tapping in
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3
                  rounded-lg bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#9B2020] to-[#7B1113]
                      rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">
                        {log.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {log.studentName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {log.time} · {log.action}
                      </p>
                    </div>
                  </div>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    log.status === 'present'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                      : log.status === 'late'
                      ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30'
                      : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                  }`}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Summary bar */}
          {!logsLoading && recentLogs.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                Present: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {recentLogs.filter(l => l.status === 'present').length}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Late: <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {recentLogs.filter(l => l.status === 'late').length}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-rose-500 rounded-full" />
                Absent: <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {recentLogs.filter(l => l.status === 'absent').length}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ── Student Directory ── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
          p-5 rounded-xl shadow-sm">

          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold">Student Directory</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Manage enrolled students and their RFID assignments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-52 pl-9 pr-8 py-2 bg-slate-50 dark:bg-gray-800
                    border border-slate-200 dark:border-gray-700 rounded-lg text-sm
                    text-slate-900 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020]
                  text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>

          {searchTerm && (
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
              {filteredCards.length === 0
                ? `No students found for "${searchTerm}"`
                : `Showing ${filteredCards.length} of ${rfidCards.length} students`}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-800">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Student Name</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Grade Level</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider">RFID Number</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Last Updated</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{card.studentName}</td>
                    <td className="py-3 text-slate-500 dark:text-gray-400">{card.gradeLevel}</td>
                    <td className="py-3 font-mono text-slate-700 dark:text-gray-300 text-xs">
                      {card.rfidNumber ?? (
                        <span className="text-slate-400 dark:text-gray-500 not-italic font-sans">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${card.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-xs font-medium text-slate-700 dark:text-gray-200 capitalize">
                          {card.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400 text-xs">{card.lastScanned}</td>
                    <td className="py-3 text-right space-x-1">
                      <button
                        onClick={() => setEditModal({
                          open:        true,
                          userId:      card.id,
                          studentName: card.studentName,
                          currentRfid: card.rfidNumber,
                        })}
                        className="inline-flex items-center justify-center p-1.5 text-slate-400
                          hover:text-[#7B1113] dark:hover:text-[#E8C96A] transition-colors
                          rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
                        title="Update RFID Card"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center p-1.5 text-slate-400
                          hover:text-rose-600 dark:hover:text-rose-400 transition-colors
                          rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
                        title="Remove student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCards.length === 0 && (
              <div className="text-center py-10">
                <User className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">
                  {searchTerm ? `No students found matching "${searchTerm}"` : 'No students found.'}
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
            )}
          </div>
        </div>
      </main>

      <EditRfidModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, userId: '', studentName: '', currentRfid: null })}
        onSubmit={handleRfidUpdate}
        userId={editModal.userId}
        studentName={editModal.studentName}
        currentRfid={editModal.currentRfid}
      />
    </div>
  );
}