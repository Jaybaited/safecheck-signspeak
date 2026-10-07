'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Plus, Trash2, XCircle, CheckCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import { getHolidays, addHoliday, deleteHoliday, Holiday } from '@/lib/calendar-api';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

const INPUT =
  'px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isWeekend(iso: string): boolean {
  const d = new Date(iso).getUTCDay();
  return d === 0 || d === 6;
}

export default function SchoolCalendarPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AdminUser;
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdminUser(parsed);
    } catch {
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHolidays(await getHolidays(year + '-01-01', year + '-12-31'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the calendar.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { if (adminUser) load(); }, [adminUser, load]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) { setError('Pick a date and type a name.'); return; }
    setSaving(true);
    setError('');
    try {
      await addHoliday(date, name.trim());
      const y = Number(date.slice(0, 4));
      setDate('');
      setName('');
      flash('Added to the calendar.');
      if (y !== year) setYear(y); else await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this day.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h: Holiday) => {
    if (!window.confirm('Remove "' + h.name + '" (' + formatDay(h.date) + ') from the calendar?')) return;
    setError('');
    try {
      await deleteHoliday(h.id);
      flash('Removed from the calendar.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this day.');
    }
  };

  if (authLoading || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={adminUser} />

      <main className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">School Calendar</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Days with no classes. They are not counted as absences in the attendance rate.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400">{success}</span>
          </div>
        )}

        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 mb-5 shadow-sm dark:shadow-none"
        >
          <h2 className="text-sm font-semibold mb-3">Add a day with no classes</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Name</label>
              <input
                type="text"
                value={name}
                maxLength={80}
                placeholder="e.g. Bonifacio Day"
                onChange={(e) => setName(e.target.value)}
                className={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> {saving ? 'Adding...' : 'Add day'}
            </button>
          </div>
        </form>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold">Days with no classes</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 rounded-full text-xs font-medium text-slate-500 dark:text-gray-400">
                {holidays.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setYear((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-16 text-center text-sm font-semibold">{year}</span>
              <button
                onClick={() => setYear((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Next year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-11 bg-slate-100 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : holidays.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">No days added for {year}</p>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                Add holidays and class suspensions above so the attendance rate stays fair.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-gray-800">
              {holidays.map((h) => (
                <li key={h.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="w-44 shrink-0 text-sm font-medium text-slate-700 dark:text-gray-200">{formatDay(h.date)}</div>
                  <div className="flex-1 min-w-0 text-sm text-slate-900 dark:text-white truncate">{h.name}</div>
                  {isWeekend(h.date) && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                      WEEKEND
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(h)}
                    className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    aria-label={'Remove ' + h.name}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Saturdays and Sundays are already left out of the attendance rate. Only add weekdays here.
            Enter the dates from your school&apos;s official calendar.
          </p>
        </div>
      </main>
    </div>
  );
}