// web/components/shared/LogoutModal.tsx
'use client';

import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-5">
          <LogOut className="w-8 h-8 text-[#7B1113]" />
        </div>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Are you logging out?
        </h2>

        {/* Subtext */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          You can come back anytime you want.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            No, I'll stay
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-colors"
            style={{ backgroundColor: '#7B1113' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5e0d0f')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7B1113')}
          >
            Yes, logout
          </button>
        </div>
      </div>
    </div>
  );
}