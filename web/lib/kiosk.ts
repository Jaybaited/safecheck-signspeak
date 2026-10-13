import type { RfidTapResponse } from './api';

// The gate computer keeps its own session, separate from the normal login,
// so a kiosk sign-in never mixes with an admin session in the same browser.
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const KEY_ACCESS = 'kiosk_access';
const KEY_REFRESH = 'kiosk_refresh';

export class KioskAuthError extends Error {}

export function kioskHasSession(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(KEY_REFRESH);
}

function clearKioskSession() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
}

export async function kioskSignIn(username: string, password: string): Promise<void> {
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data?.message === 'string' ? data.message : 'Sign-in failed. Please try again.';
    throw new Error(msg.toLowerCase().includes('invalid credentials') ? 'Incorrect username or password.' : msg);
  }
  if (data?.user?.role !== 'KIOSK') {
    await fetch(BASE + '/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: data?.refreshToken }),
    }).catch(() => undefined);
    throw new Error('This is not a kiosk account.');
  }
  localStorage.setItem(KEY_ACCESS, data.accessToken);
  localStorage.setItem(KEY_REFRESH, data.refreshToken);
}

export function kioskSignOut(): void {
  const refreshToken = localStorage.getItem(KEY_REFRESH);
  clearKioskSession();
  if (refreshToken) {
    fetch(BASE + '/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
}

async function refreshAccess(): Promise<boolean> {
  const refreshToken = localStorage.getItem(KEY_REFRESH);
  if (!refreshToken) return false;
  try {
    const res = await fetch(BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem(KEY_ACCESS, data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function kioskTap(rfidCard: string, mode?: 'CHECK_IN' | 'CHECK_OUT'): Promise<RfidTapResponse> {
  const call = () =>
    fetch(BASE + '/attendance/rfid-tap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (localStorage.getItem(KEY_ACCESS) ?? ''),
      },
      body: JSON.stringify(mode ? { rfidCard, mode } : { rfidCard }),
    });

  let res = await call();
  if (res.status === 401) {
    if (await refreshAccess()) {
      res = await call();
    }
    if (res.status === 401) {
      clearKioskSession();
      throw new KioskAuthError('The kiosk session ended. Please sign in again.');
    }
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 403) {
    clearKioskSession();
    throw new KioskAuthError('This account is not allowed to record taps. Sign in with the kiosk account.');
  }
  if (!res.ok) {
    const raw = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(typeof raw === 'string' && raw ? raw : 'Request failed: ' + res.status);
  }
  return data as RfidTapResponse;
}