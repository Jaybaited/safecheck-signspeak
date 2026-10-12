'use client';

import { useEffect, useState } from 'react';
import { X, Link2, Unlink, Loader2 } from 'lucide-react';
import { api, ParentSearchResult, User as ApiUser } from '@/lib/api';

interface LinkParentModalProps {
  student: ApiUser | null;
  onClose: () => void;
  onChanged: () => void;
}

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ' +
  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors';

export default function LinkParentModal({ student, onClose, onChanged }: LinkParentModalProps) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<ParentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const [message,   setMessage]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending,   setPending]   = useState<{ parent: ParentSearchResult; linked: boolean } | null>(null);

  const studentId = student?.id;
  useEffect(() => {
    setQuery('');
    setResults([]);
    setMessage(null);
    setError(null);
    setPending(null);
  }, [studentId]);

  const term = query.trim() || (student?.lastName ?? '').trim();
  useEffect(() => {
    if (!student || term.length < 2) { setResults([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.searchParents(term, query.trim() ? undefined : 'lastName')
        .then((r) => { if (!cancelled) setResults(r); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [student, term, query, reloadKey]);

  if (!student) return null;

  const confirmPending = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = pending.linked
        ? await api.unlinkChild(pending.parent.id, student.id)
        : await api.linkChild(pending.parent.id, student.id);
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

  const fullName = student.firstName + ' ' + student.lastName;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Link to parent</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Student: {fullName}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Parents with the last name "{student.lastName}" are listed first. Search by parent username or child name to find others.
          </p>

          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            className={INPUT_CLS} placeholder="Search by parent username or child name" />

          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {pending && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {pending.linked
                  ? 'Unlink ' + fullName + ' from ' + pending.parent.username + '? That parent will no longer see this student.'
                  : 'Link ' + fullName + ' to ' + pending.parent.username + '? That parent will be able to see this student.'}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPending(null)} disabled={busy}
                  className="flex-1 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={() => void confirmPending()} disabled={busy}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-full text-sm font-semibold transition-colors disabled:opacity-50">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          )}

          {searching && <p className="text-xs text-gray-400 dark:text-gray-500">Searching...</p>}

          {!searching && results.length === 0 && term.length >= 2 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No parents found. Try a different search.</p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {results.map((p) => {
                const linked = p.children.some((c) => c.id === student.id);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {p.username}
                        {linked && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            LINKED
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {p.name} | Children: {p.children.map((c) => c.name).join(', ')}
                      </p>
                    </div>
                    <button type="button" disabled={busy || !!pending}
                      onClick={() => setPending({ parent: p, linked })}
                      className={'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ' +
                        (linked
                          ? 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400'
                          : 'bg-[#7B1113] border-[#7B1113] text-white hover:bg-[#9B2020]')}>
                      {linked ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                      {linked ? 'Unlink' : 'Link'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
