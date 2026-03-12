'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck, CheckCircle, XCircle, Clock,
  Save, RotateCcw, Users, Search,
} from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string; section: string | null;
}

interface Student {
  id: string;
  name: string;
  status: 'present' | 'late' | 'absent' | null;
  timeIn: string;
}

const CLASS_LIST: Omit<Student, 'status' | 'timeIn'>[] = [
  { id:'s1',  name:'Ana Reyes' },
  { id:'s2',  name:'Carlo Santos' },
  { id:'s3',  name:'Diana Cruz' },
  { id:'s4',  name:'Enzo Villanueva' },
  { id:'s5',  name:'Faith Lim' },
  { id:'s6',  name:'Gabriel Torres' },
  { id:'s7',  name:'Hannah Reyes' },
  { id:'s8',  name:'Ivan Castillo' },
  { id:'s9',  name:'Julia Santos' },
  { id:'s10', name:'Kevin Mendoza' },
  { id:'s11', name:'Laura Bautista' },
  { id:'s12', name:'Marco dela Cruz' },
];

export default function MarkAttendancePage() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [students, setStudents]   = useState<Student[]>([]);
  const [search, setSearch]       = useState('');
  const [isSaving, setIsSaving]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const router                    = useRouter();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const p = JSON.parse(userData) as User;
      if (p.role !== 'TEACHER') { router.push('/'); return; }
      setUser(p);
      setStudents(CLASS_LIST.map((s) => ({ ...s, status: null, timeIn: nowTime })));
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const setStatus = (id: string, status: Student['status']) => {
    setStudents((prev) => prev.map((s) =>
      s.id === id ? { ...s, status, timeIn: status === 'absent' ? '—' : nowTime } : s
    ));
  };

  const markAll = (status: Student['status']) => {
    setStudents((prev) => prev.map((s) => ({
      ...s, status, timeIn: status === 'absent' ? '—' : nowTime,
    })));
  };

  const reset = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: null, timeIn: nowTime })));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Replace with real API call
      await new Promise((r) => setTimeout(r, 800));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    present: students.filter((s) => s.status === 'present').length,
    late:    students.filter((s) => s.status === 'late').length,
    absent:  students.filter((s) => s.status === 'absent').length,
    unmarked: students.filter((s) => s.status === null).length,
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <TeacherSidebar onLogout={handleLogout} teacher={user} />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mark Attendance</h1>
            <p className="text-slate-500 dark:text-gray-400">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm transition-colors">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button onClick={handleSave} disabled={counts.unmarked > 0 || isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Attendance saved successfully for {today}!
            </p>
          </div>
        )}

        {/* Progress Banner */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 mb-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" /> {counts.present} Present
              </span>
              <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium">
                <Clock className="w-4 h-4" /> {counts.late} Late
              </span>
              <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                <XCircle className="w-4 h-4" /> {counts.absent} Absent
              </span>
              {counts.unmarked > 0 && (
                <span className="text-slate-400 dark:text-gray-500">{counts.unmarked} unmarked</span>
              )}
            </div>
            {/* Mark All */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 dark:text-gray-500 mr-1">Mark all:</span>
              <button onClick={() => markAll('present')}
                className="px-3 py-1.5 bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 rounded-lg font-medium hover:bg-emerald-200 dark:hover:bg-green-500/20 transition-colors">
                Present
              </button>
              <button onClick={() => markAll('absent')}
                className="px-3 py-1.5 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
                Absent
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-0.5">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(counts.present / students.length) * 100}%` }} />
            <div className="h-full bg-yellow-400 transition-all duration-300"  style={{ width: `${(counts.late    / students.length) * 100}%` }} />
            <div className="h-full bg-red-400 transition-all duration-300"     style={{ width: `${(counts.absent  / students.length) * 100}%` }} />
          </div>
        </div>

        {/* Search + Student List */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="p-5 border-b border-slate-200 dark:border-gray-800">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
            {filtered.map((student) => (
              <div key={student.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {student.name.split(' ').map((n) => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                  {student.status && student.status !== 'absent' && (
                    <p className="text-xs text-slate-400 dark:text-gray-500">Time in: {student.timeIn}</p>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="flex items-center gap-2">
                  {(['present','late','absent'] as const).map((s) => {
                    const colors = {
                      present: 'bg-emerald-600 text-white',
                      late:    'bg-yellow-500 text-white',
                      absent:  'bg-red-500 text-white',
                    };
                    const inactive = 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700';
                    return (
                      <button key={s} onClick={() => setStatus(student.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          student.status === s ? colors[s] : inactive
                        }`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {counts.unmarked > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-800 text-center">
              <p className="text-sm text-slate-400 dark:text-gray-500">
                <span className="text-orange-500 font-semibold">{counts.unmarked} students</span> still need to be marked before saving
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
