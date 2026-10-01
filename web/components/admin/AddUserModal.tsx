'use client';

import { useState, useCallback, useEffect } from 'react'; // ← CHANGED: added useEffect
import { X, CheckCircle, CreditCard, Copy, Check, User, Users, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'; // ← CHANGED: added RefreshCw
import { CreateUserDto, api } from '@/lib/api';
import { useRfidScanner } from '@/hooks/useRfidScanner';

const GRADE_LEVELS = [
  'GRADE_1','GRADE_2','GRADE_3','GRADE_4',
  'GRADE_5','GRADE_6','GRADE_7','GRADE_8',
  'GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];

const SELECTABLE_ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ADMIN',   label: 'Admin'   },
];

const ROLES_WITH_GRADE = ['STUDENT'];
const ROLES_WITH_RFID  = ['STUDENT'];

interface AddUserModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (data: CreateUserDto) => Promise<{
    generatedPassword: string;
    parentAccount?: { username: string; generatedPassword: string };
  }>;
  error: string | null;
}

interface GeneratedCredentials {
  studentUsername: string;
  studentPassword: string;
  parentUsername?: string;
  parentPassword?: string;
}

interface FormErrors {
  firstName?:   string;
  lastName?:    string;
  phoneNumber?: string;
  gradeLevel?:  string;
  rfidCard?:    string;
}

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]*$/;

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border text-sm ' +
  'bg-gray-50 dark:bg-gray-800 ' +
  'border-gray-200 dark:border-gray-700 ' +
  'text-gray-900 dark:text-white ' +
  'placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#7B1113]/30 focus:border-[#7B1113] ' +
  'transition-colors';

const INPUT_ERROR_CLS =
  'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5 ' +
  'focus:ring-red-300/30 focus:border-red-400';

const LABEL_CLS =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';

function buildUsername(lastName: string, rfidCard: string): string {
  const cleanLast = lastName.trim().toLowerCase().replace(/\s+/g, '');
  const last6     = rfidCard.replace(/\s+/g, '').slice(-6).padStart(6, '0');
  return `${cleanLast}.${last6}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function AddUserModal({ isOpen, onClose, onSubmit, error }: AddUserModalProps) {
  const [formData, setFormData] = useState<Omit<CreateUserDto, 'password'>>({
    username: '', email: '', role: 'STUDENT',
    firstName: '', lastName: '', gradeLevel: '',
    rfidCard: '', phoneNumber: '',
  });
  const [formErrors,   setFormErrors]   = useState<FormErrors>({});
  const [submitting,   setSubmitting]   = useState(false);
  const [credentials,  setCredentials]  = useState<GeneratedCredentials | null>(null);
  const [rfidChecking, setRfidChecking] = useState(false);
  const [rfidTaken,    setRfidTaken]    = useState(false);

  const { isScanning, scannedRfid, error: rfidError, startScan, resetScan } = useRfidScanner();

  const showGrade = ROLES_WITH_GRADE.includes(formData.role);
  const showRfid  = ROLES_WITH_RFID.includes(formData.role);

  const rfidPreview = scannedRfid || formData.rfidCard || '';
  const userPreview = formData.lastName.trim() && rfidPreview
    ? buildUsername(formData.lastName, rfidPreview)
    : null;

  // ── CHANGED: Run duplicate check immediately after RFID is scanned ─────────
  useEffect(() => {
    if (!scannedRfid) return;

    let cancelled = false;
    setRfidChecking(true);
    setRfidTaken(false);
    setFormErrors((p) => ({ ...p, rfidCard: undefined }));

    api.checkRfidAvailable(scannedRfid).then((res) => {
      if (cancelled) return;
      if (!res.available) {
        setRfidTaken(true);
        setFormErrors((p) => ({
          ...p,
          rfidCard: 'This RFID card is already assigned to another user.',
        }));
      } else {
        setRfidTaken(false);
      }
    }).catch(() => {
      // Silently ignore — server-side will catch it on submit
    }).finally(() => {
      if (!cancelled) setRfidChecking(false);
    });

    return () => { cancelled = true; };
  }, [scannedRfid]);
  // ── END CHANGED ────────────────────────────────────────────────────────────

  // ── CHANGED: handleRfidBlur also clears rfidTaken state on new input ───────
  const handleRfidBlur = useCallback(async (value: string) => {
    if (!value.trim()) { setRfidTaken(false); return; }
    setRfidChecking(true);
    setRfidTaken(false);
    try {
      const res = await api.checkRfidAvailable(value.trim());
      if (!res.available) {
        setRfidTaken(true);
        setFormErrors((p) => ({ ...p, rfidCard: 'This RFID card is already assigned to another user.' }));
      } else {
        setRfidTaken(false);
        setFormErrors((p) => ({ ...p, rfidCard: undefined }));
      }
    } catch {
      // Silently ignore
    } finally {
      setRfidChecking(false);
    }
  }, []);

  // ── CHANGED: Retry scan — clears scanned state and restarts scan ────────────
  const handleRetryScan = () => {
    resetScan();
    setRfidTaken(false);
    setRfidChecking(false);
    setFormErrors((p) => ({ ...p, rfidCard: undefined }));
    startScan();
  };
  // ── END CHANGED ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: FormErrors = {};

    if (!formData.firstName.trim())
      errs.firstName = 'First name is required.';
    else if (!NAME_REGEX.test(formData.firstName.trim()))
      errs.firstName = 'Must start with a letter. Only letters, spaces, hyphens, apostrophes, and periods allowed.';

    if (!formData.lastName.trim())
      errs.lastName = 'Last name is required.';
    else if (!NAME_REGEX.test(formData.lastName.trim()))
      errs.lastName = 'Must start with a letter. Only letters, spaces, hyphens, apostrophes, and periods allowed.';

    if (formData.phoneNumber && !/^[0-9+\-\s()]{7,15}$/.test(formData.phoneNumber))
      errs.phoneNumber = 'Please enter a valid phone number.';

    if (showGrade && !formData.gradeLevel)
      errs.gradeLevel = 'Grade level is required for students.';

    if (rfidTaken)
      errs.rfidCard = 'This RFID card is already assigned to another user.';

    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});

    if (formData.role === 'STUDENT' && !scannedRfid) {
      startScan();
      return;
    }

    const rfid     = scannedRfid || formData.rfidCard || undefined;
    const username = buildUsername(
      formData.lastName,
      rfid ?? String(Date.now()),
    );

    setSubmitting(true);
    try {
      const result = await onSubmit({
        ...formData,
        username,
        email:       formData.email       || undefined,
        gradeLevel:  showGrade ? (formData.gradeLevel || undefined) : undefined,
        rfidCard:    showRfid ? rfid : undefined,
        phoneNumber: formData.phoneNumber || undefined,
      } as CreateUserDto);

      setCredentials({
        studentUsername: username,
        studentPassword: result.generatedPassword,
        parentUsername:  result.parentAccount?.username,
        parentPassword:  result.parentAccount?.generatedPassword,
      });
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: '', email: '', role: 'STUDENT', firstName: '', lastName: '', gradeLevel: '', rfidCard: '', phoneNumber: '' });
    setCredentials(null);
    setFormErrors({});
    setRfidTaken(false);
    setRfidChecking(false);
    resetScan();
    onClose();
  };

  if (!isOpen) return null;

  // ── Credentials Modal ──────────────────────────────────────────────────────
  if (credentials) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Created Successfully</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-11">
              Save these credentials — the password will not be shown again.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {formData.role === 'TEACHER' ? 'Teacher' : formData.role === 'ADMIN' ? 'Admin' : 'Student'} Account
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Username</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white truncate">{credentials.studentUsername}</p>
                  </div>
                  <CopyButton text={credentials.studentUsername} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Password</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{credentials.studentPassword}</p>
                  </div>
                  <CopyButton text={credentials.studentPassword} />
                </div>
              </div>
            </div>

            {credentials.parentUsername && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-500/30">
                  <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Parent Account</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Username</p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white truncate">{credentials.parentUsername}</p>
                    </div>
                    <CopyButton text={credentials.parentUsername} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Password</p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{credentials.parentPassword}</p>
                    </div>
                    <CopyButton text={credentials.parentPassword!} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                The user will be required to change their password on first login. Share these credentials to the user.
              </p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button onClick={handleClose}
              className="w-full h-11 bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Creation Form ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New User</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              A secure password will be generated automatically.
            </p>
          </div>
          <button onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {(error || rfidError) && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error || rfidError}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>First Name *</label>
              <input type="text" value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  if (formErrors.firstName) setFormErrors((p) => ({ ...p, firstName: undefined }));
                }}
                className={`${INPUT_CLS} ${formErrors.firstName ? INPUT_ERROR_CLS : ''}`}
                placeholder="e.g. Juan"
              />
              {formErrors.firstName && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {formErrors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL_CLS}>Last Name *</label>
              <input type="text" value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  if (formErrors.lastName) setFormErrors((p) => ({ ...p, lastName: undefined }));
                }}
                className={`${INPUT_CLS} ${formErrors.lastName ? INPUT_ERROR_CLS : ''}`}
                placeholder="e.g. Dela Cruz"
              />
              {formErrors.lastName && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {formErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Username preview */}
          {userPreview && !rfidTaken && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <div className="flex-1">
                <p className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-0.5">
                  Auto-generated Username
                </p>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-white">{userPreview}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-semibold border border-emerald-200 dark:border-emerald-500/20">
                Auto
              </span>
            </div>
          )}

          {/* Phone Number */}
          <div>
            <label className={LABEL_CLS}>Phone Number <span className="normal-case text-gray-400">(optional)</span></label>
            <input type="tel" value={formData.phoneNumber}
              onChange={(e) => {
                setFormData({ ...formData, phoneNumber: e.target.value });
                if (formErrors.phoneNumber) setFormErrors((p) => ({ ...p, phoneNumber: undefined }));
              }}
              className={`${INPUT_CLS} ${formErrors.phoneNumber ? INPUT_ERROR_CLS : ''}`}
              placeholder="e.g. 09171234567"
            />
            {formErrors.phoneNumber && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {formErrors.phoneNumber}
              </p>
            )}
          </div>

          {/* Role + Grade Level */}
          <div className={`grid gap-4 ${showGrade ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className={LABEL_CLS}>Role *</label>
              <select required value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as 'ADMIN' | 'TEACHER' | 'STUDENT';
                  setFormData({ ...formData, role: newRole, gradeLevel: '', rfidCard: '' });
                  setRfidTaken(false);
                  setRfidChecking(false);
                  resetScan();
                  setFormErrors((p) => ({ ...p, gradeLevel: undefined, rfidCard: undefined }));
                }}
                className={INPUT_CLS}
              >
                {SELECTABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {showGrade && (
              <div>
                <label className={LABEL_CLS}>
                  Grade Level <span className="text-red-400 normal-case font-normal">*</span>
                </label>
                <select value={formData.gradeLevel}
                  onChange={(e) => {
                    setFormData({ ...formData, gradeLevel: e.target.value });
                    if (formErrors.gradeLevel) setFormErrors((p) => ({ ...p, gradeLevel: undefined }));
                  }}
                  className={`${INPUT_CLS} ${formErrors.gradeLevel ? INPUT_ERROR_CLS : ''}`}
                >
                  <option value="">Select Grade</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g.replace('GRADE_', 'Grade ')}</option>
                  ))}
                </select>
                {formErrors.gradeLevel && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {formErrors.gradeLevel}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RFID manual input — not scanned yet, not scanning */}
          {showRfid && !scannedRfid && !isScanning && (
            <div>
              <label className={LABEL_CLS}>RFID Card Number <span className="normal-case text-gray-400">(optional — or scan below)</span></label>
              <div className="relative">
                <input type="text" value={formData.rfidCard}
                  onChange={(e) => {
                    setFormData({ ...formData, rfidCard: e.target.value });
                    setRfidTaken(false);
                    if (formErrors.rfidCard) setFormErrors((p) => ({ ...p, rfidCard: undefined }));
                  }}
                  onBlur={(e) => void handleRfidBlur(e.target.value)}
                  className={`${INPUT_CLS} pr-9 ${formErrors.rfidCard ? INPUT_ERROR_CLS : ''}`}
                  placeholder="Tap card or enter manually"
                />
                {rfidChecking && (
                  <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 animate-spin" />
                )}
                {!rfidChecking && rfidTaken && (
                  <AlertTriangle className="absolute right-3 top-2.5 w-4 h-4 text-red-500" />
                )}
                {!rfidChecking && !rfidTaken && formData.rfidCard && (
                  <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {formErrors.rfidCard && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {formErrors.rfidCard}
                </p>
              )}
            </div>
          )}

          {/* ── CHANGED: RFID scanned — show result + retry option ─────────── */}
          {showRfid && scannedRfid && !isScanning && (
            <div className={`rounded-xl border overflow-hidden ${
              rfidChecking
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                : rfidTaken
                ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
                : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
            }`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {rfidChecking ? (
                    <Loader2 className="w-5 h-5 text-gray-400 shrink-0 animate-spin" />
                  ) : rfidTaken ? (
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-widest ${
                      rfidChecking
                        ? 'text-gray-500 dark:text-gray-400'
                        : rfidTaken
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {rfidChecking
                        ? 'Checking RFID…'
                        : rfidTaken
                        ? 'RFID Already Taken'
                        : 'RFID Card Scanned'}
                    </p>
                    <p className={`text-base font-bold font-mono ${
                      rfidChecking
                        ? 'text-gray-700 dark:text-gray-200'
                        : rfidTaken
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {scannedRfid}
                    </p>
                    {rfidTaken && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                        This card is already assigned to another user.
                      </p>
                    )}
                  </div>
                </div>

                {/* Retry button — always visible once scanned */}
                <button
                  type="button"
                  onClick={handleRetryScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scan Again
                </button>
              </div>
            </div>
          )}
          {/* ── END CHANGED ─────────────────────────────────────────────────── */}

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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button type="submit"
              disabled={submitting || isScanning || rfidChecking || (showRfid && !!scannedRfid && rfidTaken)}
              className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.role === 'STUDENT' && !scannedRfid
                  ? 'bg-[#7B1113] hover:bg-[#9B2020] text-white'
                  : 'bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
              }`}>
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current animate-spin rounded-full" />
                  Creating…
                </>
              ) : formData.role === 'STUDENT' && !scannedRfid ? (
                <>
                  <CreditCard className="w-4 h-4" /> Scan RFID Card
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