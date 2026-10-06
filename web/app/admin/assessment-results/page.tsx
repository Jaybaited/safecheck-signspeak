'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, CheckCircle, XCircle, Clock, X, Loader2 } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import {
  getAdminAttempts, getAdminAttempt, reviewAttempt,
  AdminAttemptRow, AdminAttemptDetail,
} from '@/lib/assessments-api';

type Tab = 'SUBMITTED' | 'GRADED' | 'ALL';

const TABS: { key: Tab; label: string }[] = [
  { key: 'SUBMITTED', label: 'Waiting for review' },
  { key: 'GRADED', label: 'Reviewed' },
  { key: 'ALL', label: 'All' },
];

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '-';

const fmtGrade = (g: string | null) => (g ? g.replace('GRADE_', 'Grade ') : '');

export default function AssessmentResultsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('SUBMITTED');
  const [rows, setRows] = useState<AdminAttemptRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState<AdminAttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [override, setOverride] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
      setAdminUser(parsed);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const loadRows = useCallback(async () => {
    setListLoading(true);
    setError('');
    try {
      const data = await getAdminAttempts(tab === 'ALL' ? undefined : tab);
      setRows(data.filter((r) => r.status !== 'IN_PROGRESS'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the attempts.');
    } finally {
      setListLoading(false);
    }
  }, [tab]);

  useEffect(() => { if (adminUser) loadRows(); }, [adminUser, loadRows]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setError('');
    setSuccess('');
    setOverride('');
    try {
      setSelected(await getAdminAttempt(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open this attempt.');
    } finally {
      setDetailLoading(false);
    }
  };

  const passMark = selected?.assessment.passMark ?? 70;
  const overrideValid =
    override.trim() === '' ||
    (Number.isFinite(Number(override)) && Number(override) >= 0 && Number(override) <= 100);
  const effective =
    override.trim() !== '' && overrideValid ? Number(override) : (selected?.score ?? 0);
  const willPass = effective >= passMark;

  const save = async () => {
    if (!selected || !overrideValid) return;
    setSaving(true);
    setError('');
    try {
      await reviewAttempt(selected.id, override.trim() === '' ? undefined : Number(override));
      setSuccess(`Result saved for ${selected.user.firstName} ${selected.user.lastName}. The student can now see it.`);
      setSelected(null);
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the result.');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (r: { status: string; passed: boolean | null }) => {
    if (r.status === 'SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
          <Clock className="w-3 h-3" /> Waiting for review
        </span>
      );
    }
    return r.passed ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
        <CheckCircle className="w-3 h-3" /> Passed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
        <XCircle className="w-3 h-3" /> Not passed
      </span>
    );
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
            <h1 className="text-2xl font-bold mb-0.5">Assessment Results</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Check student answers, confirm or adjust the score, and release the result to the student.
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

        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSuccess(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#7B1113] text-white'
                  : 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
          {listLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#7B1113]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-gray-500 text-sm">Nothing here yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.user.firstName} {r.user.lastName}</div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">{fmtGrade(r.user.gradeLevel)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.assessment.level != null && <span className="text-xs font-semibold text-[#7B1113] dark:text-[#E8C96A] mr-2">Level {r.assessment.level}</span>}
                      {r.assessment.title}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{fmtDate(r.submittedAt)}</td>
                    <td className="px-4 py-3 font-mono">{r.score != null ? `${r.score}%` : '-'}</td>
                    <td className="px-4 py-3">{statusBadge(r)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetail(r.id)}
                        disabled={detailLoading}
                        className="px-3 py-1.5 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {r.status === 'SUBMITTED' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {selected.user.firstName} {selected.user.lastName}
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-gray-400">
                    {fmtGrade(selected.user.gradeLevel)} · @{selected.user.username}
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  {selected.assessment.level != null ? `Level ${selected.assessment.level} - ` : ''}
                  {selected.assessment.title} · Pass mark {passMark}% · Submitted {fmtDate(selected.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <table className="w-full text-sm mb-5">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Student answer</th>
                  <th className="py-2 pr-3">Correct answer</th>
                  <th className="py-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {selected.assessment.questions.map((q, i) => {
                  const r = selected.responses.find((x) => x.questionId === q.id);
                  const given = r?.submittedSign ?? null;
                  const label = (letter: string | null) =>
                    letter ? `${letter}${q.choices?.[letter] ? ' - ' + q.choices[letter] : ''}` : 'No answer';
                  return (
                    <tr key={q.id}>
                      <td className="py-2 pr-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 pr-3">{label(given)}</td>
                      <td className="py-2 pr-3">{label(q.correctAnswer)}</td>
                      <td className="py-2">
                        {r?.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-4 h-4" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                            <XCircle className="w-4 h-4" /> {given ? 'Not correct' : 'Not answered'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Automatic score</p>
                <p className="text-2xl font-bold font-mono">{selected.score ?? 0}%</p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-1">
                  Override score (optional, 0 to 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={override}
                  onChange={(e) => setOverride(e.target.value)}
                  placeholder="Leave empty to keep"
                  className="w-48 px-3 py-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1113]"
                />
                {!overrideValid && <p className="text-xs text-red-500 mt-1">Enter a number from 0 to 100.</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Final result</p>
                <p className={`text-lg font-bold ${willPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {effective}% - {willPass ? 'Passed' : 'Not passed'}
                </p>
              </div>
              <div className="ml-auto flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={!overrideValid || saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {selected.status === 'SUBMITTED' ? 'Confirm and release result' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}