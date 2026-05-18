// web/lib/dateUtils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Display-only date/time helpers.
// These format UTC ISO strings from the SERVER into Asia/Manila local time.
// NEVER use these to generate values that go back to the backend.
// NEVER call new Date() to produce a timestamp for the backend.
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_TIMEZONE = 'Asia/Manila';

/**
 * Formats a UTC ISO string from the server to a time string in Asia/Manila.
 * e.g. "2026-05-17T23:30:00.000Z" → "07:30 AM"
 */
export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: SCHOOL_TIMEZONE,
  });
}

/**
 * Formats a UTC ISO string from the server to a date string in Asia/Manila.
 * e.g. "2026-05-17T16:00:00.000Z" → "May 18, 2026"
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: SCHOOL_TIMEZONE,
  });
}

/**
 * Formats a UTC ISO string to a short date: "May 18"
 */
export function formatShortDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    timeZone: SCHOOL_TIMEZONE,
  });
}

/**
 * Formats a UTC ISO string to a full readable datetime.
 * e.g. "May 18, 2026 · 07:30 AM"
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const date = d.toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: SCHOOL_TIMEZONE,
  });
  const time = d.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: SCHOOL_TIMEZONE,
  });
  return `${date} · ${time}`;
}