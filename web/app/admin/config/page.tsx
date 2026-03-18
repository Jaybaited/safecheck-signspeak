'use client';

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Settings, 
  Wifi, 
  Cpu, 
  Bell, 
  Shield, 
  Save,
  AlertTriangle
} from 'lucide-react';

export default function ConfigurationPage() {
  // Dummy states for system toggles
  const [rfidEnabled, setRfidEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  
  // System parameters
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [semester, setSemester] = useState('2nd Semester');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-500">
      <Sidebar onLogout={() => console.log('Logout clicked')} />

      <main className="ml-64 p-8">
        {/* Header section with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Configuration</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Manage global settings, hardware status, and academic periods.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            {/* Academic Settings */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold">Academic Period</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-gray-400 mb-2">Active School Year</label>
                  <select 
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500 transition-colors text-slate-900 dark:text-white"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-gray-400 mb-2">Current Semester</label>
                  <select 
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500 transition-colors text-slate-900 dark:text-white"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hardware Services */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold">Hardware & Services</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-slate-500 dark:text-gray-400" /> RFID Scanners
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Enable or disable physical hardware check-ins.</p>
                  </div>
                  <button 
                    onClick={() => setRfidEnabled(!rfidEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${rfidEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${rfidEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-500 dark:text-gray-400" /> AI Vision Service
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Camera module for Filipino Sign Language recognition.</p>
                  </div>
                  <button 
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${aiEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Notifications */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold">Notifications</h2>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">SMS Alerts to Parents</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Automatically notify parents for late arrivals and absences.</p>
                </div>
                <button 
                  onClick={() => setSmsAlerts(!smsAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${smsAlerts ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${smsAlerts ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-900 border border-rose-200 dark:border-red-900/30 rounded-xl p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-100 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-rose-600 dark:text-red-400">Danger Zone</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-red-500/5 rounded-lg border border-rose-100 dark:border-red-500/10">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Reset Attendance Data</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Permanently delete all attendance records for the current semester.</p>
                  </div>
                  <button className="bg-white dark:bg-gray-900 border border-rose-200 dark:border-red-800 text-rose-600 dark:text-red-500 hover:bg-rose-50 dark:hover:bg-red-950 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    Reset Data
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
