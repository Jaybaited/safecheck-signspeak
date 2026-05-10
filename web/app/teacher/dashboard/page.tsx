// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { Users, CheckCircle, XCircle, TrendingUp, Calendar, Megaphone, FileText, RefreshCw } from 'lucide-react';
// import TeacherSidebar from '@/components/teacher/TeacherSidebar';
// import ThemeToggle from '@/components/ThemeToggle';

// interface TeacherUser { id: string; username: string; role: string; firstName: string; lastName: string; }
// interface DashboardStats { totalStudents: number; presentToday: number; absentToday: number; attendanceRate: number; }

// function SkeletonCard() {
//   return (
//     <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none animate-pulse">
//       <div className="flex items-center justify-between mb-4">
//         <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-lg" />
//         <div className="w-5 h-5 bg-slate-200 dark:bg-gray-700 rounded" />
//       </div>
//       <div className="w-24 h-3 bg-slate-200 dark:bg-gray-700 rounded mb-3" />
//       <div className="w-16 h-8 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
//       <div className="w-32 h-3 bg-slate-200 dark:bg-gray-700 rounded" />
//     </div>
//   );
// }

// export default function TeacherDashboardPage() {
//   const router = useRouter();
//   const [teacher,     setTeacher]     = useState<TeacherUser | null>(null);
//   const [authLoading, setAuthLoading] = useState(true);
//   const [stats,       setStats]       = useState<DashboardStats | null>(null);
//   const [dataLoading, setDataLoading] = useState(true);
//   const [dataError,   setDataError]   = useState<string | null>(null);

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

//   const fetchStats = useCallback(async (token: string) => {
//     setDataLoading(true); setDataError(null);
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error('Failed to fetch data');
//       const users = (await res.json()) as { role: string }[];
//       const students = users.filter((u) => u.role === 'STUDENT');
//       setStats({ totalStudents: students.length, presentToday: 0, absentToday: 0, attendanceRate: 0 });
//     } catch (err) {
//       setDataError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
//     } finally { setDataLoading(false); }
//   }, []);

//   useEffect(() => {
//     if (!teacher) return;
//     fetchStats(localStorage.getItem('token') ?? '');
//   }, [teacher, fetchStats]);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     router.push('/login');
//   };

//   if (authLoading || !teacher) {
//     return (
//       <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
//         <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   const statCards = [
//     { label: 'Total Students', value: stats?.totalStudents ?? '—', sub: 'enrolled in your class',
//       icon: Users, iconBg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20', iconColor: 'text-[#7B1113] dark:text-[#E8C96A]',
//       trend: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
//     { label: 'Present Today', value: stats?.presentToday ?? '—', sub: 'checked in today',
//       icon: CheckCircle, iconBg: 'bg-emerald-100 dark:bg-green-500/10', iconColor: 'text-emerald-600 dark:text-green-400',
//       trend: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
//     { label: 'Absent Today', value: stats?.absentToday ?? '—', sub: 'not yet checked in',
//       icon: XCircle, iconBg: 'bg-red-100 dark:bg-red-500/10', iconColor: 'text-red-500 dark:text-red-400',
//       trend: <XCircle className="w-5 h-5 text-red-400" /> },
//     { label: 'Attendance Rate', value: `${stats?.attendanceRate ?? 0}%`, sub: "today's rate",
//       icon: TrendingUp, iconBg: 'bg-[#C4972A]/10', iconColor: 'text-[#8B6818] dark:text-[#E8C96A]',
//       trend: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
//       <TeacherSidebar onLogout={handleLogout} />
//       <main className="ml-64 p-8">

//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold mb-1">Welcome back, {teacher.firstName}!</h1>
//             <p className="text-slate-500 dark:text-gray-400 text-sm">Here&apos;s your class overview for today.</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <ThemeToggle />
//             <button onClick={() => router.push('/teacher/profile')} aria-label="View profile"
//               className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95">
//               {teacher.firstName?.[0]}{teacher.lastName?.[0]}
//             </button>
//           </div>
//         </div>

//         {dataError && (
//           <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
//             <div className="flex items-center gap-3">
//               <XCircle className="w-5 h-5 text-red-500 shrink-0" />
//               <span className="text-red-700 dark:text-red-400">{dataError}</span>
//             </div>
//             <button onClick={() => fetchStats(localStorage.getItem('token') ?? '')}
//               className="flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:text-red-800 font-medium shrink-0 transition-colors">
//               <RefreshCw className="w-4 h-4" /> Retry
//             </button>
//           </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
//           {dataLoading
//             ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
//             : statCards.map((card) => (
//                 <div key={card.label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
//                   <div className="flex items-center justify-between mb-4">
//                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
//                       <card.icon className={`w-6 h-6 ${card.iconColor}`} />
//                     </div>
//                     {card.trend}
//                   </div>
//                   <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{card.label}</p>
//                   <h3 className="text-3xl font-bold">{card.value}</h3>
//                   <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">{card.sub}</p>
//                 </div>
//               ))}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
//             <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
//             <div className="text-center py-12">
//               <Calendar className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
//               <p className="text-slate-400 dark:text-gray-500 text-sm">No recent activity</p>
//               <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">Activity will appear once students start tapping in.</p>
//             </div>
//           </div>

//           <div className="flex flex-col gap-6">
//             <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
//               <h2 className="text-xl font-bold mb-5">Quick Actions</h2>
//               <div className="space-y-3">
//                 <button onClick={() => router.push('/teacher/announcements')}
//                   className="w-full flex items-center gap-3 p-4 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg transition-colors shadow-sm">
//                   <Megaphone className="w-5 h-5 shrink-0" />
//                   <span className="font-medium">Send Announcement</span>
//                 </button>
//                 <button onClick={() => router.push('/teacher/reports')}
//                   className="w-full flex items-center gap-3 p-4 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
//                   <FileText className="w-5 h-5 text-slate-500 dark:text-gray-400 shrink-0" />
//                   <span className="font-medium">View Reports</span>
//                 </button>
//               </div>
//             </div>

//             {!dataLoading && stats && (
//               <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
//                 <h2 className="text-xl font-bold mb-5">Class Summary</h2>
//                 <div className="grid grid-cols-2 gap-2 text-center">
//                   <div className="p-3 bg-emerald-50 dark:bg-green-500/10 rounded-lg">
//                     <p className="text-2xl font-bold text-emerald-600 dark:text-green-400">{stats.presentToday}</p>
//                     <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Present</p>
//                   </div>
//                   <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
//                     <p className="text-2xl font-bold text-red-500 dark:text-red-400">{stats.absentToday}</p>
//                     <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Absent</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }