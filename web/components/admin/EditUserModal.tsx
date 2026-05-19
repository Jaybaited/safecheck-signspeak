'use client';

import { useState, useEffect } from 'react';
import {
  X, Save, Loader2, CheckCircle, XCircle,
  User, Mail, Phone, GraduationCap, ShieldCheck,
} from 'lucide-react';
import { api, User as ApiUser, CreateUserDto } from '@/lib/api';

interface EditUserModalProps {
  isOpen:    boolean;
  user:      ApiUser | null;
  onClose:   () => void;
  onSuccess: (updated: ApiUser) => void;
}

interface FieldErrors {
  firstName?:   string;
  lastName?:    string;
  email?:       string;
  phoneNumber?: string;
  gradeLevel?:  string;
}

const GRADE_LEVELS = [
  'GRADE_1','GRADE_2','GRADE_3','GRADE_4','GRADE_5','GRADE_6',
  'GRADE_7','GRADE_8','GRADE_9','GRADE_10','GRADE_11','GRADE_12',
];
const formatGradeLabel = (g: string) => g.replace('GRADE_', 'Grade ');

const EMPTY_FORM = {
  firstName:   '',
  lastName:    '',
  email:       '',
  phoneNumber: '',
  gradeLevel:  '',
  role:        '',
};

function validateFields(form: typeof EMPTY_FORM, role: string): FieldErrors {
  const errs: FieldErrors = {};

  if (role === 'PARENT') {
    if (!form.lastName.trim())
      errs.lastName = 'Last name is required.';
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/.test(form.lastName.trim()))
      errs.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
  } else {
    if (!form.firstName.trim())
      errs.firstName = 'First name is required.';
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/.test(form.firstName.trim()))
      errs.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes.';

    if (!form.lastName.trim())
      errs.lastName = 'Last name is required.';
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/.test(form.lastName.trim()))
      errs.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = 'Please enter a valid email address.';

  if (form.phoneNumber && !/^[0-9+\-\s()]{7,15}$/.test(form.phoneNumber))
    errs.phoneNumber = 'Please enter a valid phone number.';

  if (role === 'STUDENT' && !form.gradeLevel)
    errs.gradeLevel = 'Grade level is required for students.';

  return errs;
}

// Read caller role from localStorage
function getCallerRole(): string {
  try {
    if (typeof window === 'undefined') return '';
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw).role ?? '' : '';
  } catch {
    return '';
  }
}

