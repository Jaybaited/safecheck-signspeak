// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { FileText, Download, Users, Megaphone, BookOpen, Search } from 'lucide-react';
// import TeacherSidebar from '@/components/teacher/TeacherSidebar';
// import ThemeToggle from '@/components/ThemeToggle';

// interface TeacherUser { id: string; username: string; role: string; firstName: string; lastName: string; }
// type ReportTab = 'announcements' | 'roster';

// const ANNOUNCEMENT_HISTORY = [
//   { title: 'FSL Quiz this Friday',   audience: 'Students', date: 'May 9, 2026',  recipients: 28 },
//   { title: 'No Classes on May 12',   audience: 'All',      date: 'May 7, 2026',  recipients: 54 },
//   { title: 'RFID Card Reminder',     audience: 'Students', date: 'May 5, 2026',  recipients: 28 },
//   { title: 'Parent-Teacher Meeting', audience: 'Parents',  date: 'May 3, 2026',  recipients: 26 },
//   { title: 'April Grade Update',     audience: 'Parents',  date: 'Apr 30, 2026', recipients: 26 },
// ];

// const SAMPLE_STUDENTS = [
//   { name: 'Ana Reyes',   id: 'STU-001', rfid: 'RFID-A1B2' },
//   { name: 'Ben Santos',  id: 'STU-002', rfid: 'RFID-C3D4' },
//   { name: 'Cara Flores', id: 'STU-003', rfid: 'RFID-E5F6' },
//   { name: 'Dan Cruz',    id: 'STU-004', rfid: 'RFID-G7H8' },
//   { name: 'Eva Garcia',  id: 'STU-005', rfid: 'RFID-I9J0' },
// ];

// const AUDIENCE_COLOR: Record<string, string> = {
//   All:      'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
//   Students: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A]',
//   Parents:  'bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400',
// };

// export default function TeacherReportsPage() {
//   const router = useRouter();
//   const [teacher, setTeacher]       = useState<TeacherUser | null>(null);
//   const [authLoading, setAuthLoading] = useState(true);
//   const [activeTab, setActiveTab]   = useState<ReportTab>('announcements');
//   const [search, setSearch]         = useState('');

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

//   if (authLoading || !teacher) return (
//     <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
//       <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
//     </div>
//   );

//   const filteredStudents = SAMPLE_STUDENTS.filter((s) =>
//     s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
//       <TeacherSidebar onLogout={handleLogout} />
//       <main className="ml-64 p-8">

//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold mb-1">Reports</h1>
//             <p className="text-slate-500 dark:text-gray-400 text-sm">Announcement history and class roster overview.</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <ThemeToggle />
//             <button onClick={() => router.push('/teacher/profile')} aria-label="View profile"
//               className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95">
//               {teacher.firstName?.[0]}{teacher.lastName?.[0]}
//             </button>
//           </div>
//         </div>

//         {/* Summary */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//           {[
//             { icon: Megaphone, label: 'Announcements Sent', value: ANNOUNCEMENT_HISTORY.length, bg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20', ic: 'text-[#7B1113] dark:text-[#E8C96A]' },
//             { icon: Users,     label: 'Students in Class',  value: SAMPLE_STUDENTS.length,      bg: 'bg-emerald-100 dark:bg-green-500/10',   ic: 'text-emerald-600 dark:text-green-400' },
//             { icon: BookOpen,  label: 'Assessment Reports', value: '—',                          bg: 'bg-cyan-100 dark:bg-cyan-500/10',       ic: 'text-cyan-600 dark:text-cyan-400' },
//           ].map(({ icon: Icon, label, value, bg, ic }) => (
//             <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none flex items-center gap-4 transition-colors duration-200">
//               <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
//                 <Icon className={`w-6 h-6 ${ic}`} />
//               </div>
//               <div>
//                 <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
//                 <p className="text-3xl font-bold">{value}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Phase 2 Notice */}
//         <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
//           <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
//           <div>
//             <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Assessment Reports — Phase 2</p>
//             <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
//               Detailed FSL assessment and quiz score reports will be available in Phase 2. Visit the Assessment page to learn more about this upcoming feature.
//             </p>
//           </div>
//         </div>

//         {/* Tab Panel */}
//         <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
//           <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-gray-800">
//             <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1 mr-auto">
//               <button onClick={() => setActiveTab('announcements')}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'announcements' ? 'bg-[#7B1113] text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
//                 <Megaphone className="w-4 h-4" /> Announcement Log
//               </button>
//               <button onClick={() => setActiveTab('roster')}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-[#7B1113] text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
//                 <Users className="w-4 h-4" /> Class Roster
//               </button>
//             </div>
//             <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
//               <Download className="w-4 h-4" /> Export
//             </button>
//           </div>

//           {activeTab === 'announcements' && (
//             <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
//               {ANNOUNCEMENT_HISTORY.map((a, i) => (
//                 <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
//                   <div className="w-10 h-10 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-lg flex items-center justify-center shrink-0">
//                     <Megaphone className="w-5 h-5 text-[#7B1113] dark:text-[#E8C96A]" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
//                     <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{a.date} · Sent to {a.recipients} recipients</p>
//                   </div>
//                   <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${AUDIENCE_COLOR[a.audience]}`}>{a.audience}</span>
//                 </div>
//               ))}
//             </div>
//           )}

//           {activeTab === 'roster' && (
//             <div>
//               <div className="p-4 border-b border-slate-200 dark:border-gray-800">
//                 <div className="relative max-w-sm">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
//                   <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..."
//                     className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors" />
//                 </div>
//               </div>
//               <table className="w-full">
//                 <thead>
//                   <tr className="text-left border-b border-slate-200 dark:border-gray-800">
//                     {['Name', 'Student ID', 'RFID Tag', 'Status'].map((h) => (
//                       <th key={h} className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
//                   {filteredStudents.map((s) => (
//                     <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
//                       <td className="px-6 py-4">
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 bg-[#7B1113]/10 dark:bg-[#7B1113]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#7B1113] dark:text-[#E8C96A] shrink-0 select-none">
//                             {s.name.split(' ').map((n) => n[0]).join('')}
//                           </div>
//                           <span className="text-sm font-medium">{s.name}</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-500 dark:text-gray-400 font-mono">{s.id}</td>
//                       <td className="px-6 py-4 text-sm text-slate-500 dark:text-gray-400 font-mono">{s.rfid}</td>
//                       <td className="px-6 py-4">
//                         <span className="px-2.5 py-1 bg-emerald-100 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 rounded-full text-xs font-medium">Active</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }