'use client';

import { useState, useCallback, useEffect } from 'react'; // ← CHANGED: added useEffect
import { X, CheckCircle, CreditCard, Copy, Check, User, Users, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'; // ← CHANGED: added RefreshCw
import { CreateUserDto, ParentSearchResult, api } from '@/lib/api';
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

  const [parentFirst,     setParentFirst]     = useState('');
  const [parentLast,      setParentLast]      = useState('');
  const [parentNameError, setParentNameError] = useState('');
  const [confirmOpen,     setConfirmOpen]     = useState(false);
  const [leaveOpen,       setLeaveOpen]       = useState(false);
  const [linkParent,      setLinkParent]      = useState<ParentSearchResult | null>(null);
  const [parentQuery,     setParentQuery]     = useState('');
  const [parentResults,   setParentResults]   = useState<ParentSearchResult[]>([]);
  const [parentSearching, setParentSearching] = useState(false);

  const parentSearchTerm = parentQuery.trim() || formData.lastName.trim();
  useEffect(() => {
    if (formData.role !== 'STUDENT' || linkParent || parentSearchTerm.length < 2) {
      setParentResults([]);
      setParentSearching(false);
      return;
    }
    let cancelled = false;
    setParentSearching(true);
    const timer = setTimeout(() => {
      api.searchParents(parentSearchTerm, parentQuery.trim() ? undefined : 'lastName')
        .then((r) => { if (!cancelled) setParentResults(r); })
        .catch(() => { if (!cancelled) setParentResults([]); })
        .finally(() => { if (!cancelled) setParentSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [parentSearchTerm, parentQuery, linkParent, formData.role]);

  const { isScanning, scannedRfid, error: rfidError, startScan, resetScan } = useRfidScanner();

  const dirty =
    formData.firstName.trim() !== '' || formData.lastName.trim() !== '' ||
    (formData.phoneNumber ?? '').trim() !== '' || (formData.email ?? '').trim() !== '' ||
    formData.gradeLevel !== '' || !!scannedRfid || !!linkParent ||
    parentFirst.trim() !== '' || parentLast.trim() !== '';

  useEffect(() => {
    if (!isOpen || credentials || !dirty) return;
    const warn = (ev: BeforeUnloadEvent) => { ev.preventDefault(); ev.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isOpen, credentials, dirty]);

  const requestClose = () => {
    if (credentials || !dirty) { handleClose(); return; }
    setLeaveOpen(true);
  };

  const showGrade = ROLES_WITH_GRADE.includes(formData.role);
  const showRfid  = ROLES_WITH_RFID.includes(formData.role);
  const needsScan = formData.role === 'STUDENT' && !scannedRfid && !(formData.rfidCard ?? '').trim();

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

  const handleSubmit = async (e: React.FormEvent | null, confirmed = false) => {
    e?.preventDefault();

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

    let parentErr = '';
    if (formData.role === 'STUDENT' && !linkParent) {
      if (parentFirst.trim() && !NAME_REGEX.test(parentFirst.trim()))
        parentErr = 'Parent first name: must start with a letter and use only letters, spaces, hyphens, apostrophes, and periods.';
      else if (parentLast.trim() && !NAME_REGEX.test(parentLast.trim()))
        parentErr = 'Parent last name: must start with a letter and use only letters, spaces, hyphens, apostrophes, and periods.';
    }
    setParentNameError(parentErr);
    if (Object.keys(errs).length > 0 || parentErr) { setFormErrors(errs); return; }
    setFormErrors({});

    if (needsScan) {
      startScan();
      return;
    }

    const rfid     = scannedRfid || formData.rfidCard || undefined;
    const username = buildUsername(
      formData.lastName,
      rfid ?? String(Date.now()),
    );

    if (!confirmed) {
      setConfirmOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        ...formData,
        username,
        email:       formData.email       || undefined,
        gradeLevel:  showGrade ? (formData.gradeLevel || undefined) : undefined,
        rfidCard:    showRfid ? rfid : undefined,
        phoneNumber: formData.phoneNumber || undefined,
        existingParentId: formData.role === 'STUDENT' ? linkParent?.id : undefined,
        parentFirstName:  formData.role === 'STUDENT' && !linkParent ? (parentFirst.trim() || undefined) : undefined,
        parentLastName:   formData.role === 'STUDENT' && !linkParent ? (parentLast.trim()  || undefined) : undefined,
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
    setLinkParent(null);
    setParentFirst('');
    setParentLast('');
    setParentNameError('');
    setParentQuery('');
    setParentResults([]);
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
                    {credentials.parentPassword && !credentials.parentPassword.startsWith('(') && <CopyButton text={credentials.parentPassword} />}
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
          <button onClick={requestClose}
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

          {/* RFID card: scan only. Manual typing was removed. */}
          {showRfid && !scannedRfid && !isScanning && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              RFID card: click <span className="font-semibold">Scan RFID Card</span> below, then tap the card on the reader.
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

          {/* Parent account (students only) */}
          {formData.role === 'STUDENT' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div>
                <p className={LABEL_CLS}>Parent account</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {linkParent
                    ? 'This student will be linked to the parent below. No new parent account will be created.'
                    : 'A new parent account is created automatically. If a brother or sister is already registered, link to their parent instead.'}
                </p>
              </div>

              {linkParent ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">{linkParent.username}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 truncate">
                      Children: {linkParent.children.map((c) => c.name).join(', ')}
                    </p>
                  </div>
                  <button type="button" onClick={() => setLinkParent(null)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Parent first name <span className="normal-case text-gray-400">(optional)</span></label>
                      <input type="text" value={parentFirst}
                        onChange={(e) => setParentFirst(e.target.value)}
                        className={INPUT_CLS} placeholder="e.g. Maria" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Parent last name <span className="normal-case text-gray-400">(optional)</span></label>
                      <input type="text" value={parentLast}
                        onChange={(e) => setParentLast(e.target.value)}
                        className={INPUT_CLS} placeholder={formData.lastName.trim() || 'Same as student'} />
                    </div>
                  </div>
                  {parentNameError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {parentNameError}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-1">Or link to an existing parent</p>
                  <input type="text" value={parentQuery}
                    onChange={(e) => setParentQuery(e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Search an existing parent by username or child name (optional)"
                  />
                  {parentSearching && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Searching...</p>
                  )}
                  {!parentSearching && parentResults.length > 0 && (
                    <>
                      {!parentQuery.trim() && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {'Parents with the last name "' + formData.lastName.trim() + '" were found. Pick one only if it is the same family.'}
                        </p>
                      )}
                      <ul className="max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        {parentResults.map((p) => (
                          <li key={p.id}>
                            <button type="button"
                              onClick={() => { setLinkParent(p); setParentQuery(''); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{p.username}</span>
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                Children: {p.children.map((c) => c.name).join(', ')}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {confirmOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Create this account?</h3>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white text-right">{formData.firstName.trim()} {formData.lastName.trim()}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-gray-400">Role</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white text-right">{SELECTABLE_ROLES.find((r) => r.value === formData.role)?.label ?? formData.role}</dd>
                  </div>
                  {showGrade && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">Grade level</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white text-right">{String(formData.gradeLevel).replace('GRADE_', 'Grade ')}</dd>
                    </div>
                  )}
                  {showRfid && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">RFID card</dt>
                      <dd className="font-mono font-semibold text-gray-900 dark:text-white text-right">{scannedRfid || formData.rfidCard}</dd>
                    </div>
                  )}
                  {formData.role === 'STUDENT' && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">Parent account</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white text-right">{linkParent ? 'Linked to ' + linkParent.username : ('New account' + ((parentFirst.trim() || parentLast.trim()) ? ' for ' + (parentFirst.trim() || 'Parent') + ' ' + (parentLast.trim() || formData.lastName.trim()) : ' (auto-created)'))}</dd>
                    </div>
                  )}
                </dl>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check the details. A password is generated and shown once after the account is created.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConfirmOpen(false)}
                    className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors">
                    Go back
                  </button>
                  <button type="button" onClick={() => { setConfirmOpen(false); void handleSubmit(null, true); }}
                    className="flex-1 h-11 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-full text-sm font-semibold transition-colors">
                    Yes, create
                  </button>
                </div>
              </div>
            </div>
          )}

          {leaveOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Discard this new user?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">You have unsaved changes. If you leave now, they will be lost.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setLeaveOpen(false)}
                    className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors">
                    Keep editing
                  </button>
                  <button type="button" onClick={() => { setLeaveOpen(false); handleClose(); }}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={requestClose}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button type="submit"
              disabled={submitting || isScanning || rfidChecking || (showRfid && rfidTaken)}
              className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                needsScan
                  ? 'bg-[#7B1113] hover:bg-[#9B2020] text-white'
                  : 'bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
              }`}>
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current animate-spin rounded-full" />
                  Creating…
                </>
              ) : needsScan ? (
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