'use client';

import { AlertTriangle } from 'lucide-react';
import { User } from '@/lib/api';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export default function DeleteUserModal({
  isOpen,
  user,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: DeleteUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

        {/* Warning strip */}
        <div className="h-1 w-full bg-[#7B1113]" aria-hidden="true" />

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Delete User
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </span>
                ? All associated attendance records will be removed. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* User summary */}
          <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl mb-5">
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
              User to be deleted
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              @{user.username} · {user.role}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}