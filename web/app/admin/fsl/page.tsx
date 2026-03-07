'use client';

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  BookOpen, 
  Target, 
  Users, 
  Award, 
  Search, 
  Filter 
} from 'lucide-react';

export default function FSLProgressPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy stats for the UI
  const fslStats = {
    totalWords: 45,
    avgAccuracy: 88.5,
    activeLearners: 142,
    completedModules: 856,
  };

  // Dummy FSL progress records
  const progressLogs = [
    { 
      id: 1, 
      name: 'Juan Dela Cruz', 
      grade: 'Grade 10 - Rizal', 
      lastWord: 'Salamat (Thank You)', 
      attempts: 3, 
      accuracy: 92, 
      status: 'Completed',
      lastPracticed: 'Today, 08:15 AM'
    },
    { 
      id: 2, 
      name: 'Maria Clara', 
      grade: 'Grade 9 - Bonifacio', 
      lastWord: 'Kamusta (How are you)', 
      attempts: 5, 
      accuracy: 65, 
      status: 'Learning',
      lastPracticed: 'Today, 09:30 AM'
    },
    { 
      id: 3, 
      name: 'Pedro Penduko', 
      grade: 'Grade 8 - Luna', 
      lastWord: 'Alphabet: Letter A', 
      attempts: 1, 
      accuracy: 98, 
      status: 'Completed',
      lastPracticed: 'Yesterday'
    },
    { 
      id: 4, 
      name: 'Andres Bonifacio', 
      grade: 'Grade 12 - Mabini', 
      lastWord: 'Paalam (Goodbye)', 
      attempts: 8, 
      accuracy: 45, 
      status: 'Needs Practice',
      lastPracticed: '2 days ago'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-500">
      <Sidebar onLogout={() => console.log('Logout clicked')} />

      <main className="ml-64 p-8">
        {/* Header section with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">FSL Module Progress</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Track student engagement and accuracy in Filipino Sign Language recognition.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg px-3 py-2 shadow-sm transition-colors w-64">
              <Search className="w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm w-full focus:ring-0 outline-none text-slate-700 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Available Words</p>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{fslStats.totalWords}</h3>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Avg. AI Accuracy</p>
              <div className="w-8 h-8 bg-emerald-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-green-400">{fslStats.avgAccuracy}%</h3>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Active Learners</p>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{fslStats.activeLearners}</h3>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Total Completed</p>
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400">{fslStats.completedModules}</h3>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Student Progress Log</h2>
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
              Filter by Grade
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 text-slate-500 dark:text-gray-400 text-sm border-b border-slate-200 dark:border-gray-800">
                  <th className="p-4 font-medium">Student Name</th>
                  <th className="p-4 font-medium">Current Word</th>
                  <th className="p-4 font-medium">Attempts</th>
                  <th className="p-4 font-medium">AI Accuracy</th>
                  <th className="p-4 font-medium">Last Practiced</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {progressLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium">{log.name}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{log.grade}</p>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700 dark:text-gray-300">{log.lastWord}</td>
                    <td className="p-4 text-sm text-slate-500 dark:text-gray-400">{log.attempts}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{log.accuracy}%</span>
                        <div className="w-16 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              log.accuracy >= 80 ? 'bg-emerald-500' : log.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${log.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-gray-400">{log.lastPracticed}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        log.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                          : log.status === 'Learning'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
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