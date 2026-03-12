'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone, Users, Clock, Search,
  Filter, Bell, BookOpen, CheckCircle,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'students' | 'parents';
  sentBy: string;
  createdAt: string;
  read: boolean;
}

// In production, filter by audience: 'all' | 'students' only
const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'FSL Quiz this Friday',
    message:
      'There will be an FSL alphabet quiz this Friday. Make sure to practice letters A to M using the FSL Learning and Games sections of the app. Good luck!',
    audience: 'students',
    sentBy: 'Mr. Santos',
    createdAt: 'Mar 11, 2026 • 2:30 PM',
    read: false,
  },
  {
    id: '2',
    title: 'No Classes on March 25',
    message:
      'There will be no classes on March 25 in observance of the holiday. Make-up classes will be announced at a later date. Enjoy the long weekend!',
    audience: 'all',
    sentBy: 'Mr. Santos',
    createdAt: 'Mar 9, 2026 • 4:00 PM',
    read: false,
  },
  {
    id: '3',
    title: 'RFID Card Reminder',
    message:
      'Please make sure to tap your RFID card every morning upon entering the classroom. Failure to tap will result in an absent record for the day.',
    audience: 'students',
    sentBy: 'Mr. Santos',
    createdAt: 'Mar 7, 2026 • 7:30 AM',
    read: true,
  },
  {
    id: '4',
    title: 'FSL Practice Challenge',
    message:
      'This week\'s challenge: Complete at least 5 letters in the FSL Games section. Top scorers by Friday will receive bonus recognition on the class leaderboard!',
    audience: 'students',
    sentBy: 'Mr. Santos',
    createdAt: 'Mar 5, 2026 • 1:00 PM',
    read: true,
  },
  {
    id: '5',
    title: 'Semester Schedule Reminder',
    message:
      'Please review the updated class schedule posted on the bulletin board. Any conflicts should be reported to the teacher immediately.',
    audience: 'all',
    sentBy: 'Mr. Santos',
    createdAt: 'Mar 3, 2026 • 9:00 AM',
    read: true,
  },
];

const audienceCfg = {
  all:      { label: 'All',      color: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30' },
  students: { label: 'Students', color: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30' },
  parents:  { label: 'Parents',  color: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30' },
};

type FilterType = 'all' | 'unread' | 'read';

export default function StudentAnnouncementsPage() {
  const [user, setUser]             = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>(SAMPLE_ANNOUNCEMENTS);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<FilterType>('all');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const router                      = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/'); return; }
      setUser(parsedUser);
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const markRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const markAllRead = () => {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
    markRead(id);
  };

  const filtered = announcements.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'unread' && !a.read) ||
      (filter === 'read' && a.read);
    return matchSearch && matchFilter;
  });

  const unreadCount = announcements.filter((a) => !a.read).length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              Announcements
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
              Messages and updates from your teacher
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Summary Chips */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Bell,       label: 'Total',  value: announcements.length,       color: 'text-slate-900 dark:text-white',      iconCls: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10' },
            { icon: Megaphone,  label: 'Unread', value: unreadCount,                color: 'text-red-600 dark:text-red-400',      iconCls: 'text-red-500 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-500/10' },
            { icon: CheckCircle,label: 'Read',   value: announcements.length - unreadCount, color: 'text-emerald-600 dark:text-green-400', iconCls: 'text-emerald-600 dark:text-green-400', bg: 'bg-emerald-100 dark:bg-green-500/10' },
          ].map(({ icon: Icon, label, value, color, iconCls, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none flex items-center gap-4 transition-colors duration-200">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${iconCls}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* List Card */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
          {/* Search + Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-gray-800">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search announcements..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 dark:text-gray-500" />
              {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Announcement Items */}
          <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Megaphone className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-gray-500">No announcements found</p>
              </div>
            ) : (
              filtered.map((ann) => {
                const aCfg    = audienceCfg[ann.audience];
                const isOpen  = expanded === ann.id;

                return (
                  <div
                    key={ann.id}
                    className={`transition-colors ${
                      !ann.read ? 'bg-purple-50/50 dark:bg-purple-500/5' : ''
                    }`}
                  >
                    {/* Header Row — always visible */}
                    <button
                      onClick={() => handleExpand(ann.id)}
                      className="w-full flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors text-left"
                    >
                      {/* Icon */}
                      <div className="w-11 h-11 bg-purple-100 dark:bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-semibold ${
                            ann.read
                              ? 'text-slate-700 dark:text-gray-300'
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {ann.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap">
                              {ann.createdAt}
                            </span>
                            {!ann.read && (
                              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        {/* Preview (when collapsed) */}
                        {!isOpen && (
                          <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
                            {ann.message}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${aCfg.color}`}>
                            {aCfg.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                            <Users className="w-3 h-3" />
                            {ann.sentBy}
                          </span>
                          {ann.read && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                              <Clock className="w-3 h-3" /> Read
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Message */}
                    {isOpen && (
                      <div className="px-5 pb-5 ml-[60px]">
                        <div className="bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-purple-500 shrink-0" />
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                              Full Message
                            </p>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                            {ann.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
