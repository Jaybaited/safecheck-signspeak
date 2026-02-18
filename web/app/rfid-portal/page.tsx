'use client';

import { useState, useEffect } from 'react';
import { Wifi, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { api } from '@/lib/api';

interface TapResponse {
  success: boolean;
  action: 'CHECK_IN' | 'CHECK_OUT';
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
  attendance: {
    timeIn: string;
    timeOut: string | null;
  };
}

export default function RFIDPortalPage() {
  const [scannedCard, setScannedCard] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastTap, setLastTap] = useState<TapResponse | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for RFID card input
  useEffect(() => {
    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Clear previous messages when starting new scan
      if (buffer.length === 0) {
        setError('');
        setLastTap(null);
      }

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          handleRfidTap(buffer);
          buffer = '';
        }
      } else {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, []);

  const handleRfidTap = async (rfidCard: string) => {
    setIsScanning(true);
    setError('');
    setLastTap(null);

    try {
      const response = await api.rfidTap(rfidCard);
      setLastTap(response);
      setScannedCard(rfidCard);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setLastTap(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid RFID card');
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatGradeLevel = (gradeLevel: string | null) => {
    if (!gradeLevel) return '';
    return gradeLevel.replace('GRADE_', 'Grade ');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white">
            Safe<span className="text-cyan-400">Check</span>
          </h1>
        </div>
        <p className="text-xl text-gray-400">RFID Attendance Portal</p>
      </div>

      {/* Clock */}
      <div className="text-center mb-12">
        <div className="text-6xl font-bold text-white mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-xl text-gray-400">{formatDate(currentTime)}</div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-gray-900 border-2 border-gray-800 rounded-3xl p-12">
        {/* Scanning State */}
        {!lastTap && !error && (
          <div className="text-center">
            <div className="relative mx-auto w-32 h-32 mb-8">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
              <div className="relative w-full h-full bg-cyan-500/10 rounded-full flex items-center justify-center border-4 border-cyan-500/50">
                <Wifi className="w-16 h-16 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Scan
            </h2>
            <p className="text-xl text-gray-400">
              Please tap your RFID card on the scanner
            </p>
          </div>
        )}

        {/* Success State */}
        {lastTap && (
          <div className="text-center">
            <div
              className={`mx-auto w-32 h-32 mb-8 rounded-full flex items-center justify-center ${
                lastTap.action === 'CHECK_IN'
                  ? 'bg-green-500/20 border-4 border-green-500'
                  : 'bg-blue-500/20 border-4 border-blue-500'
              }`}
            >
              <CheckCircle
                className={`w-16 h-16 ${
                  lastTap.action === 'CHECK_IN'
                    ? 'text-green-400'
                    : 'text-blue-400'
                }`}
              />
            </div>

            <h2
              className={`text-4xl font-bold mb-4 ${
                lastTap.action === 'CHECK_IN'
                  ? 'text-green-400'
                  : 'text-blue-400'
              }`}
            >
              {lastTap.action === 'CHECK_IN' ? 'Welcome!' : 'Goodbye!'}
            </h2>

            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <User className="w-8 h-8 text-cyan-400" />
                <p className="text-3xl font-bold text-white">
                  {lastTap.student.firstName} {lastTap.student.lastName}
                </p>
              </div>
              {lastTap.student.gradeLevel && (
                <p className="text-lg text-gray-400">
                  {formatGradeLevel(lastTap.student.gradeLevel)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
              <Clock className="w-6 h-6" />
              <span>
                {lastTap.action === 'CHECK_IN' ? 'Checked in' : 'Checked out'}{' '}
                at{' '}
                {formatTime(
                  new Date(
                    lastTap.action === 'CHECK_IN'
                      ? lastTap.attendance.timeIn
                      : lastTap.attendance.timeOut!
                  )
                )}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center">
            <div className="mx-auto w-32 h-32 mb-8 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500">
              <XCircle className="w-16 h-16 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-xl text-gray-400">{error}</p>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-12 flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-gray-400">System Online</span>
      </div>
    </div>
  );
}
