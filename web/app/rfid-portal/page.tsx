// web/app/rfid-portal/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Wifi, CheckCircle, XCircle, Shield } from 'lucide-react';
import { api, RfidTapResponse } from '@/lib/api';

export default function RFIDPortalPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastTap, setLastTap] = useState<RfidTapResponse | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault(); // ✅ prevent typing into page

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

    // ✅ Blur any focused element on mount
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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
      const response = await api.handleRfidTap(rfidCard);
      setLastTap(response);
      setTimeout(() => { setLastTap(null); }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid RFID card');
      setTimeout(() => { setError(''); }, 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatGradeLevel = (gradeLevel: string | null | undefined) => {
    if (!gradeLevel) return '';
    return gradeLevel.replace('GRADE_', 'Grade ');
  };

  const isCheckIn = lastTap?.attendance ? !lastTap.attendance.timeOut : false;

  return (
    <div
      onMouseDown={(e) => e.preventDefault()} // ✅ prevent focus on any click
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 50%, #f8f7ff 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#8B1A1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f0f0f', letterSpacing: '-0.3px' }}>
            SafeCheck<span style={{ color: '#8B1A1A' }}>·</span>SignSpeak
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 999,
          padding: '6px 14px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>System Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '24px',
      }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(139,26,26,0.08)',
            border: '1px solid rgba(139,26,26,0.15)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: '20px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B1A1A' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8B1A1A', letterSpacing: '0.5px' }}>
              RFID ATTENDANCE PORTAL
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900,
            color: '#0f0f0f',
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Tap to <span style={{ color: '#8B1A1A' }}>Check In</span>
          </h1>
        </div>

        {/* Clock Card */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 20,
          padding: '20px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          minWidth: 320,
        }}>
          <div style={{
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 800,
            color: '#0f0f0f',
            letterSpacing: '-1px',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}>
            {mounted ? formatTime(currentTime) : '--:--:-- --'}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8, fontWeight: 500 }}>
            {mounted ? formatDate(currentTime) : ''}
          </div>
        </div>

        {/* Main State Card */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 24,
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 480,
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          transition: 'all 0.3s ease',
        }}>

          {/* Processing */}
          {isScanning && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(139,26,26,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wifi size={32} color="#8B1A1A" />
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0f0f', margin: 0 }}>Processing...</p>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Reading RFID card</p>
            </>
          )}

          {/* Ready to Scan */}
          {!isScanning && !lastTap && !error && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(139,26,26,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wifi size={32} color="#8B1A1A" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f0f0f', margin: 0, letterSpacing: '-0.5px' }}>
                Ready to Scan
              </p>
              <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>
                Please tap your RFID card on the scanner
              </p>
            </>
          )}

          {/* Success */}
          {!isScanning && lastTap && lastTap.student && lastTap.attendance && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: isCheckIn ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={36} color={isCheckIn ? '#22c55e' : '#3b82f6'} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#0f0f0f', margin: 0, letterSpacing: '-0.8px' }}>
                {isCheckIn ? 'Welcome!' : 'Goodbye!'}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0f0f', margin: 0 }}>
                {lastTap.student.firstName} {lastTap.student.lastName}
              </p>
              {lastTap.student.gradeLevel && (
                <span style={{
                  background: 'rgba(139,26,26,0.08)',
                  color: '#8B1A1A',
                  fontSize: 13, fontWeight: 600,
                  padding: '4px 14px', borderRadius: 999,
                  border: '1px solid rgba(139,26,26,0.15)',
                }}>
                  {formatGradeLevel(lastTap.student.gradeLevel)}
                </span>
              )}
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                {isCheckIn ? 'Checked in' : 'Checked out'} at{' '}
                <strong style={{ color: '#0f0f0f' }}>
                  {mounted && formatTime(new Date(lastTap.attendance.timeOut ?? lastTap.attendance.timeIn!))}
                </strong>
              </p>
            </>
          )}

          {/* Error */}
          {!isScanning && error && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <XCircle size={36} color="#ef4444" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f0f0f', margin: 0 }}>Error</p>
              <p style={{ fontSize: 15, color: '#ef4444', margin: 0 }}>{error}</p>
            </>
          )}
        </div>

        {/* Footer label */}
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
          Admin · Teacher · Student · Parent
        </p>
      </main>

      <style>{`
        * {
          user-select: none;
          -webkit-user-select: none;
        }
        body {
          cursor: default;
        }
        p, h1, h2, h3, span, div {
          cursor: default;
          caret-color: transparent;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}