export default function EditUserModal({
  isOpen, user, onClose, onSuccess,
}: EditUserModalProps) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);
  const [isSaving,    setIsSaving]    = useState(false);

  const callerRole    = getCallerRole();
  const isAdminCaller = callerRole === 'ADMIN';

  useEffect(() => {
    if (user) {
      setForm({
        firstName:   user.firstName   ?? '',
        lastName:    user.lastName    ?? '',
        email:       user.email       ?? '',
        phoneNumber: (user as any).phoneNumber ?? '',
        gradeLevel:  user.gradeLevel  ?? '',
        role:        user.role        ?? '',
      });
      setFieldErrors({});
      setApiError(null);
      setSuccessMsg(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isStudent = user.role === 'STUDENT';
  const isParent  = user.role === 'PARENT';

  const handleChange = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FieldErrors])
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError(null);
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    const errs = validateFields(form, user.role);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setIsSaving(true);
    setApiError(null);
    setSuccessMsg(null);

    try {
      const payload: Partial<CreateUserDto> = {
        firstName:   isParent ? 'Parent' : form.firstName.trim(),
        lastName:    form.lastName.trim(),
        email:       form.email.trim()       || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        gradeLevel:  isStudent ? (form.gradeLevel || undefined) : undefined,
        // Only include role if it changed (backend strips it for non-admins anyway)
        ...(form.role && form.role !== user.role ? { role: form.role as any } : {}),
      };

      const updated = await api.updateUser(user.id, payload);
      setSuccessMsg(`${updated.firstName} ${updated.lastName} updated successfully.`);
      onSuccess(updated);
      setTimeout(() => { onClose(); setSuccessMsg(null); }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      if (msg.includes('email') && (msg.includes('23505') || msg.toLowerCase().includes('unique')))
        setApiError('This email is already in use by another account.');
      else
        setApiError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const roleBadgeClass =
    isStudent
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
      : user.role === 'TEACHER'
      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
      : 'bg-[#C4972A]/10 text-[#8B6818] border-[#C4972A]/20 dark:text-[#E8C96A]';

  const parentDisplayPreview = isParent
    ? `Parent ${form.lastName.trim() || '…'}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isSaving) onClose(); }}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-gray-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                Edit User
              </h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeClass}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => { if (!isSaving) onClose(); }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Username — always read-only */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">
              Username <span className="text-slate-400">(cannot be changed)</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-400 dark:text-gray-500 font-mono">
              <User className="w-3.5 h-3.5 shrink-0" />
              {user.username}
            </div>
          </div>

          {/* ── PARENT: Display Name + editable Last Name ── */}
          {isParent && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">
                  Display Name <span className="text-slate-400">(auto-generated)</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium">
                  <User className="w-3.5 h-3.5 shrink-0 text-[#C4972A]" />
                  <span className="text-slate-700 dark:text-gray-200">{parentDisplayPreview}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-gray-500">
                  Display name is always "Parent" + last name of the linked student.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="e.g. Cruz"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors placeholder:text-slate-400 dark:placeholder:text-gray-500 ${
                    fieldErrors.lastName
                      ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5'
                      : 'border-slate-200 dark:border-gray-700'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3 shrink-0" />{fieldErrors.lastName}
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── TEACHER / STUDENT: First + Last Name ── */}
          {!isParent && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="e.g. Maria"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors placeholder:text-slate-400 dark:placeholder:text-gray-500 ${
                      fieldErrors.firstName
                        ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5'
                        : 'border-slate-200 dark:border-gray-700'
                    }`}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3 shrink-0" />{fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="e.g. Santos"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors placeholder:text-slate-400 dark:placeholder:text-gray-500 ${
                      fieldErrors.lastName
                        ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5'
                        : 'border-slate-200 dark:border-gray-700'
                    }`}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3 shrink-0" />{fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Role dropdown (Revision 11) ── */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Role
                    {!isAdminCaller && (
                      <span className="text-slate-400 font-normal">(only admins can change)</span>
                    )}
                  </span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={!isAdminCaller}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {isAdminCaller && form.role !== user.role && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <span>⚠️</span>
                    Role will change from <strong>{user.role}</strong> → <strong>{form.role}</strong>. This action will be logged.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
              Email <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. maria@school.edu.ph"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors placeholder:text-slate-400 dark:placeholder:text-gray-500 ${
                  fieldErrors.email
                    ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5'
                    : 'border-slate-200 dark:border-gray-700'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3 shrink-0" />{fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
              Phone Number <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="e.g. 09171234567"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors placeholder:text-slate-400 dark:placeholder:text-gray-500 ${
                  fieldErrors.phoneNumber
                    ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5'
                    : 'border-slate-200 dark:border-gray-700'
                }`}
              />
            </div>
            {fieldErrors.phoneNumber && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3 shrink-0" />{fieldErrors.phoneNumber}
              </p>
            )}
          </div>

          {/* Grade Level — students only */}
          {isStudent && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={form.gradeLevel}
                  onChange={(e) => handleChange('gradeLevel', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] transition-colors appearance-none ${
                    fieldErrors.gradeLevel
                      ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/5'
                      : 'border-slate-200 dark:border-gray-700'
                  }`}
                >
                  <option value="">Select grade level</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{formatGradeLabel(g)}</option>
                  ))}
                </select>
              </div>
              {fieldErrors.gradeLevel && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="w-3 h-3 shrink-0" />{fieldErrors.gradeLevel}
                </p>
              )}
            </div>
          )}

          {/* RFID notice for students */}
          {isStudent && (
            <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg text-xs text-slate-500 dark:text-gray-400">
              <span className="shrink-0 mt-0.5">💳</span>
              <span>RFID card assignment is managed on the <span className="font-medium text-slate-700 dark:text-gray-300">RFID Management</span> page.</span>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-red-700 dark:text-red-400">{apiError}</span>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-400">{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
          <button
            onClick={() => { if (!isSaving) onClose(); }}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !!successMsg}
            className="flex items-center gap-2 px-5 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : successMsg ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}