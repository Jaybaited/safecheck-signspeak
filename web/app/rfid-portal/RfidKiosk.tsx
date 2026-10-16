'use client';

import { useState, useEffect, useRef } from 'react';
import { gradeText } from '@/lib/grade';
import { Wifi, CheckCircle, Info, Shield } from 'lucide-react';
import type { RfidTapResponse } from '@/lib/api';
import { kioskHasSession, kioskSignIn, kioskSignOut, kioskTap, KioskAuthError } from '@/lib/kiosk';

type KioskMode = 'CHECK_IN' | 'CHECK_OUT';

const noticeTitle = (action: string) => {
  switch (action) {
    case 'ALREADY_COMPLETE':   return 'All done for today';
    case 'ALREADY_CHECKED_IN': return 'Already checked in';
    case 'NO_CHECK_IN':        return 'Check in first';
    case 'TOO_SOON':           return 'Just a moment';
    case 'ARCHIVED':           return 'Student archived';
    case 'CARD_LOST':         return 'Card reported lost';
    case 'CARD_SUSPENDED':    return 'Card suspended';
    case 'CARD_RETIRED':      return 'Card no longer valid';
    default:                   return 'Please note';
  }
};

export default function RfidKiosk({ mode }: { mode: KioskMode }) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastTap, setLastTap] = useState<RfidTapResponse | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string; blocked?: boolean } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [kUser, setKUser] = useState('');
  const [kPass, setKPass] = useState('');
  const [kBusy, setKBusy] = useState(false);
  const [kError, setKError] = useState('');
  const timeOffsetRef = useRef(0); // ms difference: networkTime - Date.now()

  // ✅ Sync clock from network time on mount, then tick every second
  useEffect(() => {
    setMounted(true);
    setSignedIn(kioskHasSession());
    setAuthChecked(true);

    const syncTime = async () => {
      try {
        const res = await fetch(
          'https://timeapi.io/api/time/current/zone?timeZone=Asia/Manila',
        );
        const data = await res.json();
        const networkTime = new Date(data.dateTime + '+08:00');
        timeOffsetRef.current = networkTime.getTime() - Date.now();
      } catch {
        timeOffsetRef.current = 0; // fallback: use local clock
      }
    };

    syncTime(); // sync once on mount

    const timer = setInterval(() => {
      // Always display corrected network time
      setCurrentTime(new Date(Date.now() + timeOffsetRef.current));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen for RFID card input (USB HID keyboard emulation)
  useEffect(() => {
    if (!signedIn) return;
    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      if (buffer.length === 0) {
        setError('');
        setNotice(null);
        setLastTap(null);
      }
      if (e.key === 'Enter') {
        if (buffer.length > 0) handleRfidTap(buffer);
        buffer = '';
      } else {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { buffer = ''; }, 100);
      }
    };

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [signedIn]);

  const handleRfidTap = async (rfidCard: string) => {
    setIsScanning(true);
    setError('');
    setNotice(null);
    setLastTap(null);
    try {
      const response = await kioskTap(rfidCard, mode);
      if (response.success === false) {
        setNotice({ title: noticeTitle(response.action), message: response.message ?? 'Please try again.', blocked: String(response.action).startsWith('CARD_') });
        setTimeout(() => setNotice(null), String(response.action).startsWith('CARD_') ? 10000 : 6000);
      } else {
        setLastTap(response);
        setTimeout(() => setLastTap(null), 5000);
      }
    } catch (err) {
      if (err instanceof KioskAuthError) {
        setSignedIn(false);
        setKError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Invalid RFID card');
        setTimeout(() => setError(''), 5000);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Manila', // explicit timezone for display
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Manila',
    });

  const formatGradeLevel = (gradeLevel: string | null | undefined) => {
    if (!gradeLevel) return '';
    return gradeText(gradeLevel);
  };

  const isCheckIn = lastTap?.action === 'CHECK_IN';

  const doSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kBusy) return;
    setKBusy(true);
    setKError('');
    try {
      await kioskSignIn(kUser.trim(), kPass);
      setKPass('');
      setSignedIn(true);
    } catch (err) {
      setKError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setKBusy(false);
    }
  };

  if (!authChecked) return <div style={{ minHeight: '100vh' }} />;
  if (!signedIn) {
    const field = {
      width: '100%', height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid #e5e7eb',
      background: '#f9fafb', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' as const,
    };
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 50%, #f8f7ff 100%)',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <form onSubmit={doSignIn} style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: '40px 36px',
          width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', margin: '0 0 4px', color: '#0f0f0f' }}>Kiosk sign-in</h1>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', margin: '0 0 20px' }}>Only the kiosk account can record taps.</p>
          {kError && <p style={{ fontSize: 14, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 12px', margin: '0 0 14px' }}>{kError}</p>}
          <input type="text" value={kUser} onChange={(e) => setKUser(e.target.value)} placeholder="Kiosk username" autoComplete="username" style={field} />
          <input type="password" value={kPass} onChange={(e) => setKPass(e.target.value)} placeholder="Password" autoComplete="current-password" style={field} />
          <button type="submit" disabled={kBusy || !kUser.trim() || !kPass} style={{
            width: '100%', height: 46, borderRadius: 999, border: 'none', background: '#8B1A1A', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (kBusy || !kUser.trim() || !kPass) ? 0.5 : 1,
          }}>
            {kBusy ? 'Signing in...' : 'Sign in'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/rfid-portal" style={{ fontSize: 13, color: '#6b7280' }}>Back to portal menu</a>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div
      onMouseDown={signedIn ? (e) => e.preventDefault() : undefined}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 50%, #f8f7ff 100%)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#8B1A1A', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f0f0f', letterSpacing: '-0.3px' }}>
            SafeCheck<span style={{ color: '#8B1A1A' }}>SignSpeak</span>
          </span>
        </div>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 999, padding: '6px 14px',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>System Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 20px', gap: 24,
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.15)',
              borderRadius: 999, padding: '6px 16px', marginBottom: 20,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B1A1A' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8B1A1A', letterSpacing: '0.5px' }}>
              {mode === 'CHECK_IN' ? 'RFID CHECK-IN' : 'RFID CHECK-OUT'}
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900,
              color: '#0f0f0f', letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0,
            }}
          >
            Tap to <span style={{ color: '#8B1A1A' }}>{mode === 'CHECK_IN' ? 'Check In' : 'Check Out'}</span>
          </h1>
        </div>

        {/* Clock Card — shows network-synced time */}
        <div
          style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 20, padding: '20px 40px', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', minWidth: 320,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 800,
              color: '#0f0f0f', letterSpacing: '-1px',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}
          >
            {mounted ? formatTime(currentTime) : '--:--:-- --'}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8, fontWeight: 500 }}>
            {mounted ? formatDate(currentTime) : ''}
          </div>
        </div>

        {/* Main State Card */}
        <div
          style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 24, padding: '48px 40px', textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: 480,
            minHeight: 260, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
            transition: 'all 0.3s ease',
          }}
        >
          {/* Processing */}
          {isScanning && (
            <>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(139,26,26,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Wifi size={32} color="#8B1A1A" />
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0f0f', margin: 0 }}>Processing...</p>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Reading RFID card</p>
            </>
          )}

          {/* Ready to Scan */}
          {!isScanning && !lastTap && !error && !notice && (
            <>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(139,26,26,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
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
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: isCheckIn ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <CheckCircle size={36} color={isCheckIn ? '#22c55e' : '#3b82f6'} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#0f0f0f', margin: 0, letterSpacing: '-0.8px' }}>
                {isCheckIn ? 'Welcome!' : 'Goodbye!'}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0f0f', margin: 0 }}>
                {lastTap.student.firstName} {lastTap.student.lastName}
              </p>
              {lastTap.student.gradeLevel && (
                <span
                  style={{
                    background: 'rgba(139,26,26,0.08)', color: '#8B1A1A',
                    fontSize: 13, fontWeight: 600, padding: '4px 14px',
                    borderRadius: 999, border: '1px solid rgba(139,26,26,0.15)',
                  }}
                >
                  {formatGradeLevel(lastTap.student.gradeLevel)}
                </span>
              )}
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                {isCheckIn ? 'Checked in' : 'Checked out'} at{' '}
                <strong style={{ color: '#0f0f0f' }}>
                  {mounted &&
                    formatTime(
                      new Date(lastTap.attendance.timeOut ?? lastTap.attendance.timeIn!),
                    )}
                </strong>
              </p>
              {/* LATE badge — driven by server-side status */}
              {lastTap.attendance.status === 'LATE' && (
                <span
                  style={{
                    background: '#fef3c7', color: '#d97706',
                    fontSize: 12, fontWeight: 700, padding: '4px 14px',
                    borderRadius: 999, border: '1px solid #fcd34d',
                    letterSpacing: '0.5px',
                  }}
                >
                  LATE
                </span>
              )}
            </>
          )}

          {/* Friendly notice: repeat tap, wrong page, too soon */}
          {!isScanning && notice && (
            <>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: notice.blocked ? 'rgba(217,119,6,0.12)' : 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Info size={36} color={notice.blocked ? '#d97706' : '#3b82f6'} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f0f0f', margin: 0 }}>{notice.title}</p>
              <p style={{ fontSize: 16, color: '#374151', margin: 0 }}>{notice.message}</p>
            </>
          )}

          {/* Problem (unregistered card, network) */}
          {!isScanning && error && (
            <>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(217,119,6,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Info size={36} color="#d97706" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f0f0f', margin: 0 }}>Please try again</p>
              <p style={{ fontSize: 15, color: '#b45309', margin: 0 }}>{error}</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/rfid-portal" style={{ fontSize: 13, color: '#6b7280' }}>Back to portal menu</a>
          <button type="button" onClick={() => { kioskSignOut(); setSignedIn(false); setKError(''); }} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out of kiosk</button>
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
          Admin · Teacher · Student · Parent
        </p>
      </main>

      <style>{`
        * { user-select: none; -webkit-user-select: none; }
        body { cursor: default; }
        input { user-select: text; -webkit-user-select: text; }
        p, h1, h2, h3, span, div { cursor: default; caret-color: transparent; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}