'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Users } from 'lucide-react';
import { api, DeletePreview, User } from '@/lib/api';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export default function DeleteUserModal({ isOpen, user, onClose, onConfirm, isDeleting, error }: DeleteUserModalProps) {
  const [preview,     setPreview]     = useState<DeletePreview | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const userId = user?.id;
  useEffect(() => {
    if (!isOpen || !userId) return;
    let off = false;
    setPreview(null); setLoadError(null); setConfirmOpen(false); setLoading(true);
    api.getDeletePreview(userId)
      .then((p) => { if (!off) setPreview(p); })
      .catch((e) => { if (!off) setLoadError(e instanceof Error ? e.message : 'Could not load the details.'); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [isOpen, userId]);

  if (!isOpen || !user) return null;
  const fullName = user.firstName + ' ' + user.lastName;
  const blocked = !!preview && !preview.canDelete;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-[#7B1113]" aria-hidden="true" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
              {blocked ? <Users className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {blocked ? (preview?.role === 'PARENT' ? 'This parent cannot be deleted' : 'This student cannot be deleted') : 'Delete user'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span> ({user.username})
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking what will be affected...
            </div>
          )}
          {loadError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">{loadError}</div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">{error}</div>
          )}

          {blocked && preview && preview.role === 'STUDENT' && (
            <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl text-sm text-slate-600 dark:text-gray-300 space-y-2">
              <p>{preview.blockedReason}</p>
              {preview.records && (
                <p className="text-xs">
                  {preview.records.attendance} attendance records, {preview.records.fslProgress} FSL progress records, {preview.records.assessmentAttempts} assessment attempts.
                </p>
              )}
            </div>
          )}

          {blocked && preview && preview.role === 'PARENT' && (
            <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl text-sm text-slate-600 dark:text-gray-300 space-y-2">
              <p>A parent account exists to serve its students, so it cannot be deleted while it has any. It is removed automatically when its last student is deleted.</p>
              <p className="font-semibold text-slate-800 dark:text-white">Linked students:</p>
              <ul className="list-disc pl-5">
                {(preview.children ?? []).map((c) => <li key={c.id}>{c.name}</li>)}
              </ul>
              <p>To remove this family, delete or archive its students.</p>
            </div>
          )}

          {preview && preview.canDelete && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-300 space-y-2">
              <p className="font-semibold">This cannot be undone.</p>
              {preview.role === 'STUDENT' && preview.records && (
                <p>
                  Removes {preview.records.attendance} attendance records, {preview.records.fslProgress} FSL progress
                  records and {preview.records.assessmentAttempts} assessment attempts.
                </p>
              )}
              {preview.willDeleteParent && (
                <p>
                  The parent account <strong>{preview.willDeleteParent}</strong> has no other students, so it will be deleted too.
                </p>
              )}
              {preview.role === 'PARENT' && <p>This parent account has no students, so nothing else is affected.</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} disabled={isDeleting}
              className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl font-medium disabled:opacity-50">
              {blocked ? 'Close' : 'Cancel'}
            </button>
            {!blocked && (
              <button onClick={() => setConfirmOpen(true)} disabled={isDeleting || loading || !!loadError || !preview}
                className="flex-1 h-11 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-xl font-medium disabled:opacity-50">
                Delete user
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmOpen} busy={isDeleting} title={'Delete ' + fullName + '?'} confirmLabel="Delete permanently"
        onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); void onConfirm(); }}>
        <p>This permanently deletes the account and its records.</p>
        {preview?.willDeleteParent && <p>The parent account {preview.willDeleteParent} will be deleted as well.</p>}
      </ConfirmDialog>
    </div>
  );
}