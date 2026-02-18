'use client';

import { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { CreateUserDto } from '@/lib/api';
import { useRfidScanner } from '@/hooks/useRfidScanner';

const GRADE_LEVELS = [
  'GRADE_1',
  'GRADE_2',
  'GRADE_3',
  'GRADE_4',
  'GRADE_5',
  'GRADE_6',
  'GRADE_7',
  'GRADE_8',
  'GRADE_9',
  'GRADE_10',
  'GRADE_11',
  'GRADE_12',
];

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserDto) => Promise<void>;
  error: string | null;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  error,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    username: '',
    email: '',
    password: '',
    role: 'STUDENT',
    firstName: '',
    lastName: '',
    gradeLevel: '',
    rfidCard: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { isScanning, scannedRfid, error: rfidError, startScan, resetScan } = useRfidScanner();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If role is STUDENT and no RFID scanned yet, start scanning
    if (formData.role === 'STUDENT' && !scannedRfid) {
      startScan();
      return;
    }

    setSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        email: formData.email || undefined,
        gradeLevel: formData.gradeLevel || undefined,
        rfidCard: scannedRfid || formData.rfidCard || undefined,
      };

      await onSubmit(dataToSubmit);
      handleClose();
    } catch {
      // Error is handled by parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'STUDENT',
      firstName: '',
      lastName: '',
      gradeLevel: '',
      rfidCard: '',
    });
    resetScan();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white">Add New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(error || rfidError) && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error || rfidError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Username *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password * (min. 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    role: e.target.value as
                      | 'ADMIN'
                      | 'TEACHER'
                      | 'STUDENT'
                      | 'PARENT',
                  });
                  resetScan();
                }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="PARENT">Parent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Grade Level
              </label>
              <select
                value={formData.gradeLevel}
                onChange={(e) =>
                  setFormData({ ...formData, gradeLevel: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              >
                <option value="">Select Grade</option>
                {GRADE_LEVELS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade.replace('GRADE_', 'Grade ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RFID Card Section */}
          {formData.role !== 'STUDENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                RFID Card Number
              </label>
              <input
                type="text"
                value={formData.rfidCard}
                onChange={(e) =>
                  setFormData({ ...formData, rfidCard: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
                placeholder="Optional"
              />
            </div>
          )}

          {/* RFID Scanned Display for Students */}
          {formData.role === 'STUDENT' && scannedRfid && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">RFID Card Scanned</p>
                  <p className="text-lg font-bold text-green-400">
                    {scannedRfid}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className="bg-cyan-500/10 border border-cyan-500/50 rounded-xl p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-cyan-400 font-medium mb-1">
                    Scanning RFID Card...
                  </p>
                  <p className="text-sm text-gray-400">
                    Please scan your card now
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors font-medium text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isScanning}
              className={`flex-1 px-6 py-3 rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                formData.role === 'STUDENT' && !scannedRfid
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
            >
              {submitting ? (
                'Creating...'
              ) : formData.role === 'STUDENT' && !scannedRfid ? (
                <>
                  <CreditCard className="w-5 h-5" />
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
