// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Megaphone, Users, Clock, Send, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
// import TeacherSidebar from '@/components/teacher/TeacherSidebar';
// import ThemeToggle from '@/components/ThemeToggle';

// interface TeacherUser { id: string; username: string; role: string; firstName: string; lastName: string; }
// interface Announcement { id: string; title: string; message: string; audience: 'all' | 'students' | 'parents'; sentAt: string; }
// type AudienceKey = 'all' | 'students' | 'parents';

// const AUDIENCE_CFG: Record<AudienceKey, { label: string; color: string }> = {
//   all:      { label: 'All',      color: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30' },
//   students: { label: 'Students', color: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] border-[#7B1113]/20 dark:border-[#E8C96A]/20' },
//   parents:  { label: 'Parents',  color: 'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-300 dark:border-green-500/30' },
// };

// const SAMPLE: Announcement[] = [
//   { id: '1', title: 'FSL Quiz this Friday',   message: 'There will be an FSL alphabet quiz this Friday. Please practice letters A–M.', audience: 'students', sentAt: 'May 9, 2026 2:30 PM'  },
//   { id: '2', title: 'No Classes on May 12',   message: 'No classes on May 12 in observance of the holiday.',                          audience: 'all',      sentAt: 'May 7, 2026 4:00 PM'  },
//   { id: '3', title: 'RFID Card Reminder',     message: 'Please tap your RFID card every morning to avoid an absent record.',          audience: 'students', sentAt: 'May 5, 2026 7:30 AM'  },
//   { id: '4', title: 'Parent-Teacher Meeting', message: 'Scheduled parent-teacher meeting on May 15 at 3 PM. Attendance required.',    audience: 'parents',  sentAt: 'May 3, 2026 9:00 AM'  },
// ];

// export default function TeacherAnnouncementsPage() {
//   const router = useRouter();
//   const [teacher, setTeacher]             = useState<TeacherUser | null>(null);
//   const [authLoading, setAuthLoading]     = useState(true);
//   const [announcements, setAnnouncements] = useState<Announcement[]>(SAMPLE);
//   const [search, setSearch]               = useState('');
//   const [filterAud, setFilterAud]         = useState<AudienceKey>('all');
//   const [title, setTitle]                 = useState('');
//   const [message, setMessage]             = useState('');
//   const [audience, setAudience]           = useState<AudienceKey>('all');
//   const [sending, setSending]             = useState(false);
//   const [sendSuccess, setSendSuccess]     = useState(false);
//   const [sendError, setSendError]         = useState('');

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const userData = localStorage.getItem('user');
//     if (!token || !userData) { router.push('/login'); return; }
//     try {
//       const parsed = JSON.parse(userData) as TeacherUser;
//       if (parsed.role !== 'TEACHER') { router.push('/login'); return; }
//       setTeacher(parsed);
//     } catch { router.push('/login'); }
//     finally { setAuthLoading(false); }
//   }, [router]);

//   const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); };

//   const handleSend = async () => {
//     if (!title.trim() || !message.trim()) { setSendError('Please fill in both the title and message.'); return; }
//     setSending(true); setSendError('');
//     try {
//       await new Promise((r) => setTimeout(r, 700));
//       const newAnn: Announcement = {
//         id: Date.now().toString(), title: title.trim(), message: message.trim(), audience,
//         sentAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
//       };
//       setAnnouncements((prev) => [newAnn, ...prev]);
//       setTitle(''); setMessage(''); setAudience('all');
//       setSendSuccess(true); setTimeout(() => setSendSuccess(false), 3000);
//     } catch { setSendError('Failed to send. Please try again.'); }
//     finally { setSending(false); }
//   };

//   if (authLoading || !teacher) return (
//     <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
//       <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
//     </div>
//   );

//   const filtered = announcements.filter((a) => {
//     const ms = a.title.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase());
//     const ma = filterAud === 'all' || a.audience === filterAud;
//     return ms && ma;
//   });

//   const summaryCards = [
//     { icon: Megaphone, label: 'Total Sent',  value: announcements.length,                                          iconBg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20', iconColor: 'text-[#7B1113] dark:text-[#E8C96A]'  },
//     { icon: Users,     label: 'To Students', value: announcements.filter((a) => a.audience !== 'parents').length,  iconBg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20', iconColor: 'text-[#7B1113] dark:text-[#E8C96A]'  },
//     { icon: Users,     label: 'To Parents',  value: announcements.filter((a) => a.audience !== 'students').length, iconBg: 'bg-emerald-100 dark:bg-green-500/10',   iconColor: 'text-emerald-600 dark:text-green-400' },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
//       <TeacherSidebar onLogout={handleLogout} />
//       <main className="ml-64 p-8">

//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold mb-1">Announcements</h1>
//             <p className="text-slate-500 dark:text-gray-400 text-sm">Send messages and updates to students and parents.</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <ThemeToggle />
//             <button onClick={() => router.push('/teacher/profile')} aria-label="View profile"
//               className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95">
//               {teacher.firstName?.[0]}{teacher.lastName?.[0]}
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           {summaryCards.map(({ icon: Icon, label, value, iconBg, iconColor }) => (
//             <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none flex items-center gap-4 transition-colors duration-200">
//               <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
//                 <Icon className={`w-6 h-6 ${iconColor}`} />
//               </div>
//               <div>
//                 <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
//                 <p className="text-3xl font-bold">{value}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//           {/* Compose */}
//           <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
//             <h2 className="text-xl font-bold mb-6">New Announcement</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Title</label>
//                 <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
//                   className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors" />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Send To</label>
//                 <div className="flex gap-2">
//                   {(['all', 'students', 'parents'] as AudienceKey[]).map((opt) => (
//                     <button key={opt} onClick={() => setAudience(opt)}
//                       className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${audience === opt ? 'bg-[#7B1113] text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'}`}>
//                       {opt}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Message</label>
//                 <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message here..." rows={6}
//                   className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors resize-none" />
//                 <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 text-right">{message.length} characters</p>
//               </div>
//               {sendError && (
//                 <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
//                   <XCircle className="w-4 h-4 text-red-500 shrink-0" />
//                   <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p>
//                 </div>
//               )}
//               {sendSuccess && (
//                 <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
//                   <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
//                   <p className="text-sm text-emerald-600 dark:text-emerald-400">Announcement sent successfully!</p>
//                 </div>
//               )}
//               <button onClick={handleSend} disabled={sending}
//                 className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
//                 {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
//                 {sending ? 'Sending...' : 'Send Announcement'}
//               </button>
//             </div>
//           </div>

//           {/* Log */}
//           <div className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
//             <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-gray-800">
//               <div className="relative flex-1 min-w-40">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
//                 <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..."
//                   className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors" />
//               </div>
//               <div className="flex items-center gap-2">
//                 <Filter className="w-4 h-4 text-slate-400 dark:text-gray-500" />
//                 {(['all', 'students', 'parents'] as AudienceKey[]).map((f) => (
//                   <button key={f} onClick={() => setFilterAud(f)}
//                     className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterAud === f ? 'bg-[#7B1113] text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'}`}>
//                     {f}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
//               {filtered.length === 0 ? (
//                 <div className="p-12 text-center">
//                   <Megaphone className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
//                   <p className="text-slate-400 dark:text-gray-500 text-sm">No announcements found</p>
//                 </div>
//               ) : filtered.map((ann) => {
//                 const cfg = AUDIENCE_CFG[ann.audience];
//                 return (
//                   <div key={ann.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
//                     <div className="w-11 h-11 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-xl flex items-center justify-center shrink-0">
//                       <Megaphone className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-start justify-between gap-2 mb-1">
//                         <p className="text-sm font-semibold text-slate-900 dark:text-white">{ann.title}</p>
//                         <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap shrink-0">{ann.sentAt}</span>
//                       </div>
//                       <p className="text-sm text-slate-500 dark:text-gray-400 truncate">{ann.message}</p>
//                       <div className="flex items-center gap-2 mt-2">
//                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
//                         <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
//                           <Clock className="w-3 h-3" />{ann.sentAt}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }