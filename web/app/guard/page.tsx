'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, RefreshCw, CheckCircle, XCircle, Loader2, User as UserIcon, Clock, AlertTriangle, Activity, Calendar } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import { ALL_GRADES, gradeText } from '@/lib/grade';
import { getGateBoard, getGatePhoto, getGateRecent, markGate, GateBoard, GateStudent, GateReason, GateRecentRow, GateFilter } from '@/lib/gate-api';

interface AuthUser { id: string; username: string; role: string; firstName: string; lastName: string }

const REASONS: { value: GateReason; label: string }[] = [
  { value: 'FORGOT_CARD',      label: 'Forgot the card' },
  { value: 'CARD_LOST',        label: 'Card lost, replacement pending' },
  { value: 'CARD_NOT_WORKING', label: 'Card not working' },
  { value: 'OTHER',            label: 'Other (write a note)' },
];

const FIELD =
  'px-3 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors';

const manilaTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }) : '';

const rowTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' }) : '--:--';

function statePill(s: GateStudent): { text: string; cls: string } {
  if (s.state === 'CHECKED_IN')  return { text: 'In ' + manilaTime(s.timeIn),  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' };
  if (s.state === 'CHECKED_OUT') return { text: 'Out ' + manilaTime(s.timeOut), cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' };
  if (s.state === 'NO_TAP_OUT')  return { text: 'In ' + manilaTime(s.timeIn) + ', no out', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' };
  return { text: 'Not in yet', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' };
}

function cardBadge(status: GateStudent['cardStatus']) {
  if (status === 'LOST')      return { text: 'Card LOST',      cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' };
  if (status === 'SUSPENDED') return { text: 'Card SUSPENDED', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' };
  return null;
}

export default function GateDeskPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<GateFilter>('ALL');
  const [board, setBoard] = useState<GateBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<GateStudent | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [markAction, setMarkAction] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [reason, setReason] = useState<GateReason>('FORGOT_CARD');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [events, setEvents] = useState<GateRecentRow[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData) as AuthUser;
      if (parsed.role !== 'GUARD' && parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setUser(parsed);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const b = await getGateBoard(q, filter);
      setBoard(b);
      setError(null);
      setSelected((cur) => (cur ? b.data.find((s) => s.id === cur.id) ?? cur : cur));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the board.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, filter]);

  useEffect(() => {
    if (!user) return;
    void load();
    const t = setInterval(() => void load(true), 30000);
    return () => clearInterval(t);
  }, [user, load]);

  useEffect(() => {
    if (!user) return;
    let off = false;
    const pull = () =>
      getGateRecent(30)
        .then((r) => { if (!off) setEvents(r.rows); })
        .catch(() => { /* the next pull will try again */ });
    void pull();
    const t = setInterval(pull, 5000);
    return () => { off = true; clearInterval(t); };
  }, [user]);

  useEffect(() => {
    setPhotoUrl(null);
    if (!selected || !selected.hasPhoto) return;
    let off = false;
    getGatePhoto(selected.id)
      .then((r) => { if (!off) setPhotoUrl(r.url); })
      .catch(() => { /* no photo */ });
    return () => { off = true; };
  }, [selected?.id, selected?.hasPhoto]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 6000);
  };

  const openMark = (action: 'CHECK_IN' | 'CHECK_OUT') => {
    setMarkAction(action);
    setReason('FORGOT_CARD');
    setNote('');
    setMarkError(null);
  };

  const doMark = async () => {
    if (!selected || !markAction || busy) return;
    if (reason === 'OTHER' && note.trim().length < 3) { setMarkError('Please write a short note.'); return; }
    setBusy(true);
    setMarkError(null);
    try {
      const res = await markGate({
        studentId: selected.id,
        action: markAction,
        reason,
        note: reason === 'OTHER' ? note.trim() : undefined,
      });
      setMarkAction(null);
      flash(res.message);
      await load(true);
    } catch (e) {
      setMarkError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rows = board?.data ?? [];
  const totals = board?.totals;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-slate-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">Gate Desk</h1>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Today only{board ? ' · ' + new Date(board.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-gray-400 hidden sm:block">{user.firstName} {user.lastName}</span>
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} />
          </button>
          <ThemeToggle />
          {user.role === 'ADMIN' && (
            <a href="/admin/dashboard" className="text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline">Admin</a>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {toast && (
          <div className="mb-4 flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400">{toast}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {([
            { key: 'ALL' as GateFilter,         label: 'All students', value: totals?.students ?? 0,   color: 'text-slate-900 dark:text-white' },
            { key: 'IN_SCHOOL' as GateFilter,   label: 'In school',    value: totals?.inSchool ?? 0,   color: 'text-emerald-600 dark:text-emerald-400' },
            { key: 'CHECKED_OUT' as GateFilter, label: 'Checked out',  value: totals?.checkedOut ?? 0, color: 'text-blue-600 dark:text-blue-400' },
            { key: 'NOT_IN' as GateFilter,      label: 'Not in yet',   value: totals?.notIn ?? 0,      color: 'text-slate-500 dark:text-gray-400' },
          ]).map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={'rounded-xl px-4 py-3 flex items-center justify-between text-left border transition-colors ' +
                (filter === c.key
                  ? 'bg-[#7B1113]/5 dark:bg-[#7B1113]/10 border-[#7B1113]'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50')}
            >
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{c.label}</p>
              <p className={'text-2xl font-bold ' + c.color}>{c.value}</p>
            </button>
          ))}
        </div>

        <section className="mb-4 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                <Activity className="w-2.5 h-2.5" /> Live
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-gray-500">Today only</span>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-gray-500 text-sm">No activity yet today</p>
              <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">Activity will appear once students start tapping in</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-2 px-3 pb-2 border-b border-slate-100 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Student</p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Time In</p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Time Out</p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Status</p>
              </div>
              <div className="space-y-0.5 mt-1 max-h-72 overflow-y-auto">
                {events.map((log) => (
                  <button
                    key={log.studentId}
                    onClick={() => setQInput(log.lastName)}
                    title="Find this student in the list"
                    className="w-full grid grid-cols-4 gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {log.firstName[0]}{log.lastName[0]}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {log.firstName} {log.lastName}
                      </span>
                    </div>
                    <p className={'text-xs font-medium ' + (log.timeIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500')}>
                      {rowTime(log.timeIn)}
                    </p>
                    <p className={'text-xs font-medium ' + (log.timeOut ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-500')}>
                      {rowTime(log.timeOut)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {log.status === 'LATE' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20">LATE</span>
                      )}
                      {log.status === 'PRESENT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">PRESENT</span>
                      )}
                      {log.noTapOut && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">NO TAP-OUT</span>
                      )}
                      {log.manual && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">BY HAND</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
          {/* Student list */}
          <section className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Search a student by name..."
                  className={FIELD + ' pl-9 w-full'}
                />
              </div>
              <div className="flex items-center gap-1">
                {([
                  { key: 'ALL' as GateFilter, label: 'All' },
                  { key: 'IN_SCHOOL' as GateFilter, label: 'In school' },
                  { key: 'CHECKED_OUT' as GateFilter, label: 'Checked out' },
                  { key: 'NOT_IN' as GateFilter, label: 'Not in yet' },
                ]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ' +
                      (filter === t.key
                        ? 'bg-[#7B1113]/10 border-[#7B1113]/30 text-[#7B1113] dark:text-[#E8C96A]'
                        : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400 dark:text-gray-500">{filter === 'IN_SCHOOL' ? 'Nobody is inside right now.' : 'No students match.'}</p>
            ) : (
              <div className="max-h-[62vh] overflow-y-auto space-y-1.5 pr-1">
                {rows.map((s) => {
                  const pill = statePill(s);
                  const cb = cardBadge(s.cardStatus);
                  const active = selected?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className={'w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ' +
                        (active
                          ? 'border-[#7B1113] bg-[#7B1113]/5 dark:bg-[#7B1113]/10'
                          : 'border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{s.lastName}, {s.firstName}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {s.gradeLevel ? gradeText(s.gradeLevel) : 'No grade'} · {s.cardLast4 ? 'Card ••••' + s.cardLast4 : 'No card'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={'px-2 py-0.5 rounded-full text-[11px] font-medium border ' + pill.cls}>{pill.text}</span>
                        {cb && <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold border ' + cb.cls}>{cb.text}</span>}
                        {s.manual && <span className="text-[10px] text-slate-400 dark:text-gray-500">Manual</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {rows.length >= 100 && (
              <p className="mt-2 text-xs text-slate-400 dark:text-gray-500">Showing the first 100. Type a name or pick a grade to narrow the list.</p>
            )}
          </section>

          {/* Selected student */}
          <section className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 lg:sticky lg:top-20">
            {!selected ? (
              <div className="py-16 text-center">
                <UserIcon className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-gray-400">Pick a student to see the photo and mark a check in or out.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-48 h-60 rounded-2xl overflow-hidden bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-center">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-14 h-14 text-slate-300 dark:text-gray-600" />
                  )}
                </div>
                {!selected.hasPhoto && <p className="text-xs text-slate-400 dark:text-gray-500">No photo on file.</p>}
                <div>
                  <p className="text-xl font-bold">{selected.firstName} {selected.lastName}</p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    {selected.gradeLevel ? gradeText(selected.gradeLevel) : 'No grade'} · {selected.cardLast4 ? 'Card ••••' + selected.cardLast4 : 'No card'}
                  </p>
                </div>

                {cardBadge(selected.cardStatus) && (
                  <div className="w-full flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      This card is {selected.cardStatus === 'LOST' ? 'reported lost' : 'suspended'}. Check the photo carefully before you let anyone in.
                    </p>
                  </div>
                )}

                <div className="w-full flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className={'px-2.5 py-1 rounded-full text-xs font-medium border ' + statePill(selected).cls}>{statePill(selected).text}</span>
                  {selected.late && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">LATE</span>}
                </div>

                <div className="w-full grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => openMark('CHECK_IN')}
                    disabled={selected.state !== 'NOT_IN'}
                    className="h-12 rounded-full bg-[#7B1113] hover:bg-[#9B2020] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Check in
                  </button>
                  <button
                    onClick={() => openMark('CHECK_OUT')}
                    disabled={selected.state !== 'CHECKED_IN' && selected.state !== 'NO_TAP_OUT'}
                    className="h-12 rounded-full bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Check out
                  </button>
                </div>
                {selected.state === 'CHECKED_OUT' && (
                  <p className="text-xs text-slate-500 dark:text-gray-400">Done for today. Nothing more to mark.</p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-gray-500">
                  Use this only when the card cannot be used. The parent is told that you marked it by hand.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mark dialog */}
      {markAction && selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-[#C4972A]" aria-hidden="true" />
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold">
                {markAction === 'CHECK_IN' ? 'Check in ' : 'Check out '}{selected.firstName} {selected.lastName}?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Why is the card not being used?</p>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label key={r.value} className={'flex items-center gap-3 p-3 rounded-xl border cursor-pointer ' +
                    (reason === r.value ? 'border-[#7B1113] bg-[#7B1113]/5 dark:bg-[#7B1113]/10' : 'border-gray-200 dark:border-gray-700')}>
                    <input type="radio" name="reason" checked={reason === r.value} onChange={() => setReason(r.value)} />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
              {reason === 'OTHER' && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="Write a short note"
                  className={FIELD + ' w-full'}
                />
              )}
              {markError && <p className="text-sm text-red-600 dark:text-red-400">{markError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setMarkAction(null)}
                  disabled={busy}
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void doMark()}
                  disabled={busy}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-full text-sm font-semibold disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {markAction === 'CHECK_IN' ? 'Yes, check in' : 'Yes, check out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}