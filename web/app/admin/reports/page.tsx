'use client';

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Download, 
  Filter, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock 
} from 'lucide-react';

export default function ReportsPage() {
  // We'll hook this up to your Prisma backend later
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Dummy stats for the UI design
  const summaryStats = {
    totalEnrolled: 150,
    present: 142,
    absent: 5,
    late: 3,
  };

  // Dummy attendance records
  const attendanceLogs = [
    { id: 1, name: 'Juan Dela Cruz', grade: 'Grade 10 - Rizal', timeIn: '07:15 AM', timeOut: '--:--', status: 'Present' },
    { id: 2, name: 'Maria Clara', grade: 'Grade 9 - Bonifacio', timeIn: '07:45 AM', timeOut: '--:--', status: 'Late' },
    { id: 3, name: 'Pedro Penduko', grade: 'Grade 8 - Luna', timeIn: '--:--', timeOut: '--:--', status: 'Absent' },
    { id: 4, name: 'Andres Bonifacio', grade: 'Grade 12 - Mabini', timeIn: '06:50 AM', timeOut: '04:00 PM', status: 'Present' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-500">
      {/* Sidebar - Note: Provide dummy onLogout or hook it up to your auth logic */}
      <Sidebar onLogout={() => console.log('Logout clicked')} />

      <main className="ml-64 p-8">
        {/* Header section with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Daily Attendance Report</h1>
            <p className="text-slate-500 dark:text-gray-400">
              View and export attendance records for SafeCheck-SignSpeak
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg px-3 py-2 shadow-sm transition-colors">
              <CalendarIcon className="w-5 h-5 text-slate-400 dark:text-gray-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none text-slate-700 dark:text-gray-200"
              />
            </div>

            <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Total Enrolled</p>
              <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-3xl font-bold">{summaryStats.totalEnrolled}</h3>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Present</p>
              <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-green-400">{summaryStats.present}</h3>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Late</p>
              <Clock className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summaryStats.late}</h3>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Absent</p>
              <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">{summaryStats.absent}</h3>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Attendance Log</h2>
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
              Filter Options
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 text-slate-500 dark:text-gray-400 text-sm border-b border-slate-200 dark:border-gray-800">
                  <th className="p-4 font-medium">Student Name</th>
                  <th className="p-4 font-medium">Grade Level</th>
                  <th className="p-4 font-medium">Time In</th>
                  <th className="p-4 font-medium">Time Out</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-sm font-medium">{log.name}</td>
                    <td className="p-4 text-sm text-slate-500 dark:text-gray-400">{log.grade}</td>
                    <td className="p-4 text-sm font-medium">{log.timeIn}</td>
                    <td className="p-4 text-sm text-slate-500 dark:text-gray-400">{log.timeOut}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        log.status === 'Present' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                          : log.status === 'Late'
                          ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}