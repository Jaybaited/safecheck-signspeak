// web/lib/auth.ts
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const SESSION_KEYS = ['token', 'accessToken', 'refreshToken', 'user'];

/** Remove every key that holds the login session. */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

/**
 * Sign out: clear the browser session right away, then ask the server to
 * revoke the refresh token. The caller redirects to /login.
 */
export function logout(): void {
  if (typeof window === 'undefined') return;

  const refreshToken = localStorage.getItem('refreshToken');
  const accessToken =
    localStorage.getItem('token') ?? localStorage.getItem('accessToken');

  clearSession();

  if (!refreshToken || !BASE_URL) return;

  fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refreshToken }),
    keepalive: true,
  }).catch(() => {
    // The browser session is already cleared; nothing else to do.
  });
}