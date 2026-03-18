'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, User } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';

interface AuthUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface RfidCard {
  id: string;
  rfidNumber: string;
  studentName: string;
  gradeLevel: string;
  status: 'active' | 'unassigned';
  lastScanned: string;
}

interface ActivityLog {
  id: string;
  studentName: string;
  action: string;
  time: string;
  status: 'present' | 'late' | 'absent';
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
  { id: '1', studentName: 'Juan Dela Cruz', action: 'RFID tap', time: '07:30 AM', status: 'present' },
  { id: '2', studentName: 'Maria Clara', action: 'RFID tap', time: '07:45 AM', status: 'present' },
  { id: '3', studentName: 'Pedro Penduko', action: 'Manual', time: '07:45 AM', status: 'late' },
  { id: '4', studentName: 'Andres Bonifacio', action: '-', time: '08:00 AM', status: 'absent' },
];

export default function RfidManagement() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [rfidCards, setRfidCards] = useState<RfidCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    assignedCards: 0,
    unassignedCards: 0,
    safetyAlerts: 0,
  });

  const formatGradeLevel = (grade: string | null) => {
    if (!grade) return 'N/A';
    return grade.replace('GRADE_', 'Grade ');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const users = await api.getUsers();
      const students = users.filter((u) => u.role === 'STUDENT');

      const cards: RfidCard[] = students.map((s) => ({
        id: s.id,
        rfidNumber: s.rfidCard ?? 'Not Assigned',
        studentName: `${s.firstName} ${s.lastName}`,
        gradeLevel: formatGradeLevel(s.gradeLevel ?? null),
        status: s.rfidCard ? 'active' : 'unassigned',
        lastScanned: formatDate(s.updatedAt ?? s.createdAt),
      }));

      setRfidCards(cards);
      setStats({
        totalStudents: students.length,
        assignedCards: cards.filter((c) => c.status === 'active').length,
        unassignedCards: cards.filter((c) => c.status === 'unassigned').length,
        safetyAlerts: cards.filter((c) => c.status === 'unassigned').length,
      });
    } catch (err) {
      console.error('Failed to fetch RFID data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) { router.push('/login'); return; }

    try {
      const parsed = JSON.parse(userData) as AuthUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAuthUser(parsed);
      fetchData();
    } catch {
      router.push('/login');
    }
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const filteredCards = rfidCards.filter(
    (card) =>
      card.rfidNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !authUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-500">
      <Sidebar onLogout={handleLogout} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">RFID Management</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="relative w-64">
              <Search className="w-5 h-5 text-slate-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {authUser.firstName[0]}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Total Students</p>
            <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Assigned Cards</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-green-400">{stats.assignedCards}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Unassigned Cards</p>
            <p className="text-3xl font-bold mt-1 text-orange-600 dark:text-orange-400">{stats.unassignedCards}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Safety Alerts</p>
            <p className="text-3xl font-bold mt-1 text-rose-600 dark:text-red-400">{stats.safetyAlerts}</p>
          </div>
        </div>

        {/* Chart + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-1">Attendance & FSL Activity Overview</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
              Daily attendance vs FSL module engagement over the last 7 days.
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="fsl" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-6">Recent Attendance Logs</h2>
            <div className="space-y-4">
              {mockLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{log.studentName}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{log.time} · {log.action}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    log.status === 'present'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
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

        {/* Student Directory Table */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Student Directory</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Manage enrolled students and their RFID assignments.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/users')}
              className="bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-700 dark:hover:bg-cyan-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-gray-400 border-b border-slate-100 dark:border-gray-800">
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">Student Name</th>
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">Grade Level</th>
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">RFID Number</th>
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">Last Updated</th>
                  <th className="py-4 text-right font-semibold uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 pr-4 font-bold">{card.studentName}</td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-gray-400">{card.gradeLevel}</td>
                    <td className="py-4 pr-4 font-mono text-slate-700 dark:text-gray-300">{card.rfidNumber}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          card.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <span className="font-medium text-slate-700 dark:text-gray-200 capitalize">
                          {card.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-500 dark:text-gray-400">{card.lastScanned}</td>
                    <td className="py-4 text-right space-x-3">
                      <button
                        onClick={() => router.push('/admin/users')}
                        className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCards.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-gray-500 font-medium italic">
                {searchTerm ? `No students found matching "${searchTerm}"` : 'No students found.'}
              </div>
            )}
          </div>  
        </div>
      </main>
    </div>
  );
}

