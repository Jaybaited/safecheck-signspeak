'use client';

import { useEffect, useState } from 'react';
import { X, Link2, Loader2 } from 'lucide-react';
import { api, ParentSearchResult, ParentInfo, User as ApiUser } from '@/lib/api';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface ChangeParentModalProps {
  student: ApiUser | null;
  onClose: () => void;
  onChanged: () => void;
}

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ' +
  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113]';

export default function ChangeParentModal({ student, onClose, onChanged }: ChangeParentModalProps) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<ParentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const [message,   setMessage]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending,   setPending]   = useState<ParentSearchResult | null>(null);
  const [current,   setCurrent]   = useState<ParentInfo | null>(null);
  const [loaded,    setLoaded]    = useState(false);

  const studentId = student?.id;

  useEffect(() => {
    setQuery(''); setResults([]); setMessage(null); setError(null); setPending(null);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    let off = false;
    setLoaded(false);
    api.getStudentParent(studentId)
      .then((p) => { if (!off) setCurrent(p); })
      .catch(() => { if (!off) setCurrent(null); })
      .finally(() => { if (!off) setLoaded(true); });
    return () => { off = true; };
  }, [studentId, reloadKey]);

  const term = query.trim() || (student?.lastName ?? '').trim();
  useEffect(() => {
    if (!student || term.length < 2) { setResults([]); setSearching(false); return; }
    let off = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.searchParents(term, query.trim() ? undefined : 'lastName')
        .then((r) => { if (!off) setResults(r); })
        .catch(() => { if (!off) setResults([]); })
        .finally(() => { if (!off) setSearching(false); });
    }, 300);
    return () => { off = true; clearTimeout(timer); };
  }, [student, term, query, reloadKey]);

  if (!student) return null;
  const fullName = student.firstName + ' ' + student.lastName;

  const confirmMove = async () => {
    if (!pending || busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const res = await api.changeParent(student.id, pending.id);
      setMessage(res.message);
      setPending(null);
      setReloadKey((k) => k + 1);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Change parent</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Student: {fullName}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-sm">
            <span className="text-xs text-slate-400 dark:text-gray-500 block mb-0.5">Current parent</span>
            <span className="font-semibold text-slate-800 dark:text-white">
              {!loaded ? 'Loading...' : current ? current.firstName + ' ' + current.lastName : 'No parent linked yet'}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Parents with the last name "{student.lastName}" are listed first. Search by parent username or child name to find others.
          </p>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            className={INPUT_CLS} placeholder="Search by parent username or child name" />

          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          {searching && <p className="text-xs text-gray-400 dark:text-gray-500">Searching...</p>}
          {!searching && results.length === 0 && term.length >= 2 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No parents found. Try a different search.</p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {results.map((p) => {
                const isCurrent = current?.id === p.id || p.children.some((c) => c.id === student.id);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {p.username}
                        {isCurrent && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">CURRENT</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {p.name} | Children: {p.children.map((c) => (c.archived ? c.name + ' (archived)' : c.name)).join(', ')}
                      </p>
                    </div>
                    {!isCurrent && (
                      <button type="button" disabled={busy || !!pending} onClick={() => setPending(p)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7B1113] hover:bg-[#9B2020] text-white disabled:opacity-50">
                        <Link2 className="w-3.5 h-3.5" /> Move here
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold">
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog open={!!pending} busy={busy} title="Change this student's parent?" confirmLabel="Move student"
        onCancel={() => setPending(null)} onConfirm={() => void confirmMove()}>
        <p>Move <strong>{fullName}</strong> to <strong>{pending?.username}</strong>.</p>
        <p>The new parent will see this student. The current parent loses access. If the current parent has no other children, that parent account is deleted automatically.</p>
      </ConfirmDialog>
    </div>
  );
}