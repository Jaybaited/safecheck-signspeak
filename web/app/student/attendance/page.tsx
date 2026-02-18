'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

interface Stats {
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

export default function StudentAttendancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') {
        router.push('/');
        return;
      }
      setUser(parsedUser);
      fetchAttendanceData(parsedUser.id);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAttendanceData = async (studentId: string) => {
    try {
      const [statsData, attendanceData] = await Promise.all([
        api.getStudentStats(studentId),
        api.getStudentAttendance(studentId),
      ]);
      setStats(statsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatus = (record: AttendanceRecord) => {
    if (!record.timeIn) return 'absent';
    
    const timeIn = new Date(record.timeIn);
    const hours = timeIn.getHours();
    const minutes = timeIn.getMinutes();
    
    // Late if after 8:00 AM
    if (hours > 8 || (hours === 8 && minutes > 0)) {
      return 'late';
    }
    
    return 'present';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-400 border-green-500/50';
      case 'late':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
      case 'absent':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading || !user || !stats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <StudentSidebar onLogout={handleLogout} student={user} />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
            <p className="text-gray-400">
              Track your attendance and punctuality record
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Total Days</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalDays}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Present</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.present}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Late</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.late}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-400">Absent</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{stats.absent}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-gray-400">Attendance Rate</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {stats.attendanceRate}%
            </p>
          </div>
        </div>

        {/* Calendar and Recent Records */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Calendar</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeMonth('prev')}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium">
                  {selectedMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => changeMonth('next')}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid - Simplified for now */}
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 font-medium">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>

              <div className="text-center text-gray-500 py-8">
                Calendar view coming soon
              </div>

              {/* Legend */}
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-green-500/20 rounded"></div>
                  <span className="text-gray-400">Present</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-yellow-500/20 rounded"></div>
                  <span className="text-gray-400">Late</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-red-500/20 rounded"></div>
                  <span className="text-gray-400">Absent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Attendance Records */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Records</h2>
            </div>

            {attendance.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No attendance records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-800">
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Time In</th>
                      <th className="pb-3 font-medium">Time Out</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => {
                      const status = getStatus(record);
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-400">
                                {record.timeIn ? formatTime(record.timeIn) : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-400">
                                {record.timeOut ? formatTime(record.timeOut) : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  status
                                )}`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
