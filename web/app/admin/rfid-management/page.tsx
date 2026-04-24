'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, User, X } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
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
  id: string; studentName: string; action: string;
  time: string; status: 'present' | 'late' | 'absent';
}

const chartData = [
  { day: 'Mon', attendance: 900, fsl: 250 },
  { day: 'Tue', attendance: 950, fsl: 300 },
  { day: 'Wed', attendance: 1000, fsl: 400 },
  { day: 'Thu', attendance: 850, fsl: 350 },
  { day: 'Fri', attendance: 800, fsl: 300 },
  { day: 'Sat', attendance: 700, fsl: 200 },
  { day: 'Sun', attendance: 600, fsl: 150 },
];

const mockLogs: ActivityLog[] = [
  { id: '1', studentName: 'Juan Dela Cruz',  action: 'RFID tap', time: '07:30 AM', status: 'present' },
  { id: '2', studentName: 'Maria Clara',      action: 'RFID tap', time: '07:45 AM', status: 'present' },
  { id: '3', studentName: 'Pedro Penduko',    action: 'Manual',   time: '07:45 AM', status: 'late'    },
  { id: '4', studentName: 'Andres Bonifacio', action: '-',        time: '08:00 AM', status: 'absent'  },
];

export default function RfidManagement() {
  const router = useRouter();

  const [authUser,  setAuthUser]  = useState<AuthUser | null>(null);
  const [rfidCards, setRfidCards] = useState<RfidCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0, assignedCards: 0,
    unassignedCards: 0, safetyAlerts: 0,
  });

  // Edit RFID modal state
  const [editModal, setEditModal] = useState<{
    open: boolean;
    userId: string;
    studentName: string;
    currentRfid: string | null;
  }>({ open: false, userId: '', studentName: '', currentRfid: null });

  const formatGradeLevel = (g: string | null) => g ? g.replace('GRADE_', 'Grade ') : 'N/A';
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fetchData = useCallback(async () => {
    try {
      const users    = await api.getUsers();
      const students = users.filter((u) => u.role === 'STUDENT');
      const cards: RfidCard[] = students.map((s) => ({
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
    } catch (err) {
      console.error('Failed to fetch RFID data:', err);
    } finally {
      setLoading(false);
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
    } catch { router.push('/login'); }
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Handle RFID update submission
  const handleRfidUpdate = async (userId: string, rfidCard: string) => {
    await api.updateUser(userId, { rfidCard });
    await fetchData();
  };

  // Live search — inside the directory only
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
    { label: 'Total Students',   value: stats.totalStudents,   color: 'text-slate-900 dark:text-white'          },
    { label: 'Assigned Cards',   value: stats.assignedCards,   color: 'text-emerald-600 dark:text-emerald-400'  },
    { label: 'Unassigned Cards', value: stats.unassignedCards, color: 'text-orange-600 dark:text-orange-400'    },
    { label: 'Safety Alerts',    value: stats.safetyAlerts,    color: 'text-rose-600 dark:text-red-400'         },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={authUser} />

      <main className="ml-64 p-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">RFID Management</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Monitor student RFID cards and attendance activity
            </p>
          </div>
          {/* No bell or profile — just theme toggle */}
          <ThemeToggle />
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between"
            >
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-snug">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Chart + Logs ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-xl shadow-sm">
            <h2 className="text-base font-bold mb-1">Attendance & FSL Activity</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-5">
              Daily attendance vs FSL engagement — last 7 days
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fsl"        stroke="#7B1113" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-xl shadow-sm">
            <h2 className="text-base font-bold mb-4">Recent Attendance Logs</h2>
            <div className="space-y-3">
              {mockLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{log.studentName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400">{log.time} · {log.action}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
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
          </div>
        </div>

        {/* ── Student Directory ───────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-xl shadow-sm">

          {/* Directory toolbar — search is HERE, inside the section */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold">Student Directory</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Manage enrolled students and their RFID assignments
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search — inside directory */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-52 pl-9 pr-8 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add Student → goes to users page */}
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>

          {/* Results count when searching */}
          {searchTerm && (
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
              {filteredCards.length === 0
                ? `No students found for "${searchTerm}"`
                : `Showing ${filteredCards.length} of ${rfidCards.length} students`}
            </p>
          )}

          {/* Table */}
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
                      {card.rfidNumber ?? <span className="text-slate-400 dark:text-gray-500 not-italic">Not Assigned</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${card.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-xs font-medium text-slate-700 dark:text-gray-200 capitalize">{card.status}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400 text-xs">{card.lastScanned}</td>
                    <td className="py-3 text-right space-x-1">
                      {/* Edit — opens RFID update modal */}
                      <button
                        onClick={() => setEditModal({
                          open:        true,
                          userId:      card.id,
                          studentName: card.studentName,
                          currentRfid: card.rfidNumber,
                        })}
                        className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-[#7B1113] dark:hover:text-[#E8C96A] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
                        title="Update RFID Card"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
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

      {/* Edit RFID Modal */}
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