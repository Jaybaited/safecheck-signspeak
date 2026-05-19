'use client';

import { useState } from 'react';
import { X, Send, CheckCircle, XCircle, Loader2, KeyRound } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';

interface ForgotPasswordModalProps {
  isOpen:  boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [username,   setUsername]   = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setUsername('');
    setSuccessMsg(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!username.trim()) { setErrorMsg('Please enter your username.'); return; }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await requestPasswordReset(username.trim());
      setSuccessMsg(res.message);
      setUsername('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      if (msg.toLowerCase().includes('no account'))
        setErrorMsg('No account found with that username. Please check and try again.');
      else if (msg.toLowerCase().includes('pending'))
        setErrorMsg('You already have a pending request. Please wait for your admin to approve it.');
      else
        setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Forgot Password?</h2>
              <p className="text-xs text-gray-400">Submit a reset request to your admin</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {!successMsg ? (
            <>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter your username below. Your school admin will receive your request and generate a new password for you.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMsg(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. santos.123456"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] transition-colors placeholder:text-gray-300 font-mono"
                />
              </div>
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />{errorMsg}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Request Submitted!</p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[240px]">{successMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {successMsg ? 'Close' : 'Cancel'}
          </button>
          {!successMsg && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !username.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                : <><Send className="w-4 h-4" /> Submit Request</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}