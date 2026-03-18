'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Search, TrendingUp, Award,
  Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string; section: string | null;
}

interface StudentProgress {
  id: string;
  name: string;
  completed: number;
  total: number;
  streak: number;
  lastActive: string;
  letters: string[];
}

const FSL_LETTERS = ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];

const SAMPLE_PROGRESS: StudentProgress[] = [
  { id:'s1',  name:'Ana Reyes',        completed:22, total:24, streak:14, lastActive:'Today',      letters:['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W'] },
  { id:'s2',  name:'Diana Cruz',       completed:21, total:24, streak:11, lastActive:'Today',      letters:['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V'] },
  { id:'s3',  name:'Faith Lim',        completed:19, total:24, streak:9,  lastActive:'Yesterday',  letters:['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T'] },
  { id:'s4',  name:'Carlo Santos',     completed:17, total:24, streak:7,  lastActive:'Yesterday',  letters:['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R'] },
  { id:'s5',  name:'Marco Bautista',   completed:16, total:24, streak:6,  lastActive:'2 days ago', letters:['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q'] },
  { id:'s6',  name:'Hannah Reyes',     completed:14, total:24, streak:5,  lastActive:'Today',      letters:['A','B','C','D','E','F','G','H','I','K','L','M','N','O'] },
  { id:'s7',  name:'Gabriel Torres',   completed:12, total:24, streak:4,  lastActive:'3 days ago', letters:['A','B','C','D','E','F','G','H','I','K','L','M'] },
  { id:'s8',  name:'Julia Santos',     completed:10, total:24, streak:3,  lastActive:'Yesterday',  letters:['A','B','C','D','E','F','G','H','I','K'] },
  { id:'s9',  name:'Kevin Mendoza',    completed:8,  total:24, streak:2,  lastActive:'4 days ago', letters:['A','B','C','D','E','F','G','H'] },
  { id:'s10', name:'Enzo Villanueva',  completed:5,  total:24, streak:1,  lastActive:'1 week ago', letters:['A','B','C','D','E'] },
  { id:'s11', name:'Laura Bautista',   completed:4,  total:24, streak:0,  lastActive:'2 weeks ago',letters:['A','B','C','D'] },
  { id:'s12', name:'Ivan Castillo',    completed:2,  total:24, streak:0,  lastActive:'3 weeks ago',letters:['A','B'] },
];

type SortKey = 'name' | 'completed' | 'streak';

export default function FSLProgressPage() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('completed');
  const [sortAsc, setSortAsc]     = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const router                    = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as User;
      if (p.role !== 'TEACHER') { router.push('/login'); return; }
      setUser(p);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...SAMPLE_PROGRESS]
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = sortKey === 'name' ? a.name.localeCompare(b.name) : (a[sortKey] - b[sortKey]);
      return sortAsc ? v : -v;
    });

  const avgCompleted = Math.round(SAMPLE_PROGRESS.reduce((acc, s) => acc + s.completed, 0) / SAMPLE_PROGRESS.length);
  const avgPct       = Math.round((avgCompleted / 24) * 100);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)
      : <ChevronDown className="w-3.5 h-3.5 opacity-30" />;

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
            <h1 className="text-3xl font-bold mb-2">FSL Progress</h1>
            <p className="text-slate-500 dark:text-gray-400">Monitor your students&apos; Filipino Sign Language progress</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Class Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,     label: 'Total Students',   value: SAMPLE_PROGRESS.length,                                                           color: 'text-slate-900 dark:text-white',      iconCls: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-100 dark:bg-cyan-500/10' },
            { icon: TrendingUp,label: 'Class Avg',         value: `${avgPct}%`,                                                                     color: 'text-purple-600 dark:text-purple-400',iconCls: 'text-purple-600 dark:text-purple-400',bg: 'bg-purple-100 dark:bg-purple-500/10' },
            { icon: Award,     label: 'Above 75%',         value: SAMPLE_PROGRESS.filter((s) => (s.completed/s.total) >= 0.75).length,              color: 'text-emerald-600 dark:text-green-400',iconCls: 'text-emerald-600 dark:text-green-400',bg: 'bg-emerald-100 dark:bg-green-500/10' },
            { icon: BookOpen,  label: 'Needs Attention',   value: SAMPLE_PROGRESS.filter((s) => (s.completed/s.total) < 0.5).length,               color: 'text-orange-600 dark:text-orange-400',iconCls: 'text-orange-600 dark:text-orange-400',bg: 'bg-orange-100 dark:bg-orange-500/10' },
          ].map(({ icon: Icon, label, value, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${iconCls}`} />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {/* Search */}
          <div className="p-5 border-b border-slate-200 dark:border-gray-800">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-gray-800">
              <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Student <SortIcon k="name" />
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('completed')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Progress <SortIcon k="completed" />
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('streak')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Streak <SortIcon k="streak" />
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">Last Active</th>
                <th className="px-6 py-3 font-medium">Letters</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const pct     = Math.round((s.completed / s.total) * 100);
                const isOpen  = expanded === s.id;
                const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400';
                return (
                  <>
                    <tr key={s.id}
                      className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : s.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {s.name.split(' ').map((n) => n[0]).join('').slice(0,2)}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                            {s.completed}/{s.total}
                          </span>
                          <span className={`text-xs font-bold ${pct >= 75 ? 'text-emerald-600 dark:text-green-400' : pct >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${s.streak > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-gray-500'}`}>
                          {s.streak > 0 ? `🔥 ${s.streak} days` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-gray-400">{s.lastActive}</span>
                      </td>
                      <td className="px-6 py-4">
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                        }
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${s.id}-detail`} className="bg-slate-50 dark:bg-gray-800/40">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                            Completed Letters
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {FSL_LETTERS.map((l) => {
                              const done = s.letters.includes(l);
                              return (
                                <div key={l} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                                  done
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500'
                                }`}>
                                  {l}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

