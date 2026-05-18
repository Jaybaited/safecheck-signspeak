'use client';

import { useState, useEffect } from 'react'; // ← added useEffect
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { CreateUserDto } from '@/lib/api';
import { useRfidScanner } from '@/hooks/useRfidScanner';

const GRADE_LEVELS = [
  'GRADE_1','GRADE_2','GRADE_3','GRADE_4',
  'GRADE_5','GRADE_6','GRADE_7','GRADE_8',
  'GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];

interface AddUserModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (data: CreateUserDto) => Promise<void>;
  error:    string | null;
}

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border text-sm ' +
  'bg-gray-50 dark:bg-gray-800 ' +
  'border-gray-200 dark:border-gray-700 ' +
  'text-gray-900 dark:text-white ' +
  'placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] ' +
  'transition-colors';

const LABEL_CLS =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';

// ── Auto-generate username: lastname.last6ofRFID ← added
function generateUsername(lastName: string, rfidCard: string): string {
  const cleanLast = lastName.trim().toLowerCase().replace(/\s+/g, '');
  const last6     = rfidCard.replace(/\s+/g, '').slice(-6).padStart(6, '0');
  return `${cleanLast}.${last6}`;
}

export default function AddUserModal({
  isOpen, onClose, onSubmit, error,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    username:   '',
    email:      '',
    password:   '',
    role:       'STUDENT',
    firstName:  '',
    lastName:   '',
    gradeLevel: '',
    rfidCard:   '',
  });
  const [submitting, setSubmitting] = useState(false);

  const {
    isScanning, scannedRfid,
    error: rfidError, startScan, resetScan,
  } = useRfidScanner();

  // ── Auto-generate username whenever lastName or RFID changes ← added
  useEffect(() => {
    const rfid = scannedRfid || formData.rfidCard || '';
    if (formData.lastName.trim() && rfid) {
      setFormData((prev) => ({
        ...prev,
        username: generateUsername(formData.lastName, rfid),
      }));
    }
  }, [formData.lastName, formData.rfidCard, scannedRfid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Frontend validations ← added
    if (!formData.firstName.trim()) return;
    if (!formData.lastName.trim())  return;
    if (!formData.password || formData.password.length < 6) return;

    if (formData.role === 'STUDENT' && !scannedRfid) {
      startScan();
      return;
    }

    const rfid     = scannedRfid || formData.rfidCard || undefined;
    const username = generateUsername(
      formData.lastName,
      rfid ?? Date.now().toString() // fallback if no RFID (non-student)
    );

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        username,                              // ← always auto-generated
        email:      formData.email      || undefined,
        gradeLevel: formData.gradeLevel || undefined,
        rfidCard:   rfid,
      });
      handleClose();
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '', email: '', password: '',
      role: 'STUDENT', firstName: '', lastName: '',
      gradeLevel: '', rfidCard: '',
    });
    resetScan();
    onClose();
  };

  if (!isOpen) return null;

  // ── Preview generated username ← added
  const rfidPreview  = scannedRfid || formData.rfidCard || '';
  const userPreview  = formData.lastName.trim() && rfidPreview
    ? generateUsername(formData.lastName, rfidPreview)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New User</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Fill in the details below to create a new account.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Error */}
          {(error || rfidError) && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error || rfidError}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>First Name *</label>
              <input
                type="text" required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={INPUT_CLS}
                placeholder="e.g. Juan"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Last Name *</label>
              <input
                type="text" required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={INPUT_CLS}
                placeholder="e.g. Dela Cruz"
              />
            </div>
          </div>

          {/* ── Auto-generated username preview ← added */}
          {userPreview && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <div className="flex-1">
                <p className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-0.5">
                  Auto-generated Username
                </p>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-white">
                  {userPreview}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-semibold border border-emerald-200 dark:border-emerald-500/20">
                Auto
              </span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className={LABEL_CLS}>Email <span className="normal-case text-gray-400">(optional)</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={INPUT_CLS}
              placeholder="e.g. juan@psd.edu.ph"
            />
          </div>

          {/* Password */}
          <div>
            <label className={LABEL_CLS}>Password * <span className="normal-case text-gray-400">(min. 6 characters)</span></label>
            <input
              type="password" required minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={INPUT_CLS}
              placeholder="••••••••"
            />
          </div>

          {/* Role + Grade row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' });
                  resetScan();
                }}
                className={INPUT_CLS}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="PARENT">Parent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Grade Level</label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                className={INPUT_CLS}
              >
                <option value="">Select Grade</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{g.replace('GRADE_', 'Grade ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* RFID — manual input for non-students */}
          {formData.role !== 'STUDENT' && (
            <div>
              <label className={LABEL_CLS}>RFID Card Number <span className="normal-case text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={formData.rfidCard}
                onChange={(e) => setFormData({ ...formData, rfidCard: e.target.value })}
                className={INPUT_CLS}
                placeholder="Tap card or enter manually"
              />
            </div>
          )}

          {/* RFID scanned success — students */}
          {formData.role === 'STUDENT' && scannedRfid && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest">RFID Card Scanned</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">{scannedRfid}</p>
              </div>
            </div>
          )}

          {/* Scanning animation */}
          {isScanning && (
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-[#7B1113]/5 dark:bg-[#7B1113]/10 border border-[#7B1113]/20">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-[#7B1113]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#7B1113] rounded-full border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#7B1113] dark:text-[#E8C96A]">Scanning RFID Card…</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please tap the card on the reader now</p>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isScanning}
              className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.role === 'STUDENT' && !scannedRfid
                  ? 'bg-[#7B1113] hover:bg-[#9B2020] text-white'
                  : 'bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
              }`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current animate-spin rounded-full" />
                  Creating…
                </>
              ) : formData.role === 'STUDENT' && !scannedRfid ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  Scan RFID Card
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}