import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const REFRESH_MS = 15000;

// Fired by the Notifications page after something is marked read, so the sidebar badge updates at once.
export const NOTIFICATIONS_CHANGED_EVENT = 'parent-notifications-changed';

// Unread notifications for this parent, read from the server. It refreshes every 15 seconds,
// so the badge is the same on every parent page, in every browser, and after a new tap.
export function usePersistedUnreadCount(parentId: string | undefined): number {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!parentId) return;
    let cancelled = false;

    const load = () => {
      api.getUnreadNotifications()
        .then((list) => { if (!cancelled) setUnreadCount(list.length); })
        .catch(() => {});
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, [parentId]);

  return unreadCount;
}