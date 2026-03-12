'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone, Send, Users, Clock,
  CheckCircle, Trash2, Plus, X,
} from 'lucide-react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string; section: string | null;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'parents' | 'students';
  createdAt: string;
  sentBy: string;
}

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  { id:'1', title:'Reminder: RFID Tap Required',    message:'Please remind students to tap their RFID cards every morning before entering the classroom.',                    audience:'parents',  createdAt:'Mar 12, 2026 • 8:00 AM', sentBy:'You' },
  { id:'2', title:'FSL Quiz this Friday',           message:'There will be an FSL alphabet quiz this Friday. Students should practice letters A to M using the app.',         audience:'students', createdAt:'Mar 11, 2026 • 2:30 PM', sentBy:'You' },
  { id:'3', title:'Parent-Teacher Meeting',         message:'A parent-teacher conference is scheduled for March 20, 2026 at 3:00 PM. Kindly confirm your attendance.',         audience:'parents',  createdAt:'Mar 10, 2026 • 9:00 AM', sentBy:'You' },
  { id:'4', title:'No Classes on March 25',         message:'There will be no classes on March 25 in observance of the holiday. Make-up classes will be announced soon.',      audience:'all',      createdAt:'Mar 9, 2026 • 4:00 PM',  sentBy:'You' },
];

const audienceConfig = {
  all:      { label: 'All',      color: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30' },
  parents:  { label: 'Parents',  color: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30' },
  students: { label: 'Students', color: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30' },
};

export default function AnnouncementsPage() {
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>(SAMPLE_ANNOUNCEMENTS);
  const [showForm, setShowForm]       = useState(false);
  const [title, setTitle]             = useState('');
  const [message, setMessage]         = useState('');
  const [audience, setAudience]       = useState<'all' | 'parents' | 'students'>('all');
  const [isSending, setIsSending]     = useState(false);
  const [sent, setSent]               = useState(false);
  const router                        = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const p = JSON.parse(userData) as User;
      if (p.role !== 'TEACHER') { router.push('/'); return; }
      setUser(p);
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setIsSending(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const newAnn: Announcement = {
        id: String(Date.now()),
        title: title.trim(),
        message: message.trim(),
        audience,
        createdAt: new Date().toLocaleDateString('en-US', {
          month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit',
        }),
        sentBy: 'You',
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
      setTitle('');
      setMessage('');
      setAudience('all');
      setShowForm(false);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
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
            <h1 className="text-3xl font-bold mb-2">Announcements</h1>
            <p className="text-slate-500 dark:text-gray-400">Send announcements to students and parents</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowForm((p) => !p)}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'New Announcement'}
            </button>
          </div>
        </div>

        {sent && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Announcement sent successfully!
            </p>
          </div>
        )}

        {/* Compose Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 mb-8 shadow-sm dark:shadow-none transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">New Announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  rows={4} placeholder="Write your announcement here..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors resize-none"
                />
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">{message.length}/500</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Send To</label>
                <div className="flex gap-3">
                  {(['all','students','parents'] as const).map((a) => (
                    <button key={a} onClick={() => setAudience(a)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                        audience === a
                          ? audienceConfig[a].color
                          : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'
                      }`}>
                      <Users className="w-4 h-4" />
                      {audienceConfig[a].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleSend} disabled={!title.trim() || !message.trim() || isSending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                  {isSending
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                  {isSending ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sent Announcements */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Sent Announcements <span className="text-slate-400 dark:text-gray-500 font-normal text-base">({announcements.length})</span>
          </h2>
          {announcements.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm dark:shadow-none">
              <Megaphone className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate-400 dark:text-gray-500">No announcements sent yet</p>
            </div>
          ) : (
            announcements.map((ann) => {
              const cfg = audienceConfig[ann.audience];
              return (
                <div key={ann.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">{ann.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {ann.createdAt}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Sent by {ann.sentBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(ann.id)}
                      className="p-2 text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
