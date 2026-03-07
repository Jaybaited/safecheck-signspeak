'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface RfidCard {
  id: string;
  rfidNumber: string;
  studentId: string;
  studentName: string;
  gradeLevel: string;
  status: 'active' | 'inactive' | 'lost' | 'unassigned';
  fslProgress: number;
  lastScanned: string;
}

interface ActivityLog {
  id: string;
  studentName: string;
  action: string;
  time: string;
  status: 'present' | 'late' | 'absent';
}

export default function RfidManagement() {
  const [rfidCards, setRfidCards] = useState<RfidCard[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 1248,
    attendanceToday: 92,
    fslModules: 84,
    safetyAlerts: 2,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback((cards: RfidCard[]) => {
    const totalStudents = cards.length;
    const attendanceToday = Math.round((cards.filter(c => c.status !== 'unassigned').length / totalStudents) * 100) || 0;
    const fslModules = cards.reduce((sum, c) => sum + c.fslProgress, 0) / totalStudents || 0;
    const safetyAlerts = cards.filter(c => c.status === 'lost' || c.status === 'unassigned').length;
    setStats({ totalStudents, attendanceToday, fslModules, safetyAlerts });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const mockCards: RfidCard[] = await new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: '1',
              rfidNumber: '0006022403',
              studentId: 'STU001',
              studentName: 'Juan Dela Cruz',
              gradeLevel: 'Grade 10 - Rizal',
              status: 'active',
              fslProgress: 80,
              lastScanned: '2026-02-18 14:30',
            },
            {
              id: '2',
              rfidNumber: '0006022404',
              studentId: 'STU002',
              studentName: 'Maria Clara',
              gradeLevel: 'Grade 9 - Bonifacio',
              status: 'active',
              fslProgress: 65,
              lastScanned: '2026-02-17 09:15',
            },
            {
              id: '3',
              rfidNumber: '0006022405',
              studentId: 'STU003',
              studentName: 'Pedro Penduko',
              gradeLevel: 'Grade 8 - Luna',
              status: 'unassigned',
              fslProgress: 10,
              lastScanned: '2026-02-16 16:45',
            },
          ]);
        }, 500);
      });

      const mockLogs: ActivityLog[] = [
        { id: '1', studentName: 'Juan Dela Cruz', action: 'RFID tap', time: '07:30 AM', status: 'present' },
        { id: '2', studentName: 'Maria Clara', action: 'RFID tap', time: '07:45 AM', status: 'present' },
        { id: '3', studentName: 'Pedro Penduko', action: 'Manual', time: '07:45 AM', status: 'late' },
        { id: '4', studentName: 'Andres Bonifacio', action: '-', time: '08:00 AM', status: 'absent' },
      ];

      setRfidCards(mockCards);
      setActivityLogs(mockLogs);
      calculateStats(mockCards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCards = rfidCards.filter(
    (card) =>
      card.rfidNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'inactive': return 'bg-amber-500';
      case 'lost': return 'bg-rose-500';
      case 'unassigned': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unassigned': return 'Unassigned';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const chartData = [
    { day: 'Mon', attendance: 900, fsl: 250 },
    { day: 'Tue', attendance: 950, fsl: 300 },
    { day: 'Wed', attendance: 1000, fsl: 400 },
    { day: 'Thu', attendance: 850, fsl: 350 },
    { day: 'Fri', attendance: 800, fsl: 300 },
    { day: 'Sat', attendance: 700, fsl: 200 },
    { day: 'Sun', attendance: 600, fsl: 150 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-500">
        <div className="text-slate-900 dark:text-white font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-500">
      <Sidebar onLogout={() => {}} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">RFID Management</h1>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <div className="relative w-64">
              <Search className="w-5 h-5 text-slate-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, logs..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-10 h-10 bg-linear-to-br from-pink-500 to-purple-600 rounded-full shadow-md"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Total Students</p>
            <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
            <p className="text-xs text-emerald-600 dark:text-green-400 mt-2 font-medium">↑ 1.2%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Today&apos;s Attendance</p>
            <p className="text-3xl font-bold mt-1">{stats.attendanceToday}%</p>
            <p className="text-xs text-emerald-600 dark:text-green-400 mt-2 font-medium">↑ 4%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">FSL Modules</p>
            <p className="text-3xl font-bold mt-1">{Math.round(stats.fslModules)}</p>
            <p className="text-xs text-emerald-600 dark:text-green-400 mt-2 font-medium">↑ 2.4%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Safety Alerts</p>
            <p className="text-3xl font-bold mt-1 text-rose-600 dark:text-red-400">{stats.safetyAlerts}</p>
            <p className="text-xs text-rose-600 dark:text-red-400 mt-2 font-medium">↓ 50%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
            <h2 className="text-lg font-bold mb-1">Attendance & FSL Activity Overview</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Comparing daily attendance vs FSL module engagement over the last 7 days.</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="fsl" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
            <h2 className="text-lg font-bold mb-6">Recent Attendance Logs</h2>
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-slate-500 dark:text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{log.studentName}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{log.time} • {log.action}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    log.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' :
                    log.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30' :
                    'bg-rose-50 text-rose-600 border-rose-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                  }`}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Student Directory</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage enrolled students and their RFID assignments.</p>
            </div>
            <button className="bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-700 dark:hover:bg-cyan-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm">
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
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">RFID Status</th>
                  <th className="py-4 pr-4 font-semibold uppercase tracking-wider text-xs">FSL Progress</th>
                  <th className="py-4 text-right font-semibold uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 pr-4 font-bold text-slate-900 dark:text-white">{card.studentName}</td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-gray-400">{card.gradeLevel}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(card.status)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></div>
                        <span className="font-medium text-slate-700 dark:text-gray-200">{getStatusText(card.status)}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="w-40 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700">
                        <div 
                          className="h-full bg-emerald-500 dark:bg-green-500 rounded-full transition-all duration-500" 
                          style={{ width: `${card.fslProgress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 text-right space-x-3">
                      <button className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
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
                No students found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}